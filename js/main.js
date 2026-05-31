// IndianJOEla — cover page interactions
// (Placeholder hook for the next sections of the site.)

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.querySelector(".enter-btn");
  if (!btn) return;

  btn.addEventListener("click", () => {
    // Little comic "punch" feedback for now — real navigation comes later.
    btn.animate(
      [
        { transform: "scale(1)" },
        { transform: "scale(1.15) rotate(-2deg)" },
        { transform: "scale(1)" },
      ],
      { duration: 220, easing: "ease-out" }
    );
    console.log("Adventure awaits — next chapters coming soon!");
  });
});
