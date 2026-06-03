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

  /* ---- the scroll area is now the .strip (not the window) ---- */
  const scroller = document.querySelector(".strip");

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
      { root: scroller, rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );
    sections.forEach((s) => obs.observe(s));
  }

  // tab tap → smooth-scroll the section into view inside the scroll area
  tabs.forEach((t) => {
    t.addEventListener("click", (e) => {
      const el = document.getElementById(t.dataset.tab);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      tabs.forEach((x) => x.classList.remove("is-active"));
      t.classList.add("is-active");
    });
  });
})();
