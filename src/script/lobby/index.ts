import "/src/style.css";
import { openModal } from "./create-room-modal.ts";
import { showRoomListPopup } from "./join-room-modal.ts";
import { cleanRooms } from "../A13C-chat.ts";


const createRoomButton = document.querySelector("#create-room-btn") as HTMLButtonElement | null;
// 참여하기 버튼
const showRoomBtn = document.querySelector("#show-room-btn") as HTMLDivElement;

createRoomButton?.addEventListener("click", openModal);
// 참여하기 버튼 클릭
showRoomBtn.addEventListener("click", showRoomListPopup);

// 퇴장 플래그 초기화
localStorage.removeItem("A13C_LEAVING_ROOM");
localStorage.removeItem("A13C_CREATE_ROOM_INFO");

//cleanRooms() 함수 호출 - 도든 방 삭제
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.altKey && e.key === 'x') {
    if (confirm('모든 채팅방을 삭제하시겠습니까?')) {
      cleanRooms();
      alert('모든 채팅방이 삭제되었습니다.');
      
      // 잠시 후 새로고침하여 방 목록 업데이트
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }
});

