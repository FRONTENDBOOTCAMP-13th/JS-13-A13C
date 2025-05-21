import {  addResult, getResults, } from "./store";

// 플레이어 카드 제출 정보
export interface PlayerCard {
  nickName: string;
  onecard: number;
}

// 라운드별 승자/승점 계산
export function getRoundResult(roundSubmits: PlayerCard[], round: number) {

  // 카드별 제출자 수 세기
  const cardCount: { [card: number]: number } = {};
  roundSubmits.forEach((s) => {
    cardCount[s.onecard] = (cardCount[s.onecard] || 0) + 1;
  });

  // 중복되지 않은 카드만 추출
  const uniqueCards = Object.entries(cardCount)
    .filter(([_, count]) => count === 1)
    .map(([card]) => Number(card));

  if (uniqueCards.length === 0) {
    // 무승부 (모두 중복)
    return {
      round: Number(round),
      winners: roundSubmits.map((s) => s.nickName),
      point: 1,
      draw: true,
    };
  }

  // 가장 낮은 카드 찾기
  const minCard = Math.min(...uniqueCards);
  // 해당 카드를 낸 플레이어(들)
  const winners = roundSubmits
    .filter((s) => s.onecard === minCard)
    .map((s) => s.nickName);

  // 동점자 여러 명일 수 있음
  addResult({
    round: Number(round),
    winners,
    point: minCard,
    draw: winners.length > 1,
  });
}

// 닉네임별 누적 승점 계산
export function getTotalPoints() {
  const totals: { [nick: string]: number } = {};
  getResults().forEach((result) => {
    result.winners.forEach((nick) => {
      if (!totals[nick]) totals[nick] = 0;
      totals[nick] += result.point;
    });
  });
  return Object.entries(totals).map(([nickName, totalPoint]) => ({
    nickName,
    totalPoint,
  }));
}

// // TODO 실제 동작: 카드 제출 시점에 submitCard 호출
// import { submitCard } from "./winning-point";
// import { updateScoreTable } from "../components/score-table/table.ts"; // UI 갱신용 함수 import

// // 예시: 서버에서 카드 제출 이벤트를 받았을 때
// socket.on("cardSubmitted", (data) => {
//   // data: { round, nickName, card }
//   submitCard(data.round, data.nickName, data.card);

//   // 결과를 UI에 반영 (라운드 결과 및 누적 승점 테이블 갱신)
//   updateScoreTable();
// });
