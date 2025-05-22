/**
 * 채팅 애플리케이션의 메인 모듈
 * 소켓 통신과 채팅방 관리 기능을 구현
 */
import {
  socket,
  sendMsg,
  createRoom,
  joinRoom,
  leaveRoom,
  getRooms,
} from "../../script/A13C-chat.ts";
import type {
  // ChatMessage,
  CreateRoomParams,
  JoinRoomParams,
  RoomInfo,
} from "../../script/A13C-chat.ts";

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

// 사용자 정보 저장 함수
function saveCurrentUser(userIdValue: string, nickNameValue: string) {
  localStorage.setItem(
    CURRENT_USER_KEY,
    JSON.stringify({
      userId: userIdValue,
      nickName: nickNameValue,
    })
  );
}

// 시스템 메시지 전송 함수
function sendSystemMessage(message: string) {
  socket.emit("message", {
    nickName: "시스템",
    msg: message.toString(),
  });
}

// 사용자 정보 로드 함수
function loadCurrentUser() {
  const savedUser = localStorage.getItem(CURRENT_USER_KEY);
  if (savedUser) {
    try {
      return JSON.parse(savedUser);
    } catch (error) {
      return null;
    }
  }
  return null;
}

/**
 * 방 이름으로 방 찾기 함수
 */
async function findRoomByName(searchName: string): Promise<RoomInfo | null> {
  try {
    const rooms = await getRooms();
    
    // 이름이 같은 방들 중에서 삭제되지 않은 가장 최신 방 찾기
    const matchingRooms = Object.values(rooms)
      .filter(
        (room) =>
          room.roomName.toLowerCase() === searchName.toLowerCase() &&
          !deletedRoomIds.includes(room.roomId)
      );

    return matchingRooms.length > 0 ? matchingRooms[0] : null;
  } catch (error) {
    return null;
  }
}

// 현재 접속 중인 방 정보 저장
const CURRENT_ROOM_KEY = "A13C_CURRENT_ROOM";
interface CurrentRoomInfo {
  roomId: string;
  roomName: string;
  memberCount: number;
}

// 현재 방 정보 저장
export function saveCurrentRoom(roomId: string, roomName: string, memberCount: number) {
  const currentRoom: CurrentRoomInfo = {
    roomId,
    roomName,
    memberCount,
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
      return null;
    }
  }
  return null;
}

