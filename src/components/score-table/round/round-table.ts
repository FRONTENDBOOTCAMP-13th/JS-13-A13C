import { getRoomInfo } from "../../../pages/ingame/A13C-chat.ts";

// 현재 방 정보 로드
function loadCurrentRoom() {
  const saved = sessionStorage.getItem("A13C_CURRENT_ROOM");
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

// 오버레이
export async function showScoreTable() {
  const overlay = document.getElementById("round-overlay");
  const content = document.getElementById("round-overlay-content");
  if (!overlay || !content) return;

  // HTML 불러오기
  const html = await fetch(
    "/src/components/score-table/round/round-table.html"
  ).then((res) => res.text());
  content.innerHTML = html;

  // 점수 테이블 렌더링
  await updateScoreTable();

  // 화면에 표시
  overlay.style.display = "flex";

  // 5초 후 자동 제거
  setTimeout(() => {
    overlay.style.display = "none";
  }, 4000);
}

// TODO 호출 부분은 ingame에서 라운드 종료 판단 후 호출하도록 수정해야 함
showScoreTable();
