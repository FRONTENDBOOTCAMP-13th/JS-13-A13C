import {
  type ChoiceTwoCard,
  sendMsg,
  socket,
  type ChatMessage,
  type ChoiceOneCard,
  type Player,
  getRoomInfo,
} from "../A13C-chat";

import {
  nextRound,
  getPlayer,
  getPlayerList,
  getRound,
  getUserId,
  isAllDone,
  getResult,
  setPlayerList,
} from "./store";
import { getRoundResult } from "./winning-point";

import { showScoreTable } from "./round-table";

const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get("roomId");

// 왼쪽 카드 선택 슬롯
const selectedLeft = document.getElementById("selected-left") as HTMLDivElement;
// 오른쪽 카드 선택 슬롯
const selectedRight = document.getElementById(
  "selected-right"
) as HTMLDivElement;
// 리셋 버튼
const resetBtn = document.querySelector(
  "#submitbutton button:nth-child(1)"
) as HTMLButtonElement;
// 제출 버튼
const submitBtn = document.querySelector(
  "#submitbutton button:nth-child(2)"
) as HTMLButtonElement;
/** 내 카드 영역 */
const myCardContainer = document.getElementById("my-cards") as HTMLDivElement;
/** 점수판(최종 카드 영역) */
const scoreBoard = document.getElementById("final-card-area") as HTMLDivElement;
/** 임시 저장 카드 영역 */
const tempStorage = document.getElementById("temp-card-area") as HTMLDivElement;
const tempStorageArea = document.getElementById(
  "temp-card-area"
) as HTMLDivElement;

// 필수 요소 찾기
window.addEventListener("DOMContentLoaded", () => {
  if (
    !selectedLeft ||
    !selectedRight ||
    !resetBtn ||
    !submitBtn ||
    !myCardContainer ||
    !scoreBoard ||
    !tempStorage
  ) {
    console.error("필수 요소를 찾을 수 없습니다.");
    return;
  }
});

/** 제출되어 손에서 제거된 카드 번호 집합 */
const removedNumbers = new Set<number>();
/** 임시로 비활성화된 카드 번호 집합 */
let tempDisabled = new Set<number>();
/** 마지막으로 비활성화된 카드 번호 집합 */
let lastDisabled = new Set<number>();
/** 현재 선택된 카드 번호 배열 (최대 2개) */
let selectedCardNumbers: number[] = [];
/** 현재 활성화된 카드 슬롯 ("left" | "right" | null) */
// let activeSlot: "left" | "right" | null = null;

/**
 * 플레이어의 손패 카드를 렌더링합니다.
 * removedNumbers와 tempDisabled를 고려하여 활성/비활성 카드를 구분하고,
 * 핸드 카드 수가 2장 이하일 경우 렌더를 종료합니다.
 */
export function renderMyCards(): void {
  myCardContainer.innerHTML = "";
  const activeNums: number[] = [];
  for (let i = 1; i <= 8; i++) {
    if (removedNumbers.has(i) || tempDisabled.has(i)) continue;
    activeNums.push(i);
  }
  const disabledNums = Array.from(tempDisabled).filter(
    (i) => !removedNumbers.has(i)
  );

  const totalCount = activeNums.length + disabledNums.length;
  // 핸드가 2장 이하이면 카드를 전부 숨김
  if (totalCount <= 2) {
    return;
  }

  // 활성 카드 먼저 렌더
  activeNums.forEach((i) => appendCard(i, false));
  // 비활성 카드는 오른쪽 끝에만 렌더
  disabledNums.forEach((i) => appendCard(i, true));

  updateHandCardAvailability();
}

/**
 * 카드 이미지를 생성하여 myCardContainer에 추가합니다.
 * @param cardNum - 카드 번호
 * @param disabled - 비활성화 여부
 */
export function appendCard(cardNum: number, disabled: boolean): void {
  const card = document.createElement("img");
  card.src = `/imges/card-${cardNum}.webp`;
  card.className =
    "w-[153px] h-[214px] cursor-pointer transition-transform duration-200 ease-in-out hover:scale-110";
  card.setAttribute("data-card", String(cardNum));
  if (disabled) {
    card.classList.add("opacity-50");
    card.style.pointerEvents = "none";
  }
  card.addEventListener("click", () => choiceCard(card, cardNum));

  myCardContainer.appendChild(card);
}