/** 방 목록 렌더링 */
function renderRoomList(rooms: { [key: string]: RoomInfo }) {
  // roomList 요소가 존재하는지 확인
  const roomList = document.getElementById("roomList");
  if (!roomList) return;

  roomList.innerHTML = "";

  // 중복 방지를 위한 Map (roomName을 키로 사용)
  const uniqueRooms = new Map<string, RoomInfo>();

  // 삭제된 방 필터링하고 중복 방지
  Object.entries(rooms).forEach(([roomId, room]) => {
    if (!uniqueRooms.has(room.roomName.toLowerCase()) && !deletedRoomIds.includes(room.roomId)) {
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

    // 참여자 수 계산
    const serverMemberCount = room.memberList
      ? Object.keys(room.memberList).length
      : 0;
    
    const displayCount = Math.min(serverMemberCount, 5);
    const isFull = serverMemberCount >= 5;

    row.innerHTML = `
      <td class="px-4 py-2">${index + 1}</td>
      <td class="text-left px-4 py-2">${room.roomName}</td>
      <td class="px-4 py-2 participant-count">${displayCount}/5</td>
      <td class="px-4 py-2">${room.parents_option?.isPlaying ? "진행 중" : isFull ? "입장 마감" : "대기 중"}</td>
    `;

    // 현재 접속한 방 강조 표시
    if (currentRoom && room.roomId === currentRoom.roomId) {
      row.classList.add("bg-blue-100");
      enterRoomId.value = room.roomName;
      connectedRoomElem.textContent = `${room.roomName} (${displayCount}/5)`;
      saveCurrentRoom(room.roomId, room.roomName, displayCount);
    }

    row.addEventListener("click", () => {
      enterRoomId.value = room.roomName;
      enterRoomId.setAttribute("data-room-id", room.roomId);
    });
    roomList.appendChild(row);
  });
}

// 방 목록 로드
async function loadRoomList() {
  try {
    const roomList = document.getElementById("roomList");
    if (!roomList) return;
    
    const leavingTimestamp = localStorage.getItem("A13C_LEAVING_ROOM");
    if (leavingTimestamp) return;
    
    const rooms = await getRooms();
    renderRoomList(rooms);
    
    // 현재 방 검증
    const currentRoom = loadCurrentRoom();
    if (currentRoom && (!rooms[currentRoom.roomId] || deletedRoomIds.includes(currentRoom.roomId))) {
      clearCurrentRoom();
      connectedRoomElem.textContent = "";
    }
  } catch (error) {
    console.error("방 목록을 가져오는 중 오류 발생:", error);
  }
}

// 채팅방 입장
joinRoomBtn.addEventListener("click", async () => {
  try {
    const userIdValue = userId.value.trim() || `user_${Date.now()}`;
    const nickNameValue = nickName.value.trim() || `손님${Math.floor(Math.random() * 1000)}`;
    let roomNameValue = roomName.value.trim();
    let roomIdValue = "";
    
    if (!roomNameValue) {
      roomNameValue = enterRoomId.value.trim();
      roomIdValue = enterRoomId.getAttribute("data-room-id") || "";
    }
    
    if (!roomNameValue) {
      alert("방 이름을 입력해주세요.");
      return;
    }
    
    // 사용자 정보 저장
    saveCurrentUser(userIdValue, nickNameValue);
    
    // 기존 방에 입장하는 경우
    if (roomIdValue) {
      const joinParams: JoinRoomParams = {
        roomId: roomIdValue,
        user_id: userIdValue,
        nickName: nickNameValue,
      };
      
      const result = await joinRoom(joinParams);
      if (result.ok) {
        // setTimeout(() => {
        //   alert(`${roomNameValue} 방에 입장했습니다.`);
        // }, 100);
        connectedRoomElem.textContent = `${roomNameValue} (접속 중...)`;
        saveCurrentRoom(roomIdValue, roomNameValue, 1);
        
        // setTimeout(() => {
        //   sendSystemMessage(`${nickNameValue}님이 입장했습니다.`);
        // }, 800);
      } else {
        alert(result.message || "방 입장에 실패했습니다.");
      }
    }
    // 새 방을 만드는 경우
    else {
      const createParams: CreateRoomParams = {
        roomName: roomNameValue,
        user_id: userIdValue,
        hostName: nickNameValue
      };
      
      const result = await createRoom(createParams);
      if (result.ok) {
        alert(`${roomNameValue} 방을 생성하고 입장했습니다.`);
        connectedRoomElem.textContent = `${roomNameValue} (1/5)`;
        saveCurrentRoom(result.roomInfo.roomId!, roomNameValue, 1);
        
        setTimeout(() => {
          sendSystemMessage(`${nickNameValue}님이 입장했습니다.`);
        }, 500);
      } else {
        alert(result.message || "방 생성에 실패했습니다.");
      }
    }
  } catch (error) {
    alert("방 입장 중 오류가 발생했습니다.");
  }
});

// 채팅방 퇴장 처리
let isLeavingRoom = false;
leaveRoomBtn.addEventListener("click", async () => {
  try {
    // 퇴장 중복 요청 방지
    const leavingTimestamp = localStorage.getItem("A13C_LEAVING_ROOM");
    if (leavingTimestamp && Date.now() - parseInt(leavingTimestamp) < 3000) {
      alert("이미 퇴장 처리 중입니다. 잠시만 기다려주세요.");
      return;
    }
    
    // 퇴장 시작 표시
    localStorage.setItem("A13C_LEAVING_ROOM", Date.now().toString());
    localStorage.removeItem("A13C_CREATE_ROOM_INFO");
    
    // 현재 방 정보 확인
    let currentRoom = loadCurrentRoom();
    
    // 방 정보가 없는 경우
    if (!currentRoom) {
      const connectedRoomText = connectedRoomElem.textContent || "";
      const match = connectedRoomText.match(/^(.*?)\s*\(/);
      const roomNameFromText = match ? match[1].trim() : "";
      
      const roomNameFromInput = enterRoomId.value.trim();
      const roomIdFromAttr = enterRoomId.getAttribute("data-room-id");
      
      const roomNameToLeave = roomNameFromText || roomNameFromInput;
      
      if (!roomNameToLeave && !roomIdFromAttr) {
        alert("퇴장할 방 정보가 없습니다. 로비로 이동합니다.");
        localStorage.removeItem("A13C_LEAVING_ROOM");
        localStorage.removeItem(CURRENT_USER_KEY);
        window.location.href = "/src/pages/lobby.html";
        return;
      }
      
      // 방 찾기
      let foundRoom;
      if (roomIdFromAttr) {
        const rooms = await getRooms();
        foundRoom = rooms[roomIdFromAttr];
      }
      
      if (!foundRoom && roomNameToLeave) {
        foundRoom = await findRoomByName(roomNameToLeave);
      }
      
      if (!foundRoom) {
        alert(`채팅방에서 퇴장하여 로비로 이동합니다.`);
        localStorage.removeItem("A13C_LEAVING_ROOM");
        localStorage.removeItem(CURRENT_USER_KEY);
        await leaveRoom();
        window.location.href = "/src/pages/lobby.html";
        return;
      }
      
      // 찾은 방 정보로 현재 방 설정
      currentRoom = {
        roomId: foundRoom.roomId,
        roomName: foundRoom.roomName,
        memberCount: foundRoom.memberList ? Object.keys(foundRoom.memberList).length : 1,
      };
    }
    
    // 현재 방 정보로 퇴장 처리
    const currentRoomId = currentRoom.roomId;
    const rooms = await getRooms();
    const room = rooms[currentRoomId];
    
    if (!room) {
      clearCurrentRoom();
      localStorage.removeItem(CURRENT_USER_KEY);
      connectedRoomElem.textContent = "";
      localStorage.removeItem("A13C_LEAVING_ROOM");
      alert("채팅방이 이미 존재하지 않습니다.");
      window.location.href = "/src/pages/lobby.html";
      return;
    }
    
    // 참여자 수 확인
    const memberList = room.memberList || {};
    const serverCount = Object.keys(memberList).length;
    
    // 퇴장 메시지 전송
    if (!isLeavingRoom) {
      isLeavingRoom = true;
      const currentUser = loadCurrentUser();
      if(currentUser && currentUser.nickName) {
        sendSystemMessage(`${currentUser.nickName}님이 퇴장했습니다.`);
      }
      
      // 참가자가 1명 이하면 방 삭제
      if (serverCount <= 1) {
        setTimeout(async() => {
          await leaveRoom();
          
          // 서버에 방 삭제 요청 전송
          socket.emit("deleteRoom", { roomId: currentRoomId }, (response: any) => {
            console.log("방 삭제 응답:", response);
          });
          
          // 로컬 상태 업데이트
          addToDeletedRooms(currentRoomId);
          
          alert("마지막 사용자가 퇴장하여 채팅방이 삭제되었습니다.");
          
          // 상태 초기화 및 로비로 이동
          clearCurrentRoom();
          localStorage.removeItem(CURRENT_USER_KEY);
          connectedRoomElem.textContent = "";
          enterRoomId.value = "";
          enterRoomId.removeAttribute("data-room-id");
          
          setTimeout(() => {
            localStorage.removeItem("A13C_LEAVING_ROOM");
            window.location.href = "/src/pages/lobby.html";
          }, 500);
        });
      } 
      // 참가자가 2명 이상이면 일반 퇴장
      else {
        setTimeout(async() => {
          await leaveRoom();
          
          // 상태 초기화 및 로비로 이동
          clearCurrentRoom();
          localStorage.removeItem(CURRENT_USER_KEY);
          connectedRoomElem.textContent = "";
          enterRoomId.value = "";
          enterRoomId.removeAttribute("data-room-id");
          
          alert("채팅방에서 퇴장했습니다.");
          
          setTimeout(() => {
            localStorage.removeItem("A13C_LEAVING_ROOM");
            localStorage.removeItem("A13C_CREATE_ROOM_INFO");
            window.location.href = "/src/pages/lobby.html";
          }, 500);
        });
      }
    }
  } catch (error) {
    console.error("[오류] 채팅방 퇴장 중 오류 발생:", error);
    alert("퇴장 중 오류가 발생했습니다. 다시 시도해 주세요.");
    localStorage.removeItem("A13C_LEAVING_ROOM");
    localStorage.removeItem(CURRENT_USER_KEY);
    window.location.href = "/src/pages/lobby.html";
  } finally {
    isLeavingRoom = false;
  }
});

// 메시지 전송
sendBtn.addEventListener("click", () => {
  const message = msgInput.value.trim();
  if (message) {
    sendMsg<string>(message);
    msgInput.value = "";
  }
});

// Enter 키로 메시지 전송
msgInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const message = msgInput.value.trim();
    if (message) {
      sendMsg(message);
      msgInput.value = "";
    }
  }
});

