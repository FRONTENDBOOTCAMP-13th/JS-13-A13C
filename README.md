## FRONTENDBOOTCAMP-13th A13C

<div align="center">
<br>
   
![logo](https://github.com/user-attachments/assets/fe1ef64b-ce09-45cc-8605-912419891aae)

<br>

## ✨ 프로젝트를 소개합니다! ✨
<br>

### 🎓 프로젝트 명
A13C - 하나 빼기 게임
<br />
<br />

### 🎓 배포 링크
[![Netlify](https://img.shields.io/badge/Netlify-A13C-brightgreen?style=for-the-badge&logo=netlify&logoColor=white)](https://a13c.netlify.app/)
<br />
<br />


### 📝 프로젝트 소개
본 프로젝트는 넷플릭스 예능 <데블스플랜: 데스룸>의 ‘하나 빼기’ 룰을 기반으로 제작된 실시간 전략 카드 게임입니다. <br>
참가자들은 하나의 방에 모여 소통하며, 제한된 카드와 규칙 속에서 최후의 승자를 가리게 됩니다.

<br>

### 🃏 게임 규칙
- 각자 1에서 8까지의 숫자 카드 중 2장을 골라 제출합니다.
- 제출된 카드 2장은 동시에 공개되며, 그 중 1장을 직접 선택해 사용합니다.
- 중복을 제외하고 가장 낮은 숫자를 낸 플레이어가 카드 숫자만큼 점수를 얻습니다.
- 사용된 카드는 제거되고, 사용되지 않은 카드는 다음 라운드까지 임시 보관 후 재사용 가능합니다.
- 총 5라운드 동안 진행되며, 총점이 가장 높은 플레이어가 우승합니다.

<br>

### 🔧 주요 기능
<br>


| 작업 항목        | 기능 설명                                                                 | 우선순위 | 담당 | 
|------------------|---------------------------------------------------------------------------|----------|------|
| 방 관리           | 방 생성 혹은 기존 방 입장                                           | ⭐⭐⭐    | 우영찬 |  
| 방 목록 조회       | 현재 생성된 방들의 목록을 실시간으로 조회하여 사용자가 입장할 방을 선택 가능 | ⭐⭐⭐    | 구성연 |
| 실시간 채팅       | 같은 방의 사용자들과 텍스트 채팅                                     | ⭐⭐    | 우영찬 |      
| 게임 시작 동기화 | 방장이 게임 시작 시, 방 내 모든 플레이어의 게임이 동시에 시작됨            | ⭐⭐    |  박정우    | 
| 게임 진행        | 1~8번 카드 중 2장을 제출하고, 1장을 선택하여 사용                      | ⭐⭐⭐    |  구성연, 박정우    |   
| 게임 동기화      | 모든 플레이어의 선택 상태 및 결과가 실시간으로 반영                       | ⭐⭐⭐     | 구성연, 박정우     |  
| 점수 계산 로직       | 각 라운드 결과에 따라 승자 결정 및 포인트 부여, 무승부 시 1점 씩부여 등 점수 산정 규칙과 로직 처리 | ⭐⭐⭐    | 정예빈  |      
| 점수 시스템          | 누적 점수 및 라운드 우승자 집계, 점수 결과를 시각화                        | ⭐⭐⭐    | 정예빈 |      
| 카드 관리        | 사용된 카드는 제거, 미사용 카드는 한 라운드 임시 보관 후 재사용     | ⭐⭐⭐    |  구성연    | 
| 라운드 관리       | 현재 라운드 번호를 관리하며, 라운드 종료 시 자동으로 라운드 번호를 증가시켜 다음 라운드로 진행 | ⭐⭐⭐    | 우영찬 |  
| 라운드 결과  | 각 라운드 종료 시, 결과를 시각화한 테이블을 새로 생성하여 표시        | ⭐⭐     | 정예빈 |      
| 결과 처리        | 5라운드 종료 후 승점 → 라운드 승리 횟수 → 마지막 승리자 순으로 우승자 결정 | ⭐⭐⭐    |  우영찬    |
| 타이머 기능      | 카드 선택에 제한 시간 적용, 시간 초과 시 자동 선택 처리                     | ⭐    |  미완료   | 




<br />
<br />

### 📅 프로젝트 기간

2025.05.09 ~ 2025.05.23
<br />
<br />



### 🛠️ 기술 스택 / 협업 툴

| 분류          | 툴                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **언어**      | ![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white) ![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white) ![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white) ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black) ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white) |
| **개발 환경** | ![Visual Studio Code](https://img.shields.io/badge/Visual%20Studio%20Code-0078d7.svg?style=for-the-badge&logo=visual-studio-code&logoColor=white) ![Vite](https://img.shields.io/badge/Vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)                                                                                                                                                                                      |
| **협업**      | ![Git](https://img.shields.io/badge/git-%23F05032.svg?style=for-the-badge&logo=git&logoColor=white) ![GitHub](https://img.shields.io/badge/github-%23121011.svg?style=for-the-badge&logo=github&logoColor=white) ![Discord](https://img.shields.io/badge/discord-%235865F2.svg?style=for-the-badge&logo=discord&logoColor=white) ![Notion](https://img.shields.io/badge/Notion-%23000000.svg?style=for-the-badge&logo=notion&logoColor=white) |
| **디자인**      | ![Figma](https://img.shields.io/badge/Figma-F24E1E?style=for-the-badge&logo=figma&logoColor=white)                                                                                                                                                                                                                                                                                                                               |
| **배포**      | ![Netlify](https://img.shields.io/badge/netlify-%2300C7B7.svg?style=for-the-badge&logo=netlify&logoColor=white)                                                                                                                                                                                                                                                                                                                               |
<br />
<br />

## 🧑‍🤝‍🧑 팀을 소개합니다!

[![Notion](https://img.shields.io/badge/Notion-%23000000.svg?style=for-the-badge&logo=notion&logoColor=white)](https://www.notion.so/A13C-1ed73873401a80e6864dd461a67f92b9?pvs=4)


## 👥 팀원 소개  






| ![구성연](https://github.com/user-attachments/assets/0a7fffb8-8f77-4987-9ba4-de12b154ab66) | ![정우님](https://github.com/user-attachments/assets/39a201c3-cd6a-4c28-aba6-ac11cf704074) | ![영찬님](https://github.com/user-attachments/assets/4e205e59-c43a-4a11-ad4c-bef0451fd73b) | ![예빈님](https://github.com/user-attachments/assets/3c9688e5-f6c2-4d71-a69a-60d7b61d0924) |
|:--:|:--:|:--:|:--:|
| **구성연** <br /> **팀장** | **박정우** <br /> **PL**  | **우영찬** <br /> **스크럼 마스터** | **정예빈** <br /> **문서정리** |
| [![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/koo-rogie) | [![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/jungwoo0601) | [![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Yujin0528) | [![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/yebin-jeong) |
| [rn5184@naver.com](mailto:rn5184@naver.com) | [pjw1346799@naver.com](mailto:pjw1346799@naver.com) | [wooych4931@gmail.com](mailto:wooych4931@gmail.com) | [2022112390@dgu.ac.kr](mailto:2022112390@dgu.ac.kr) |
| ISFP | ENTJ | ISFJ | ISTJ |
| 갈등 없이 협력하며 멋진 결과 만들어가요! 다들 화이팅입니다! |  |  | 재밌는 게임을 만들어 봅시다! |



</div>
<br>
<br><br>

## 📂 프로젝트 구조 

<br>
<br><br>

## ▶ 실행 방법 

1. **환경 설정**:

   ```bash
   git clone https://github.com/FRONTENDBOOTCAMP-13th/JS-13-A13C.git
   cd 13th/JS-13-A13C
   ```

2. **의존성 설치**:
   ```bash
   npm install
   ```
3. **프로젝트 실행**: 실행 명령어로 프로젝트를 시작합니다.
   ```bash
   npm run dev
   ```

<br>
<br><br>

## 📷 구현 결과



<br><br>
<br><br>

📌 컨벤션 및 자세한 문서는 [GitHub Wiki에서 확인하기](https://github.com/FRONTENDBOOTCAMP-13th/JS-13-A13C/wiki)
