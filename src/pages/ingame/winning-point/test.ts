import { submitCard, getRoundResults, getTotalPoints } from "./winning-point";

// 테스트 데이터: 3라운드, 4명
submitCard(1, "가나다", 3);
submitCard(1, "라마바", 3);
submitCard(1, "사아자", 5);
submitCard(1, "차카타", 5);

submitCard(2, "가나다", 2);
submitCard(2, "라마바", 4);
submitCard(2, "사아자", 2);
submitCard(2, "차카타", 8);

submitCard(3, "가나다", 1);
submitCard(3, "라마바", 2);
submitCard(3, "사아자", 3);
submitCard(3, "차카타", 1);

// 결과 출력
window.onload = () => {
  document.getElementById("round")!.textContent = JSON.stringify(
    getRoundResults(),
    null,
    2
  );

  document.getElementById("total")!.textContent = JSON.stringify(
    getTotalPoints(),
    null,
    2
  );

  // 라운드별 결과 테이블
  const roundWinnerBody = document.getElementById("round-winner-body")!;
  roundWinnerBody.innerHTML = "";
  getRoundResults().forEach(({ round, winners, point, draw }) => {
    winners.forEach((winner) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="px-6 py-3 text-center">${round}</td>
        <td class="px-6 py-3 text-center">${winner}</td>
        <td class="px-6 py-3 text-center">${point}${draw ? " (무승부)" : ""}</td>
      `;
      roundWinnerBody.appendChild(tr);
    });
  });

  // 누적 승점 테이블
  const totalScoreHeader = document.getElementById("total-score-header")!;
  const totalScoreRow = document.getElementById("total-score-row")!;
  const totals = getTotalPoints();
  totalScoreHeader.innerHTML = totals
    .map((t) => `<th>${t.nickName}</th>`)
    .join("");
  totalScoreRow.innerHTML = totals
    .map((t) => `<td>${t.totalPoint}</td>`)
    .join("");
};

// 함수로 빼기
// export function updateScoreTables() {
//   // 라운드별 결과 테이블
//   const roundWinnerBody = document.getElementById("round-winner-body")!;
//   roundWinnerBody.innerHTML = "";
//   getRoundResults().forEach(({ round, winners, point, draw }) => {
//     winners.forEach((winner) => {
//       const tr = document.createElement("tr");
//       tr.innerHTML = `
//         <td class="px-6 py-3 text-center">${round}</td>
//         <td class="px-6 py-3 text-center">${winner}</td>
//         <td class="px-6 py-3 text-center">${point}${draw ? " (무승부)" : ""}</td>
//       `;
//       roundWinnerBody.appendChild(tr);
//     });
//   });

//   // 누적 승점 테이블
//   const totalScoreHeader = document.getElementById("total-score-header")!;
//   const totalScoreRow = document.getElementById("total-score-row")!;
//   const totals = getTotalPoints();
//   totalScoreHeader.innerHTML = totals
//     .map((t) => `<th>${t.nickName}</th>`)
//     .join("");
//   totalScoreRow.innerHTML = totals
//     .map((t) => `<td>${t.totalPoint}</td>`)
//     .join("");
// }
