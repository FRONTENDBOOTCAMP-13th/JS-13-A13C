// src/pages/ingame/ingame.ts
import "../../style.css";
import "./ingame-ui.ts";
import { sendMsg, socket, joinRoom, getRoomInfo } from "./A13C-chat.ts";
import type { RoomMembers, JoinRoomParams } from "./A13C-chat.ts";
import "./chat.ts";

function loadCurrentRoom() {
  const saved = sessionStorage.getItem("A13C_CURRENT_ROOM");
  if (!saved) return null;
  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

async function updateOpponentNicknames() {
  console.log("✅ updateOpponentNicknames 함수 시작됨");
  const currentRoom = loadCurrentRoom();
  const savedUser = localStorage.getItem("A13C_CURRENT_USER");

  if (!currentRoom || !savedUser) return;

  const parsed = JSON.parse(savedUser);
  const user_id = parsed.userId;
  const myNick = parsed.nickName;

  // joinRoom 먼저 실행
  const joinParams: JoinRoomParams = {
    roomId: currentRoom.roomId,
    user_id,
    nickName: myNick,
  };

  try {
    const joinResult = await joinRoom(joinParams);
    console.log("✅ joinRoom 결과:", joinResult);

    const roomInfo = await getRoomInfo(currentRoom.roomId);
    console.log("✅ roomInfo:", roomInfo);

    if (!roomInfo || !roomInfo.memberList) return;

    const nickNames = Object.values(roomInfo.memberList).map((m) => m.nickName);
    console.log("✅ nickNames:", nickNames);
    for (let i = 1; i <= 4; i++) {
      const el = document.getElementById(`nickname-${i}`);
      const nick = nickNames[i - 1];
      console.log(`⛳ nickname-${i}:`, el, "| nick:", nick);
      if (el && nick) {
        el.textContent = nick;
      } else {
        console.warn(`⚠️ nickname-${i} 요소 또는 nick이 존재하지 않음`);
      }
    }
  } catch (e) {
    console.error("❌ joinRoom 또는 getRoomInfo 중 오류 발생:", e);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  updateOpponentNicknames();
});

// interface TempCard {
//   card: number;
//   returnRound: number;
// }

interface Step1Payload {
  action: "step1";
  actor: string;
  card1: number;
  card2: number;
}

// let currentRound = 1;
let selectedCardNumbers: number[] = [];
// let activeCardId: "left" | "right" | null = null;
// let mySubmittedCard: number | null = null;
// let tempStorage: TempCard[] = [];
// const submittedCards: { [playerId: string]: number } = {};

const selectedLeft = document.getElementById("selected-left") as HTMLDivElement;
const selectedRight = document.getElementById(
  "selected-right"
) as HTMLDivElement;
const resetBtn = document.querySelector(
  "#submitbutton button:nth-child(1)"
) as HTMLButtonElement;
// const submitBtn = document.querySelector(
//   "#submitbutton button:nth-child(2)"
// ) as HTMLButtonElement;
const myCardContainer = document.getElementById("my-cards") as HTMLDivElement;
const scoreBoard = document.getElementById("final-card-area") as HTMLDivElement;
const tempStorageArea = document.getElementById(
  "temp-card-area"
) as HTMLDivElement;

export const isHost = localStorage
  .getItem("A13C_CREATE_ROOM_INFO")
  ?.includes('"isCreator":true');
const nickName = localStorage.getItem("A13C_NICKNAME") || "익명";

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
document.body.appendChild(overlay);

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
}

function selectCard(
  num: number,
  cardEl: HTMLImageElement
  // force = false
): void {
  if (cardEl.classList.contains("opacity-50")) return;
  if (selectedCardNumbers.length >= 2) return;
  selectedCardNumbers.push(num);
  cardEl.remove();
  const target =
    selectedCardNumbers.length === 1 ? selectedLeft : selectedRight;
  target.style.backgroundImage = `url("/imges/card-${num}.webp")`;
  target.setAttribute("data-card-src", `/imges/card-${num}.webp`);
}

