// 참여하기 버튼
const showRoomBtn = document.querySelector(".show-room-btn") as HTMLDivElement;

// 방 리스트를 보여주는 팝업창
const showRoomList = document.querySelector(".show-room-list") as HTMLDivElement;

// 참여하기버튼, 방 만들기 버튼
const buttonGroups = document.querySelector(".button-groups") as HTMLDivElement;

// 닫기 버튼
const closeBtn = document.querySelector(".close-btn") as HTMLDivElement;

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