// 메시지 수신 처리
const messageCache = new Set<string>();
socket.on("message", (data: any) => {
  if (!chatScreen) return;

  // 게임 액션 메시지만 필터링하고 시스템 메시지는 표시
  if(data && typeof data.msg === 'object' && (data.msg.action === 'twocard' || data.msg.action === 'onecard')){
    return;
  }
  
  // 중복 메시지 필터링
  const msgId = typeof data === 'object' ? 
    `${data.nickName}:${JSON.stringify(data.msg)}:${Date.now().toString().slice(0, -3)}` : 
    `${data}:${Date.now().toString().slice(0, -3)}`;
    
  if (messageCache.has(msgId)) return;
  
  // 메시지 캐시에 추가
  messageCache.add(msgId);
  setTimeout(() => messageCache.delete(msgId), 5000);
  
  const messageElement = document.createElement("div");
  
  // 메시지 종류에 따른 처리
  if (data && data.action === "joinRoom" && data.msg) {
    // 입장 메시지
    messageElement.textContent = data.msg;
    messageElement.style.color = "#888";
    messageElement.style.fontStyle = "italic";
  } 
  else if (data && data.nickName === "시스템") {
    // 시스템 메시지
    const msgText = typeof data.msg === 'object' ? 
      (data.msg.msg || JSON.stringify(data.msg)) : 
      String(data.msg);
      
    messageElement.textContent = msgText;
    messageElement.style.color = "#888";
    messageElement.style.fontStyle = "italic";
  } 
  else if (data && data.nickName) {
    // 일반 채팅 메시지
    const msgText = typeof data.msg === 'object' ? 
      JSON.stringify(data.msg) : 
      String(data.msg);
      
    messageElement.textContent = `${data.nickName}: ${msgText}`;
  }
  else {
    // 기타 메시지
    messageElement.textContent = typeof data === 'object' ? 
      JSON.stringify(data) : String(data);
    messageElement.style.color = "#888";
  }
  
  // 메시지 스타일 지정 및 추가
  messageElement.style.wordBreak = "break-word";
  messageElement.style.overflowWrap = "break-word";
  messageElement.style.maxWidth = "100%";
  messageElement.style.padding = "4px 8px";
  
  chatScreen.appendChild(messageElement);
  chatScreen.scrollTop = chatScreen.scrollHeight;
});

