/* =========================================================
   IndianJOEla — slideshow + photo upload
   Uses Supabase shared storage when configured; otherwise
   falls back to per-device storage (localStorage) so the
   experience works immediately.
   ========================================================= */
(function () {
  "use strict";

  const cfg = window.INDIANJOELA_CONFIG || {};
  const hasSupabase =
    cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && window.supabase;

  const sb = hasSupabase
    ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY)
    : null;

  const BUCKET = cfg.BUCKET || "photos";
  const ROTATE_MS = 4000;
  const LS_KEY = "indianjoela_photos";
  const MAX_EDGE = 1600; // downscale big phone photos before storing

  // ---- DOM ----
  const stage    = document.getElementById("slides");
  const dotsWrap = document.getElementById("dots");
  const counter  = document.getElementById("counter");
  const prevBtn  = document.getElementById("prevBtn");
  const nextBtn  = document.getElementById("nextBtn");
  const fileInput = document.getElementById("fileInput");
  const uploadBtn = document.querySelector(".upload-btn");

  let photos = [];      // [{url}]
  let index = 0;
  let timer = null;

  /* ---------------- helpers ---------------- */

  function toast(msg) {
    if (window.IJ_toast) window.IJ_toast(msg);
  }

  // Resize/compress an image File to a JPEG data URL (keeps storage light).
  function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = () => { img.src = reader.result; };
      reader.onerror = reject;
      img.onload = () => {
        let { width: w, height: h } = img;
        if (Math.max(w, h) > MAX_EDGE) {
          const s = MAX_EDGE / Math.max(w, h);
          w = Math.round(w * s); h = Math.round(h * s);
        }
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function dataURLtoBlob(dataURL) {
    const [meta, b64] = dataURL.split(",");
    const mime = meta.match(/:(.*?);/)[1];
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
  }

  /* ---------------- storage layer ---------------- */

  async function loadPhotos() {
    if (sb) {
      try {
        const { data, error } = await sb.storage
          .from(BUCKET)
          .list("", { limit: 200, sortBy: { column: "created_at", order: "asc" } });
        if (error) throw error;
        return (data || [])
          .filter((f) => f.name && !f.name.startsWith("."))
          .map((f) => ({
            url: sb.storage.from(BUCKET).getPublicUrl(f.name).data.publicUrl,
          }));
      } catch (e) {
        console.warn("Supabase load failed, using local:", e);
      }
    }
    try {
      return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    } catch {
      return [];
    }
  }

  async function savePhoto(file) {
    if (sb) {
      const ext = (file.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
      const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      // Compress first to keep mobile uploads fast.
      const dataURL = await fileToDataURL(file);
      const blob = dataURLtoBlob(dataURL);
      const { error } = await sb.storage
        .from(BUCKET)
        .upload(name, blob, { contentType: "image/jpeg", upsert: false });
      if (error) throw error;
      return { url: sb.storage.from(BUCKET).getPublicUrl(name).data.publicUrl };
    }
    // local fallback
    const dataURL = await fileToDataURL(file);
    const local = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    local.push({ url: dataURL });
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(local));
    } catch {
      toast("This device is full — can't save more locally.");
    }
    return { url: dataURL };
  }

  /* ---------------- rendering ---------------- */

  function render() {
    // wipe (keep nothing; rebuild)
    stage.innerHTML = "";
    dotsWrap.innerHTML = "";

    if (photos.length === 0) {
      const empty = document.createElement("div");
      empty.className = "slide slide--empty is-active";
      empty.innerHTML =
        '<div class="speech-bubble"><p><b>No pics yet!</b><br/>Be the first legend to add one. 👇</p></div>';
      stage.appendChild(empty);
      counter.textContent = "";
      prevBtn.style.display = nextBtn.style.display = "none";
      stopAuto();
      return;
    }

    photos.forEach((p, i) => {
      const slide = document.createElement("div");
      slide.className = "slide" + (i === index ? " is-active" : "");
      const img = document.createElement("img");
      img.loading = "lazy";
      img.alt = "Bachelor party photo";
      img.src = p.url;
      slide.appendChild(img);
      stage.appendChild(slide);

      const dot = document.createElement("button");
      dot.className = "dot" + (i === index ? " is-active" : "");
      dot.setAttribute("aria-label", `Go to photo ${i + 1}`);
      dot.addEventListener("click", () => go(i));
      dotsWrap.appendChild(dot);
    });

    const many = photos.length > 1;
    prevBtn.style.display = nextBtn.style.display = many ? "block" : "none";
    updateCounter();
    if (many) startAuto(); else stopAuto();
  }

  function updateCounter() {
    counter.textContent = `${index + 1} / ${photos.length}`;
  }

  function go(i) {
    if (photos.length === 0) return;
    index = (i + photos.length) % photos.length;
    [...stage.children].forEach((s, k) => s.classList.toggle("is-active", k === index));
    [...dotsWrap.children].forEach((d, k) => d.classList.toggle("is-active", k === index));
    updateCounter();
  }

  function next() { go(index + 1); }
  function prev() { go(index - 1); }

  function startAuto() { stopAuto(); timer = setInterval(next, ROTATE_MS); }
  function stopAuto()  { if (timer) clearInterval(timer); timer = null; }

  /* ---------------- upload ---------------- */

  async function handleFiles(fileList) {
    const files = [...fileList].filter((f) => f.type.startsWith("image/"));
    if (!files.length) return;

    uploadBtn.classList.add("is-busy");
    toast(files.length > 1 ? `Adding ${files.length} photos…` : "Adding your photo…");

    let added = 0;
    for (const file of files) {
      try {
        const saved = await savePhoto(file);
        photos.push(saved);
        added++;
      } catch (e) {
        console.error(e);
        toast("Hmm, one photo didn't upload. Try again?");
      }
    }

    uploadBtn.classList.remove("is-busy");
    if (added) {
      render();
      go(photos.length - 1); // show the newest
      toast(sb ? "Added to everyone's reel! 🎉" : "Added! (saved on this device)");
    }
  }

  /* ---------------- swipe (mobile) ---------------- */

  let touchX = null;
  const slideshow = document.getElementById("slideshow");
  slideshow.addEventListener("touchstart", (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  slideshow.addEventListener("touchend", (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) (dx < 0 ? next : prev)();
    touchX = null;
  }, { passive: true });

  // pause auto-rotate while interacting
  slideshow.addEventListener("pointerdown", stopAuto);
  slideshow.addEventListener("pointerup", () => { if (photos.length > 1) startAuto(); });

  /* ---------------- wire up ---------------- */

  prevBtn.addEventListener("click", () => { prev(); startAuto(); });
  nextBtn.addEventListener("click", () => { next(); startAuto(); });
  fileInput.addEventListener("change", (e) => { handleFiles(e.target.files); fileInput.value = ""; });

  // initial load
  (async function init() {
    photos = await loadPhotos();
    render();
  })();
})();
