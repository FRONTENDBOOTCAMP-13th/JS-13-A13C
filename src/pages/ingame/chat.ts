/**
 * 채팅 애플리케이션의 메인 모듈
 * 소켓 통신과 채팅방 관리 기능을 구현
 */
import { socket, sendMsg, createRoom, joinRoom, leaveRoom, getRooms } from "./A13C-chat.ts";
import type { ChatMessage, CreateRoomParams, JoinRoomParams, RoomInfo } from "./A13C-chat.ts";

/** DOM 요소들 */
const userId = document.querySelector<HTMLInputElement>('[name="userId"]')!;
const roomId = document.querySelector<HTMLInputElement>('[name="roomId"]')!;
const roomName = document.querySelector<HTMLInputElement>('[name="roomName"]')!;
const createRoomBtn = document.querySelector<HTMLButtonElement>("#createRoomBtn")!;
const enterRoomId = document.querySelector<HTMLInputElement>('[name="enterRoomId"]')!;
const nickName = document.querySelector<HTMLInputElement>('[name="nickName"]')!;
const joinRoomBtn = document.querySelector<HTMLButtonElement>("#joinRoomBtn")!;
const leaveRoomBtn = document.querySelector<HTMLButtonElement>("#leaveRoomBtn")!;
const msgInput = document.querySelector<HTMLInputElement>('[name="message"]')!;
const sendBtn = document.querySelector<HTMLButtonElement>("#sendBtn")!;
const connectedRoomElem = document.querySelector("#connectedRoom")!;
const chatScreen = document.querySelector(".addChat")!;

/** 방 목록 렌더링 */
function renderRoomList(rooms: { [key: string]: RoomInfo }) {
  const roomList = document.getElementById("roomList")!;
  roomList.innerHTML = ""; // 기존 목록 초기화

  if (!rooms || Object.keys(rooms).length === 0) {
    const emptyRow = document.createElement("tr");
    emptyRow.innerHTML = `
      <td colspan="4" class="text-center py-2">생성된 채팅방이 없습니다.</td>
    `;
    roomList.appendChild(emptyRow);
    return;
  }

  const currentRoomId = enterRoomId.value.trim();

  Object.values(rooms).forEach((room, index) => {
    const row = document.createElement("tr");
    row.className = "hover:bg-gray-300";
    row.setAttribute("data-room-id", room.roomId);

    const memberCount = Object.keys(room.memberList).length;
    const displayCount = Math.min(memberCount, 5);

    row.innerHTML = `
      <td class="h-12 px-4 text-center font-medium">${index + 1}</td>
      <td class="max-w-[500px] h-12 px-4 text-left align-middle font-medium truncate">${room.roomName}</td>
      <td class="h-12 px-4 text-center font-medium participant-count">${displayCount}/5</td>
      <td class="h-12 px-4 text-center font-medium">${room.parents_option?.isPlaying ? "진행 중" : "대기 중"}</td>
    `;

    connectedRoomElem.textContent = `${currentRoomId} (${memberCount}/5)`;
    const roomListRow = document.querySelector(`tr[data-room-id="${currentRoomId}"]`);
    if (roomListRow) {
      const participantCell = roomListRow.querySelector(".participant-count");
      if (participantCell) {
        participantCell.textContent = `${displayCount}/5`;
        console.log(`UI 업데이트 완료: ${displayCount}/5`);
      }
    }

    row.addEventListener("click", () => {
      enterRoomId.value = room.roomId;
    });
    roomList.appendChild(row);
  });
}

async function loadRoomList() {
  try {
    const rooms = await getRooms();
    console.log("방 목록:", rooms); // 디버깅 로그 추가
    // 방 목록 UI 업데이트
    renderRoomList(rooms);
  } catch (error) {
    console.error("방 목록을 가져오는 중 오류 발생:", error);
  }
}

async function updateCurrentRoomInfo(members?: { [key: string]: { user_id: string; nickName: string } }) {
  const currentRoomId = enterRoomId.value.trim();
  if (!currentRoomId) {
    console.warn("현재 방 ID가 설정되지 않았습니다.");
    return;
  }

  try {
    let memberCount = 0;

    if (members) {
      // members가 전달된 경우, 소켓 데이터 기반으로만 업데이트 (서버 호출 생략)
      memberCount = Object.keys(members).length;
    } else {
      // members가 없을 경우에만 서버에서 가져오기
      const rooms = await getRooms();
      const room = rooms[currentRoomId];
      if (room) {
        memberCount = Object.keys(room.memberList).length;
      } else {
        console.warn(`방 ID [${currentRoomId}]에 해당하는 방 정보를 찾을 수 없습니다.`);
        return;
      }
    }

    const displayCount = Math.min(memberCount, 5);

    // UI 업데이트
    connectedRoomElem.textContent = `${currentRoomId} (${displayCount}/5)`;

    const roomListRow = document.querySelector(`tr[data-room-id="${currentRoomId}"]`);
    if (roomListRow) {
      const participantCell = roomListRow.querySelector(".participant-count");
      if (participantCell) {
        participantCell.textContent = `${memberCount}/5`;
        console.log(`UI 업데이트 완료: ${participantCell.textContent}`);
      }
    }
  } catch (error) {
    console.error("방 정보 갱신 중 오류 발생:", error);
  }
}