function choiceCard(card: HTMLImageElement, cardNum: number) {
  if (card.style.pointerEvents === "none") return;
  if (selectedCardNumbers.length >= 2) return;
  selectedCardNumbers.push(cardNum);
  const slot = selectedCardNumbers.length === 1 ? selectedLeft : selectedRight;
  slot.style.backgroundImage = `url(${card.src})`;
  slot.setAttribute("data-card-src", card.src);
  card.remove();
  updateHandCardAvailability();
  if (selectedCardNumbers.length === 2) {
    // 카드 2장 뽑혔으니 초기화 버튼 숨기기
    resetBtn.style.display = "none";
    // 제출 타이머 자동 시작
    // startSubmitTimer();

    const choiceCard: ChoiceTwoCard = {
      action: "twocard",
      user_id: getUserId(),
      left: selectedCardNumbers[0],
      right: selectedCardNumbers[1],
    };

    // console.log("카드 두개 선택 완료", choiceCard);
    sendMsg<ChoiceTwoCard>(choiceCard);
  }
}

/** 슬롯 클릭 시 활성 슬롯을 전환할 수 있게 이벤트 설정 */
[selectedLeft, selectedRight].forEach((slot) => {
  slot.addEventListener("click", () => {
    if (!slot.dataset.cardSrc) return;
    selectedLeft.classList.remove("border-4", "border-yellow-300");
    selectedRight.classList.remove("border-4", "border-yellow-300");
    slot.classList.add("border-4", "border-yellow-300");
  });
});

/** 손패의 카드 클릭 가능 여부 업데이트 */
export function updateHandCardAvailability(): void {
  const cards = Array.from(
    myCardContainer.querySelectorAll<HTMLImageElement>("img[data-card]")
  );
  if (selectedCardNumbers.length === 2) {
    cards.forEach((c) => (c.style.pointerEvents = "none"));
  } else {
    cards.forEach((c) => {
      const num = Number(c.getAttribute("data-card"));
      c.style.pointerEvents = tempDisabled.has(num) ? "none" : "";
    });
  }
}

/** 카드 이동 애니메이션 처리 */
export function flyCard(
  fromEl: HTMLElement,
  toEl: HTMLElement,
  src: string
): void {
  const fromRect = fromEl.getBoundingClientRect();
  const toRect = toEl.getBoundingClientRect();
  const dx = toRect.left - fromRect.left;
  const dy = toRect.top - fromRect.top;
  const anim = document.createElement("img");
  anim.src = src;
  anim.className = "card-fly";
  anim.style.left = `${fromRect.left}px`;
  anim.style.top = `${fromRect.top}px`;
  document.body.appendChild(anim);
  requestAnimationFrame(() => {
    anim.style.transform = `translate(${dx}px, ${dy}px)`;
  });
  setTimeout(() => {
    anim.remove();
    toEl.innerHTML = "";
    const placed = document.createElement("img");
    placed.src = src;
    placed.className = "w-[80px] h-[110px]";
    toEl.appendChild(placed);
  }, 500);
}

// 리셋 버튼 클릭 핸들러
resetBtn.addEventListener("click", () => {
  [selectedLeft, selectedRight].forEach((el) => {
    el.style.backgroundImage = `url("/imges/card-back.webp")`;
    el.removeAttribute("data-card-src");
    el.classList.remove("border-4", "border-yellow-300");
  });
  tempDisabled.clear();
  lastDisabled.clear();
  removedNumbers.clear();
  scoreBoard.innerHTML = "";
  tempStorageArea.innerHTML = "";
  renderMyCards();
});

// 제출 버튼 클릭 핸들러
export function submitBtnFun() {
  submitBtn.addEventListener("click", () => {
    // 1️⃣ 활성 슬롯 확인
    const activeCardId = selectedLeft.getAttribute("data-card-src")
      ? "left"
      : selectedRight.getAttribute("data-card-src")
        ? "right"
        : null;
    if (!activeCardId) {
      alert("카드를 선택해주세요");
      return;
    }

    // 2️⃣ 선택된 카드 번호 분해
    const [a, b] = selectedCardNumbers;
    const keepNum = activeCardId === "left" ? a : b;
    const loseNum = activeCardId === "left" ? b : a;

    // 3️⃣ 이미지 경로 설정
    const keepSrc = `/imges/card-${keepNum}.webp`;
    const loseSrc = `/imges/card-${loseNum}.webp`;

    // 4️⃣ 내 슬롯 요소 선택
    const myIdx = getPlayerList().findIndex(
      (p: Player) => p.nickName === getUserId()
    );
    const playerNum = myIdx + 1;
    const selectedSlot = document.getElementById(
      `player-select-card-${playerNum}`
    );
    const tempSlot = document.getElementById(
      `palyer-temporarily-card-${playerNum}`
    );
    if (!selectedSlot || !tempSlot) return;

    // 5️⃣ 카드 비행 애니메이션 실행
    flyCard(selectedLeft, selectedSlot, keepSrc);
    flyCard(selectedRight, tempSlot, loseSrc);

    // 6️⃣ 상태 업데이트
    removedNumbers.add(keepNum);
    tempDisabled = new Set(lastDisabled);
    lastDisabled.clear();
    lastDisabled.add(loseNum);
    tempDisabled = new Set(lastDisabled);

    // 7️⃣ 슬롯 UI 및 내 카드 재렌더링
    [selectedLeft, selectedRight].forEach((el) => {
      el.style.backgroundImage = `url("/imges/card-back.webp")`;
      el.removeAttribute("data-card-src");
      el.classList.remove("border-4", "border-yellow-300");
    });
    selectedCardNumbers = [];
    renderMyCards();

    // 8️⃣ 메시지 전송 및 내 화면 갱신
    const choice: ChoiceOneCard = {
      action: "onecard",
      user_id: getUserId(),
      choice: keepNum,
    };
    sendMsg(choice);
    handleAutoSelectionAndMove();
  });
}

