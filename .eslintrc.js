// .eslintrc.js
module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: [
    'plugin:vue/vue3-essential', // Vue 3 필수 규칙
    'eslint:recommended', // ESLint 권장 규칙
    '@vue/prettier', // Prettier와 충돌하는 ESLint 규칙 비활성화
  ],
  parserOptions: {
    parser: '@babel/eslint-parser',
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    // --- 여기서부터 스타일 관련 규칙 조정 ---

    // 들여쓰기 규칙 (indent)
    // 'indent': ['error', 4, { 'SwitchCase': 1 }], // 4칸 스페이스, switch case 1칸 들여쓰기
    indent: ['error', 2], // 2칸 스페이스 (Vue CLI 기본값과 일치)
    // 만약 4칸을 선호한다면 4로 변경

    // 따옴표 규칙 (quotes)
    quotes: ['error', 'single'], // 홑따옴표 강제

    // 라인 길이 규칙 (max-len)
    'max-len': [
      'error',
      {
        code: 100, // 최대 라인 길이 100자 (기본값)
        ignoreUrls: true, // URL이 포함된 라인은 무시
        ignoreStrings: true, // 문자열 리터럴이 포함된 라인은 무시
        ignoreTemplateLiterals: true, // 템플릿 리터럴이 포함된 라인은 무시
        ignoreRegExpLiterals: true, // 정규식 리터럴이 포함된 라인은 무시
        ignoreComments: true, // 주석 라인 무시
        // ignorePattern: '^import .*' // 특정 패턴에 해당하는 라인 무시 (예: import 문)
      },
    ],

    // label-has-for 규칙 (vuejs-accessibility/label-has-for)
    // 이 규칙은 접근성(Accessibility)을 위해 중요합니다.
    // <label> 태그가 <input> 등과 연결되지 않았을 때 발생합니다.
    // for 속성을 사용하거나, <label> 안에 <input>을 직접 넣는 방식으로 해결합니다.
    // 현재 코드에서는 for 속성을 추가하여 해결했으므로, 이 규칙을 'off'할 필요는 없습니다.
    // 만약 특정 상황에서 이 규칙을 끄고 싶다면 아래와 같이 설정합니다.
    // 'vuejs-accessibility/label-has-for': 'off',

    // alert() 사용 경고 (no-alert)
    // alert()는 사용자 경험을 방해하므로 프로덕션에서는 사용하지 않는 것이 좋습니다.
    // 개발 편의상 사용하려면 'warn'으로 설정하거나, 특정 라인에서 ESLint 주석으로 무시합니다.
    'no-alert': process.env.NODE_ENV === 'production' ? 'error' : 'warn',

    // 함수 사용 전 정의 (no-use-before-define)
    // Composition API의 setup 스크립트에서는 함수 선언 순서가 중요합니다.
    // 이 규칙을 끄는 것은 권장되지 않지만, 필요하다면 'off'할 수 있습니다.
    // 'no-use-before-define': 'off',
  },
  overrides: [
    {
      files: ['**/__tests__/*.{j,t}s?(x)', '**/tests/unit/**/*.spec.{j,t}s?(x)'],
      env: {
        jest: true,
      },
    },
  ],
};
