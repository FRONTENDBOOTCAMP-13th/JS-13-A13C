import { overlay } from "./ingame-server";
/**
 * 게임 인게임 페이지의 메인 스크립트
 * 카드 선택, 제출, 리셋, 애니메이션 등 주요 UI 로직을 담당합니다.
 */
window.addEventListener("DOMContentLoaded", () => {
  /** 왼쪽 카드 선택 슬롯 */
  const selectedLeft = document.getElementById("selected-left") as HTMLDivElement;
  /** 오른쪽 카드 선택 슬롯 */
  const selectedRight = document.getElementById("selected-right") as HTMLDivElement;
  /** 리셋 버튼 */
  const resetBtn = document.querySelector("#submitbutton button:nth-child(1)") as HTMLButtonElement;
  /** 제출 버튼 */
  const submitBtn = document.querySelector("#submitbutton button:nth-child(2)") as HTMLButtonElement;
  /** 내 카드 영역 */
  const myCardContainer = document.getElementById("my-cards") as HTMLDivElement;
  /** 점수판(최종 카드 영역) */
  const scoreBoard = document.getElementById("final-card-area") as HTMLDivElement;
  /** 임시 저장 카드 영역 */
  const tempStorage = document.getElementById("temp-card-area") as HTMLDivElement;

  if (!selectedLeft || !selectedRight || !resetBtn || !submitBtn || !myCardContainer || !scoreBoard || !tempStorage) {
    console.error("필수 요소를 찾을 수 없습니다.");
    return;
  }

  /** 제출되어 손에서 제거된 카드 번호 집합 */
  const removedNumbers = new Set<number>();
  /** 임시로 비활성화된 카드 번호 집합 */
  let tempDisabled = new Set<number>();
  /** 마지막으로 비활성화된 카드 번호 집합 */
  let lastDisabled = new Set<number>();
  /** 현재 선택된 카드 번호 배열 (최대 2개) */
  let selectedCardNumbers: number[] = [];
  /** 현재 활성화된 카드 슬롯 ("left" | "right" | null) */
  let activeCardId: "left" | "right" | null = null;

  /**
   * 플레이어의 손패 카드를 렌더링합니다.
   * removedNumbers와 tempDisabled를 고려하여 활성/비활성 카드를 구분하고,
   * 핸드 카드 수가 2장 이하일 경우 렌더를 종료합니다.
   * @returns {void}
   */
  function renderMyCards(): void {
    myCardContainer.innerHTML = "";
    const activeNums: number[] = [];
    for (let i = 1; i <= 8; i++) {
      if (removedNumbers.has(i) || tempDisabled.has(i)) continue;
      activeNums.push(i);
    }
    const disabledNums = Array.from(tempDisabled).filter((i) => !removedNumbers.has(i));

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

  /**
   * 카드 이미지를 생성하여 myCardContainer에 추가합니다.
   * @param {number} cardNum - 카드 번호
   * @param {boolean} disabled - 비활성화 여부
   * @returns {void}
   */
  function appendCard(cardNum: number, disabled: boolean): void {
    const card = document.createElement("img");
    card.src = `/imges/card-${cardNum}.webp`;
    card.className = "w-[153px] h-[214px] cursor-pointer transition-transform duration-200 ease-in-out hover:scale-110";
    card.setAttribute("data-card", String(cardNum));
    if (disabled) {
      card.classList.add("opacity-50");
      card.style.pointerEvents = "none";
    }
    card.addEventListener("click", () => {
      if (card.style.pointerEvents === "none") return;
      if (selectedCardNumbers.length >= 2) return;
      selectedCardNumbers.push(cardNum);
      const slot = selectedCardNumbers.length === 1 ? selectedLeft : selectedRight;
      slot.style.backgroundImage = `url(${card.src})`;
      slot.setAttribute("data-card-src", card.src);
      card.remove();
      updateHandCardAvailability();
    });
    myCardContainer.appendChild(card);
  }

  /**
   * 선택 슬롯에 클릭 이벤트를 설정하여 활성 슬롯을 전환할 수 있게 합니다.
   * @returns {void}
   */
  function setupSlotToggle(): void {
    [selectedLeft, selectedRight].forEach((slot) => {
      slot.addEventListener("click", () => {
        if (!slot.getAttribute("data-card-src")) return;
        selectedLeft.classList.remove("border-4", "border-yellow-300");
        selectedRight.classList.remove("border-4", "border-yellow-300");
        slot.classList.add("border-4", "border-yellow-300");
        activeCardId = slot === selectedLeft ? "left" : "right";
      });
    });
  }

  /**
   * 손패의 카드 클릭 가능 여부를 업데이트합니다.
   * selectedCardNumbers와 tempDisabled 상태에 따라 pointer-events를 조절합니다.
   * @returns {void}
   */
  function updateHandCardAvailability(): void {
    const cards = Array.from(myCardContainer.querySelectorAll<HTMLImageElement>("img[data-card]"));
    if (selectedCardNumbers.length === 2) {
      cards.forEach((c) => (c.style.pointerEvents = "none"));
    } else {
      cards.forEach((c) => {
        const num = Number(c.getAttribute("data-card"));
        c.style.pointerEvents = tempDisabled.has(num) ? "none" : "";
      });
    }
  }

  /**
   * 카드 이미지를 fromEl에서 toEl로 이동 애니메이션을 실행합니다.
   * @param {HTMLElement} fromEl - 애니메이션 시작 요소
   * @param {HTMLElement} toEl - 애니메이션 종료 요소
   * @param {string} src - 카드 이미지 src
   * @returns {void}
   */
  function flyCard(fromEl: HTMLElement, toEl: HTMLElement, src: string): void {
    const fromRect = fromEl.getBoundingClientRect();
    const toRect = toEl.getBoundingClientRect();
    const dx = toRect.left - fromRect.left;
    const dy = toRect.top - fromRect.top;
    const anim = document.createElement("img");
    anim.src = src;
    anim.className = "card-fly";
    anim.style.left = `${fromRect.left}px`;
    anim.style.top = `${fromRect.top}px`;
    document.body.appendChild(anim);
    requestAnimationFrame(() => {
      anim.style.transform = `translate(${dx}px, ${dy}px)`;
    });
    setTimeout(() => {
      anim.remove();
      toEl.innerHTML = "";
      const placed = document.createElement("img");
      placed.src = src;
      placed.className = "w-[80px] h-[110px]";
      toEl.appendChild(placed);
    }, 500);
  }

  /**
   * 리셋 버튼 클릭 시 선택 상태 및 카드 상태를 초기화합니다.
   */
  resetBtn.addEventListener("click", () => {
    [selectedLeft, selectedRight].forEach((el) => {
      el.style.backgroundImage = `url(/imges/card-back.webp)`;
      el.removeAttribute("data-card-src");
      el.classList.remove("border-4", "border-yellow-300");
    });
    selectedCardNumbers = [];
    activeCardId = null;
    tempDisabled.clear();
    lastDisabled.clear();
    removedNumbers.clear();
    renderMyCards();
  });

  /**
   * 제출 버튼 클릭 시 선택된 카드 처리 및 애니메이션, 상태 갱신을 수행합니다.
   */
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
      el.classList.remove("border-4", "border-yellow-300");
    });
    activeCardId = null;
    selectedCardNumbers = [];
    tempDisabled = new Set(lastDisabled);
    renderMyCards();
  });

  function revealOpponentCards(): void {
    const opponentContainers = document.querySelectorAll(".flex.space-x-1");

    const fakeOpponentCards = [
      [3, 7],
      [5, 2],
      [1, 6],
      [4, 8],
    ];

    opponentContainers.forEach((container, i) => {
      const imgs = container.querySelectorAll("img");
      imgs.forEach((img, j) => {
        const num = fakeOpponentCards[i][j];
        img.src = `/imges/card-${num}.webp`;
      });
    });
  }

  const timerDisplay = document.createElement("div");
  timerDisplay.id = "selection-timer";
  timerDisplay.className = "text-white text-xl ml-20 mt-2";
  selectedLeft.parentElement?.parentElement?.insertBefore(timerDisplay, selectedLeft.parentElement);

  /** 카드 선택 제한 시간 타임아웃 핸들러 */
  let selectionTimeout: ReturnType<typeof setTimeout>;
  /** 카드 선택 타이머 인터벌 핸들러 */
  let timerInterval: ReturnType<typeof setInterval>;
  /** 카드 선택 시간 만료 여부 */
  let selectionExpired: boolean = false;

  /**
   * 카드 선택 타이머 시작
   */
  function startSelectionTimer(): void {
    clearTimeout(selectionTimeout);
    clearInterval(timerInterval);
    let remaining = 8;
    selectionExpired = false;
    timerDisplay.textContent = `카드 선택 시간: ${remaining}초`;
    
      timerInterval = setInterval(() => {
        remaining--;
        if (remaining > 0) {
          timerDisplay.textContent = `카드 선택 시간: ${remaining}초`;
        } else {
          timerDisplay.textContent = "시간 종료";
          submitBtn.classList.remove("hidden");
          clearInterval(timerInterval);
        }
      }, 1000);

    selectionTimeout = setTimeout(() => {
      selectionExpired = true;
      const availableCardElements = Array.from(myCardContainer.querySelectorAll<HTMLImageElement>("img[data-card]"));

      const availableCards = availableCardElements.map((card) => Number(card.getAttribute("data-card")));

      // 시간 초과 시 남은 카드에서 랜덤으로 선택
      while (selectedCardNumbers.length < 2 && availableCards.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableCards.length);
        const randomCard = availableCards.splice(randomIndex, 1)[0];
        const cardEl = myCardContainer.querySelector(`img[data-card="${randomCard}"]`) as HTMLImageElement;
        if (cardEl) {
          cardEl.remove();
          appendCard(randomCard, true);
        }
      }

      revealOpponentCards();
    }, 8000);
  }

  // 초기 렌더 및 슬롯 토글 이벤트 설정
  renderMyCards();
  setupSlotToggle();
  startSelectionTimer();
});
