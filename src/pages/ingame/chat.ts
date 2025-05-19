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
const refreshBtn = document.querySelector<HTMLButtonElement>("#refreshRoomListBtn");

// 현재 사용자 정보 저장을 위한 키 추가
const CURRENT_USER_KEY = "A13C_CURRENT_USER";

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

// 사용자 정보 저장 함수 추가
function saveCurrentUser(userIdValue: string, nickNameValue: string) {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify({
    userId: userIdValue,
    nickName: nickNameValue
  }));
}

// 사용자 정보 로드 함수
function loadCurrentUser() {
  const savedUser = localStorage.getItem(CURRENT_USER_KEY);
  if (savedUser) {
    try {
      return JSON.parse(savedUser);
    } catch (error) {
      console.error("사용자 정보 로드 중 오류:", error);
      return null;
    }
  }
  return null;
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
    
    // 이름이 같은 방들 중에서 삭제되지 않은 가장 최신 방 찾기
    const matchingRooms = Object.values(rooms)
      .filter(room => 
        room.roomName.toLowerCase() === searchName.toLowerCase() && 
        !deletedRoomIds.includes(room.roomId)
      )
      .sort((a, b) => {
        const timeA = a.create_at ? new Date(a.create_at).getTime() : 0;
        const timeB = b.create_at ? new Date(b.create_at).getTime() : 0;
        return timeB - timeA; // 최신 생성순 정렬
      });
    
    return matchingRooms.length > 0 ? matchingRooms[0] : null;
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
  sessionStorage.setItem(CURRENT_ROOM_KEY, JSON.stringify(currentRoom));
}

// 현재 방 정보 삭제
function clearCurrentRoom() {
  sessionStorage.removeItem(CURRENT_ROOM_KEY);
}

