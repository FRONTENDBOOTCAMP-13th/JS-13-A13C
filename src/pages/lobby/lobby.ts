// A13C-chat 모듈 불러오기 - 파일 최상단에 배치
import { getRooms } from "../ingame/A13C-chat.ts";
import type { RoomInfo } from "../ingame/A13C-chat.ts";

// 방 만들기 모달 관련
const roomNameInput = document.getElementById("roomName") as HTMLInputElement;
const userIdInput = document.getElementById("userId") as HTMLInputElement;
const nickNameInput = document.getElementById("nickName") as HTMLInputElement;
const joinRoomBtn = document.getElementById("joinRoomBtn") as HTMLButtonElement;

// 참여하기 버튼
const showRoomBtn = document.querySelector(".show-room-btn") as HTMLDivElement;

// 방 리스트를 보여주는 팝업창
const showRoomList = document.querySelector(".show-room-list") as HTMLDivElement;

// 참여하기버튼, 방 만들기 버튼
const buttonGroups = document.querySelector(".button-groups") as HTMLDivElement;

// 닫기 버튼
const closeBtn = document.querySelector(".close-btn") as HTMLDivElement;

// 방 목록을 보여주는 <tbody> 요소
const roomListContainer = document.getElementById("roomList")!;

// 방 참여하기 버튼
const joinForm = document.getElementById("join-form")!;

// 선택한 방이 어떤 방인지 확인하는 <p>요소
const selectedRoomNameElem = document.getElementById("selectedRoomName")!;

// 유저 id 입력란
const joinUserId = document.getElementById("joinUserId") as HTMLInputElement;

// 유저 닉네임 입력란
const joinNickName = document.getElementById("joinNickName") as HTMLInputElement;

// 방 참여하기 버튼
const finalJoinBtn = document.getElementById("finalJoinBtn")!;

// 실시간 업데이트를 위한 타이머
let updateInterval: number | null = null;

// 삭제된 방 ID를 저장하는 블랙리스트
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

// 방 목록에서 마우스 오버 시 시각적 피드백 추가
const styles = document.createElement("style");
styles.innerHTML = `
  #roomList tr {
    cursor: pointer;
    transition: background-color 0.2s;
  }
  #roomList tr:hover {
    background-color: #f0f0f0;
  }
  .selected-room {
    background-color: #e0e0ff !important;
    font-weight: bold;
  }
`;
document.head.appendChild(styles);

/**
 * 방 목록 렌더링 함수 - 캐시 방지 매개변수 추가
 */
async function renderRoomList(forceRefresh = false) {
  try {
    roomListContainer.innerHTML = `
      <tr>
        <td colspan="4" class="text-center py-2">방 목록을 불러오는 중...</td>
      </tr>
    `;

    // 캐시 방지를 위한 타임스탬프 추가
    const timestamp = forceRefresh ? `?_t=${Date.now()}` : "";
    const rooms = await getRooms(timestamp);

    if (!rooms || Object.keys(rooms).length === 0) {
      roomListContainer.innerHTML = `
        <tr>
          <td colspan="4" class="text-center py-2">생성된 채팅방이 없습니다.</td>
        </tr>
      `;
      return;
    }

    // 블랙리스트에 등록된 방은 제외
    const filteredRooms = Object.entries(rooms)
      .filter(([roomId]) => !deletedRoomIds.includes(roomId))
      .reduce(
        (acc, [roomId, room]) => {
          acc[roomId] = room;
          return acc;
        },
        {} as { [key: string]: RoomInfo }
      );

    if (!filteredRooms || Object.keys(filteredRooms).length === 0) {
      roomListContainer.innerHTML = `
        <tr>
          <td colspan="4" class="text-center py-2">생성된 채팅방이 없습니다.</td>
        </tr>
      `;
      return;
    }

    // 기존 목록 비우기
    roomListContainer.innerHTML = "";

    // 각 방에 대한 행 추가
    Object.values(filteredRooms).forEach((room, index) => {
      const row = document.createElement("tr");
      row.className = "hover:bg-gray-300";
      row.setAttribute("data-room-id", room.roomId);
      row.setAttribute("data-room-name", room.roomName);

      // 참여자 수 계산
      const memberCount = room.memberList ? Object.keys(room.memberList).length : 0;
      const displayCount = Math.min(memberCount, 5);
      const isFull = memberCount >= 5;

      // 행 내용 설정
      row.innerHTML = `
        <td class="px-4 py-2">${index + 1}</td>
        <td class="px-4 py-2">${room.roomName}</td>
        <td class="px-4 py-2">${displayCount}/5</td>
        <td class="px-4 py-2">${room.parents_option?.isPlaying ? "진행 중" : isFull ? "입장 마감" : "대기 중"}</td>
      `;

      roomListContainer.appendChild(row);
    });
  } catch (error) {
    console.error("방 목록을 가져오는 중 오류 발생:", error);
    let errorMessage = "방 목록을 불러오는데 실패했습니다.";
    if (error instanceof Error) {
      errorMessage += ` (${error.message})`;
    }

    roomListContainer.innerHTML = `
      <tr>
        <td colspan="4" class="text-center py-2">${errorMessage}</td>
      </tr>
    `;
  }
}

