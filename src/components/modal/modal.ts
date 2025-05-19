// DOM 선택 부분
const modalDialog = document.querySelector(".modal-dialog") as HTMLDialogElement | null;
const showModalButton = document.querySelector(".show-modal-dialog") as HTMLButtonElement | null;
const closeModalButton = document.querySelector(".close-modal-dialog") as HTMLButtonElement | null;

// 함수 구현 부분
const openModal = () => {
  if (modalDialog) modalDialog.showModal();
};

const closeModal = () => {
  if (modalDialog) modalDialog.close();
};

// 이벤트 등록
if (showModalButton) {
  showModalButton.addEventListener("click", openModal);
}

if (closeModalButton) {
  closeModalButton.addEventListener("click", closeModal);
}

// 닉네임 입력 처리 (영어만, 10자 이내)
const nicknameInput = document.querySelectorAll<HTMLInputElement>(".filter-english");
nicknameInput.forEach((input) => {
  input.addEventListener("input", () => {
    let filtered = input.value.replace(/[^a-zA-Z0-9]/g, "");

    if (filtered.length > 10) {
      filtered = filtered.slice(0, 10);
    }

    input.value = filtered;
  });
});

// 방 제목 입력 처리 (아무 문자 가능, 10자 이내)
// const roomNameInput = document.getElementById("modal-form") as HTMLInputElement;

// roomNameInput.addEventListener("input", () => {
//   let filtered = roomNameInput.value;

//   // 10자 초과 시 자르기
//   if (filtered.length > 10) {
//     filtered = filtered.slice(0, 10);
//   }

//   roomNameInput.value = filtered;
// });
