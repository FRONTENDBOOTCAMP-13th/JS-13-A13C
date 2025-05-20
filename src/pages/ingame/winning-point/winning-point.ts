// 라운드별 승자와 승점 저장용 배열
export interface RoundResult {
  round: number;
  winner: string;
  point: number;
}

let roundResults: RoundResult[] = [];

// 라운드 결과 추가 함수
export function addRoundResult(round: number, winner: string, point: number) {
  roundResults.push({ round, winner, point });
}

// 라운드별 승자 배열 반환
export function getRoundResults(): RoundResult[] {
  return roundResults;
}

// 닉네임별 누적 승점 계산 함수
export function getTotalPoints(): { nickName: string; totalPoint: number }[] {
  const totals: { [nick: string]: number } = {};
  roundResults.forEach(({ winner, point }) => {
    if (!totals[winner]) totals[winner] = 0;
    totals[winner] += point;
  });
  return Object.entries(totals).map(([nickName, totalPoint]) => ({
    nickName,
    totalPoint,
  }));
}

// 테스트용 초기화 함수 (테스트/디버깅용)
export function resetResults() {
  roundResults = [];
}