/**
 * 타이머 시작 함수 - 5초마다 방 목록 업데이트
 */
function startRoomListTimer() {
  if (updateInterval) {
    clearInterval(updateInterval);
  }

  // 초기 로드 시 강제 새로고침
  renderRoomList(true);

  updateInterval = setInterval(() => {
    // 팝업이 표시 중일 때만 업데이트
    if (!showRoomList.classList.contains("hidden")) {
      renderRoomList(true);
    }
  }, 5000) as unknown as number; // 5초마다 업데이트
}

// 방 클릭 시 시각적으로 선택된 방 표시
roomListContainer.addEventListener("click", (e) => {
  const target = (e.target as HTMLElement).closest("tr");
  if (!target) return;

  // 이전에 선택된 방의 하이라이트 제거
  document.querySelectorAll("#roomList tr.selected-room").forEach((el) => el.classList.remove("selected-room"));

  // 현재 선택한 방 하이라이트
  target.classList.add("selected-room");

  const roomName = target.querySelector("td:nth-child(2)")?.textContent?.trim();
  const roomId = target.getAttribute("data-room-id");

  if (!roomName || !roomId) return;

  selectedRoomNameElem.textContent = roomName;
  joinForm.classList.remove("hidden");

  const enterRoomId = document.getElementById("enterRoomId") as HTMLInputElement;

  if (enterRoomId) {
    enterRoomId.value = roomName;
    // 방 ID도 저장해둠
    enterRoomId.setAttribute("data-room-id", roomId);
  }

  // 이전에 입력했던 사용자 정보 불러오기 (선택적)
  const savedUserInfo = localStorage.getItem("A13C_USER_INFO");
  if (savedUserInfo) {
    try {
      const userInfo = JSON.parse(savedUserInfo);
      joinUserId.value = userInfo.userId || "";
      joinNickName.value = userInfo.nickName || "";
    } catch (e) {
      console.error("저장된 사용자 정보를 불러오는데 실패했습니다.", e);
    }
  }

  joinUserId.focus();
});

