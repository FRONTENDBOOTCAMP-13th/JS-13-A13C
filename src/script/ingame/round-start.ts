import "../../style.css";
import "./ingame-ui.ts";
import { getRoomInfo, sendMsg, socket } from "../A13C-chat.ts";
import "./chat.ts";
// import { getPlayerList, nextRound } from "./store.ts";

// 오버레이 제거
export function removeOverlay() {
  const ol = document.getElementById("game-overlay");
  if (ol) ol.remove();
}

// ROUND 시작 오버레이
export function showRoundStartOverlay(r: number) {
  const ol = document.createElement("div");
  ol.id = "round-start-overlay";
  ol.className =
    "fixed top-0 left-0 w-full h-full z-10 bg-black/70 text-white text-7xl font-bold flex justify-center items-center";
  ol.textContent = `ROUND ${r}`;
  document.body.appendChild(ol);
  setTimeout(() => ol.remove(), 3500);
}

(async () => {
  const urlParams = new URLSearchParams(location.search);
  const roomId = urlParams.get("roomId")!;
  const nickName = urlParams.get("nickName")!;

  const isHost = (await getRoomInfo(roomId)).hostName === nickName;

  // 처음 대기/게임시작 오버레이 생성
  const overlay = document.createElement("div");
  overlay.id = "game-overlay";
  overlay.className =
    "fixed top-0 left-0 w-full h-full z-10 bg-black/60 flex flex-col justify-center items-center text-white text-2xl pointer-events-none backdrop-blur-sm";
  overlay.innerHTML = isHost
    ? `<div class="pointer-events-auto text-center">
         <p class="mb-4">게임을 시작하려면 아래 버튼을 누르세요</p>
         <button id="startGameBtn" class="btn btn-active text-xl px-6 py-2">게임 시작</button>
       </div>`
    : `<p class="pointer-events-none">방장이 게임을 시작할 때까지 기다려주세요</p>`;
  document.body.appendChild(overlay);

  // 호스트 클릭 핸들러
  if (isHost) {
    document.getElementById("startGameBtn")!.addEventListener("click", () => {
      removeOverlay();
      sendMsg("게임시작");
    });
  }

  // 모든 사용자: 게임 시작 메시지 수신 시 1라운드 오버레이 표시
  socket.on("message", (data: any) => {
    const action = typeof data === "string" ? data : data?.msg;
    if (action === "게임시작") {
      removeOverlay();
      showRoundStartOverlay(1);
    }
  });

  // Score overlay가 사라진 후 다음 ROUND 표시를 위한 Observer
  let roundCounter = 1;
  const scoreOverlay = document.getElementById("round-overlay");
  if (scoreOverlay) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "style") {
          const disp = (mutation.target as HTMLElement).style.display;
          if (disp === "none" && roundCounter < 5) {
            roundCounter++;
            showRoundStartOverlay(roundCounter);
          }
        }
      });
    });
    observer.observe(scoreOverlay, {
      attributes: true,
      attributeFilter: ["style"],
    });
  }
})();
