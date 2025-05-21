import { sendMsg, socket } from "./A13C-chat";
import { removeOverlay, isHost } from "./ingame-server";

// 모듈 스크립트는 defer 동작하므로 DOMContentLoaded 이벤트 불필요

/** 왼쪽 카드 선택 슬롯 */
const selectedLeft = document.getElementById("selected-left") as HTMLDivElement;
/** 오른쪽 카드 선택 슬롯 */
const selectedRight = document.getElementById(
  "selected-right"
) as HTMLDivElement;
/** 리셋 버튼 */
const resetBtn = document.querySelector(
  "#submitbutton button:nth-child(1)"
) as HTMLButtonElement;
/** 제출 버튼 */
const submitBtn = document.querySelector(
  "#submitbutton button:nth-child(2)"
) as HTMLButtonElement;
/** 내 카드 영역 */
const myCardContainer = document.getElementById("my-cards") as HTMLDivElement;
/** 점수판(최종 카드 영역) */
const scoreBoard = document.getElementById("final-card-area") as HTMLDivElement;
/** 임시 저장 카드 영역 */
const tempStorage = document.getElementById("temp-card-area") as HTMLDivElement;

window.addEventListener("DOMContentLoaded", () => {
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
});

document.addEventListener("DOMContentLoaded", () => {
  if (isHost) {
    const startBtn = document.getElementById("startGameBtn");
    startBtn?.addEventListener("click", () => {
      removeOverlay();
    });
  }
});

/** 제출되어 손에서 제거된 카드 번호 집합 */
const removedNumbers = new Set<number>();
/** 임시로 비활성화된 카드 번호 집합 */
let tempDisabled = new Set<number>();
/** 마지막으로 비활성화된 카드 번호 집합 */
let lastDisabled = new Set<number>();
/** 현재 선택된 카드 번호 배열 (최대 2개) */
let selectedCardNumbers: number[] = [];
/** 현재 활성화된 카드 슬롯 ("left" | "right" | null) */
// let activeCardId: "left" | "right" | null = null;

/**
 * 플레이어의 손패 카드를 렌더링합니다.
 * removedNumbers와 tempDisabled를 고려하여 활성/비활성 카드를 구분하고,
 * 핸드 카드 수가 2장 이하일 경우 렌더를 종료합니다.
 */
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

/**
 * 카드 이미지를 생성하여 myCardContainer에 추가합니다.
 * @param cardNum - 카드 번호
 * @param disabled - 비활성화 여부
 */
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
    slot.style.backgroundImage = `url(${card.src})`;
    slot.setAttribute("data-card-src", card.src);
    card.remove();
    updateHandCardAvailability();
  });
  myCardContainer.appendChild(card);
}

/** 슬롯 클릭 시 활성 슬롯을 전환할 수 있게 이벤트 설정 */
export function setupSlotToggle() {
  [selectedLeft, selectedRight].forEach((slot) => {
    slot.addEventListener("click", () => {
      if (!slot.getAttribute("data-card-src")) return;
      selectedLeft.classList.remove("border-4", "border-yellow-300");
      selectedRight.classList.remove("border-4", "border-yellow-300");
      slot.classList.add("border-4", "border-yellow-300");
      // let activeCardId: "left" | "right" | null = null;
      // activeCardId = slot === selectedLeft ? "left" : "right";
    });
  });
}

/** 손패의 카드 클릭 가능 여부 업데이트 */
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

/** 카드 이동 애니메이션 처리 */
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

// 리셋 버튼 클릭 핸들러
resetBtn.addEventListener("click", () => {
  // let activeCardId: "left" | "right" | null = null;
  [selectedLeft, selectedRight].forEach((el) => {
    el.style.backgroundImage = `url(/imges/card-back.webp)`;
    el.removeAttribute("data-card-src");
    el.classList.remove("border-4", "border-yellow-300");
  });
  selectedCardNumbers = [];
  // activeCardId = null;
  tempDisabled.clear();
  lastDisabled.clear();
  removedNumbers.clear();
  renderMyCards();
});

