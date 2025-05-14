const slideItems = document.querySelectorAll<HTMLLIElement>(".rule-list > li");
const prevBtn = document.getElementById("prevBtn") as HTMLButtonElement;
const nextBtn = document.getElementById("nextBtn") as HTMLButtonElement;

let currentIndex = 0;

function updateSlides(index: number) {
  slideItems.forEach((li, i) => {
    const isActive = i === index;
    li.classList.toggle("active", isActive);
    li.setAttribute("aria-hidden", String(!isActive));
    if (isActive) {
      // 슬라이드에 포커스 이동
      setTimeout(() => {
        li.focus();
      }, 0);
    }
  });

  if (index === 0) {
    // 버튼 텍스트 업데이트
    prevBtn.textContent = "닫기";
    nextBtn.textContent = "다음";
  } else if (index === slideItems.length - 1) {
    prevBtn.textContent = "이전";
    nextBtn.textContent = "시작";
  } else {
    prevBtn.textContent = "이전";
    nextBtn.textContent = "다음";
  }
}

// 이전 버튼
prevBtn.addEventListener("click", (e) => {
  e.preventDefault();
  if (currentIndex === 0) {
    location.href = "/";
  } else {
    currentIndex--;
    updateSlides(currentIndex);
  }
});

// 다음 버튼
nextBtn.addEventListener("click", (e) => {
  e.preventDefault();
  if (currentIndex === slideItems.length - 1) {
    location.href = "/src/pages/lobby.html";
  } else {
    currentIndex++;
    updateSlides(currentIndex);
  }
});

// 초기화
updateSlides(currentIndex);
