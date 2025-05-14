import "../../style.css";

window.addEventListener("DOMContentLoaded", () => {
  const selectedLeft = document.getElementById(
    "selected-left"
  ) as HTMLDivElement;
  const selectedRight = document.getElementById(
    "selected-right"
  ) as HTMLDivElement;
  const resetBtn = document.querySelector(
    "#submitbutton a:nth-child(1)"
  ) as HTMLAnchorElement;
  const submitBtn = document.querySelector(
    "#submitbutton a:nth-child(2)"
  ) as HTMLAnchorElement;
  const myCardContainer = document.querySelector(
    ".ml-20 .flex"
  ) as HTMLDivElement;
  const scoreBoard = document.getElementById(
    "final-card-area"
  ) as HTMLDivElement;
  const tempStorage = document.getElementById(
    "temp-card-area"
  ) as HTMLDivElement;

  const selectedCardNumbers: number[] = [];
  let activeCardId: "left" | "right" | null = null;

  function renderMyCards() {
    myCardContainer.innerHTML = "";

    for (let i = 1; i <= 8; i++) {
      if (selectedCardNumbers.includes(i)) continue;

      const card = document.createElement("img");
      card.src = `/src/imges/card-${i}.webp`;
      card.className = "w-[153px] h-[214px] cursor-pointer";
      card.setAttribute("data-card", String(i));

      card.classList.add(
        "transition-transform",
        "duration-200",
        "ease-in-out",
        "hover:scale-110"
      );

      card.addEventListener("click", () => {
        if (selectedCardNumbers.length >= 2) return;

        const cardNum = Number(card.getAttribute("data-card"));
        selectedCardNumbers.push(cardNum);
        card.remove();

        const cardImg = card.getAttribute("src")!;
        if (selectedCardNumbers.length === 1) {
          selectedLeft.style.backgroundImage = `url("${cardImg}")`;
          selectedLeft.setAttribute("data-card-src", cardImg);
        } else if (selectedCardNumbers.length === 2) {
          selectedRight.style.backgroundImage = `url("${cardImg}")`;
          selectedRight.setAttribute("data-card-src", cardImg);
        }
      });

      myCardContainer.appendChild(card);
    }
  }

  function setupSubmitCardClick() {
    selectedLeft.addEventListener("click", () => {
      selectedLeft.classList.add("border-4", "border-yellow-300");
      selectedRight.classList.remove("border-4", "border-yellow-300");
      activeCardId = "left";
    });

    selectedRight.addEventListener("click", () => {
      selectedRight.classList.add("border-4", "border-yellow-300");
      selectedLeft.classList.remove("border-4", "border-yellow-300");
      activeCardId = "right";
    });
  }

  resetBtn.addEventListener("click", () => {
    selectedCardNumbers.length = 0;

    selectedLeft.style.backgroundImage = `url("/src/imges/card-back.webp")`;
    selectedRight.style.backgroundImage = `url("/src/imges/card-back.webp")`;
    selectedLeft.removeAttribute("data-card-src");
    selectedRight.removeAttribute("data-card-src");

    selectedLeft.classList.remove("border-4", "border-yellow-300");
    selectedRight.classList.remove("border-4", "border-yellow-300");
    activeCardId = null;

    scoreBoard.innerHTML = "";
    tempStorage.innerHTML = "";

    renderMyCards();
  });

  submitBtn.addEventListener("click", () => {
    if (!activeCardId) return alert("제출할 카드를 선택하세요!");

    const keep = activeCardId === "left" ? selectedLeft : selectedRight;
    const remove = activeCardId === "left" ? selectedRight : selectedLeft;

    const keepSrc = keep.getAttribute("data-card-src");
    const removeSrc = remove.getAttribute("data-card-src");

    const scoreTarget = scoreBoard;
    const tempTarget = tempStorage;

    function flyCard(fromEl: HTMLElement, toEl: HTMLElement, src: string) {
      const fromRect = fromEl.getBoundingClientRect();
      const toRect = toEl.getBoundingClientRect();

      const card = document.createElement("img");
      card.src = src;
      card.className = "card-fly";
      card.style.left = `${fromRect.left}px`;
      card.style.top = `${fromRect.top}px`;

      document.body.appendChild(card);

      requestAnimationFrame(() => {
        card.style.transform = `translate(${toRect.left - fromRect.left}px, ${toRect.top - fromRect.top}px)`;
      });

      setTimeout(() => {
        // 슬라이딩이 끝난 카드 자체를 그대로 타겟 박스로 이동시킴
        card.style.transform = "";
        card.style.transition = "";
        card.style.position = "";
        card.style.left = "";
        card.style.top = "";
        card.classList.remove("card-fly");
        card.classList.add("w-[80px]", "h-[110px]");

        toEl.innerHTML = "";
        toEl.appendChild(card);
      }, 500);
    }

    if (keepSrc) flyCard(keep, scoreTarget, keepSrc);
    if (removeSrc) flyCard(remove, tempTarget, removeSrc);

    keep.style.backgroundImage = "";
    remove.style.backgroundImage = "";
    keep.removeAttribute("data-card-src");
    remove.removeAttribute("data-card-src");

    selectedLeft.classList.remove("border-4", "border-yellow-300");
    selectedRight.classList.remove("border-4", "border-yellow-300");
    selectedCardNumbers.length = 0;
    activeCardId = null;
  });

  renderMyCards();
  setupSubmitCardClick();
});
