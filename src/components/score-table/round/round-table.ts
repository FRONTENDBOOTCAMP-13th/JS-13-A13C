import { getRoomInfo } from "../../../pages/ingame/A13C-chat.ts";

// 현재 방 정보 로드
function loadCurrentRoom() {
  const saved = localStorage.getItem("A13C_CURRENT_ROOM");
  if (!saved) return null;
  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

// 총점 및 라운드 승자 테이블 갱신
async function updateScoreTable() {
  const currentRoom = loadCurrentRoom();
  if (!currentRoom) return;

  const roomInfo = await getRoomInfo(currentRoom.roomId);
  if (!roomInfo || !roomInfo.memberList) return;

  const nicknames = Object.values(roomInfo.memberList).map((m) => m.nickName);

  const totalScoreHeader = document.getElementById("total-score-header");
  const totalScoreRow = document.getElementById("total-score-row");
  if (totalScoreHeader && totalScoreRow) {
    totalScoreHeader.innerHTML = "";
    totalScoreRow.innerHTML = "";

    nicknames.forEach((nick) => {
      const th = document.createElement("th");
      th.className = "px-6 py-3 text-center";
      th.textContent = nick;
      totalScoreHeader.appendChild(th);

      const td = document.createElement("td");
      td.className = "px-6 py-3 text-center";
      td.textContent = `${Math.floor(Math.random() * 30)}점`;
      totalScoreRow.appendChild(td);
    });
  }

  const roundWinnerBody = document.getElementById("round-winner-body");
  if (roundWinnerBody) {
    roundWinnerBody.innerHTML = "";
    nicknames.forEach((nick, index) => {
      const tr = document.createElement("tr");

      const roundTd = document.createElement("td");
      roundTd.className = "px-6 py-3 text-center";
      roundTd.textContent = `${index + 1}라운드`;

      const winnerTd = document.createElement("td");
      winnerTd.className = "px-6 py-3 text-center";
      winnerTd.textContent = nick;

      const scoreTd = document.createElement("td");
      scoreTd.className = "px-6 py-3 text-center";
      scoreTd.textContent = `${Math.floor(Math.random() * 10)}점`;

      tr.appendChild(roundTd);
      tr.appendChild(winnerTd);
      tr.appendChild(scoreTd);

      roundWinnerBody.appendChild(tr);
    });
  }
}

// 페이지 진입 시 즉시 호출
updateScoreTable();

// 테이블 표시 함수 (외부에서 사용 가능)
// export async function showScoreTable() {
//   await updateScoreTable();
//   const scoreTables = document.getElementById("score-tables");
//   if (scoreTables) {
//     scoreTables.classList.remove("hidden");
//   }
// }

// 다른 스크립트에서 불러올 때 사용
// import { showScoreTable } from "./경로/scoreTable.ts";

// // 라운드가 끝났을 때 호출
// function onRoundEnd() {
//   showScoreTable();
// }