// finalJoinBtn 이벤트 리스너 내부 변경
finalJoinBtn.addEventListener("click", () => {
  const userId = joinUserId.value.trim();
  const nickName = joinNickName.value.trim();
  const enterRoomId = document.getElementById("enterRoomId") as HTMLInputElement;
  const roomName = enterRoomId?.value || "";
  const roomId = enterRoomId?.getAttribute("data-room-id") || "";

  if (!userId || !nickName || !roomName) {
    alert("모든 입력을 완료하세요.");
    return;
  }

  // 사용자 정보 별도 저장 (다음 입력 시 사용)
  localStorage.setItem("A13C_USER_INFO", JSON.stringify({ userId, nickName }));

  // 참여 정보 저장 (방 생성자가 아님)
  const roomInfo = {
    roomName,
    roomId, // 방 ID 명시적으로 저장
    userId,
    nickName,
    isCreator: false,
    timestamp: Date.now(),
  };

  localStorage.setItem("A13C_CREATE_ROOM_INFO", JSON.stringify(roomInfo));

  // ingame.html로 이동
  window.location.href = "/src/pages/ingame.html";
});

/**
 * 참여하기 버튼 클릭시 기존에 있던 방만들기, 참여하기 버튼이 사라집니다.
 * 그리고 방 리스트를 보여주는 팝업창이 나타납니다.
 */
function showRoomListPopup() {
  showRoomList.classList.toggle("hidden");
  buttonGroups.classList.toggle("hidden");

  // 팝업이 표시될 때만 방 목록 로드 및 타이머 시작
  if (!showRoomList.classList.contains("hidden")) {
    renderRoomList(true);
    startRoomListTimer();
  } else {
    // 팝업이 닫힐 때 타이머 정리
    if (updateInterval) {
      clearInterval(updateInterval);
      updateInterval = null;
    }
  }
}

// 팝업 열고 닫기 이벤트 리스너
showRoomBtn.addEventListener("click", showRoomListPopup);
closeBtn.addEventListener("click", showRoomListPopup);

// 방 만들기 버튼 클릭 시 처리
joinRoomBtn.addEventListener("click", () => {
  const roomName = roomNameInput.value.trim();
  const userId = userIdInput.value.trim();
  const nickName = nickNameInput.value.trim();

  if (!roomName || !userId || !nickName) {
    alert("방 이름, 사용자 ID, 닉네임을 모두 입력해주세요.");
    return;
  }

  // 사용자 정보 별도 저장 (다음 입력 시 사용)
  localStorage.setItem("A13C_USER_INFO", JSON.stringify({ userId, nickName }));

  // 입력 정보를 localStorage에 저장 (ingame.html에서 사용)
  const roomInfo = {
    roomName,
    userId,
    nickName,
    isCreator: true, // 방 생성자임을 표시
    timestamp: Date.now(), // 데이터 신선도 확인용 타임스탬프
  };

  localStorage.setItem("A13C_CREATE_ROOM_INFO", JSON.stringify(roomInfo));

  // ingame.html로 이동
  window.location.href = "/src/pages/ingame.html";
});

// 페이지 로드 시 초기화
document.addEventListener("DOMContentLoaded", () => {
  // 퇴장 플래그 초기화
  localStorage.removeItem("A13C_LEAVING_ROOM");
  localStorage.removeItem("A13C_CREATE_ROOM_INFO");

  // 삭제된 방 목록 로드
  loadDeletedRooms();

  // 방 목록 팝업이 표시 중이면 바로 로드
  if (!showRoomList.classList.contains("hidden")) {
    renderRoomList(true);
    startRoomListTimer();
  }

  // 이전에 입력했던 사용자 정보 불러오기
  const savedUserInfo = localStorage.getItem("A13C_USER_INFO");
  if (savedUserInfo) {
    try {
      const userInfo = JSON.parse(savedUserInfo);

      // 방 생성 폼에 적용
      userIdInput.value = userInfo.userId || "";
      nickNameInput.value = userInfo.nickName || "";
    } catch (e) {
      console.error("저장된 사용자 정보를 불러오는데 실패했습니다.", e);
    }
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
 * Esc 키를 눌렀을 때 방 만들기 팝업을 닫는 이벤트 리스너
 */

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !showRoomList.classList.contains("hidden")) {
    showRoomList.classList.add("hidden");
    buttonGroups.classList.remove("hidden");
    if (updateInterval) clearInterval(updateInterval);
  }
});
