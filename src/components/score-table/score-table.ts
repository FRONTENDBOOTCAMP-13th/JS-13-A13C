const showButton = document.getElementById("show-button") as HTMLButtonElement;
const scoreTables = document.getElementById("score-tables") as HTMLDivElement;

// 버튼에 마우스 진입 시, 테이블 보이기
showButton.addEventListener("mouseenter", () => {
  scoreTables.classList.remove("hidden");
});

// 버튼에서 마우스 나가면, 마우스가 테이블을 벗어났을 때 숨기기
showButton.addEventListener("mouseleave", () => {
  setTimeout(() => {
    if (!scoreTables.matches(":hover")) {
      scoreTables.classList.add("hidden");
    }
  }, 100);
});

// 테이블에 마우스 진입 시, 테이블 보이기
scoreTables.addEventListener("mouseenter", () => {
  scoreTables.classList.remove("hidden");
});

// 테이블에서 마우스 나가면, 숨기기
scoreTables.addEventListener("mouseleave", () => {
  scoreTables.classList.add("hidden");
});

import { getRoomInfo } from "../../pages/ingame/A13C-chat.ts";

// 현재 방 정보 로드 함수
function loadCurrentRoom() {
  const saved = sessionStorage.getItem("A13C_CURRENT_ROOM");
  if (!saved) return null;
  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

// 승점 테이블 갱신 함수
async function updateScoreTable() {
  const currentRoom = loadCurrentRoom();
  if (!currentRoom) return;

  // 방 정보 요청
  const roomInfo = await getRoomInfo(currentRoom.roomId);
  if (!roomInfo || !roomInfo.memberList) return;

  // 닉네임 배열 추출
  const nicknames = Object.values(roomInfo.memberList).map((m) => m.nickName);

  // 누적 승점 테이블 바디 업데이트
  const totalScoreHeader = document.getElementById("total-score-header");
  const totalScoreTable = document.getElementById("total-score-row");
  if (totalScoreHeader && totalScoreTable) {
    totalScoreHeader.innerHTML = "";
    nicknames.forEach((nick) => {
      const td = document.createElement("td");
      td.className = "px-6 py-3 text-center";
      td.textContent = nick;
      totalScoreHeader.appendChild(td);
    });

    totalScoreTable.innerHTML = "";
    nicknames.forEach(() => {
      const scoreTd = document.createElement("td");
      scoreTd.className = "px-6 py-3 text-center";
      scoreTd.textContent = `${Math.floor(Math.random() * 30)}점`;
      totalScoreTable.appendChild(scoreTd);
    });
  }
  // 라운드 별 우승자 테이블 바디 업데이트
  const roundWinnerBody = document.getElementById("round-winner-body");
  if (roundWinnerBody) {
    roundWinnerBody.innerHTML = "";
    nicknames.forEach((nick, index) => {
      const tr = document.createElement("tr");

      const roundTd = document.createElement("td");
      roundTd.className = "px-6 py-3 text-center";
      roundTd.textContent = `${index + 1}라운드`;

      const nickTd = document.createElement("td");
      nickTd.className = "px-6 py-3 text-center";
      nickTd.textContent = nick;

      const scoreTd = document.createElement("td");
      scoreTd.className = "px-6 py-3 text-center";
      scoreTd.textContent = `${Math.floor(Math.random() * 10)}점`;

      tr.appendChild(roundTd);
      tr.appendChild(nickTd);
      tr.appendChild(scoreTd);

      roundWinnerBody.appendChild(tr);
    });
  }
}

// 버튼에 마우스 진입 시 테이블 갱신 후 보이기
showButton.addEventListener("mouseenter", async () => {
  await updateScoreTable();
  scoreTables.classList.remove("hidden");
});