/** 채팅방 생성 */
createRoomBtn.addEventListener("click", async () => {
  const params: CreateRoomParams = {
    roomId: roomId.value,
    user_id: userId.value,
    roomName: roomName.value,
    hostName: "A13C",
  };
  try {
    const result = await createRoom(params);
    console.log("채팅방 생성 요청 결과", result);
    loadRoomList();
  } catch (error) {
    console.error("채팅방 생성 중 오류 발생:", error);
  }
});

/** 채팅방 입장 */
joinRoomBtn.addEventListener("click", async () => {
  const roomIdValue = enterRoomId.value.trim();
  if (!roomIdValue) {
    alert("방 ID를 입력하세요.");
    return;
  }

  try {
    const rooms = await getRooms();
    const room = rooms[roomIdValue];
    if (!room) {
      alert("해당 방이 존재하지 않습니다.");
      return;
    }

    const participantCount = Object.keys(room.memberList).length;
    if (participantCount >= 5) {
      alert("참여 인원이 5명 이상인 방에는 입장할 수 없습니다.");
      return;
    }

    const currentUserId = userId.value.trim();
    if (room.memberList[currentUserId]) {
      alert("이미 해당 채팅방에 참여 중입니다.");
      return;
    }

    const params: JoinRoomParams = {
      roomId: roomIdValue,
      user_id: userId.value,
      nickName: nickName.value,
    };

    connectedRoomElem.textContent = `${room.roomName} (입장 중...)`;

    const result = await joinRoom(params);
    if (result.ok) {
      alert(`${room.roomName} 방에 입장하였습니다.`);
      // loadRoomList();
    } else {
      alert(`방 입장 실패: ${result.message}`);
    }
  } catch (error) {
    console.error("채팅방 입장 중 오류 발생:", error);
  }
});

/** 채팅방 퇴장 */
leaveRoomBtn.addEventListener("click", async () => {
  try {
    leaveRoom();
    connectedRoomElem.textContent = "";
    alert("채팅방에서 퇴장했습니다.");
    loadRoomList();
  } catch (error) {
    console.error("채팅방 퇴장 중 오류 발생:", error);
  }
});

/** 메시지 전송 */
sendBtn.addEventListener("click", () => {
  const message = msgInput.value.trim();
  if (message) {
    sendMsg(message);
    msgInput.value = "";
  }
});

/** Enter 키로 메시지 전송 */
msgInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const message = msgInput.value.trim();
    if (message) {
      sendMsg(message);
      msgInput.value = "";
    }
  }
});

/** 소켓 이벤트 리스너 */
socket.on("message", (data: ChatMessage) => {
  const messageElement = document.createElement("div");
  messageElement.textContent = `${data.nickName}: ${data.msg}`;
  chatScreen.appendChild(messageElement);
  chatScreen.scrollTop = chatScreen.scrollHeight;
});

/** 초기화 */
document.addEventListener("DOMContentLoaded", () => {
  // 기존 리스너 모두 제거
  socket.off("members");
  socket.off("rooms");

  // 리스너 한 번만 등록
  socket.on("members", (members: { [key: string]: { user_id: string; nickName: string } }) => {
    console.log("현재 채팅방 멤버:", members);
    const memberCount = Object.keys(members).length;
    if (memberCount > 5) {
      console.warn(`참여 인원 제한 초과: ${memberCount}/5`);
    }
    updateCurrentRoomInfo(members);
  });

  // rooms 이벤트 핸들러 수정
  socket.on("rooms", () => {
    // 사용자가 현재 참여한 방 ID 저장
    const currentRoomId = enterRoomId.value.trim();
    console.log("rooms 이벤트 발생, 현재 방:", currentRoomId);

    // 현재 참여 중인 방이 있으면 참여인원 업데이트 없이 처리
    if (currentRoomId) {
      loadRoomListExceptCurrent(currentRoomId);
    } else {
      loadRoomList();
    }
  });

  // 초기 방 목록 로드
  loadRoomList();
});

// 현재 참여 중인 방을 제외하고 방 목록 업데이트하는 함수 추가
async function loadRoomListExceptCurrent(currentRoomId: string) {
  try {
    const rooms = await getRooms();
    console.log("방 목록 업데이트 (현재 방 제외):", rooms);

    // 현재 방의 참여인원 정보 백업
    const currentParticipantCell = document.querySelector(`tr[data-room-id="${currentRoomId}"] .participant-count`);
    const currentParticipantText = currentParticipantCell ? currentParticipantCell.textContent : null;

    // 방 목록 렌더링
    renderRoomList(rooms);

    // 현재 방의 참여인원 정보 복원
    if (currentParticipantText) {
      const updatedParticipantCell = document.querySelector(`tr[data-room-id="${currentRoomId}"] .participant-count`);
      if (updatedParticipantCell) {
        updatedParticipantCell.textContent = currentParticipantText;
        console.log(`현재 방 [${currentRoomId}]의 참여인원 정보 복원: ${currentParticipantText}`);
      }
    }
  } catch (error) {
    console.error("방 목록을 가져오는 중 오류 발생:", error);
  }
}
