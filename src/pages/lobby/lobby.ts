// 참여하기 버튼
const showRoomBtn = document.querySelector(".show-room-btn") as HTMLDivElement;

// 방 리스트를 보여주는 팝업창
const showRoomList = document.querySelector(
  ".show-room-list"
) as HTMLDivElement;

// 참여하기버튼, 방 만들기 버튼
const buttonGroups = document.querySelector(".button-groups") as HTMLDivElement;

// 닫기 버튼
const closeBtn = document.querySelector(".close-btn") as HTMLDivElement;

const roomListContainer = document.getElementById("roomList")!;
const joinForm = document.getElementById("join-form")!;
const selectedRoomNameElem = document.getElementById("selectedRoomName")!;
const joinUserId = document.getElementById("joinUserId") as HTMLInputElement;
const joinNickName = document.getElementById(
  "joinNickName"
) as HTMLInputElement;
const finalJoinBtn = document.getElementById("finalJoinBtn")!;

// 방 클릭 시 입력 폼 표시
roomListContainer.addEventListener("click", (e) => {
  const target = (e.target as HTMLElement).closest("tr");
  if (!target) return;

  const roomName = target.querySelector("td:nth-child(2)")?.textContent?.trim();
  if (!roomName) return;

  selectedRoomNameElem.textContent = roomName;
  joinForm.classList.remove("hidden");

  const enterRoomId = document.getElementById(
    "enterRoomId"
  ) as HTMLInputElement;
  enterRoomId.value = roomName;
});

// 참여 버튼 클릭 시 chat.ts의 헬퍼 호출
finalJoinBtn.addEventListener("click", () => {
  const userId = joinUserId.value.trim();
  const nickName = joinNickName.value.trim();
  const roomName = (document.getElementById("enterRoomId") as HTMLInputElement)
    .value;

  if (!userId || !nickName || !roomName) {
    alert("모든 입력을 완료하세요.");
    return;
  }

  import("/src/pages/ingame/chat.ts").then((chatModule) => {
    chatModule.handleRoomJoinFromLobby?.(roomName, userId, nickName);
  });
});

/**
 * 참여하기 버튼 클릭시 기존에 있던 방만들기, 참여하기 버튼이 사라집니다.
 * 그리고 방 리스트를 보여주는 팝업창이 나타납니다.
 */

function showRoomListPopup() {
  showRoomList.classList.toggle("hidden");
  buttonGroups.classList.toggle("hidden");
}

showRoomBtn.addEventListener("click", showRoomListPopup);
closeBtn.addEventListener("click", showRoomListPopup);
