import "../../style.css";
window.addEventListener("DOMContentLoaded", () => {
  const selectedLeft = document.getElementById("selected-left") as HTMLDivElement;
  const selectedRight = document.getElementById("selected-right") as HTMLDivElement;
  const resetBtn = document.querySelector("#submitbutton button:nth-child(1)") as HTMLButtonElement;
  const submitBtn = document.querySelector("#submitbutton button:nth-child(2)") as HTMLButtonElement;
  const myCardContainer = document.querySelector(".flex.translate-y-10.ml-20 > .flex.space-x-2") as HTMLDivElement;
  const scoreBoard = document.getElementById("final-card-area") as HTMLDivElement;
  const tempStorage = document.getElementById("temp-card-area") as HTMLDivElement;

  if (!selectedLeft || !selectedRight || !resetBtn || !submitBtn || !myCardContainer || !scoreBoard || !tempStorage) {
    console.error("필수 요소를 찾을 수 없습니다.");
    return;
  }

  let selectedCardNumbers: number[] = [];
  let activeCardId: "left" | "right" | null = null;

  /**
   * 손패에 남은 카드 수에 따라
   * - 1장 남으면 사용된 카드는 제거
   * - 2장 남으면 모두 활성화
   * - 그 외(>2) 사용된 카드는 비활성화
   */
  function updateHandCardAvailability(): void {
    const cards = Array.from(myCardContainer.querySelectorAll<HTMLImageElement>("img[data-card]"));
    const used = new Set<number>();
    [scoreBoard, tempStorage].forEach((board) => {
      board.querySelectorAll<HTMLImageElement>("img[data-card]").forEach((img) => {
        const m = img.src.match(/card-(\d+)\.webp/);
        if (m) used.add(Number(m[1]));
      });
    });

    // 1장 남으면 사용된 카드는 완전히 제거
    if (cards.length === 1) {
      cards.forEach((card) => {
        const num = Number(card.getAttribute("data-card"));
        if (used.has(num)) {
          card.remove();
        }
      });
      return;
    }

    // 2장 남으면 모두 활성화
    if (cards.length === 2) {
      cards.forEach((card) => {
        card.classList.remove("opacity-50");
        card.style.pointerEvents = "";
      });
      return;
    }

    // 그 외(>2): 사용된 카드는 반투명+클릭불가
    cards.forEach((card) => {
      const num = Number(card.getAttribute("data-card"));
      if (used.has(num)) {
        card.classList.add("opacity-50");
        card.style.pointerEvents = "none";
      } else {
        card.classList.remove("opacity-50");
        card.style.pointerEvents = "";
      }
    });
  }

  /**
   * 플레이어 손패 렌더링
   */
  function renderMyCards(): void {
    myCardContainer.innerHTML = "";
    for (let i = 1; i <= 8; i++) {
      if (selectedCardNumbers.includes(i)) continue;
      const card = document.createElement("img");
      card.src = `/imges/card-${i}.webp`;
      card.className = "w-[153px] h-[214px] cursor-pointer transition-transform duration-200 ease-in-out hover:scale-110";
      card.setAttribute("data-card", String(i));

      card.addEventListener("click", () => {
        if (card.classList.contains("opacity-50")) return;
        if (selectedCardNumbers.length >= 2) return;
        selectedCardNumbers.push(i);
        card.remove();

        const imgUrl = card.src;
        if (selectedCardNumbers.length === 1) {
          selectedLeft.style.backgroundImage = `url("${imgUrl}")`;
          selectedLeft.setAttribute("data-card-src", imgUrl);
        } else {
          selectedRight.style.backgroundImage = `url("${imgUrl}")`;
          selectedRight.setAttribute("data-card-src", imgUrl);
        }

        updateHandCardAvailability();
      });

      myCardContainer.appendChild(card);
    }
    updateHandCardAvailability();
  }

  /**
   * 제출 슬롯 클릭 설정
   */
  function setupSubmitCardClick(): void {
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

  /**
   * 카드 슬라이드 애니메이션
   */
  function flyCard(fromEl: HTMLElement, toEl: HTMLElement, src: string): void {
    const fromRect = fromEl.getBoundingClientRect();
    const toRect = toEl.getBoundingClientRect();
    const card = document.createElement("img");
    card.src = src;
    const m = src.match(/card-(\d+)\.webp/);
    if (m) card.setAttribute("data-card", m[1]);
    card.className = "card-fly";
    card.style.left = `${fromRect.left}px`;
    card.style.top = `${fromRect.top}px`;
    document.body.appendChild(card);

    requestAnimationFrame(() => {
      card.style.transform = `translate(${toRect.left - fromRect.left}px, ${toRect.top - fromRect.top}px)`;
    });

    setTimeout(() => {
      card.style.transform = "";
      card.style.transition = "";
      card.style.position = "";
      card.style.left = "";
      card.style.top = "";
      card.classList.remove("card-fly");
      card.classList.add("w-[80px]", "h-[110px]");
      toEl.innerHTML = "";
      toEl.appendChild(card);
      updateHandCardAvailability();
    }, 500);
  }

  // 초기화
  resetBtn.addEventListener("click", () => {
    selectedCardNumbers = [];
    [selectedLeft, selectedRight].forEach((el) => {
      el.style.backgroundImage = `url("/imges/card-back.webp")`;
      el.removeAttribute("data-card-src");
      el.classList.remove("border-4", "border-yellow-300");
    });
    scoreBoard.innerHTML = "";
    tempStorage.innerHTML = "";
    renderMyCards();
  });

  // 제출
  submitBtn.addEventListener("click", () => {
    const keepEl = activeCardId === "left" ? selectedLeft : selectedRight;
    const removeEl = activeCardId === "left" ? selectedRight : selectedLeft;
    const keepSrc = keepEl.getAttribute("data-card-src");
    const removeSrc = removeEl.getAttribute("data-card-src");

    if (!activeCardId || !keepSrc || keepSrc.includes("card-back.webp")) {
      alert("카드를 선택해주세요");
      return;
    }

    flyCard(keepEl, scoreBoard, keepSrc);
    if (removeSrc) flyCard(removeEl, tempStorage, removeSrc);

    // 패배 카드 복귀
    if (removeSrc) {
      const m2 = removeSrc.match(/card-(\d+)\.webp/);
      if (m2) {
        const num = Number(m2[1]);
        const card = document.createElement("img");
        card.src = removeSrc;
        card.className = "w-[153px] h-[214px] cursor-pointer transition-transform duration-200 ease-in-out hover:scale-110";
        card.setAttribute("data-card", String(num));
        card.addEventListener("click", () => {
          if (card.classList.contains("opacity-50")) return;
          if (selectedCardNumbers.length >= 2) return;
          selectedCardNumbers.push(num);
          card.remove();
          const imgUrl = card.src;
          if (selectedCardNumbers.length === 1) {
            selectedLeft.style.backgroundImage = `url("${imgUrl}")`;
            selectedLeft.setAttribute("data-card-src", imgUrl);
          } else {
            selectedRight.style.backgroundImage = `url("${imgUrl}")`;
            selectedRight.setAttribute("data-card-src", imgUrl);
          }
          updateHandCardAvailability();
        });
        myCardContainer.appendChild(card);
      }
    }

    // 슬롯 초기화
    [selectedLeft, selectedRight].forEach((el) => {
      el.style.backgroundImage = `url("/imges/card-back.webp")`;
      el.removeAttribute("data-card-src");
      el.classList.remove("border-4", "border-yellow-300");
    });
    selectedCardNumbers = [];
    activeCardId = null;
  });

  renderMyCards();
  setupSubmitCardClick();
});
