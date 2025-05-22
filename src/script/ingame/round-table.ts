import { getRoomInfo } from "../A13C-chat.ts";
import { getResults } from "./store.ts";
import { getTotalPoints } from "./winning-point.ts";

// 현재 방 정보 로드
function loadCurrentRoom() {
  const savedRoom = sessionStorage.getItem("A13C_CURRENT_ROOM");
  console.log(
    "A13C_CURRENT_ROOM:",
    sessionStorage.getItem("A13C_CURRENT_ROOM")
  );

  if (savedRoom) {
    try {
      return JSON.parse(savedRoom);
    } catch {
      return null;
    }
  }
  return null;
}

// 총점 및 라운드 승자 테이블 갱신
async function updateScoreTable() {
  const currentRoom = loadCurrentRoom();
  if (!currentRoom) {
    console.log("currentRoom 없음");
    return;
  }
  // 방 정보 요청
  const roomInfo = await getRoomInfo(currentRoom.roomId);
  if (!roomInfo || !roomInfo.memberList) {
    console.log("roomInfo 없음", roomInfo);
    return;
  }
  // 닉네임 배열 추출
  const nicknames = Object.values(roomInfo.memberList).map((m) => m.nickName);
  console.log("닉네임 목록:", nicknames);
  // 누적 승점 테이블
  const totalScoreHeader = document.getElementById("total-score-header");
  const totalScoreRow = document.getElementById("total-score-row");
  const totals = getTotalPoints();
  console.log("누적 승점:", totals);

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
    const roundResults = getResults();
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

  // DOM이 그려진 뒤에 테이블 갱신
  await new Promise((r) => setTimeout(r, 0));
  await updateScoreTable();

  // 화면에 표시
  overlay.style.display = "flex";

  // 4초 후 자동 제거
  setTimeout(() => {
    overlay.style.display = "none";
  }, 4000);
}

// TODO ingame에서 라운드 종료 판단 후 호출하도록