// 제출 버튼 클릭 핸들러
function submitBtnFun() {
  submitBtn.addEventListener("click", () => {
    // 1️⃣ 활성 슬롯 확인
    const activeCardId = selectedLeft.getAttribute("data-card-src")
      ? "left"
      : selectedRight.getAttribute("data-card-src")
        ? "right"
        : null;
    if (!activeCardId) {
      alert("카드를 선택해주세요");
      return;
    }

    // 2️⃣ 선택된 카드 번호 분해
    const [a, b] = selectedCardNumbers;
    const keepNum = activeCardId === "left" ? a : b;
    const loseNum = activeCardId === "left" ? b : a;

    // 3️⃣ 이미지 경로 설정
    const keepSrc = `/imges/card-${keepNum}.webp`;
    const loseSrc = `/imges/card-${loseNum}.webp`;

    // 4️⃣ 카드 비행 애니메이션 실행
    flyCard(selectedLeft, scoreBoard, keepSrc);
    flyCard(selectedRight, tempStorage, loseSrc);

    // 5️⃣ 상태 업데이트
    removedNumbers.add(keepNum);
    tempDisabled = new Set(lastDisabled);
    lastDisabled.clear();
    lastDisabled.add(loseNum);
    tempDisabled = new Set(lastDisabled);

    // 6️⃣ 슬롯 초기화
    [selectedLeft, selectedRight].forEach((el) => {
      el.style.backgroundImage = `url("/imges/card-back.webp")`;
      el.removeAttribute("data-card-src");
      el.classList.remove("border-4", "border-yellow-300");
    });
    selectedCardNumbers = [];
    // activeCardId = null;

    // 7️⃣ 내 카드 UI 재렌더링
    renderMyCards();

    // 8️⃣ 서버로 제출 메시지 전송
    sendMsg(
      `님이 선택한 카드는 ${keepNum}번 카드, 선택하지 않은 카드는 ${loseNum}번 카드입니다.`
    );
    console.log("전송된 오른쪽 카드 번호:", loseNum);
    console.log("전송된 왼쪽 카드 번호:", keepNum);
  });
}

socket.on("message", (data: object) => {
  submitBtnFun();
  sendMsg<object>({ msg: data });
  console.log("수신된 카드 src:", data);
});

// 상대 플레이어 카드 공개 (테스트용)
export function revealOpponentCards(): void {
  const opponentContainers =
    document.querySelectorAll<HTMLDivElement>(".flex.space-x-1");
  // 테스트용 더미 카드 번호 생성
  const fakeOpponentCards = Array.from(
    { length: opponentContainers.length },
    () => {
      const a = Math.floor(Math.random() * 8) + 1;
      let b: number;
      do {
        b = Math.floor(Math.random() * 8) + 1;
      } while (b === a);
      return [a, b] as [number, number];
    }
  );

  opponentContainers.forEach((container, i) => {
    const imgs = container.querySelectorAll<HTMLImageElement>("img");

    // 카드 이미지와 data-card 속성 세팅
    imgs.forEach((img, j) => {
      const num = fakeOpponentCards[i][j];
      img.src = `/imges/card-${num}.webp`;
      img.setAttribute("data-card", String(num));
      img.classList.remove("border-4", "border-yellow-300", "opacity-50");
    });

    // 클릭 핸들러 등록
    imgs.forEach((img) => {
      img.addEventListener("click", () => {
        // 1️⃣ 선택 표시 토글
        imgs.forEach((el) => {
          el.classList.remove("border-4", "border-yellow-300");
          el.classList.add("opacity-50");
        });
        img.classList.add("border-4", "border-yellow-300");
        img.classList.remove("opacity-50");

        // 2️⃣ 선택한 카드와 비활성 카드 번호 가져오기
        const selected = img.getAttribute("data-card");
        const other = Array.from(imgs)
          .find((el) => el !== img)
          ?.getAttribute("data-card");

        // 3️⃣ 닉네임 추출
        const parent = container.parentElement;
        let nickname = `플레이어${i + 1}`;
        const nickEl = parent?.querySelector(
          `#nickname-${i + 1}`
        ) as HTMLElement;
        if (nickEl && nickEl.textContent) nickname = nickEl.textContent;

        // 4️⃣ 서버로 메시지 전송
        if (selected && other) {
          sendMsg(
            `${nickname}님이 선택한 카드는 ${selected}번 카드, 선택하지 않은 카드는 ${other}번 카드입니다.`
          );
          console.log(`선택 카드: ${selected}, 비활성 카드: ${other}`);
        }
      });
    });
  });
}

socket.on("message", (data: object) => {
  revealOpponentCards();
  sendMsg<object>({ msg: data });
  console.log("수신된 카드 src:", data);
});

// 초기 렌더 및 이벤트 설정
renderMyCards();
setupSlotToggle();
revealOpponentCards();
submitBtnFun();
