/**
 * 채팅 애플리케이션의 메인 모듈
 * 소켓 통신과 채팅방 관리 기능을 구현
 */
import { socket, sendMsg, createRoom, joinRoom, leaveRoom, getRooms } from "./A13C-chat.ts";
import type { ChatMessage, CreateRoomParams, JoinRoomParams, RoomInfo } from "./A13C-chat.ts";

/** DOM 요소들 */
const userId = document.querySelector<HTMLInputElement>('[name="userId"]')!;
const roomName = document.querySelector<HTMLInputElement>('[name="roomName"]')!;
const enterRoomId = document.querySelector<HTMLInputElement>('[name="enterRoomId"]')!;
const nickName = document.querySelector<HTMLInputElement>('[name="nickName"]')!;
const joinRoomBtn = document.querySelector<HTMLButtonElement>("#joinRoomBtn")!;
const leaveRoomBtn = document.querySelector<HTMLButtonElement>("#leaveRoomBtn")!;
const msgInput = document.querySelector<HTMLInputElement>('[name="message"]')!;
const sendBtn = document.querySelector<HTMLButtonElement>("#sendBtn")!;
const connectedRoomElem = document.querySelector("#connectedRoom")!;
const chatScreen = document.querySelector(".addChat")!;

// 삭제된 방 ID를 저장하는 블랙리스트 추가
const DELETED_ROOMS_KEY = "A13C_DELETED_ROOMS";
let deletedRoomIds: string[] = [];

// 삭제된 방 목록 로드
function loadDeletedRooms() {
  const saved = localStorage.getItem(DELETED_ROOMS_KEY);
  if (saved) {
    try {
      deletedRoomIds = JSON.parse(saved);
    } catch (error) {
      deletedRoomIds = [];
    }
  }
}

// 방 삭제 시 블랙리스트에 추가
function addToDeletedRooms(roomId: string) {
  if (!deletedRoomIds.includes(roomId)) {
    deletedRoomIds.push(roomId);
    localStorage.setItem(DELETED_ROOMS_KEY, JSON.stringify(deletedRoomIds));
  }
}

/**
 * UUID 생성 함수 (자동 roomId 생성)
 */
function generateUUID() {
  return 'room_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
}

/**
 * 방 이름으로 방 찾기 함수
 */
async function findRoomByName(searchName: string): Promise<RoomInfo | null> {
  try {
    const rooms = await getRooms();
    const foundRoom = Object.values(rooms).find(room => 
      room.roomName.toLowerCase() === searchName.toLowerCase()
    );
    return foundRoom || null;
  } catch (error) {
    console.error("방 이름으로 검색 중 오류:", error);
    return null;
  }
}

// 실시간 참여 인원 수 관리를 위한 캐시
const CACHE_KEY = "A13C_ROOM_PARTICIPANT_CACHE";
let roomParticipantCache: { [roomId: string]: number } = {};

// 현재 접속 중인 방 정보 저장
const CURRENT_ROOM_KEY = "A13C_CURRENT_ROOM";
interface CurrentRoomInfo {
  roomId: string;
  roomName: string;
  memberCount: number;
}

// 로컬 스토리지에서 캐시 불러오기
function loadCacheFromStorage() {
  const savedCache = localStorage.getItem(CACHE_KEY);
  if (savedCache) {
    try {
      roomParticipantCache = JSON.parse(savedCache);
    } catch (error) {
      console.error("캐시 로드 중 오류:", error);
      roomParticipantCache = {};
    }
  }
}

// 캐시를 로컬 스토리지에 저장
function saveCacheToStorage() {
  localStorage.setItem(CACHE_KEY, JSON.stringify(roomParticipantCache));
}

// 현재 방 정보 저장
function saveCurrentRoom(roomId: string, roomName: string, memberCount: number) {
  const currentRoom: CurrentRoomInfo = {
    roomId,
    roomName,
    memberCount
  };
  localStorage.setItem(CURRENT_ROOM_KEY, JSON.stringify(currentRoom));
}

// 현재 방 정보 삭제
function clearCurrentRoom() {
  localStorage.removeItem(CURRENT_ROOM_KEY);
}

// 현재 방 정보 로드
function loadCurrentRoom(): CurrentRoomInfo | null {
  const savedRoom = localStorage.getItem(CURRENT_ROOM_KEY);
  if (savedRoom) {
    try {
      return JSON.parse(savedRoom);
    } catch (error) {
      console.error("현재 방 정보 로드 중 오류:", error);
      return null;
    }
  }
  return null;
}

// 실시간 업데이트를 위한 타이머
let updateInterval: number | null = null;

