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

    <!-- 로봇별 상태를 카드 형태로 표시 -->
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

// === State and Data ===
// API 기본 URL. DeviceStatusController의 @RequestMapping에 맞춰 수정
const API_BASE_URL = 'http://localhost:8080/api/device-status';

let map = null;
let refreshInterval = null; // Polling을 위한 setInterval 핸들러
const loading = ref(false); // 로딩 상태
const robotMarkers = ref({});
const activeRobotLocations = ref([]);
const showMessage = ref({ visible: false, text: '', type: 'info' });
const alertClass = ref('alert-info');

// Leaflet 기본 마커 이미지 설정 (Vue에서 사용할 때 필요)
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import icon from 'leaflet/dist/images/marker-icon.png';
import shadow from 'leaflet/dist/images/marker-shadow.png';
L.Marker.prototype.options.icon = L.icon({
  iconRetinaUrl: iconRetina,
  iconUrl: icon,
  shadowUrl: shadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

// === Methods ===
const showMessageBox = (text, type = 'info', duration = 3000) => {
  showMessage.value = { visible: true, text, type };
  alertClass.value =
    type === 'error' ? 'alert-error' : type === 'info' ? 'alert-info' : 'alert-success';
  setTimeout(() => {
    showMessage.value.visible = false;
  }, duration);
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString();
};

const initMap = () => {
  if (map) {
    map.remove();
  }
  map = L.map('map').setView([37.5665, 126.978], 13); // 서울 시청으로 초기 뷰 설정
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors',
  }).addTo(map);
};

const updateMapMarkers = (robotData) => {
  if (robotData && robotData.location) {
    // 기존 마커를 삭제하거나 업데이트
    if (robotMarkers.value[robotData.deviceId]) {
      map.removeLayer(robotMarkers.value[robotData.deviceId]);
    }

    // 새로운 마커 생성 및 팝업 추가
    const marker = L.marker([robotData.location.latitude, robotData.location.longitude]).addTo(map);
    const popupContent = `
      <b>${robotData.deviceId}</b><br>
      상태: ${robotData.currentStatus}<br>
      배터리: ${robotData.batteryLevel}%<br>
      업데이트: ${formatDate(robotData.ttimestamp)}
    `;
    marker.bindPopup(popupContent);
    robotMarkers.value[robotData.deviceId] = marker;

    // activeRobotLocations 데이터 업데이트
    const index = activeRobotLocations.value.findIndex((r) => r.deviceId === robotData.deviceId);
    if (index !== -1) {
      activeRobotLocations.value[index] = robotData;
    } else {
      activeRobotLocations.value.push(robotData);
    }
  }
};

const goToRobot = (robot) => {
  if (map && robot.location) {
    map.setView([robot.location.latitude, robot.location.longitude], 15);
    robotMarkers.value[robot.deviceId]?.openPopup();
  } else {
    showMessageBox('선택한 로봇의 위치 정보가 유효하지 않습니다.', 'info');
  }
};

const goToLatestRobot = () => {
  if (activeRobotLocations.value.length > 0) {
    const latestRobot = activeRobotLocations.value.reduce((prev, current) =>
      new Date(prev.ttimestamp) > new Date(current.ttimestamp) ? prev : current
    );
    goToRobot(latestRobot);
  } else {
    showMessageBox('조회된 로봇이 없습니다.', 'info');
  }
};

// DeviceStatusController.java의 robot-location API를 폴링하는 함수
const fetchRobotLocation = async () => {
  loading.value = true;
  try {
    // DeviceStatusController에 정의된 /api/device-status/robot-location 엔드포인트를 호출
    const response = await fetch(`${API_BASE_URL}/robot-location`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    data.forEach((robot) => updateMapMarkers(robot));
    showMessageBox('로봇 위치 정보를 업데이트했습니다.', 'success');
  } catch (error) {
    console.error('Fetching robot location failed:', error);
    showMessageBox('로봇 위치 정보를 불러오는 데 실패했습니다.', 'error');
  } finally {
    loading.value = false;
  }
};

// 컴포넌트 마운트 시 초기 데이터 로드 및 폴링 시작
onMounted(async () => {
  initMap(); // 지도 초기화
  await fetchRobotLocation(); // 초기 데이터 로드
  refreshInterval = setInterval(fetchRobotLocation, 5000); // 5초마다 폴링 시작
});

// 컴포넌트 언마운트 시 인터벌 및 맵 정리
onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
  if (map) {
    map.remove();
    map = null;
  }
});
</script>

<style scoped>
#map {
  height: 500px;
  width: 100%;
}
</style>
