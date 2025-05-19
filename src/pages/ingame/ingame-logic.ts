import "../../style.css";

window.addEventListener("DOMContentLoaded", () => {
  const selectedLeft = document.getElementById(
    "selected-left"
  ) as HTMLDivElement;
  const selectedRight = document.getElementById(
    "selected-right"
  ) as HTMLDivElement;
  const resetBtn = document.querySelector(
    "#submitbutton button:nth-child(1)"
  ) as HTMLButtonElement;
  const submitBtn = document.querySelector(
    "#submitbutton button:nth-child(2)"
  ) as HTMLButtonElement;
  const myCardContainer = document.getElementById("my-cards") as HTMLDivElement;
  const scoreBoard = document.getElementById(
    "final-card-area"
  ) as HTMLDivElement;
  const tempStorage = document.getElementById(
    "temp-card-area"
  ) as HTMLDivElement;

  if (
    !selectedLeft ||
    !selectedRight ||
    !resetBtn ||
    !submitBtn ||
    !myCardContainer ||
    !scoreBoard ||
    !tempStorage
  ) {
    console.error("필수 요소를 찾을 수 없습니다.");
    return;
  }

  const removedNumbers = new Set<number>();
  let tempDisabled = new Set<number>();
  let lastDisabled = new Set<number>();
  let selectedCardNumbers: number[] = [];
  let activeCardId: "left" | "right" | null = null;

  function renderMyCards(): void {
    myCardContainer.innerHTML = "";
    const activeNums: number[] = [];
    for (let i = 1; i <= 8; i++) {
      if (removedNumbers.has(i) || tempDisabled.has(i)) continue;
      activeNums.push(i);
    }
    const disabledNums = Array.from(tempDisabled).filter(
      (i) => !removedNumbers.has(i)
    );

    const totalCount = activeNums.length + disabledNums.length;
    // 핸드가 2장 이하이면 카드를 전부 숨김
    if (totalCount <= 2) {
      return;
    }

    // 활성 카드 먼저 렌더
    activeNums.forEach((i) => appendCard(i, false));
    // 비활성 카드는 오른쪽 끝에만 렌더
    disabledNums.forEach((i) => appendCard(i, true));

    updateHandCardAvailability();
  }

  function appendCard(cardNum: number, disabled: boolean): void {
    const card = document.createElement("img");
    card.src = `/imges/card-${cardNum}.webp`;
    card.className =
      "w-[153px] h-[214px] cursor-pointer transition-transform duration-200 ease-in-out hover:scale-110";
    card.setAttribute("data-card", String(cardNum));
    if (disabled) {
      card.classList.add("opacity-50");
      card.style.pointerEvents = "none";
    }
    card.addEventListener("click", () => {
      if (card.style.pointerEvents === "none") return;
      if (selectedCardNumbers.length >= 2) return;
      selectedCardNumbers.push(cardNum);
      const slot =
        selectedCardNumbers.length === 1 ? selectedLeft : selectedRight;
      slot.style.backgroundImage = `url("${card.src}")`;
      slot.setAttribute("data-card-src", card.src);
      card.remove();
      updateHandCardAvailability();
    });
    myCardContainer.appendChild(card);
  }

  function setupSlotToggle(): void {
    [selectedLeft, selectedRight].forEach((slot) => {
      slot.addEventListener("click", () => {
        if (!slot.getAttribute("data-card-src")) return;
        selectedLeft.classList.remove("border-5");
        selectedRight.classList.remove("border-5");
        slot.classList.add("border-5");
        activeCardId = slot === selectedLeft ? "left" : "right";
      });
    });
  }

  function updateHandCardAvailability(): void {
    const cards = Array.from(
      myCardContainer.querySelectorAll<HTMLImageElement>("img[data-card]")
    );
    if (selectedCardNumbers.length === 2) {
      cards.forEach((c) => (c.style.pointerEvents = "none"));
    } else {
      cards.forEach((c) => {
        const num = Number(c.getAttribute("data-card"));
        c.style.pointerEvents = tempDisabled.has(num) ? "none" : "";
      });
    }
  }

  function flyCard(fromEl: HTMLElement, toEl: HTMLElement, src: string): void {
    const fromRect = fromEl.getBoundingClientRect();
    const toRect = toEl.getBoundingClientRect();
    const anim = document.createElement("img");
    anim.src = src;
    anim.className = "card-fly";
    anim.style.left = `${fromRect.left}px`;
    anim.style.top = `${fromRect.top}px`;
    document.body.appendChild(anim);
    requestAnimationFrame(() => {
      anim.style.transform = `translate(${toRect.left - fromRect.left}px, ${toRect.top - fromRect.top}px)`;
    });
    setTimeout(() => {
      anim.remove();
      // 이전 카드 제거 후 새 카드로 교체
      toEl.innerHTML = "";
      const placed = document.createElement("img");
      placed.src = src;
      placed.className = "w-[80px] h-[110px]";
      toEl.appendChild(placed);
    }, 500);
  }

  resetBtn.addEventListener("click", () => {
    [selectedLeft, selectedRight].forEach((el) => {
      el.style.backgroundImage = `url("/imges/card-back.webp")`;
      el.removeAttribute("data-card-src");
      el.classList.remove("border-5");
    });
    selectedCardNumbers = [];
    activeCardId = null;
    tempDisabled.clear();
    lastDisabled.clear();
    removedNumbers.clear();
    renderMyCards();
  });

  submitBtn.addEventListener("click", () => {
    if (!activeCardId || selectedCardNumbers.length < 2) {
      alert("카드를 선택해주세요");
      return;
    }
    const [a, b] = selectedCardNumbers;
    const keepNum = activeCardId === "left" ? a : b;
    const loseNum = activeCardId === "left" ? b : a;
    const keepSrc = `/imges/card-${keepNum}.webp`;
    const loseSrc = `/imges/card-${loseNum}.webp`;
    selectedLeft.style.backgroundImage = `url("${keepSrc}")`;
    selectedRight.style.backgroundImage = `url("${loseSrc}")`;
    flyCard(selectedLeft, scoreBoard, keepSrc);
    flyCard(selectedRight, tempStorage, loseSrc);
    removedNumbers.add(keepNum);
    tempDisabled = new Set(lastDisabled);
    lastDisabled.clear();
    lastDisabled.add(loseNum);
    [selectedLeft, selectedRight].forEach((el) => {
      el.style.backgroundImage = `url("/imges/card-back.webp")`;
      el.removeAttribute("data-card-src");
      el.classList.remove("border-5");
    });
    activeCardId = null;
    selectedCardNumbers = [];
    tempDisabled = new Set(lastDisabled);
    renderMyCards();
  });

  renderMyCards();
  setupSlotToggle();
});
