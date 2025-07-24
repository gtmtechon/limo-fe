// server.js (Vue 프로젝트 루트에 위치)
const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 80; // Azure App Service는 PORT 환경 변수를 사용

// Vue.js 빌드 결과물(정적 파일)을 서비스
app.use(express.static(path.join(__dirname, 'dist')));

// SPA (Single Page Application) 라우팅을 위한 대체 경로 설정
// Vue Router의 history 모드를 사용하는 경우, 모든 경로에 대해 index.html을 반환해야 합니다.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
