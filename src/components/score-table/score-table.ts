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

const hardcodedRoomId = "room_1747457674860_quudcp";
const userId = "observer001";
const nickName = "승점판";

socket.on(
  "members",
  (members: { [key: string]: { user_id: string; nickName: string } }) => {
    const nicknames = Object.values(members)
      .map((member) => member.nickName)
      .filter((nick) => nick !== "승점판");

    // 누적 승점 테이블 헤더 업데이트
    const totalScoreHeader = document.getElementById("total-score-header");
    const totalScoreTable = document.getElementById("total-score-row");

    if (totalScoreHeader && totalScoreTable) {
      // 1행: 닉네임들만 삽입
      totalScoreHeader.innerHTML = "";
      nicknames.forEach((nick) => {
        const td = document.createElement("td");
        td.className = "px-6 py-3 text-center";
        td.textContent = nick;
        totalScoreHeader.appendChild(td);
      });

      // 2행: 점수만 삽입 (매번 초기화)
      totalScoreTable.innerHTML = "";
      nicknames.forEach(() => {
        const scoreTd = document.createElement("td");
        scoreTd.className = "px-6 py-3 text-center";
        scoreTd.textContent = `${Math.floor(Math.random() * 30)}점`; // 임의 점수
        totalScoreTable.appendChild(scoreTd);
      });
    }

    // 라운드 우승자 테이블 바디 업데이트
    const roundWinnerBody = document.getElementById("round-winner-body");
    if (roundWinnerBody) {
      roundWinnerBody.innerHTML = "";
      nicknames.forEach((nick, index) => {
        const tr = document.createElement("tr");

        const roundTd = document.createElement("td");
        roundTd.className = "px-6 py-3 text-center";
        roundTd.textContent = `${index + 1}라운드`;

        const nickTd = document.createElement("td");
        nickTd.className = "px-6 py-3 text-center";
        nickTd.textContent = nick;

        const scoreTd = document.createElement("td");
        scoreTd.className = "px-6 py-3 text-center";
        scoreTd.textContent = `${Math.floor(Math.random() * 10)}점`;

        tr.appendChild(roundTd);
        tr.appendChild(nickTd);
        tr.appendChild(scoreTd);

        roundWinnerBody.appendChild(tr);
      });
    }
  }
);

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
