import "../../style.css";
import "./chat.ts";

interface TempCard {
  card: number;
  returnRound: number;
}

let currentRound = 1;
let selectedCardNumbers: number[] = [];
let activeCardId: "left" | "right" | null = null;
let mySubmittedCard: number | null = null;
let tempStorage: TempCard[] = [];
const submittedCards: { [playerId: string]: number } = {};

const selectedLeft = document.getElementById("selected-left") as HTMLDivElement;
const selectedRight = document.getElementById(
  "selected-right"
) as HTMLDivElement;
const resetBtn = document.querySelector(
  "#submitbutton button:nth-child(1)"
) as HTMLButtonElement;
const submitBtn = document.querySelector(
  "#submitbutton button:nth-child(2)"
) as HTMLButtonElement;
const myCardContainer = document.querySelector(
  ".flex.translate-y-10.ml-20 > .flex.space-x-2"
) as HTMLDivElement;
const scoreBoard = document.getElementById("final-card-area") as HTMLDivElement;
const tempStorageArea = document.getElementById(
  "temp-card-area"
) as HTMLDivElement;

const isHost = localStorage
  .getItem("A13C_CREATE_ROOM_INFO")
  ?.includes('"isCreator":true');

// 오버레이 추가
const overlay = document.createElement("div");
overlay.id = "game-overlay";
overlay.className =
  "fixed top-0 left-0 w-3/4 h-full z-40 bg-black/60 flex flex-col justify-center items-center text-white text-2xl pointer-events-none backdrop-blur-sm";
overlay.innerHTML = isHost
  ? `<div class="pointer-events-auto text-center">
       <p class="mb-4">게임을 시작하려면 아래 버튼을 누르세요</p>
       <button id="startGameBtn" class="btn btn-active text-xl px-6 py-2">게임 시작</button>
     </div>`
  : `<p class="pointer-events-none">방장이 게임을 시작할 때까지 기다려주세요</p>`;

const gameMain = document.querySelector("main");
if (gameMain) {
  gameMain.appendChild(overlay);
} else {
  document.body.appendChild(overlay);
}

const timerDisplay = document.createElement("div");
timerDisplay.id = "selection-timer";
timerDisplay.className = "text-white text-xl ml-20 mt-2";
selectedLeft.parentElement?.parentElement?.insertBefore(
  timerDisplay,
  selectedLeft.parentElement
);

function updateHandCardAvailability(): void {
  const cards = Array.from(
    myCardContainer.querySelectorAll<HTMLImageElement>("img[data-card]")
  );
  const used = new Set<number>();
  [scoreBoard, tempStorageArea].forEach((board) => {
    board
      .querySelectorAll<HTMLImageElement>("img[data-card]")
      .forEach((img) => {
        const m = img.src.match(/card-(\d+)\.webp/);
        if (m) used.add(Number(m[1]));
      });
  });
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

function renderMyCards(): void {
  myCardContainer.innerHTML = "";
  for (let i = 1; i <= 8; i++) {
    if (selectedCardNumbers.includes(i)) continue;
    const card = document.createElement("img");
    card.src = `/imges/card-${i}.webp`;
    card.className =
      "w-[153px] h-[214px] cursor-pointer transition-transform duration-200 ease-in-out hover:scale-110";
    card.setAttribute("data-card", String(i));
    card.addEventListener("click", () => selectCard(i, card));
    myCardContainer.appendChild(card);
  }
  updateHandCardAvailability();
  startSelectionTimer();
}

function selectCard(num: number, cardEl: HTMLImageElement): void {
  if (cardEl.classList.contains("opacity-50")) return;
  if (selectedCardNumbers.length >= 2) return;
  selectedCardNumbers.push(num);
  cardEl.remove();
  const target =
    selectedCardNumbers.length === 1 ? selectedLeft : selectedRight;
  target.style.backgroundImage = `url("/imges/card-${num}.webp")`;
  target.setAttribute("data-card-src", `/imges/card-${num}.webp`);
  if (selectedCardNumbers.length === 2) {
    clearInterval(timerInterval);
    timerDisplay.textContent = "";
  }
}

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
    card.remove();
    const finalCard = document.createElement("img");
    finalCard.src = src;
    finalCard.className = "w-[80px] h-[110px]";
    if (m) finalCard.setAttribute("data-card", m[1]);
    toEl.innerHTML = "";
    toEl.appendChild(finalCard);
    updateHandCardAvailability();
  }, 500);
}

