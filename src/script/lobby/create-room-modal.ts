import { createRoom, type CreateRoomParams } from "../A13C-chat";

// 방 만들기 모달 관련
const roomNameInput = document.getElementById("roomName") as HTMLInputElement;
const nickNameInput = document.getElementById("nickName") as HTMLInputElement;
const joinRoomBtn = document.getElementById("joinRoomBtn") as HTMLButtonElement;

// DOM 선택 부분
const modalDialog = document.querySelector(
  ".modal-dialog"
) as HTMLDialogElement | null;
const closeModalButton = document.querySelector(
  ".close-modal-dialog"
) as HTMLButtonElement | null;

// 함수 구현 부분
export const openModal = () => modalDialog?.showModal();
const closeModal = () => modalDialog?.close();

// 이벤트 등록
closeModalButton?.addEventListener("click", closeModal);

// 이전에 입력했던 사용자 정보 불러오기
const nickName = localStorage.getItem("A13C_USER_INFO");
// 방 생성 폼에 적용
nickNameInput.value = nickName || "";

// 방 만들기 > 채팅방 입장 버튼 클릭 시 처리(방생성 후 입장)
joinRoomBtn.addEventListener("click", async () => {
  const roomName = roomNameInput.value.trim();
  const nickName = nickNameInput.value.trim();

  if (!roomName || !nickName) {
    alert("방 이름, 닉네임을 모두 입력해주세요.");
    return;
  }

  // 사용자 정보 별도 저장 (다음 입력 시 사용)
  localStorage.setItem("A13C_USER_INFO", nickName);

  const roomInfo: CreateRoomParams = {
    user_id: nickName,
    roomName,
    hostName: nickName, // 방 생성자
    autoClose: false,
    capacity: 5,
  };

  const createRoomResult = await createRoom(roomInfo);

  console.log("방생성 요청 결과", createRoomResult);
  if (createRoomResult.ok) {
    localStorage.setItem(
      "A13C_CREATE_ROOM_INFO",
      JSON.stringify({
        user_id: nickName,
        roomId: createRoomResult.roomInfo.roomId,
        isCreator: true,
      })
    );
    // ingame.html로 이동
    window.location.href = `/src/pages/ingame.html?roomId=${createRoomResult.roomInfo.roomId}&nickName=${nickName}`;
  } else {
    alert(createRoomResult.message);
  }
});
