import "../../style.css";

window.addEventListener("DOMContentLoaded", () => {
  const cards = document.querySelectorAll<HTMLImageElement>("[data-card]");

  cards.forEach((card) => {
    card.classList.add(
      "transition-transform",
      "duration-200",
      "ease-in-out",
      "hover:scale-110"
    );
  });
});
