import { createApp, ref } from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';

// 전역 스타일 임포트
import './assets/global.css';

const app = createApp(App);

// 메시지 박스 상태
const message = ref('');
const messageType = ref('info'); // 'success', 'error', 'info'
const showMessage = ref(false);
let messageTimeout = null;

// 메시지 박스 표시 함수
const showMessageBox = (msg, type = 'info', duration = 3000) => {
  message.value = msg;
  messageType.value = type;
  showMessage.value = true;

  if (messageTimeout) {
    clearTimeout(messageTimeout);
  }
  messageTimeout = setTimeout(() => {
    showMessage.value = false;
    message.value = '';
  }, duration);
};

// Vue 앱 전체에서 사용 가능하도록 provide
app.provide('showMessageBox', showMessageBox);
app.provide('message', message);
app.provide('messageType', messageType);
app.provide('showMessage', showMessage);

app.use(router);
app.use(store);

app.mount('#app');