export function setupSubmitCardClick(): void {
  selectedLeft.addEventListener("click", () => {
    selectedLeft.classList.add("border-4", "border-yellow-300");
    selectedRight.classList.remove("border-4", "border-yellow-300");
  });
  selectedRight.addEventListener("click", () => {
    selectedRight.classList.add("border-4", "border-yellow-300");
    selectedLeft.classList.remove("border-4", "border-yellow-300");
  });
}

// 상대 플레이어 카드 공개
export function revealOpponentCards(): void {
  const opponentContainers =
    document.querySelectorAll<HTMLDivElement>(".flex.space-x-1");

  opponentContainers.forEach((container, i) => {
    const player = getPlayerList()[i];
    if (!player || !player.twocard) return;
    if (player.twocard) {
      const [l, r] = player.twocard;
      const imgs = container.querySelectorAll<HTMLImageElement>("img");
      imgs[0].src = `/imges/card-${l}.webp`;
      imgs[1].src = `/imges/card-${r}.webp`;
    }
  });

  opponentContainers.forEach((container, i) => {
    const parent = container.parentElement;
    const nickEl = parent?.querySelector<HTMLElement>(`#nickname-${i + 1}`);
    if (!nickEl) return;

    // 기존 textContent가 있으면 그대로 사용, 없으면 기본값 할당
    const nickname = nickEl.textContent ?? `플레이어${i + 1}`;
    nickEl.textContent = nickname;
  });
}

function handleAutoSelectionAndMove(): void {
  const players = getPlayerList();
  // ① final-card-area 안의 슬롯들(플레이어 수만큼) 선택
  const slots = Array.from(
    document.querySelectorAll<HTMLDivElement>(
      "#final-card-area > div[id^='player-select-card-']"
    )
  );

  // ③ 플레이어 리스트 순서대로 슬롯에 한 장씩 배치
  players.forEach((player, idx) => {
    // onecard가 숫자일 때만 렌더
    if (typeof player.onecard === "number") {
      const slot = slots[idx];
      if (!slot) return;

      const img = document.createElement("img");
      img.src = `/imges/card-${player.onecard}.webp`;
      img.className = "h-[110px]"; // 필요시 조정
      slot.replaceChildren(img);
    }
  });
}

export function revealExcludedCards(): void {
  getPlayerList().forEach((player, idx) => {
    if (!player.twocard?.length || !player.onecard) return;
    const [l, r] = player.twocard;
    const excluded = player.onecard === l ? r : l;
    const container = document.getElementById(
      `player-temporarily-card-${idx + 1}`
    );
    if (!container) return;

    container.innerHTML = "";
    const img = document.createElement("img");
    img.src = `/imges/card-${excluded}.webp`;
    img.className = "h-[110px]";
    container.appendChild(img);
  });
}

export function revealSubmittedCards(): void {
  getPlayerList().forEach((player, idx) => {
    if (!player.onecard) return;
    const container = document.getElementById(`player-select-card-${idx + 1}`);
    if (!container) return;

    container.innerHTML = "";
    const img = document.createElement("img");
    img.src = `/imges/card-${player.onecard}.webp`;
    img.className = "h-[110px]";
    container.appendChild(img);
  });
}
// 3️⃣ 1초마다 방 정보 가져와서 전체 UI 갱신
// async function pollRoomState(): Promise<void> {
//   if (!roomId) return;

//   const roomInfo = await getRoomInfo(roomId); // 1️⃣
//   setPlayerList(Object.values(roomInfo.memberList)); // 2️⃣
//   refreMembers(getPlayerList()); // 3️⃣