// 현재 방 정보 로드
function loadCurrentRoom(): CurrentRoomInfo | null {
  const savedRoom = sessionStorage.getItem(CURRENT_ROOM_KEY);
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

/**
 * 같은 이름의 방이 이미 있는지 확인
 * @returns 방이 이미 존재하면 true, 아니면 false 
 */
async function checkRoomExists(roomNameToCheck: string): Promise<boolean> {
  try {
    const rooms = await getRooms();
    // 이름이 같은 방 중 삭제되지 않은 방이 있는지 확인
    return Object.values(rooms).some(room => 
      room.roomName.toLowerCase() === roomNameToCheck.toLowerCase() && 
      !deletedRoomIds.includes(room.roomId)
    );
  } catch (error) {
    console.error("방 존재 여부 확인 중 오류:", error);
    return false;
  }
}

// 특정 방의 참여자 수를 UI에서 갱신하는 함수
function updateRoomParticipantCount(roomId: string, count: number) {
  const roomListRow = document.querySelector(`tr[data-room-id="${roomId}"]`);
  if (roomListRow) {
    const participantCell = roomListRow.querySelector(".participant-count");
    if (participantCell) {
      const displayCount = Math.min(count, 5);
      participantCell.textContent = `${displayCount}/5`;
      
      // 현재 접속 중인 방인 경우 방 제목의 인원수도 업데이트
      const currentRoom = loadCurrentRoom();
      if (currentRoom && currentRoom.roomId === roomId) {
        connectedRoomElem.textContent = `${currentRoom.roomName} (${displayCount}/5)`;
        document.title = `채팅 (${currentRoom.roomName}: ${displayCount}명)`;
      }
    }
  }
}

/** 방 목록 렌더링 - 중복 방지 로직 강화 */
function renderRoomList(rooms: { [key: string]: RoomInfo }) {
  // roomList 요소가 존재하는지 확인
  const roomList = document.getElementById("roomList");
  if (!roomList) {
    console.log("현재 페이지에 roomList 요소가 없습니다.");
    return;
  }
  
  roomList.innerHTML = "";

  // 중복 방지를 위한 Map (roomName을 키로 사용)
  const uniqueRooms = new Map<string, RoomInfo>();
  
  // 삭제된 방 필터링하고 중복 방 처리를 위해 정렬
  const sortedRooms = Object.entries(rooms)
    .filter(([roomId]) => !deletedRoomIds.includes(roomId))
    .sort((a, b) => {
      const timeA = a[1].create_at ? new Date(a[1].create_at).getTime() : 0;
      const timeB = b[1].create_at ? new Date(b[1].create_at).getTime() : 0;
      return timeB - timeA; // 최신 방이 우선
    });
  
  // 중복된 방 이름은 최신 방만 표시
  sortedRooms.forEach(([roomId, room]) => {
    if (!uniqueRooms.has(room.roomName.toLowerCase())) {
      uniqueRooms.set(room.roomName.toLowerCase(), { ...room, roomId });
    }
  });
  
  // 중복 제거된 방 목록 객체 생성
  const filteredRooms: { [key: string]: RoomInfo } = {};
  uniqueRooms.forEach((room) => {
    filteredRooms[room.roomId] = room;
  });

  if (Object.keys(filteredRooms).length === 0) {
    const emptyRow = document.createElement("tr");
    emptyRow.innerHTML = `
      <td colspan="4" class="text-center py-2">생성된 채팅방이 없습니다.</td>
    `;
    roomList.appendChild(emptyRow);
    return;
  }

  const currentRoom = loadCurrentRoom();

  // 필터링된 방 목록 표시
  Object.values(filteredRooms).forEach((room, index) => {
    const row = document.createElement("tr");
    row.className = "hover:bg-gray-300";
    row.setAttribute("data-room-id", room.roomId);
    row.setAttribute("data-room-name", room.roomName);

    // 서버에서 받은 실제 참여자 수
    const serverMemberCount = room.memberList ? Object.keys(room.memberList).length : 0;
    
    // 캐시된 값과 서버 값 중 큰 값 사용 (정확도 향상)
    const memberCount = Math.max(serverMemberCount, roomParticipantCache[room.roomId] || 0);
    
    // 캐시 업데이트 및 저장
    roomParticipantCache[room.roomId] = memberCount;
    
    const displayCount = Math.min(memberCount, 5);
    const isFull = memberCount >= 5;

    row.innerHTML = `
      <td class="px-4 py-2">${index + 1}</td>
      <td class="px-4 py-2">${room.roomName}</td>
      <td class="px-4 py-2 participant-count">${displayCount}/5</td>
      <td class="px-4 py-2">${room.parents_option?.isPlaying ? "진행 중" : isFull ? "입장 마감" : "대기 중"}</td>
    `;

    // 현재 접속한 방이거나 저장된 방 정보와 일치하는 경우 하이라이트
    if (currentRoom && room.roomId === currentRoom.roomId) {
      row.classList.add("bg-blue-100");
      enterRoomId.value = room.roomName;
      connectedRoomElem.textContent = `${room.roomName} (${displayCount}/5)`;
      
      // 방 정보 갱신 저장
      saveCurrentRoom(room.roomId, room.roomName, displayCount);
    }

    row.addEventListener("click", () => {
      enterRoomId.value = room.roomName;
      // 방 ID도 data 속성으로 저장
      enterRoomId.setAttribute("data-room-id", room.roomId);
    });
    roomList.appendChild(row);
  });
  
  // 캐시 저장
  saveCacheToStorage();
}

async function loadRoomList() {
  try {
    // roomList 요소가 존재하는지 확인
    const roomList = document.getElementById("roomList");
    if (!roomList) {
      console.log("현재 페이지에 roomList 요소가 없습니다. 방 목록 로드를 건너뜁니다.");
      return;
    }
    
    // 퇴장 중에는 목록 업데이트 건너뛰기
    const leavingTimestamp = localStorage.getItem("A13C_LEAVING_ROOM");
    if (leavingTimestamp) {
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
      
      // 참여자 수가 변경된 경우 UI 갱신
      if (serverCount !== cachedCount) {
        roomParticipantCache[room.roomId] = serverCount;
        updateRoomParticipantCount(room.roomId, serverCount);
      }
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
      
      // 참여자 수 변경이 있으면 캐시 및 UI 업데이트
      if (roomParticipantCache[currentRoomId] !== memberCount) {
        roomParticipantCache[currentRoomId] = memberCount;
        saveCacheToStorage();
        
        // UI 업데이트
        updateRoomParticipantCount(currentRoomId, memberCount);
      }
    } else {
      const rooms = await getRooms();
      roomInfo = rooms[currentRoomId];
      
      if (roomInfo) {
        const serverCount = roomInfo.memberList ? Object.keys(roomInfo.memberList).length : 0;
        
        // 참여자 수 변경이 있으면 캐시 및 UI 업데이트
        if (roomParticipantCache[currentRoomId] !== serverCount) {
          roomParticipantCache[currentRoomId] = serverCount;
          saveCacheToStorage();
          
          // UI 업데이트
          updateRoomParticipantCount(currentRoomId, serverCount);
        }
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
      // 이미 같은 이름의 방이 있는지 확인
      const roomExists = await checkRoomExists(newRoomName);
      if (roomExists) {
        alert(`"${newRoomName}" 이름의 방이 이미 존재합니다. 다른 이름을 사용하거나 기존 방에 참여하세요.`);
        return;
      }
      
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
        
        // 방 ID를 enterRoomId에도 저장 (퇴장 시 사용)
        enterRoomId.value = newRoomName;
        enterRoomId.setAttribute("data-room-id", generatedRoomId);
        
        await loadRoomList();
        
        // 방 생성 후 자동 입장
        const joinParams: JoinRoomParams = {
          roomId: generatedRoomId,
          user_id: userIdValue,
          nickName: nickNameValue,
        };
        
        const joinResult = await joinRoom(joinParams);
        
        if (joinResult && joinResult.ok) {
          // 사용자 정보 저장 - 새로고침해도 방 참여 유지하기 위함
          saveCurrentUser(userIdValue, nickNameValue);
          
          alert(`채팅방 "${newRoomName}"이(가) 생성되었으며 채팅에 참여합니다.`);
          roomName.value = "";
          
          // 실시간 참여자 수 업데이트를 위해 rooms 이벤트 수신
          socket.emit("rooms", (roomsData: any) => {
            if (roomsData) {
              renderRoomList(roomsData);
            }
          });
          
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
      // 저장된 방 ID 확인 - 로비에서 전달된 ID 우선 사용
      const directRoomId = enterRoomId.getAttribute("data-room-id");
      let foundRoom;
      let roomIdValue;
      
      if (directRoomId) {
        console.log("로비에서 전달된 방 ID 사용:", directRoomId);
        const rooms = await getRooms();
        foundRoom = rooms[directRoomId];
        
        if (foundRoom) {
          roomIdValue = directRoomId;
        } else {
          // 방 ID로 찾을 수 없는 경우 이름으로 검색
          console.log("저장된 방 ID로 방을 찾을 수 없어 이름으로 검색합니다");
          foundRoom = await findRoomByName(existingRoomName);
          if (foundRoom) roomIdValue = foundRoom.roomId;
        }
      } else {
        // 방 ID가 없는 경우 이름으로 검색
        foundRoom = await findRoomByName(existingRoomName);
        if (foundRoom) roomIdValue = foundRoom.roomId;
      }
      
      if (!foundRoom || !roomIdValue) {
        alert(`"${existingRoomName}" 방이 존재하지 않습니다. 채팅방을 생성하려면 '생성할 방 이름'에 입력해주세요.`);
        return;
      }
      
      if (deletedRoomIds.includes(roomIdValue)) {
        alert(`"${existingRoomName}" 방은 이미 삭제되었습니다. 새로운 방을 생성해주세요.`);
        return;
      }
      
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
        roomId: roomIdValue as string,
        user_id: userIdValue,
        nickName: nickNameValue,
      };

      connectedRoomElem.textContent = `${existingRoomName} (입장 중...)`;

      const result = await joinRoom(params);
      
      // 기존 방 입장 모드에서 성공 후 UI 업데이트 코드 수정
      if (result.ok) {
        // 사용자 정보 저장 - 새로고침해도 방 참여 유지하기 위함
        saveCurrentUser(userIdValue, nickNameValue);
        
        alert(`${existingRoomName} 방에 입장하였습니다.`);
        
        // 참여자 수 증가
        const newCount = participantCount + 1;
        roomParticipantCache[roomIdValue] = newCount;
        saveCacheToStorage(); 
        
        // 현재 방 정보 저장
        saveCurrentRoom(roomIdValue, existingRoomName, Math.min(newCount, 5));
        
        // 여기에 UI 직접 업데이트 추가 (누락된 부분)
        const displayCount = Math.min(newCount, 5);
        connectedRoomElem.textContent = `${existingRoomName} (${displayCount}/5)`;
        
        // 방 ID를 data-room-id 속성으로도 저장 (퇴장 시 사용)
        enterRoomId.setAttribute("data-room-id", roomIdValue);
        
        // 방 목록에서 참여자 수 업데이트
        updateRoomParticipantCount(roomIdValue, newCount);
        
        // 서버에서 최신 참여자 정보 가져와서 정확히 업데이트
        socket.emit("get_members", { roomId: roomIdValue }, (membersData: any) => {
          if (membersData) {
            const realMemberCount = Object.keys(membersData).length;
            const displayCount = Math.min(realMemberCount, 5);
            connectedRoomElem.textContent = `${existingRoomName} (${displayCount}/5)`;
            updateRoomParticipantCount(roomIdValue, realMemberCount);
          }
        });
        
        // 최신 방 목록 정보 로드 및 반영
        socket.emit("rooms", (roomsData: any) => {
          if (roomsData) {
            renderRoomList(roomsData);
          }
        });
        
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

/** 채팅방 퇴장 - 수정: 현재 방 정보가 없어도 퇴장 가능하도록 */
leaveRoomBtn.addEventListener("click", async () => {
  try {
    // 퇴장 중복 요청 방지 - 타임스탬프 확인
    const leavingTimestamp = localStorage.getItem("A13C_LEAVING_ROOM");
    if (leavingTimestamp && (Date.now() - parseInt(leavingTimestamp) < 3000)) {
      alert("이미 퇴장 처리 중입니다. 잠시만 기다려주세요.");
      return;
    }
    
    // 현재 시간을 저장
    localStorage.setItem("A13C_LEAVING_ROOM", Date.now().toString());
    localStorage.removeItem('A13C_CREATE_ROOM_INFO');
    
    // 현재 방 정보 로드 시도
    let currentRoom = loadCurrentRoom();
    
    // 방 정보가 없는 경우
    if (!currentRoom) {
      // 현재 텍스트 정보에서 방 제목 추출 시도
      const connectedRoomText = connectedRoomElem.textContent || "";
      const match = connectedRoomText.match(/^(.*?)\s*\(/);
      const roomNameFromText = match ? match[1].trim() : "";
      
      // 입력창의 방 이름 확인
      const roomNameFromInput = enterRoomId.value.trim();
      const roomIdFromAttr = enterRoomId.getAttribute("data-room-id");
      
      // 방 이름 결정 (텍스트 > 입력창 순으로 우선)
      const roomNameToLeave = roomNameFromText || roomNameFromInput;
      
      if (!roomNameToLeave && !roomIdFromAttr) {
        // 화면에 표시된 방 정보가 없고 입력창도 비어있으면 바로 로비로 이동
        alert("퇴장할 방 정보가 없습니다. 로비로 이동합니다.");
        localStorage.removeItem("A13C_LEAVING_ROOM");
        localStorage.removeItem(CURRENT_USER_KEY); // 사용자 정보도 삭제
        window.location.href = "/src/pages/lobby.html";
        return;
      }
      
      // 방 찾기 (ID 우선, 없으면 이름으로)
      let foundRoom;
      if (roomIdFromAttr) {
        const rooms = await getRooms();
        foundRoom = rooms[roomIdFromAttr];
      }
      
      if (!foundRoom && roomNameToLeave) {
        foundRoom = await findRoomByName(roomNameToLeave);
      }
      
      if (!foundRoom) {
        alert("현재 참여 중인 방을 찾을 수 없습니다. 로비로 이동합니다.");
        localStorage.removeItem("A13C_LEAVING_ROOM");
        localStorage.removeItem(CURRENT_USER_KEY); // 사용자 정보도 삭제
        await leaveRoom(); // 어떤 방이든 퇴장 처리
        window.location.href = "/src/pages/lobby.html";
        return;
      }
      
      // 찾은 방 정보로 현재 방 설정
      currentRoom = {
        roomId: foundRoom.roomId,
        roomName: foundRoom.roomName,
        memberCount: foundRoom.memberList ? Object.keys(foundRoom.memberList).length : 1
      };
    }
    
    // 현재 방 정보로 퇴장 처리 진행
    const currentRoomId = currentRoom.roomId;
    const rooms = await getRooms();
    const room = rooms[currentRoomId];
    
    if (!room) {
      clearCurrentRoom();
      localStorage.removeItem(CURRENT_USER_KEY); // 사용자 정보도 삭제
      connectedRoomElem.textContent = "";
      localStorage.removeItem("A13C_LEAVING_ROOM");
      alert("채팅방이 이미 존재하지 않습니다.");
      
      // 로비로 이동
      window.location.href = "/src/pages/lobby.html";
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
      
      // 방에서 퇴장 처리 먼저 실행
      await leaveRoom();
      
      roomParticipantCache[currentRoomId] = newCount;
      saveCacheToStorage();
      
      clearCurrentRoom();
      localStorage.removeItem(CURRENT_USER_KEY); // 사용자 정보도 삭제
      connectedRoomElem.textContent = "";
      enterRoomId.value = "";
      enterRoomId.removeAttribute("data-room-id");
      
      // 방 리스트에서 참여자 수 업데이트
      updateRoomParticipantCount(currentRoomId, newCount);
      
      alert("채팅방에서 퇴장했습니다.");
      
      // 로비로 이동 추가
      setTimeout(() => {
        localStorage.removeItem("A13C_LEAVING_ROOM");
        localStorage.removeItem("A13C_CREATE_ROOM_INFO"); // 다시 한번 확실하게 정리
        window.location.href = "/src/pages/lobby.html";
      }, 1000);
    }
    // 참가자가 정확히 1명일 경우만 방 삭제 처리
    else if (effectiveCount === 1 || serverCount <= 1) {
      // 방에서 퇴장 처리 먼저 실행
      await leaveRoom();
      
      addToDeletedRooms(currentRoomId);
      
      delete roomParticipantCache[currentRoomId];
      saveCacheToStorage();
      
      const roomListRow = document.querySelector(`tr[data-room-id="${currentRoomId}"]`);
      if (roomListRow) {
        roomListRow.remove();
      }
      
      clearCurrentRoom();
      localStorage.removeItem(CURRENT_USER_KEY); // 사용자 정보도 삭제
      connectedRoomElem.textContent = "";
      enterRoomId.value = "";
      enterRoomId.removeAttribute("data-room-id");
      
      alert("마지막 사용자가 퇴장하여 채팅방이 삭제되었습니다.");
      
      // 로비로 이동 추가
      setTimeout(() => {
        localStorage.removeItem("A13C_LEAVING_ROOM");
        window.location.href = "/src/pages/lobby.html";
      }, 1000);
    } 
    else {
      await leaveRoom();
      
      clearCurrentRoom();
      localStorage.removeItem(CURRENT_USER_KEY); // 사용자 정보도 삭제
      connectedRoomElem.textContent = "";
      enterRoomId.value = "";
      enterRoomId.removeAttribute("data-room-id");
      
      alert("채팅방에서 퇴장했습니다.");
      localStorage.removeItem("A13C_LEAVING_ROOM");
      
      // 로비로 이동 추가
      window.location.href = "/src/pages/lobby.html";
    }
  } catch (error) {
    console.error("[오류] 채팅방 퇴장 중 오류 발생:", error);
    alert("퇴장 중 오류가 발생했습니다. 다시 시도해 주세요.");
    localStorage.removeItem("A13C_LEAVING_ROOM");
    localStorage.removeItem(CURRENT_USER_KEY); // 사용자 정보도 삭제
    
    // 오류 발생해도 로비로 이동
    window.location.href = "/src/pages/lobby.html";
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
  if (!chatScreen) return;
  
  const messageElement = document.createElement("div");
  messageElement.textContent = `${data.nickName}: ${data.msg}`;

  messageElement.style.wordBreak = "break-word";
  messageElement.style.overflowWrap = "break-word";
  messageElement.style.maxWidth = "100%";
  messageElement.style.padding = "4px 8px";
  
  chatScreen.appendChild(messageElement);
  chatScreen.scrollTop = chatScreen.scrollHeight;
});

/** 초기화 */
document.addEventListener("DOMContentLoaded", () => {
  // 페이지 로드 시 퇴장 플래그 초기화
  localStorage.removeItem("A13C_LEAVING_ROOM");
  
  if (chatScreen) {
    chatScreen.setAttribute("style", `
      overflow-x: hidden;
      word-wrap: break-word;
    `);
  }

  // 로드된 정보 초기화
  loadDeletedRooms();
  loadCacheFromStorage();
  
  // 방 목록 요소가 있는 페이지에서만 방 목록 관련 기능 실행
  const roomList = document.getElementById("roomList");
  
  if (roomList) {
    // 초기 방 목록 로드
    loadRoomList();
    
    // 수동 새로고침 버튼 이벤트 리스너 연결
    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => {
        loadRoomList();
      });
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

      // 현재 게임 참가자 닉네임 배열로 출력
      const nicknameList = Object.values(members).map(member => member.nickName);
      console.log("현재 방 참여자 닉네임:", nicknameList);
      
      // 이전 참가자 수와 비교하여 변경이 있으면 알림
      const previousCount = roomParticipantCache[currentRoom.roomId] || 0;
      if (previousCount !== memberCount) {
        console.log(`참여자 수 변경: ${previousCount} -> ${memberCount}`);
        
        // 방 목록에서 실시간으로 참여자 수 업데이트
        updateRoomParticipantCount(currentRoom.roomId, memberCount);
        
        // 다른 사람이 방에 들어오거나 나갔을 때 캐시 및 UI 업데이트
        roomParticipantCache[currentRoom.roomId] = memberCount;
        saveCacheToStorage();
        
        // 실시간 참여자 수 반영하여 UI 업데이트
        updateCurrentRoomInfo(members);
        
        // 최신 방 목록 로드하여 ui 반영 (수동 새로고침 모드에서는 필요 없음)
        if (refreshBtn) {
          // 수동 새로고침 모드에서는 자동으로 방 목록을 갱신하지 않음
        } else {
          socket.emit("rooms", (roomsData: any) => {
            if (roomsData) {
              renderRoomList(roomsData);
            }
          });
        }
      }
    }
  });

  socket.on("rooms", (roomsData: { [key: string]: RoomInfo }) => {
    const leavingRoomId = localStorage.getItem("A13C_LEAVING_ROOM");
    if (leavingRoomId) {
      return;
    }
    
    // 수동 새로고침 모드에서는 자동으로 방 목록을 갱신하지 않음
    if (!refreshBtn && roomsData) {
      // 현재 방 정보만 업데이트
      const currentRoom = loadCurrentRoom();
      if (currentRoom && roomsData[currentRoom.roomId]) {
        const room = roomsData[currentRoom.roomId];
        const serverMemberCount = room.memberList ? Object.keys(room.memberList).length : 0;
        
        if (roomParticipantCache[currentRoom.roomId] !== serverMemberCount) {
          roomParticipantCache[currentRoom.roomId] = serverMemberCount;
          saveCacheToStorage();
          updateRoomParticipantCount(currentRoom.roomId, serverMemberCount);
        }
      }
    }
    
    const currentRoom = loadCurrentRoom();
    if (currentRoom && roomsData && !roomsData[currentRoom.roomId]) {
      clearCurrentRoom();
      localStorage.removeItem(CURRENT_USER_KEY); // 사용자 정보도 삭제
      connectedRoomElem.textContent = "";
      
      if (!deletedRoomIds.includes(currentRoom.roomId)) {
        addToDeletedRooms(currentRoom.roomId);
        alert("참여 인원이 없어 채팅방이 자동으로 삭제되었습니다.");
      }
    }
  });
  
  // 사용자가 이미 방에 참여 중이고 새로고침 한 경우 자동 재접속
  const currentUser = loadCurrentUser();
  const currentRoom = loadCurrentRoom();
  
  if (currentUser && currentRoom) {
    // 사용자 정보와 방 정보를 폼에 채움
    userId.value = currentUser.userId;
    nickName.value = currentUser.nickName;
    enterRoomId.value = currentRoom.roomName;
    enterRoomId.setAttribute("data-room-id", currentRoom.roomId);
    connectedRoomElem.textContent = `${currentRoom.roomName} (재접속 중...)`;
    
    // 소켓 재연결 및 방 재입장
    const joinParams: JoinRoomParams = {
      roomId: currentRoom.roomId,
      user_id: currentUser.userId,
      nickName: currentUser.nickName
    };
    
    // 약간의 딜레이 후 재입장 시도 (소켓 연결이 완료될 시간 확보)
    setTimeout(async () => {
      try {
        const result = await joinRoom(joinParams);
        if (result && result.ok) {
          console.log("페이지 새로고침 후 채팅방에 자동 재입장했습니다.");
          connectedRoomElem.textContent = `${currentRoom.roomName} (${currentRoom.memberCount}/5)`;
          
          // 채팅 화면에 재입장 메시지 표시
          if (chatScreen) {
            const messageElement = document.createElement("div");
            messageElement.textContent = "페이지 새로고침 후 채팅방에 재입장했습니다.";
            messageElement.style.color = "#888";
            messageElement.style.fontStyle = "italic";
            messageElement.style.padding = "4px 8px";
            chatScreen.appendChild(messageElement);
            chatScreen.scrollTop = chatScreen.scrollHeight;
          }
          
          // 채팅 입력창에 포커스
          if (msgInput) {
            msgInput.focus();
          }
        }
      } catch (error) {
        console.error("자동 재입장 중 오류 발생:", error);
      }
    }, 1000);
  }
  
  // 로비에서 전달된 정보 처리
  const savedRoomInfo = localStorage.getItem("A13C_CREATE_ROOM_INFO");
  if (savedRoomInfo) {
    try {
      const roomInfo = JSON.parse(savedRoomInfo);
      
      // 생성된지 10분 이내의 정보만 사용
      if (roomInfo && roomInfo.timestamp && Date.now() - roomInfo.timestamp < 10 * 60 * 1000) {
        // 사용자 정보 입력
        userId.value = roomInfo.userId || "";
        nickName.value = roomInfo.nickName || "";
        
        // 방 이름 입력
        if (roomInfo.isCreator) {
          // 방 생성자인 경우
          roomName.value = roomInfo.roomName || "";
        } else {
          // 참여자인 경우
          enterRoomId.value = roomInfo.roomName || "";
          
          // 방 ID가 있으면 데이터 속성으로 저장
          if (roomInfo.roomId) {
            console.log("로비에서 전달받은 방 ID:", roomInfo.roomId);
            enterRoomId.setAttribute("data-room-id", roomInfo.roomId);
          }
        }
        
        // 페이지 로드 후 약간의 딜레이를 두고 자동 입장
        setTimeout(() => {
          joinRoomBtn.click();
        }, 500);
      }
    } catch (error) {
      console.error("저장된 방 정보를 불러오는데 실패했습니다.", error);
    }
  }
  
  // 페이지 제목에 현재 방 정보 표시
  if (currentRoom) {
    document.title = `채팅 (${currentRoom.roomName}: ${currentRoom.memberCount}명)`;
  }
});

// 페이지 종료 시 타이머 정리
window.addEventListener("beforeunload", () => {
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
  }
});

/**
 * chat.ts에서 불러오는 함수의 타입에 맞춰 구현
 * 방 입장 처리를 위한 헬퍼 함수
 * @param roomName - 입장할 방 이름
 * @param userId - 사용자 ID
 * @param nickName - 닉네임
 */
export function handleRoomJoinFromLobby(
  roomName: string, 
  userId: string, 
  nickName: string, 
  isCreator: boolean = false,
  roomId?: string // roomId 매개변수 추가
) {
  // 로컬스토리지에 정보 저장 후 페이지 이동
  localStorage.setItem("A13C_CREATE_ROOM_INFO", JSON.stringify({
    roomName,
    userId,
    nickName,
    isCreator,
    roomId, // roomId도 함께 저장
    timestamp: Date.now()
  }));

  // 인게임 채팅 페이지로 이동
  window.location.href = "./ingame.html";
}