// 플레이어 카드 제출 정보
export interface PlayerCard {
  round: number;
  nickName: string;
  card: number;
}

// 라운드별 제출 내역
let roundSubmits: PlayerCard[] = [];

// 카드 제출 기록
export function submitCard(round: number, nickName: string, card: number) {
  roundSubmits.push({ round, nickName, card });
}

// 라운드별 승자/승점 계산
export function getRoundResults() {
  // 라운드별 그룹화
  const roundMap: { [round: number]: PlayerCard[] } = {};
  roundSubmits.forEach((r) => {
    if (!roundMap[r.round]) roundMap[r.round] = [];
    roundMap[r.round].push(r);
  });

  // 각 라운드별 결과 계산
  return Object.entries(roundMap).map(([round, submits]) => {
    // 카드별 제출자 수 세기
    const cardCount: { [card: number]: number } = {};
    submits.forEach((s) => {
      cardCount[s.card] = (cardCount[s.card] || 0) + 1;
    });

    // 중복되지 않은 카드만 추출
    const uniqueCards = Object.entries(cardCount)
      .filter(([_, count]) => count === 1)
      .map(([card]) => Number(card));

    if (uniqueCards.length === 0) {
      // 무승부 (모두 중복)
      return {
        round: Number(round),
        winners: submits.map((s) => s.nickName),
        point: 1,
        draw: true,
      };
    }

    // 가장 낮은 카드 찾기
    const minCard = Math.min(...uniqueCards);
    // 해당 카드를 낸 플레이어(들)
    const winners = submits
      .filter((s) => s.card === minCard)
      .map((s) => s.nickName);

    // 동점자 여러 명일 수 있음
    return {
      round: Number(round),
      winners,
      point: minCard,
      draw: winners.length > 1,
    };
  });
}

// 닉네임별 누적 승점 계산
export function getTotalPoints() {
  const totals: { [nick: string]: number } = {};
  getRoundResults().forEach((result) => {
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
