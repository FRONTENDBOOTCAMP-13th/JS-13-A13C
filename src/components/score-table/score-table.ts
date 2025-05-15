import { socket } from "../../pages/ingame/A13C-chat.ts";

const showButton = document.getElementById("show-button") as HTMLButtonElement;
const scoreTables = document.getElementById("score-tables") as HTMLDivElement;
const roundWinnerBody = document.getElementById(
  "round-winner-body"
) as HTMLTableSectionElement;
const totalScoreHeader = document.getElementById(
  "total-score-header"
) as HTMLTableRowElement;
const totalScoreRow = document.getElementById(
  "total-score-row"
) as HTMLTableRowElement;

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

// 데이터 저장용 변수
let roundWinners: { round: number; nickName: string; score: number }[] = [];
let totalScores: { [nickName: string]: number[] } = {};

// 라운드 별 우승자 테이블 업데이트
function updateRoundWinnerTable() {
  roundWinnerBody.innerHTML = "";
  roundWinners.forEach((winner) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="px-6 py-3 text-center">${winner.round}</td>
      <td class="px-6 py-3 text-center">${winner.nickName}</td>
      <td class="px-6 py-3 text-center">${winner.score}</td>
    `;
    roundWinnerBody.appendChild(row);
  });
}

// 누적 승점 테이블 업데이트
function updateTotalScoreTable() {
  totalScoreHeader.innerHTML = "";
  totalScoreRow.innerHTML = "";

  // 헤더 생성
  const headerRow =
    `<th class="px-6 py-3 text-center">닉네임</th>` +
    Object.keys(totalScores)
      .map(
        (_, index) =>
          `<th class="px-6 py-3 text-center">라운드 ${index + 1}</th>`
      )
      .join("") +
    `<th class="px-6 py-3 text-center">총점</th>`;
  totalScoreHeader.innerHTML = headerRow;

  // 데이터 행 생성
  Object.entries(totalScores).forEach(([nickName, scores]) => {
    const totalScoreRowContent = `
      <td class="px-6 py-3 text-center">${nickName}</td>
      ${scores.map((score) => `<td class="px-6 py-3 text-center">${score}</td>`).join("")}
      <td class="px-6 py-3 text-center">${scores.reduce((a, b) => a + b, 0)}</td>
    `;
    const row = document.createElement("tr");
    row.innerHTML = totalScoreRowContent;
    totalScoreRow.appendChild(row);
  });
}

// 데이터 추가 함수
function addRoundWinner(round: number, nickName: string, score: number) {
  // 라운드 별 우승자 추가
  roundWinners.push({ round, nickName, score });

  // 누적 승점 업데이트
  if (!totalScores[nickName]) {
    totalScores[nickName] = [];
  }
  totalScores[nickName][round - 1] = score;

  // 테이블 업데이트
  updateRoundWinnerTable();
  updateTotalScoreTable();
}

// 테스트용 데이터 추가 버튼
const testButton = document.createElement("button");
testButton.textContent = "테스트 데이터 추가";
testButton.className = "bg-blue-500 text-white px-4 py-2 rounded";
testButton.addEventListener("click", () => {
  const round = roundWinners.length + 1;
  const nickName = `Player${round}`;
  const score = Math.floor(Math.random() * 100);
  addRoundWinner(round, nickName, score);
});
document.body.appendChild(testButton);