/** 방 목록 렌더링 */
function renderRoomList(rooms: { [key: string]: RoomInfo }) {
  const roomList = document.getElementById("roomList")!;
  roomList.innerHTML = "";

  // 블랙리스트에 등록된 방은 제외
  const filteredRooms = Object.entries(rooms)
    .filter(([roomId]) => !deletedRoomIds.includes(roomId))
    .reduce((acc, [roomId, room]) => {
      acc[roomId] = room;
      return acc;
    }, {} as { [key: string]: RoomInfo });

  if (!filteredRooms || Object.keys(filteredRooms).length === 0) {
    const emptyRow = document.createElement("tr");
    emptyRow.innerHTML = `
      <td colspan="4" class="text-center py-2">생성된 채팅방이 없습니다.</td>
    `;
    roomList.appendChild(emptyRow);
    return;
  }

  const currentRoom = loadCurrentRoom();

  Object.values(filteredRooms).forEach((room, index) => {
    const row = document.createElement("tr");
    row.className = "hover:bg-gray-300";
    row.setAttribute("data-room-id", room.roomId);
    row.setAttribute("data-room-name", room.roomName);

    // 서버에서 받은 실제 참여자 수
    const serverMemberCount = room.memberList ? Object.keys(room.memberList).length : 0;
    
    // 캐시된 값과 서버 값 중 큰 값 사용 (정확도 향상)
    const memberCount = Math.max(
      serverMemberCount, 
      roomParticipantCache[room.roomId] || 0
    );
    
    // 캐시 업데이트 및 저장
    roomParticipantCache[room.roomId] = memberCount;
    saveCacheToStorage();
    
    const displayCount = Math.min(memberCount, 5);
    const isFull = memberCount >= 5;

    row.innerHTML = `
      <td class="px-4 py-2">${index + 1}</td>
      <td class="px-4 py-2">${room.roomName}</td>
      <td class="px-4 py-2 participant-count">${displayCount}/5</td>
      <td class="px-4 py-2">${room.parents_option?.isPlaying ? "진행 중" : isFull ? "입장 마감" : "대기 중"}</td>
    `;

    // 현재 접속한 방이거나 저장된 방 정보와 일치하는 경우
    if (currentRoom && room.roomId === currentRoom.roomId) {
      // 사용자가 이 방에 입장 중인 경우
      enterRoomId.value = room.roomName;
      connectedRoomElem.textContent = `${room.roomName} (${displayCount}/5)`;
      
      // 방 정보 갱신 저장
      saveCurrentRoom(room.roomId, room.roomName, displayCount);
    }

    row.addEventListener("click", () => {
      enterRoomId.value = room.roomName;
    });
    roomList.appendChild(row);
  });
}

async function loadRoomList() {
  try {
    // 퇴장 중에는 목록 업데이트 건너뛰기
    const leavingRoomId = localStorage.getItem("A13C_LEAVING_ROOM");
    if (leavingRoomId) {
      return;
    }

    const rooms = await getRooms();
    
    // 존재하지 않는 방은 캐시에서 삭제
    Object.keys(roomParticipantCache).forEach(roomId => {
      if (!rooms[roomId]) {
        delete roomParticipantCache[roomId];
      }
    });
    
    // 서버 데이터로 캐시 갱신
    Object.values(rooms).forEach(room => {
      // 블랙리스트에 있는 방은 건너뜀
      if (deletedRoomIds.includes(room.roomId)) {
        return;
      }
      
      const serverCount = room.memberList ? Object.keys(room.memberList).length : 0;
      const cachedCount = roomParticipantCache[room.roomId] || 0;
      
      // 서버 값과 캐시 값 중 더 큰 값 사용
      roomParticipantCache[room.roomId] = Math.max(serverCount, cachedCount);
    });
    
    saveCacheToStorage();
    renderRoomList(rooms);
    
    // 현재 방 정보 확인
    const currentRoom = loadCurrentRoom();
    if (currentRoom) {
      // 현재 방이 여전히 존재하는지 확인
      if (!rooms[currentRoom.roomId] || deletedRoomIds.includes(currentRoom.roomId)) {
        // 방이 더 이상 존재하지 않으면 방 정보 삭제
        clearCurrentRoom();
        connectedRoomElem.textContent = "";
      }
    }
  } catch (error) {
    console.error("방 목록을 가져오는 중 오류 발생:", error);
  }
}

