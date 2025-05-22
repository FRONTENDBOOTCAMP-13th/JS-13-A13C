import "../../style.css";
import "./ingame-ui.ts";
import { sendMsg, socket } from "../A13C-chat.ts";
import "./chat.ts";

// 오버레이 제거
export function removeOverlay() {
  const ol = document.getElementById("game-overlay");
  if (ol) ol.remove();
}

// ROUND 시작 오버레이
function showRoundStartOverlay(r: number) {
  const ol = document.createElement("div");
  ol.id = "round-start-overlay";
  ol.className =
    "fixed top-0 left-0 w-full h-full z-50 bg-black/70 text-white text-7xl font-bold flex justify-center items-center";
  ol.textContent = `ROUND ${r}`;
  document.body.appendChild(ol);
  setTimeout(() => ol.remove(), 3500);
}

window.addEventListener("DOMContentLoaded", () => {
  const isHost = localStorage
    .getItem("A13C_CREATE_ROOM_INFO")
    ?.includes('"isCreator":true');

  // 오버레이를 생성∙삽입
  const overlay = document.createElement("div");
  overlay.id = "game-overlay";
  overlay.className =
    "fixed top-0 left-0 w-full h-full z-40 bg-black/60 flex flex-col justify-center items-center text-white text-2xl pointer-events-none backdrop-blur-sm";
  overlay.innerHTML = isHost
    ? `<div class="pointer-events-auto text-center">
         <p class="mb-4">게임을 시작하려면 아래 버튼을 누르세요</p>
         <button id="startGameBtn" class="btn btn-active text-xl px-6 py-2">게임 시작</button>
       </div>`
    : `<p class="pointer-events-none">방장이 게임을 시작할 때까지 기다려주세요</p>`;
  document.body.appendChild(overlay);

  //  호스트 버튼 핸들러도 여기에
  if (isHost) {
    document.getElementById("startGameBtn")!.addEventListener("click", () => {
      removeOverlay();
      sendMsg("게임시작");
    });
  }

  //  모든 사용자: 메시지 수신 시 오버레이 제거
  socket.on("message", (data: any) => {
    const action = typeof data === "string" ? data : data?.msg;
    if (action === "게임시작") {
      removeOverlay();
      showRoundStartOverlay(1);
    }
  });
});