//   // — 여기서 “내” 슬롯만 숨기기 —
//   const players = getPlayerList();
//   const myId = getUserId();
//   const myIndex = players.findIndex((pl: Player) => pl.nickName === myId); // 4️⃣
//   const myContainer =
//     document.querySelectorAll<HTMLDivElement>(".opponent-cards")[myIndex]; // 5️⃣
//   myContainer?.querySelectorAll<HTMLImageElement>("img").forEach((img) => {
//     img.classList.add("sr-only"); // 6️⃣
//   });

//   revealOpponentCards(); // 7️⃣
//   revealExcludedCards(); // 8️⃣
//   if (isAllDone()) {
//     // 9️⃣
//     revealSubmittedCards(); // 10️⃣
//   }
// }

export function refreMembers(members: Player[]): void {
  members.forEach((player, i) => {
    const el = document.getElementById(`nickname-${i + 1}`);
    if (el) el.textContent = player.nickName;
  });
}

/**
 * 채팅 메시지 수신 이벤트 리스너
 * @description 다른 사용자가 보낸 채팅 메시지를 수신할 때 호출됩니다.
 * @param data - 수신된 채팅 메시지 정보 (발신자 닉네임과 메시지 내용)
 */
socket.on("message", (data: ChatMessage) => {
  if (!data.msg || typeof data.msg !== "object" || !data.msg.action) {
    return; // 채팅 메시지는 무시
  }
  const player = getPlayer(data.msg.user_id);

  console.log(player, '제출한 카드', );

  // 타입가드
  if (player) {
    if (data.msg.action === "twocard") {
      // 상대 카드 불러오기
      player.twocard = [data.msg.left, data.msg.right];

      // 상대 카드를 ui로 렌더링
      const containers =
        document.querySelectorAll<HTMLDivElement>(".opponent-cards");

      // 플레이어 리스트에서 해당 유저 위치 찾기
      const idx = getPlayerList().findIndex(
        (p) => p.nickName === data.msg.user_id
      );

      // 상대 카드를 이미지로 렌더링
      if (idx >= 0 && containers[idx]) {
        const imgs = containers[idx].querySelectorAll<HTMLImageElement>("img");
        const [l, r] = player.twocard;
        imgs[0].src = `/imges/card-${l}.webp`;
        imgs[1].src = `/imges/card-${r}.webp`;
      }
      revealOpponentCards();
    } else if (data.msg.action === "onecard") {
      // console.log("여기 작동되는지 ", data);
      player.onecard = data.msg.choice;

      // // 1️⃣ 플레이어 인덱스 찾기
      // const players = getPlayerList();
      // const idx = players.findIndex((p) => p.nickName === data.msg.user_id);

      // // 2️⃣ 두 카드에서 미선택 카드 찾기
      // const twoCards = player.twocard;
      // if (!twoCards) return;
      // const oneMsg = data.msg as ChoiceOneCard;
      // player.onecard = oneMsg.choice;
      // const unchosen = twoCards.find((n) => n !== oneMsg.choice);

      // // 3️⃣ 임시 슬롯 요소 선택
      // const tempSlot = document.getElementById(
      //   `palyer-temporarily-card-${idx + 1}`
      // );
      // // 4️⃣ 원본 카드 이미지 요소 찾기
      // const containers =
      //   document.querySelectorAll<HTMLDivElement>(".opponent-cards");
      // const imgs =
      //   containers[idx]?.querySelectorAll<HTMLImageElement>("img") || [];
      // const loseImg = Array.from(imgs).find(
      //   (img) => Number(img.getAttribute("data-card")) === unchosen
      // );

      // // 5️⃣ flyCard로 카드 이동 애니메이션 실행
      // if (idx >= 0 && unchosen !== undefined && tempSlot && loseImg) {
      //   flyCard(loseImg, tempSlot, `/imges/card-${unchosen}.webp`);
      // }

      handleAutoSelectionAndMove();
      console.log('플레이어 상태', getPlayerList());
      console.log('isAllDone', isAllDone());
      if (isAllDone()) {
        const round = getRound();
        console.log(round, "라운드 종료");
        getRoundResult(getPlayerList(), round);
        console.log("승자 정보", getResult(round));
        nextRound();
        showScoreTable();
      }
    }
  }

  // console.log("카드 제출 정보 추가", getPlayerList());
});

// 초기 로직에 타이머 호출
window.addEventListener("DOMContentLoaded", () => {
  renderMyCards(); // 내 카드 초기 렌더링
  setupSubmitCardClick(); // 슬롯 클릭 바인딩
  // revealOpponentCards(); // 초기 테스트용 호출은 pollRoomState에서 이미 처리되므로 중복이면 지워도 OK
  // pollRoomState(); // 초기 동기화
  // setInterval(pollRoomState, 1000); // 1초 폴링
  submitBtnFun();
});

export default {};
