/* =========================================================
   IndianJOEla — nav, scroll-spy, toast
   ========================================================= */
(function () {
  "use strict";

  /* ---- toast (exposed for slideshow.js) ---- */
  const toastEl = document.getElementById("toast");
  let toastTimer = null;
  window.IJ_toast = function (msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("is-show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("is-show"), 2600);
  };

  /* ---- bottom-tab scroll spy ---- */
  const tabs = [...document.querySelectorAll(".tab")];
  const sections = tabs
    .map((t) => document.getElementById(t.dataset.tab))
    .filter(Boolean);

  if ("IntersectionObserver" in window && sections.length) {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            tabs.forEach((t) => t.classList.toggle("is-active", t.dataset.tab === id));
          }
        });
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );
    sections.forEach((s) => obs.observe(s));
  }

  // smooth-scroll handled by CSS; just give tactile active state on tap
  tabs.forEach((t) => {
    t.addEventListener("click", () => {
      tabs.forEach((x) => x.classList.remove("is-active"));
      t.classList.add("is-active");
    });
  });

  /* ---- keep the bottom bar glued to the VISIBLE viewport bottom ----
     iOS Safari positions `fixed` elements against the layout viewport, so
     when the URL bar shrinks/expands a gap can open under the tab bar.
     The VisualViewport API tells us where the real visible bottom is. */
  const tabbar = document.querySelector(".tabbar");
  const vv = window.visualViewport;
  if (tabbar && vv) {
    const pin = () => {
      // how far the visible bottom sits above the layout bottom
      const delta = window.innerHeight - (vv.height + vv.offsetTop);
      tabbar.style.transform = `translateY(${-delta}px)`;
    };
    vv.addEventListener("resize", pin);
    vv.addEventListener("scroll", pin);
    window.addEventListener("scroll", pin, { passive: true });
    window.addEventListener("orientationchange", () => setTimeout(pin, 200));
    pin();
  }
})();
