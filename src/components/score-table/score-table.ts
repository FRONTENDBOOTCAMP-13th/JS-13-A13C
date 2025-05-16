const showButton = document.getElementById("show-button") as HTMLButtonElement;
const scoreTables = document.getElementById("score-tables") as HTMLDivElement;

// 버튼에 마우스 진입 시, 테이블 보이기
showButton.addEventListener("mouseenter", () => {
  scoreTables.classList.remove("hidden");
});

// 버튼에서 마우스 나가면, 마우스가 테이블을 벗어났을 때 숨기기
showButton.addEventListener("mouseleave", () => {
  setTimeout(() => {
    if (!scoreTables.matches(":hover")) {
      scoreTables.classList.add("hidden");
    }
  }, 100);
});

// 테이블에 마우스 진입 시, 테이블 보이기
scoreTables.addEventListener("mouseenter", () => {
  scoreTables.classList.remove("hidden");
});

// 테이블에서 마우스 나가면, 숨기기
scoreTables.addEventListener("mouseleave", () => {
  scoreTables.classList.add("hidden");
});

// 1. 하드코딩된 방 ID 및 닉네임/유저아이디
import { socket } from "../../pages/ingame/A13C-chat.ts";
import { joinRoom } from "../../pages/ingame/A13C-chat.ts";

const hardcodedRoomId = "room_1747396315375_4vxn2y";
const userId = "observer001";
const nickName = "승점판관찰자";

// chat.ts의 joinRoom 함수 사용
async function joinHardcodedRoom() {
  try {
    const joinParams = {
      roomId: hardcodedRoomId,
      user_id: userId,
      nickName: nickName,
    };
    // chat.ts의 joinRoom 함수 호출
    const result = await joinRoom(joinParams);

    if (result.ok) {
      console.log(`방 "${hardcodedRoomId}"에 입장 성공`);
      // chat.ts의 소켓 "members" 리스너가 이미 닉네임 배열을 콘솔로 찍어줌
    } else {
      console.error("방 입장 실패:", result.message);
    }
  } catch (error) {
    console.error("방 입장 중 오류 발생:", error);
  }
}

// 실제 실행
joinHardcodedRoom();
