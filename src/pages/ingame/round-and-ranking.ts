import { socket } from "./A13C-chat.ts";

// 데이터 상태 관리를 위한 변수
let currentRound = 1;
let MAX_ROUND = 5;
let participantList: string[] = [];
const scoresPerRound: Record<number, Record<string, number>> = {};
const totalScores: Record<string, number> = {};
const roundWinners: {round: number, winner: string, score: number}[] = [];

/**
 * 라운드 증가 함수 - 매 라운드가 끝날 때마다 호출
 * @param roundScore - 해당 라운드의 참가자별 점수 {닉네임: 점수}
 */
//매 라운드가 끝나면 라운드 1씩 증가하는 함수 구현 (ingame.html 134번쨰줄)
function increaseRound(roundScore: Record<string, number>) {
  currentRound++;

  // 인게임 라운드 UI 업데이트
  const roundDisplay = document.querySelectorAll(".mb-2.text-white span.font-bold");
  roundDisplay.forEach(element => {
    element.textContent = `${currentRound} / ${MAX_ROUND}`;
  })
  
  // 첫 번째 라운드에서 참가자 목록 초기화
  if(currentRound === 1){
    participantList = Object.keys(roundScore);
    participantList.forEach(player => {
      totalScores[player] = 0; // 총점 초기화
    });
  }

  // 현재 라운드 점수 저장
  scoresPerRound[currentRound] = {...roundScore};

  // 누적 점수 계산
  Object.entries(roundScore).forEach(([player, score]) => {
    if(!totalScores[player]) totalScores[player] = 0;
    totalScores[player] += score;
  })

  // 라운드 승자 결정
  let highestScore = 0;
  let winner = '';
  
  Object.entries(roundScore).forEach(([player, score]) => {
    if(score > highestScore) {
      highestScore = score;
      winner = player;
    }
  });

  roundWinners.push({
    round: currentRound,
    winner: winner,
    score: highestScore
  });

  console.log(`라운드 ${currentRound} 승자 ${winner} (점수: ${highestScore})`)

  if (currentRound >= MAX_ROUND){
    setTimeout(() => {
      showRanking();
    }, 3000);
  }

  // 서버에 라운드 결과 전송
  socket.emit("round_result", {
    round: currentRound,
    winner: winner,
    score: highestScore,
    totalScores: totalScores
  });
}


/**
 * 모든 라운드가 끝난 후 최종 순위 표시
 * 5라운드 까지 종료되면 모달 창으로 순위 발표
 */
function showRanking(){
  // 기존 라운드 테이블 제거
  const existingTable = document.getElementById("round-table");
  if(existingTable){
    existingTable.remove();
  }

  const finalRankingContainer = document.createElement("div");
  finalRankingContainer.id = "final-ranking";
  finalRankingContainer.className = "fixed inset-0 z-50 flex items-center justify-center bg-black/80";

  //테이블 내용 생성
  fetch("/src/components/score-table/score-table.html")
    .then(response => response.text())
    .then(html => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      const scoreTable = doc.getElementById("score-tables")

      if(scoreTable){
        // hidden 클래스 제거 후 팝업 형태로 변경
        scoreTable.classList.remove("hidden");
        scoreTable.classList.add("block");
        finalRankingContainer.innerHTML = `
          <div class="bg-gray-900 rounded-xl border-2 border-[#bba16d] p-6 shadow-[0_0_15px_#9E844F] max-w-xl w-full">
            <h1 class="text-2xl font-bold text-center text-white mb-6">최종 순위</h1>
            ${scoreTable.outerHTML}
            <div class="mt-6 flex justify-center">
              <button id="close-ranking" class="px-6 py-2 bg-[#9E844F] text-white font-semibold rounded-lg hover:bg-[#8a7343] transition-colors">
                닫기
              </button>
            </div>
          </div>
        `;

        document.body.appendChild(finalRankingContainer);

        updateFinalRoundWinnerTable();

        updateFinalTotalScoreTable();

        const closeBtn = document.querySelector("#close-ranking");
        if(closeBtn){
          closeBtn.addEventListener("click", () => {
            const container = document.getElementById('final-ranking');
            if(container){
              container.remove();
            }
          });
        }
      }
    })
    .catch(error => {
      console.error("최종 순위 테이블 로드 실패:", error);
    })
}