async function updateCurrentRoomInfo(members?: { [key: string]: { user_id: string; nickName: string } }) {
  const currentRoom = loadCurrentRoom();
  if (!currentRoom) {
    return;
  }

  // 블랙리스트에 있는 방은 처리하지 않음
  if (deletedRoomIds.includes(currentRoom.roomId)) {
    clearCurrentRoom();
    connectedRoomElem.textContent = "";
    return;
  }

  const currentRoomId = currentRoom.roomId;

  try {
    let memberCount = 0;
    let roomInfo;

    if (members) {
      memberCount = Object.keys(members).length;
      roomParticipantCache[currentRoomId] = memberCount;
      saveCacheToStorage();
    } else {
      const rooms = await getRooms();
      roomInfo = rooms[currentRoomId];
      
      if (roomInfo) {
        const serverCount = roomInfo.memberList ? Object.keys(roomInfo.memberList).length : 0;
        const cachedCount = roomParticipantCache[currentRoomId] || 0;
        memberCount = Math.max(serverCount, cachedCount);
        roomParticipantCache[currentRoomId] = memberCount;
        saveCacheToStorage();
      } else {
        return;
      }
    }

    const displayCount = Math.min(memberCount, 5);

    // UI 업데이트
    if (roomInfo) {
      connectedRoomElem.textContent = `${roomInfo.roomName} (${displayCount}/5)`;
      saveCurrentRoom(currentRoomId, roomInfo.roomName, displayCount);
    } else {
      connectedRoomElem.textContent = `${currentRoom.roomName} (${displayCount}/5)`;
      saveCurrentRoom(currentRoomId, currentRoom.roomName, displayCount);
    }

    const roomListRow = document.querySelector(`tr[data-room-id="${currentRoomId}"]`);
    if (roomListRow) {
      const participantCell = roomListRow.querySelector(".participant-count");
      if (participantCell) {
        participantCell.textContent = `${displayCount}/5`;
      }
    }
  } catch (error) {
    console.error("방 정보 갱신 중 오류 발생:", error);
  }
}

/** 채팅방 입장 버튼 - 생성 및 입장 통합 기능 */
joinRoomBtn.addEventListener("click", async () => {
  const userIdValue = userId.value.trim();
  const nickNameValue = nickName.value.trim();
  
  if (!userIdValue || !nickNameValue) {
    alert("사용자 아이디와 닉네임을 모두 입력하세요.");
    return;
  }
  
  const newRoomName = roomName.value.trim();
  const existingRoomName = enterRoomId.value.trim();
  
  try {
    // 1. 새 방 생성 모드
    if (newRoomName) {
      const generatedRoomId = generateUUID();
      
      const createParams: CreateRoomParams = {
        roomId: generatedRoomId,
        user_id: userIdValue,
        roomName: newRoomName,
        hostName: "A13C",
      };
      
      const createResult = await createRoom(createParams);
      
      if (createResult && (createResult.success === true || 
          (typeof createResult === 'object' && createResult.roomInfo))) {
        
        // 블랙리스트에서 제거 (동일한 방 이름으로 이전에 삭제된 경우)
        deletedRoomIds = deletedRoomIds.filter(id => {
          const room = createResult.roomList?.[id];
          return !room || room.roomName.toLowerCase() !== newRoomName.toLowerCase();
        });
        localStorage.setItem(DELETED_ROOMS_KEY, JSON.stringify(deletedRoomIds));
        
        // 새 방 생성 시 참여자 수 초기화 (방장 1명)
        roomParticipantCache[generatedRoomId] = 1;
        saveCacheToStorage();
        
        // 현재 방 정보 저장
        saveCurrentRoom(generatedRoomId, newRoomName, 1);
        connectedRoomElem.textContent = `${newRoomName} (1/5)`;
        
        await loadRoomList();
        
        // 방 생성 후 자동 입장
        const joinParams: JoinRoomParams = {
          roomId: generatedRoomId,
          user_id: userIdValue,
          nickName: nickNameValue,
        };
        
        const joinResult = await joinRoom(joinParams);
        
        if (joinResult && joinResult.ok) {
          alert(`채팅방 "${newRoomName}"이(가) 생성되었으며 채팅에 참여합니다.`);
          roomName.value = "";
          
          if (msgInput) {
            msgInput.focus();
          }
          return;
        } else {
          alert(`채팅방은 생성되었지만 입장에 실패했습니다: ${joinResult?.message || '알 수 없는 오류'}`);
        }
      } else {
        alert("채팅방 생성에 실패했습니다. 다시 시도해 주세요.");
      }
    }
    // 2. 기존 방 입장 모드
    else if (existingRoomName) {
      const foundRoom = await findRoomByName(existingRoomName);
      
      if (!foundRoom) {
        alert(`"${existingRoomName}" 방이 존재하지 않습니다. 채팅방을 생성하려면 '생성할 방 이름'에 입력해주세요.`);
        return;
      }
      
      if (deletedRoomIds.includes(foundRoom.roomId)) {
        alert(`"${existingRoomName}" 방은 이미 삭제되었습니다. 새로운 방을 생성해주세요.`);
        return;
      }
      
      const roomIdValue = foundRoom.roomId;
      
      // 참여자 수 확인
      const serverCount = foundRoom.memberList ? Object.keys(foundRoom.memberList).length : 0;
      const cachedCount = roomParticipantCache[roomIdValue] || 0;
      const participantCount = Math.max(serverCount, cachedCount);
      
      if (participantCount >= 5) {
        alert("참여 인원이 5명 이상인 방에는 입장할 수 없습니다.");
        return;
      }

      if (foundRoom.memberList[userIdValue]) {
        alert("이미 해당 채팅방에 참여 중입니다.");
        return;
      }

      const params: JoinRoomParams = {
        roomId: roomIdValue,
        user_id: userIdValue,
        nickName: nickNameValue,
      };

      connectedRoomElem.textContent = `${existingRoomName} (입장 중...)`;

      const result = await joinRoom(params);
      
      if (result.ok) {
        alert(`${existingRoomName} 방에 입장하였습니다.`);
        
        // 참여자 수 증가
        const newCount = participantCount + 1;
        roomParticipantCache[roomIdValue] = newCount;
        saveCacheToStorage(); 
        
        // 현재 방 정보 저장
        saveCurrentRoom(roomIdValue, existingRoomName, Math.min(newCount, 5));
        
        await loadRoomList();
        
        if (msgInput) {
          msgInput.focus();
        }
      } else {
        alert(`방 입장 실패: ${result.message || '알 수 없는 오류'}`);
        connectedRoomElem.textContent = "";
      }
    } else {
      alert("생성할 방 이름 또는 참여할 방 이름을 입력하세요.");
    }
  } catch (error) {
    console.error("채팅방 생성/입장 중 오류 발생:", error);
    alert("채팅방 생성/입장 중 오류가 발생했습니다. 다시 시도해 주세요.");
  }
});

