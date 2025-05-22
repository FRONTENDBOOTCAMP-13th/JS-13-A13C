import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
// import path from "path";
// import fs from "fs";

// function findAllHtmlFiles(directory) {
//   const htmlFiles = {};

//   function scanDirectory(dir) {
//     const files = fs.readdirSync(dir);

//     for (const file of files) {
//       const filePath = path.join(dir, file);
//       const stat = fs.statSync(filePath);

//       if (stat.isDirectory()) {
//         scanDirectory(filePath);
//       } else if (file.endsWith(".html")) {
//         // 키 이름을 경로에서 추출 (확장자 제외)
//         const key = path.relative(__dirname, filePath).replace(".html", "");
//         htmlFiles[key] = filePath;
//       }
//     }
//   }

//   scanDirectory(directory);
//   return htmlFiles;
// }

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        index: "index.html", // 기본 index.html
        mainhtml: "./src/pages/ingame.html",
        lobby: "./src/pages/lobby.html",
        rule: "./src/pages/rule.html",
        btn: "./src/components/btn/btn.html",
        mainContainer: "./src/components/main-container/main-container.html",
        modal: "./src/components/modal/modal.html",
        scoreTable: "./src/components/score-table/score-table.html",
        roundTable: "./src/components/score-table/round/round-table.html",
      },
    },
  },
  appType: "mpa", // fallback 사용안함
  plugins: [tailwindcss()],
});
