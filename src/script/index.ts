const main = document.querySelector("main") as HTMLElement;
const textWrapper = document.querySelector(".text-hidden") as HTMLDivElement;
const buttonGroups = document.querySelector(".button-groups") as HTMLDivElement;

function revealMenu() {
  textWrapper.classList.add("hidden");
  buttonGroups.classList.remove("hidden");
}

main.addEventListener("click", () => {
  revealMenu();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    revealMenu();
  }
});