let selectionTimeout: ReturnType<typeof setTimeout>;
let timerInterval: ReturnType<typeof setInterval>;
function startSelectionTimer(): void {
  clearTimeout(selectionTimeout);
  clearInterval(timerInterval);
  let remaining = 8;
  timerDisplay.textContent = `카드 선택 시간: ${remaining}초`;
  timerInterval = setInterval(() => {
    remaining--;
    if (remaining > 0) {
      timerDisplay.textContent = `카드 선택 시간: ${remaining}초`;
    } else {
      clearInterval(timerInterval);
      timerDisplay.textContent = "";
    }
  }, 1000);
  selectionTimeout = setTimeout(() => {
    if (selectedCardNumbers.length < 2) {
      const availableCards = Array.from(
        myCardContainer.querySelectorAll<HTMLImageElement>("img[data-card]")
      ).map((card) => Number(card.getAttribute("data-card")));
      while (selectedCardNumbers.length < 2 && availableCards.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableCards.length);
        const randomCard = availableCards.splice(randomIndex, 1)[0];
        const cardEl = myCardContainer.querySelector(
          `img[data-card="${randomCard}"]`
        );
        if (cardEl) {
          selectCard(randomCard, cardEl as HTMLImageElement);
        }
      }
    }
  }, 8000);
}

resetBtn.addEventListener("click", () => {
  selectedCardNumbers = [];
  activeCardId = null;
  selectedLeft.style.backgroundImage = `url("/imges/card-back.webp")`;
  selectedRight.style.backgroundImage = `url("/imges/card-back.webp")`;
  selectedLeft.removeAttribute("data-card-src");
  selectedRight.removeAttribute("data-card-src");
  selectedLeft.classList.remove("border-4", "border-yellow-300");
  selectedRight.classList.remove("border-4", "border-yellow-300");
  scoreBoard.innerHTML = "";
  tempStorageArea.innerHTML = "";
  renderMyCards();
});

submitBtn.addEventListener("click", () => {
  const keepEl = activeCardId === "left" ? selectedLeft : selectedRight;
  const removeEl = activeCardId === "left" ? selectedRight : selectedLeft;
  const keepSrc = keepEl.getAttribute("data-card-src");
  const removeSrc = removeEl.getAttribute("data-card-src");
  if (!activeCardId || !keepSrc || keepSrc.includes("card-back")) {
    alert("카드를 선택해주세요");
    return;
  }
  flyCard(keepEl, scoreBoard, keepSrc);
  const m = keepSrc.match(/card-(\d+)\.webp/);
  if (m) {
    mySubmittedCard = Number(m[1]);
    submittedCards["me"] = mySubmittedCard;
  }
  if (removeSrc) {
    const m2 = removeSrc.match(/card-(\d+)\.webp/);
    if (m2) {
      const num = Number(m2[1]);
      tempStorage.push({ card: num, returnRound: currentRound + 2 });
      flyCard(removeEl, tempStorageArea, removeSrc);
    }
  }
  selectedCardNumbers = [];
  activeCardId = null;
});

document.addEventListener("DOMContentLoaded", () => {
  setupSubmitCardClick();
  if (isHost) {
    const startBtn = document.getElementById("startGameBtn");
    startBtn?.addEventListener("click", () => {
      alert("게임이 시작되었습니다.");
      document.getElementById("game-overlay")?.remove();
      renderMyCards();
    });
  } else {
    const observer = new MutationObserver(() => {
      if (!document.getElementById("game-overlay")) {
        alert("게임이 시작되었습니다.");
        renderMyCards();
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true });
  }
});