// 초기화
document.addEventListener("DOMContentLoaded", () => {
  localStorage.removeItem("A13C_LEAVING_ROOM");
  
  if (chatScreen) {
    chatScreen.setAttribute(
      "style",
      "overflow-x: hidden; word-wrap: break-word;"
    );
  }
  
  // 기본 데이터 로드
  loadDeletedRooms();
  
  // 방 목록 처리
  const roomList = document.getElementById("roomList");
  if (roomList) {
    loadRoomList();
    if (refreshBtn) {
      refreshBtn.addEventListener("click", loadRoomList);
    }
  }
  
  // 멤버 목록 변경 이벤트
  socket.on("members", () => {
    // 방 목록 갱신으로 간소화
    loadRoomList();
  });
  
  // 방 목록 변경 이벤트
  socket.on("rooms", (roomsData: { [key: string]: RoomInfo }) => {
    if (localStorage.getItem("A13C_LEAVING_ROOM")) return;
    
    renderRoomList(roomsData);
    
    const currentRoom = loadCurrentRoom();
    if (currentRoom && roomsData && !roomsData[currentRoom.roomId]) {
      clearCurrentRoom();
      localStorage.removeItem(CURRENT_USER_KEY);
      connectedRoomElem.textContent = "";
      
      if (!deletedRoomIds.includes(currentRoom.roomId)) {
        addToDeletedRooms(currentRoom.roomId);
        alert("참여 인원이 없어 채팅방이 자동으로 삭제되었습니다.");
      }
    }
  });
  
  // 새로고침 후 자동 재접속 처리
  const currentUser = loadCurrentUser();
  const currentRoom = loadCurrentRoom();
  
  if (currentUser && currentRoom) {
    userId.value = currentUser.userId;
    nickName.value = currentUser.nickName;
    enterRoomId.value = currentRoom.roomName;
    enterRoomId.setAttribute("data-room-id", currentRoom.roomId);
    connectedRoomElem.textContent = `${currentRoom.roomName} (재접속 중...)`;
    
    const joinParams: JoinRoomParams = {
      roomId: currentRoom.roomId,
      user_id: currentUser.userId,
      nickName: currentUser.nickName,
    };
    
    setTimeout(async () => {
      try {
        const result = await joinRoom(joinParams);
        if (result && result.ok) {
          connectedRoomElem.textContent = `${currentRoom.roomName} (접속 중)`;
          
          setTimeout(() => {
            sendSystemMessage(`${currentUser.nickName}님이 재입장했습니다.`);
          }, 500);
          
          // 재접속 메시지 표시
          const messageElement = document.createElement("div");
          messageElement.textContent = "페이지 새로고침 후 채팅방에 재입장했습니다.";
          messageElement.style.color = "#888";
          messageElement.style.fontStyle = "italic";
          messageElement.style.padding = "4px 8px";
          chatScreen.appendChild(messageElement);
          chatScreen.scrollTop = chatScreen.scrollHeight;
          
          msgInput.focus();
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
        userId.value = roomInfo.userId || "";
        nickName.value = roomInfo.nickName || "";
        
        if (roomInfo.isCreator) {
          // 방 생성자인 경우
          roomName.value = roomInfo.roomName || "";
        } else {
          // 참여자인 경우
          enterRoomId.value = roomInfo.roomName || "";
          
          // 방 ID가 있으면 데이터 속성으로 저장
          if (roomInfo.roomId) {
            enterRoomId.setAttribute("data-room-id", roomInfo.roomId);
          }
        }
        
        // 자동 입장
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
    document.title = `채팅 (${currentRoom.roomName})`;
  }
});

// 방 입장 처리를 위한 헬퍼 함수 (외부에서 호출용)
export function handleRoomJoinFromLobby(
  roomName: string,
  userId: string,
  nickName: string,
  isCreator: boolean = false,
  roomId?: string
) {
  localStorage.setItem(
    "A13C_CREATE_ROOM_INFO",
    JSON.stringify({
      roomName,
      userId,
      nickName,
      isCreator,
      roomId,
      timestamp: Date.now(),
    })
  );
  window.location.href = "./ingame.html";
}

export default {};