/**
 * 최종 라운드 별 승자 테이블 업데이트
 */
function updateFinalRoundWinnerTable() {
  const roundWinnerBody = document.querySelector("#final-ranking #round-winner-body");
  if(!roundWinnerBody) return;

  roundWinnerBody.innerHTML = "";

  roundWinners.forEach(winner => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="px-6 py-3">${winner.round}</td>
      <td class="px-6 py-3">${winner.winner}</td>
      <td class="px-6 py-3">${winner.score}</td>
    `;
    roundWinnerBody.appendChild(row);
  })
}


/**
 * 최종 누적 점수 테이블 업데이트
 * 각 참여자 별 점수와 순위 표시
 */
function updateFinalTotalScoreTable() {
  const totalScoreHeader = document.querySelector("#final-ranking #total-score-header");
  const totalScoreRow = document.querySelector("#final-ranking #total-score-row");

  if(!totalScoreHeader || !totalScoreRow) return;

  totalScoreHeader.innerHTML = "";
  totalScoreRow.innerHTML = "";

  //순위 열 추가
  const rankHeader = document.createElement("th");
  rankHeader.className = "px-6 py-3";
  rankHeader.textContent = "순위";
  totalScoreHeader.appendChild(rankHeader);

  //모든 참가자 닉네임 헤더로 추가
  participantList.forEach(player => {
    const header = document.createElement("th");
    header.className = "px-6 py-3";
    header.textContent = player;
    totalScoreHeader.appendChild(header);
  })

  // 승점에 따른 순위 계산
  const sortedPlayers = [...participantList].sort((a, b) => (totalScores[b] || 0) - (totalScores[a] || 0));
  const ranks: Record<string, number> = {};

  // 순위 계산(동점자는 같은 순위)
  let currentRank = 1;
  let prevScore = -1;

  sortedPlayers.forEach((player, index) => {
    const score = totalScores[player] || 0;
    if(score !== prevScore){
      currentRank = index + 1;
    }
    ranks[player] = currentRank;
    prevScore = score;
  })

  //순위 셀 추가
  const rankCell = document.createElement("th");
  rankCell.innerHTML = sortedPlayers.map((player) => {
    const rank = ranks[player];
    let style = '';

    if(rank === 1) style = 'color: gold, font-weight: bold;';
    else if(rank === 2) style = 'color: silver, font-weight: bold;';
    else if(rank === 3) style = 'color: #cd7f32, font-weight: bold;';

    return `<div style="${style}">${rank}등</div>`;
  }).join("");
  totalScoreRow.appendChild(rankCell);

  participantList.forEach(player => {
    const score = totalScores[player] || 0;
    const scoreCell = document.createElement("td");
    
    // 1등은 금색, 2등은 은색, 3등은 동색으로 표시
    if (ranks[player] === 1) {
      scoreCell.style.color = 'gold';
      scoreCell.style.fontWeight = 'bold';
    } else if (ranks[player] === 2) {
      scoreCell.style.color = 'silver';
      scoreCell.style.fontWeight = 'bold';
    } else if (ranks[player] === 3) {
      scoreCell.style.color = '#CD7F32';
      scoreCell.style.fontWeight = 'bold';
    }
    
    scoreCell.textContent = `${score}`;
    totalScoreRow.appendChild(scoreCell);
  });
}

//라운드 끝날 때 호출하는 함수
function completeRound(roundScore: Record<string,number>){
  increaseRound(roundScore);
}

// 서버에서 라운드 결과를 수신 받음
socket.on("game_round_complete", (data: {scores: Record<string, number>}) => {
  completeRound(data.scores); // 
}) 

export { increaseRound, showRanking, completeRound };