<template>
  <div class="card bg-base-100 shadow-xl p-4">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-2xl font-semibold">로봇 위치 추적 (Polling)</h2>
      <button
        @click="goToLatestRobot"
        class="btn btn-ghost btn-circle tooltip tooltip-left"
        data-tip="가장 최근 로봇으로 이동"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m0 0l7 7
            m-1.5-7.5a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
          />
        </svg>
      </button>
    </div>
    <div id="map" class="mb-4"></div>
    <div class="text-gray-600">
      로봇 위치는 5초 단위로 업데이트됩니다.
      <span v-if="loading" class="text-blue-500 font-bold"> 업데이트 중... </span>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
      <div
        v-for="robot in activeRobotLocations"
        :key="robot.deviceId"
        class="card bg-neutral text-neutral-content shadow-md"
      >
        <div class="card-body p-4">
          <h3 class="card-title text-xl">{{ robot.deviceId }}</h3>
          <p class="text-sm">
            상태:
            <span
              :class="{
                'text-green-400': robot.currentStatus === 'idle',
                'text-blue-400': robot.currentStatus === 'purifying',
                'text-yellow-400': robot.currentStatus === 'moving',
                'text-red-400': robot.currentStatus === 'error',
              }"
            >
              {{ robot.currentStatus }}
            </span>
          </p>
          <p class="text-sm">
            배터리:
            <span
              :class="{
                'text-red-400': robot.batteryLevel < 20,
                'text-yellow-400': robot.batteryLevel >= 20 && robot.batteryLevel < 50,
                'text-green-400': robot.batteryLevel >= 50,
              }"
            >
              {{ robot.batteryLevel }}%
            </span>
          </p>
          <p class="text-sm">업데이트: {{ formatDate(robot.ttimestamp) }}</p>
          <div class="card-actions justify-end mt-2">
            <button @click="goToRobot(robot)" class="btn btn-sm btn-primary">위치 보기</button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showMessage.visible" class="toast toast-end">
      <div class="alert" :class="alertClass">
        <span class="font-semibold">{{ showMessage.text }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Import the image using a relative path, Vue handles the asset pipeline.
import robotIconUrl from '/public/images/waterbot.png';

const API_BASE_URL = process.env.VUE_APP_API_BASE_URL;


let map = null;
let refreshInterval = null;
const loading = ref(false);
const robotMarkers = ref({});
const activeRobotLocations = ref([]);
const showMessage = ref({ visible: false, text: '', type: 'info' });
const alertClass = ref('alert-info');

// 컴포넌트가 소멸 절차에 들어갔는지 확인하는 플래그입니다.
const isUnmounting = ref(false);

const robotIcon = L.icon({
  iconUrl: robotIconUrl, // Use the imported URL
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

const showMessageBox = (text, type = 'info', duration = 3000) => {
  showMessage.value = { visible: true, text, type };
  alertClass.value = type === 'error' ? 'alert-error' : 'alert-success';
  setTimeout(() => {
    showMessage.value.visible = false;
  }, duration);
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString();
};

const initMap = () => {
  if (map) map.remove();
  map = L.map('map').setView([37.5665, 126.978], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors',
  }).addTo(map);
};

const goToRobot = (robot) => {
  // 함수 시작 시점에 언마운트가 진행 중이거나 맵이 없으면 즉시 실행을 중단하여 오류를 원천 차단합니다.
  if (isUnmounting.value || !map) return;

  if (robot.location?.latitude && robot.location?.longitude) {
    map.setView([robot.location.latitude, robot.location.longitude], 15);
    robotMarkers.value[robot.deviceId]?.openPopup();
  } else {
    showMessageBox('선택한 로봇의 위치 정보가 유효하지 않습니다.', 'info');
  }
};

const goToLatestRobot = () => {
  if (isUnmounting.value || !map) return;

  if (activeRobotLocations.value.length > 0) {
    const latestRobot = activeRobotLocations.value.reduce((prev, current) =>
      new Date(prev.ttimestamp) > new Date(current.ttimestamp) ? prev : current
    );
    goToRobot(latestRobot);
  } else {
    showMessageBox('조회된 로봇이 없습니다.', 'info');
  }
};

const fetchRobotLocation = async () => {
  loading.value = true;
  try {
    const response = await fetch(`${API_BASE_URL}/latest-robot-status/robots`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();

    // fetch(await)가 끝난 후에도 반드시 상태를 재확인해야 합니다.
    if (isUnmounting.value || !map) return;

    Object.values(robotMarkers.value).forEach((marker) => map.removeLayer(marker));
    robotMarkers.value = {};
    activeRobotLocations.value = [];

    data.forEach((robotData) => {
      if (robotData?.location?.latitude && robotData?.location?.longitude) {
        const { latitude: lat, longitude: lng } = robotData.location;
        const marker = L.marker([lat, lng], { icon: robotIcon }).addTo(map);
        marker.bindPopup(`
          <b>${robotData.deviceId}</b><br>
          상태: ${robotData.currentStatus}<br>
          배터리: ${robotData.batteryLevel}%<br>
          업데이트: ${formatDate(robotData.ttimestamp)}
        `);
        robotMarkers.value[robotData.deviceId] = marker;
        activeRobotLocations.value.push(robotData);
      }
    });
    showMessageBox('로봇 위치 정보를 업데이트했습니다.', 'success');
  } catch (error) {
    // isUnmounting 중 발생한 에러는 사용자에게 알릴 필요가 없을 수 있습니다.
    if (!isUnmounting.value) {
      console.error('Fetching robot location failed:', error);
      showMessageBox('로봇 위치 정보를 불러오는 데 실패했습니다.', 'error');
    }
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  initMap();
  await fetchRobotLocation();
  refreshInterval = setInterval(fetchRobotLocation, 5000);
});

onUnmounted(() => {
  // 1. 가장 먼저 플래그를 설정하여 다른 모든 작업이 멈추도록 신호를 보냅니다.
  isUnmounting.value = true;

  // 2. 반복되는 작업을 중단시킵니다.
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }

  // 3. 마지막으로 맵 리소스를 정리합니다.
  if (map) {
    console.log('Destroying Leaflet map object now.');
    map.remove();
    map = null;
  }

  robotMarkers.value = {};
  activeRobotLocations.value = [];
});
</script>

<style scoped>
#map {
  height: 500px;
  width: 100%;
}
</style>
