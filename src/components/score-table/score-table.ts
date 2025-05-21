import {
  getTotalPoints,
  getRoundResults,
} from "../../pages/ingame/winning-point.ts";
import { getRoomInfo } from "../../pages/ingame/A13C-chat.ts";

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

  // 누적 승점 테이블
  const totalScoreHeader = document.getElementById("total-score-header");
  const totalScoreRow = document.getElementById("total-score-row");
  const totals = getTotalPoints();

  // 닉네임 순서대로, 없는 닉네임은 0점
  const mappedTotals = nicknames.map((nick) => {
    const found = totals.find((t) => t.nickName === nick);
    return { nickName: nick, totalPoint: found ? found.totalPoint : 0 };
  });

  if (totalScoreHeader && totalScoreRow) {
    totalScoreHeader.innerHTML = mappedTotals
      .map((t) => `<th class="px-6 py-3">${t.nickName}</th>`)
      .join("");
    totalScoreRow.innerHTML = mappedTotals
      .map((t) => `<td class="px-6 py-3 text-center">${t.totalPoint}</td>`)
      .join("");
  }

  // 라운드 별 우승자 테이블
  const roundWinnerBody = document.getElementById("round-winner-body");
  if (roundWinnerBody) {
    roundWinnerBody.innerHTML = "";
    const roundResults = getRoundResults();
    roundResults.forEach(({ round, winners, point, draw }) => {
      if (draw) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td class="px-6 py-3 text-center">${round}</td>
          <td class="px-6 py-3 text-center">무승부</td>
          <td class="px-6 py-3 text-center">1</td>
        `;
        roundWinnerBody.appendChild(tr);
      } else {
        winners.forEach((winner) => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td class="px-6 py-3 text-center">${round}</td>
            <td class="px-6 py-3 text-center">${winner}</td>
            <td class="px-6 py-3 text-center">${point}</td>
          `;
          roundWinnerBody.appendChild(tr);
        });
      }
    });
  }
}

// 버튼에 마우스 진입 시 테이블 갱신 후 보이기
showButton.addEventListener("mouseenter", async () => {
  await updateScoreTable();
  scoreTables.classList.remove("hidden");
});
