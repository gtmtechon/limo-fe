const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  // 이 배열에 Babel로 트랜스파일해야 하는 종속성을 추가합니다.
  // 일반적으로 node_modules에 있는 ES6+ 코드를 구형 브라우저에서 실행할 수 있도록 변환합니다.
  // 특별히 트랜스파일할 종속성이 없다면 빈 배열로 유지합니다.
  transpileDependencies: true, // 이 값을 true로 설정하면 모든 node_modules를 트랜스파일합니다.
  // 특정 패키지만 트랜스파일하려면 배열로 지정합니다.
  // 예: ['my-es6-dep', 'another-es6-lib']

  // ESLint 및 Prettier 설정은 .eslintrc.js 및 prettier.config.js에서 관리됩니다.
  // 여기서 추가적인 webpack 설정을 할 수 있습니다.
  configureWebpack: {
    // 개발 서버 설정 (CORS 프록시 등 필요 시)
    devServer: {
      // API_BASE_URL이 백엔드 서버와 다른 도메인/포트인 경우 CORS 문제를 해결하기 위한 프록시 설정
      // 이 설정은 개발 환경에서만 작동하며, 프로덕션 환경에서는 백엔드 서버에서 CORS를 설정해야 합니다.
      proxy: {
        '/api': {
          target: process.env.VUE_APP_API_BASE_URL || 'http://localhost:8080', // .env의 API_BASE_URL 사용
          changeOrigin: true, // 대상 서버의 호스트 헤더를 변경
          pathRewrite: { '^/api': '' } // '/api' 접두사를 제거하고 대상 서버로 요청 전달
        }
      }
    }
  }
})
