# limo-fe
- **limo front end service**

- **환경 준비**
    - `node -v`: Node.js 버전 확인
    - `npm -v`: npm 버전 확인
    - `npm install -g @vue/cli`: Vue CLI 전역 설치

- **2단계: 새로운 Vue 프로젝트 생성 (Vue CLI 사용)**
    - `vue create limo-fe`
    - 프로젝트 디렉터리로 이동: `cd limo-fe`
    - 개발 서버 실행: `npm run serve`

- **3단계: 초기 프로젝트 구조 탐색 (자동 생성)**
    - 생성된 디렉터리 구조 예시:
        ```
        lake-monitoring-frontend/
        ├── node_modules/
        ├── public/
        │   ├── index.html
        │   └── favicon.ico
        ├── src/
        │   ├── assets/
        │   │   └── logo.png
        │   ├── components/
        │   │   └── HelloWorld.vue
        │   ├── router/
        │   │   └── index.js
        │   ├── store/
        │   │   └── index.js
        │   ├── views/
        │   │   ├── HomeView.vue
        │   │   └── AboutView.vue
        │   ├── App.vue
        │   └── main.js
        ├── .gitignore
        ├── babel.config.js
        ├── package.json
        ├── README.md
        ├── vue.config.js
        └── postcss.config.js
        ```

- **주요 파일 및 디렉터리 역할**
    - `public/index.html`: 앱의 뼈대, Vue가 마운트되는 HTML 파일
    - `src/main.js`: 애플리케이션 진입점, Vue 인스턴스 생성 및 초기화
    - `src/App.vue`: 최상위 루트 컴포넌트, 라우터 뷰 포함
    - `src/router/index.js`: URL 경로와 뷰 컴포넌트 매핑
    - `src/store/index.js`: 전역 상태 관리(Vuex/Pinia)
    - `src/components/`: 재사용 가능한 UI 컴포넌트
    - `src/views/`: 라우터에 매핑되는 페이지 컴포넌트
    - `package.json`: 프로젝트 메타데이터, 스크립트, 의존성 목록

cd limo-fe
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
