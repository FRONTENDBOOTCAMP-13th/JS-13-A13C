import "/src/style.css";
import { openModal } from "./create-room-modal.ts";
import { showRoomListPopup } from "./join-room-modal.ts";


const createRoomButton = document.querySelector("#create-room-btn") as HTMLButtonElement | null;
// 참여하기 버튼
const showRoomBtn = document.querySelector("#show-room-btn") as HTMLDivElement;

createRoomButton?.addEventListener("click", openModal);
// 참여하기 버튼 클릭
showRoomBtn.addEventListener("click", showRoomListPopup);



// 퇴장 플래그 초기화
localStorage.removeItem("A13C_LEAVING_ROOM");
localStorage.removeItem("A13C_CREATE_ROOM_INFO");