function setupSubmitCardClick(): void {
  selectedLeft.addEventListener("click", () => {
    selectedLeft.classList.add("border-4", "border-yellow-300");
    selectedRight.classList.remove("border-4", "border-yellow-300");
    // activeCardId = "left";
  });
  selectedRight.addEventListener("click", () => {
    selectedRight.classList.add("border-4", "border-yellow-300");
    selectedLeft.classList.remove("border-4", "border-yellow-300");
    // activeCardId = "right";
  });
}

function sendStep1Cards(): void {
  const card1 = Number(
    selectedLeft.getAttribute("data-card-src")?.match(/\d+/)?.[0]
  );
  const card2 = Number(
    selectedRight.getAttribute("data-card-src")?.match(/\d+/)?.[0]
  );
  const message: Step1Payload = {
    action: "step1",
    actor: nickName,
    card1,
    card2,
  };
  socket.emit("message", message);
  console.log("emit step1 message:", message);
}

sendStep1Cards();

resetBtn.addEventListener("click", () => {
  selectedCardNumbers = [];
  // activeCardId = null;
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

export function removeOverlay(): boolean {
  const overlay = document.getElementById("game-overlay");
  if (overlay) {
    overlay.remove();
    return true;
  }
  return true;
}

document.addEventListener("DOMContentLoaded", () => {
  setupSubmitCardClick();
  if (isHost) {
    const startBtn = document.getElementById("startGameBtn");
    startBtn?.addEventListener("click", () => {
      sendMsg<string>("게임시작");
      console.log("startGame");
    });
  }
});

socket.on("message", (data: any) => {
  if (data.msg === "게임시작") {
    removeOverlay();
    return;
  }
});

socket.on("message", (data: Step1Payload) => {
  if (data.action === "step1") {
    const { actor, card1, card2 } = data;
    if (actor !== nickName) {
      console.log(`상대 ${actor}가 카드 ${card1}, ${card2} 선택함.`);
      // TODO: 상대 카드 UI 표시
    }
  }
});

socket.on("members", (members: RoomMembers) => {
  const savedUser = localStorage.getItem("A13C_CURRENT_USER");
  if (!savedUser) return;

  let myNick = "";
  try {
    const parsed = JSON.parse(savedUser);
    myNick = parsed.nickName;
  } catch (e) {
    console.error("❌ 사용자 정보 파싱 실패:", e);
    return;
  }

  // 소켓 ID 기준 정렬
  const sortedMembers = Object.entries(members)
    .sort(([idA], [idB]) => (idA > idB ? 1 : -1))
    .map(([_, member]) => member);

  // ✅ 현재 사용자의 위치 파악
  const myIndex = sortedMembers.findIndex((m) => m.nickName === myNick);

  // ✅ 현재 사용자 기준으로, 본인을 제외한 순서 보장된 배열 생성
  const otherMembers = [
    ...sortedMembers.slice(0, myIndex),
    ...sortedMembers.slice(myIndex + 1),
  ];

  console.log(
    "🎯 나를 제외한 순서 보장 닉네임:",
    otherMembers.map((m) => m.nickName)
  );

  const updateNicknames = () => {
    for (let i = 1; i <= 4; i++) {
      const el = document.getElementById(`nickname-${i}`);
      if (el) {
        el.textContent = otherMembers[i - 1]?.nickName ?? "";
      }
    }
  };

  const observer = new MutationObserver(() => {
    const ready = otherMembers.every((_, i) =>
      document.getElementById(`nickname-${i + 1}`)
    );
    if (ready) {
      updateNicknames();
      observer.disconnect();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // 혹시 이미 준비됐으면 바로 적용
  setTimeout(() => {
    const ready = otherMembers.every((_, i) =>
      document.getElementById(`nickname-${i + 1}`)
    );
    if (ready) {
      updateNicknames();
      observer.disconnect();
    }
  }, 300);
});