/** 채팅방 퇴장 */
leaveRoomBtn.addEventListener("click", async () => {
  try {
    // 현재 방 정보 로드 시도
    let currentRoom = loadCurrentRoom();
    
    // 로컬에 방 정보가 없는 경우 (처음 방 생성자인 경우 발생할 수 있음)
    if (!currentRoom) {
      const roomNameToLeave = enterRoomId.value.trim();
      
      if (!roomNameToLeave) {
        alert("퇴장할 방 정보가 없습니다.");
        return;
      }
      
      const foundRoom = await findRoomByName(roomNameToLeave);
      if (!foundRoom) {
        alert("퇴장할 방을 찾을 수 없습니다.");
        return;
      }
      
      currentRoom = {
        roomId: foundRoom.roomId,
        roomName: foundRoom.roomName,
        memberCount: foundRoom.memberList ? Object.keys(foundRoom.memberList).length : 1
      };
      
      if (currentRoom.memberCount === 1) {
        saveCurrentRoom(currentRoom.roomId, currentRoom.roomName, currentRoom.memberCount);
      }
    }
    
    const currentRoomId = currentRoom.roomId;
    
    if (localStorage.getItem("A13C_LEAVING_ROOM")) {
      alert("이미 퇴장 처리 중입니다. 잠시만 기다려주세요.");
      return;
    }
    
    localStorage.setItem("A13C_LEAVING_ROOM", currentRoomId);
    
    const rooms = await getRooms();
    const room = rooms[currentRoomId];
    
    if (!room) {
      clearCurrentRoom();
      connectedRoomElem.textContent = "";
      localStorage.removeItem("A13C_LEAVING_ROOM");
      alert("채팅방이 이미 존재하지 않습니다.");
      return;
    }
    
    const memberList = room.memberList || {};
    const serverCount = Object.keys(memberList).length;
    
    // 서버의 참여자 수와 캐시된 참여자 수 비교
    const cachedCount = roomParticipantCache[currentRoomId] || 0;
    const effectiveCount = Math.max(serverCount, cachedCount);
    
    // 참가자가 두 명 이상일 경우: 일반 퇴장 처리
    if (effectiveCount > 1) {
      const newCount = effectiveCount - 1;
      
      roomParticipantCache[currentRoomId] = newCount;
      saveCacheToStorage();
      
      clearCurrentRoom();
      connectedRoomElem.textContent = "";
      enterRoomId.value = "";
      
      await leaveRoom();
      
      const roomListRow = document.querySelector(`tr[data-room-id="${currentRoomId}"]`);
      if (roomListRow) {
        const participantCell = roomListRow.querySelector(".participant-count");
        if (participantCell) {
          participantCell.textContent = `${newCount}/5`;
        }
      }
      
      alert("채팅방에서 퇴장했습니다.");
      
      setTimeout(() => {
        localStorage.removeItem("A13C_LEAVING_ROOM");
        loadRoomList();
      }, 5000);
    }
    // 참가자가 정확히 1명일 경우만 방 삭제 처리
    else if (effectiveCount === 1 || serverCount <= 1) {
      addToDeletedRooms(currentRoomId);
      
      delete roomParticipantCache[currentRoomId];
      saveCacheToStorage();
      
      const roomListRow = document.querySelector(`tr[data-room-id="${currentRoomId}"]`);
      if (roomListRow) {
        roomListRow.remove();
      }
      
      clearCurrentRoom();
      connectedRoomElem.textContent = "";
      enterRoomId.value = "";
      
      await leaveRoom();
      
      alert("마지막 사용자가 퇴장하여 채팅방이 삭제되었습니다.");
      
      const roomList = document.getElementById("roomList")!;
      if (roomList.children.length === 0) {
        const emptyRow = document.createElement("tr");
        emptyRow.innerHTML = `
          <td colspan="4" class="text-center py-2">생성된 채팅방이 없습니다.</td>
        `;
        roomList.appendChild(emptyRow);
      }
      
      setTimeout(() => {
        localStorage.removeItem("A13C_LEAVING_ROOM");
        loadRoomList();
      }, 10000);
    } 
    else {
      clearCurrentRoom();
      connectedRoomElem.textContent = "";
      await leaveRoom();
      alert("채팅방에서 퇴장했습니다.");
      localStorage.removeItem("A13C_LEAVING_ROOM");
      loadRoomList();
    }
  } catch (error) {
    console.error("[오류] 채팅방 퇴장 중 오류 발생:", error);
    alert("퇴장 중 오류가 발생했습니다. 다시 시도해 주세요.");
    localStorage.removeItem("A13C_LEAVING_ROOM");
    loadRoomList();
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
  
  loadDeletedRooms();
  loadCacheFromStorage();
  
  const currentRoom = loadCurrentRoom();
  if (currentRoom) {
    if (deletedRoomIds.includes(currentRoom.roomId)) {
      clearCurrentRoom();
    } else {
      enterRoomId.value = currentRoom.roomName;
      connectedRoomElem.textContent = `${currentRoom.roomName} (${currentRoom.memberCount}/5)`;
    }
  }
  
  // 기존 리스너 모두 제거
  socket.off("members");
  socket.off("rooms");

  socket.on("members", (members: { [key: string]: { user_id: string; nickName: string } }) => {
    const currentRoom = loadCurrentRoom();
    
    if (currentRoom) {
      if (deletedRoomIds.includes(currentRoom.roomId)) {
        clearCurrentRoom();
        connectedRoomElem.textContent = "";
        return;
      }
      
      const memberCount = Object.keys(members).length;
      
      roomParticipantCache[currentRoom.roomId] = memberCount;
      saveCacheToStorage();
      
      updateCurrentRoomInfo(members);
    }
  });

  socket.on("rooms", (roomsData: { [key: string]: RoomInfo }) => {
    const leavingRoomId = localStorage.getItem("A13C_LEAVING_ROOM");
    if (leavingRoomId) {
      return;
    }
    
    if(roomsData){
      const filteredRooms = Object.entries(roomsData)
        .filter(([roomId]) => !deletedRoomIds.includes(roomId))
        .reduce((acc, [roomId, room]) => {
          acc[roomId] = room;
          return acc;
        }, {} as { [key: string]: RoomInfo });
      
      renderRoomList(filteredRooms);
    }
    
    const currentRoom = loadCurrentRoom();
    if (currentRoom && roomsData && !roomsData[currentRoom.roomId]) {
      clearCurrentRoom();
      connectedRoomElem.textContent = "";
      
      if (!deletedRoomIds.includes(currentRoom.roomId)) {
        addToDeletedRooms(currentRoom.roomId);
        alert("참여 인원이 없어 채팅방이 자동으로 삭제되었습니다.");
      }
    }
  });

  // 초기 방 목록 로드
  loadRoomList();
  
  // 주기적으로 방 목록 업데이트 (3초마다)
  if (updateInterval) {
    clearInterval(updateInterval);
  }
  
  updateInterval = setInterval(() => {
    loadRoomList();
  }, 3000);
});

// 페이지 종료 시 타이머 정리
window.addEventListener("beforeunload", () => {
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
  }
});