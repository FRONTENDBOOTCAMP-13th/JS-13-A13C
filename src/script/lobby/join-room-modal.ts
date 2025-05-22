import { getRooms } from "../A13C-chat";

// 방 리스트를 보여주는 팝업창
const showRoomList = document.querySelector(".show-room-list") as HTMLDivElement;

// 방 목록을 보여주는 <tbody> 요소
const roomListContainer = document.getElementById("roomList")!;


// 참여하기버튼, 방 만들기 버튼
const buttonGroups = document.querySelector(".button-groups") as HTMLDivElement;

// 닫기 버튼
const closeBtn = document.querySelector(".close-btn") as HTMLDivElement;


// 방 참여하기 버튼
const joinForm = document.getElementById("join-form")!;

// 선택한 방이 어떤 방인지 확인하는 <p>요소
const selectedRoomNameElem = document.getElementById("selectedRoomName")!;

// 유저 닉네임 입력란
const joinNickName = document.getElementById("joinNickName") as HTMLInputElement;

// 참여하기 > 입장하기 버튼
const finalJoinBtn = document.getElementById("finalJoinBtn")!;



// 실시간 업데이트를 위한 타이머
let updateInterval: number | null = null;

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
 * 방 목록 렌더링 함수
 */
async function renderRoomList() {
  try {

    const rooms = await getRooms();

    if (!rooms || Object.keys(rooms).length === 0) {
      roomListContainer.innerHTML = `
        <tr>
          <td colspan="4" class="text-center py-2">생성된 채팅방이 없습니다.</td>
        </tr>
      `;
      return;
    }

    // 블랙리스트에 등록된 방은 제외
    const filteredRooms = rooms;

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
  renderRoomList();

  updateInterval = setInterval(() => {
    // 팝업이 표시 중일 때만 업데이트
    if (!showRoomList.classList.contains("hidden")) {
      renderRoomList();
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
  const nickName = localStorage.getItem("A13C_USER_INFO");
  joinNickName.value = nickName || "";
  joinNickName.focus();
});


// 참여하기 > 입장하기 버튼 클릭
finalJoinBtn.addEventListener("click", () => {
  const nickName = joinNickName.value.trim();
  const enterRoomId = document.getElementById("enterRoomId") as HTMLInputElement;
  const roomId = enterRoomId?.getAttribute("data-room-id") || "";

  if (!nickName) {
    alert("닉네임을 입력하세요.");
    return;
  }

  // 사용자 정보 별도 저장 (다음 입력 시 사용)
  localStorage.setItem("A13C_USER_INFO", nickName);

  // ingame.html로 이동
  window.location.href = `/src/pages/ingame.html?roomId=${roomId}&nickName=${nickName}`;
});

/**
 * 참여하기 버튼 클릭시 기존에 있던 방만들기, 참여하기 버튼이 사라집니다.
 * 그리고 방 리스트를 보여주는 팝업창이 나타납니다.
 */
export function showRoomListPopup() {
  showRoomList.classList.toggle("hidden");
  // buttonGroups.classList.toggle("hidden");

  // 팝업이 표시될 때만 방 목록 로드 및 타이머 시작
  if (!showRoomList.classList.contains("hidden")) {
    renderRoomList();
    startRoomListTimer();
  } else {
    // 팝업이 닫힐 때 타이머 정리
    if (updateInterval) {
      clearInterval(updateInterval);
      updateInterval = null;
    }
  }
}


// 참여하기 닫기
closeBtn.addEventListener("click", showRoomListPopup);

// 방 목록 팝업이 표시 중이면 바로 로드
if (!showRoomList.classList.contains("hidden")) {
  renderRoomList();
  startRoomListTimer();
}


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