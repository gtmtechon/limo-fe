<template>
  <div class="card bg-base-100 shadow-xl">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-2xl font-semibold">로봇 위치 추적</h2>
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
    <div class="text-gray-600">로봇 위치는 10초 단위로 업데이트됩니다.</div>

    <!-- 로봇별 상태를 카드 형태로 표시 -->
    <div
      v-if="activeRobotLocations.length > 0"
      class="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <div
        v-for="robot in activeRobotLocations"
        :key="robot.deviceId"
        class="card bg-base-100 shadow-md p-4 rounded-lg"
      >
        <h3 class="text-xl font-semibold mb-2">
          로봇 ID: {{ robot.deviceId }} ({{ getDeviceName(robot.deviceId) }})
        </h3>
        <p>
          <strong>시간:</strong>
          {{ robot.timestamp ? new Date(robot.timestamp).toLocaleString() : '-' }}
        </p>
        <p><strong>위도:</strong> {{ robot.latitude }}</p>
        <p><strong>경도:</strong> {{ robot.longitude }}</p>
        <p><strong>상태:</strong> {{ robot.currentStatus }}</p>
        <p v-if="robot.batteryLevel"><strong>배터리:</strong> {{ robot.batteryLevel }}%</p>
        <p v-if="robot.filterLifeRemaining">
          <strong>필터 잔량:</strong> {{ robot.filterLifeRemaining }}%
        </p>
        <p v-if="robot.purifiedVolumeLiters">
          <strong>정화량:</strong> {{ robot.purifiedVolumeLiters }} L
        </p>
        <p v-if="robot.errorCode"><strong>에러 코드:</strong> {{ robot.errorCode }}</p>
      </div>
    </div>
    <div v-else class="text-gray-500 mt-4">로봇 위치 데이터가 없습니다.</div>
  </div>
</template>

<script setup>
/* global L */ // Leaflet.js 전역 객체 L을 ESLint에게 알림
import { ref, onMounted, onUnmounted, nextTick, inject } from 'vue';
import axios from 'axios';

const API_BASE_URL = process.env.VUE_APP_API_BASE_URL;

let map = null;
const robotMarkers = ref({}); // 각 로봇의 마커를 저장할 객체 (deviceId 기준)
const activeRobotLocations = ref([]); // 현재 활성화된 로봇들의 최신 위치 및 상태를 저장할 배열
const devices = ref([]); // 디바이스 이름 매핑을 위해 추가
let refreshInterval = null; // 자동 새로고침 인터벌 ID

// main.js에서 provide된 showMessageBox 함수 inject
const showMessageBox = inject('showMessageBox');

// 로봇 마커 아이콘 정의
const robotIcon = L.icon({
  iconUrl: '/images/waterbot.png', // public 폴더의 이미지 경로
  iconSize: [64, 64], // 아이콘 크기
  iconAnchor: [32, 64], // 아이콘의 기준점 (마커의 바닥 중앙)
  popupAnchor: [0, -64], // 팝업이 열릴 위치 (아이콘 상단)
});

// 지도 초기화 함수
const initMap = () => {
  if (map) {
    map.remove(); // 기존 맵이 있다면 제거 (Hot-reload 시 문제 방지)
  }

  // 지정된 네 지점의 좌표
  const fixedBoundsCoords = [
    [37.511403, 127.10198],
    [37.513631, 127.107132],
    [37.512106, 127.108334],
    [37.509022, 127.104349],
  ];

  // 맵 초기화 및 bounds에 맞게 뷰 설정
  // scrollWheelZoom을 true로 명시하여 스크롤 문제 방지
  const initialBounds = L.latLngBounds(fixedBoundsCoords);
  map = L.map('map', { scrollWheelZoom: true }).fitBounds(initialBounds);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19, // 최대 줌 레벨 설정 (필요시 조정)
  }).addTo(map);

  // 기존 마커 객체 초기화
  robotMarkers.value = {};
};

// 지도에 로봇 위치 업데이트 함수
const updateRobotLocationOnMap = (robotsData) => {
  if (!map) {
    initMap(); // 맵이 초기화되지 않았다면 초기화
    if (!map) return;
  }

  // 현재 지도에 있는 마커 중 robotsData에 없는 마커는 제거
  const currentDeviceIds = new Set(robotsData.map((robot) => robot.deviceId));
  for (const deviceId in robotMarkers.value) {
    if (!currentDeviceIds.has(deviceId)) {
      map.removeLayer(robotMarkers.value[deviceId]);
      delete robotMarkers.value[deviceId];
    }
  }

  const currentRobotPositions = [];
  let boundsChanged = false; // bounds가 변경되었는지 추적

  if (robotsData && robotsData.length > 0) {
    robotsData.forEach((robot) => {
      if (robot.latitude && robot.longitude) {
        const newPosition = [robot.latitude, robot.longitude];
        currentRobotPositions.push(newPosition);

        if (robotMarkers.value[robot.deviceId]) {
          // 기존 마커가 있다면 위치 업데이트
          robotMarkers.value[robot.deviceId].setLatLng(newPosition);
        } else {
          // 새 마커 생성 및 추가
          const marker = L.marker(newPosition, { icon: robotIcon }).addTo(map);
          marker
            .bindPopup(
              `
            <b>로봇 ID:</b> ${robot.deviceId}<br>
            <b>로봇 이름:</b> ${getDeviceName(robot.deviceId)}<br>
            <b>상태:</b> ${robot.currentStatus}<br>
            <b>배터리:</b> ${robot.batteryLevel ? robot.batteryLevel + '%' : '-'}
          `
            )
            .openPopup(); // 팝업 바로 열기
          robotMarkers.value[robot.deviceId] = marker; // 마커 저장
          boundsChanged = true; // 새 마커가 추가되면 bounds 재계산 필요
        }
      }
    });

    // 모든 로봇 위치와 고정된 범위 좌표를 포함하는 새로운 bounds 계산
    // 단, 줌 비율은 유지하기 위해 map.fitBounds는 초기화 시 또는 goToLatestRobot에서만 호출
    // 여기서는 마커 위치만 업데이트하고, 필요하다면 맵 중심만 조정
    if (boundsChanged || activeRobotLocations.value.length !== robotsData.length) {
      // 로봇 목록이 변경되었거나 새 로봇이 추가/제거된 경우에만 bounds를 다시 계산하여 맵 뷰 조정
      const allPoints = [
        ...currentRobotPositions,
        ...[
          [37.511403, 127.10198],
          [37.513631, 127.107132],
          [37.512106, 127.108334],
          [37.509022, 127.104349],
        ],
      ];
      const combinedBounds = L.latLngBounds(allPoints);
      map.fitBounds(combinedBounds, { padding: [50, 50], animate: false }); // 애니메이션 없이 바로 적용
    }
  } else {
    // 로봇 데이터가 없으면 모든 마커 제거 후 초기 고정된 범위로 맵 뷰 재설정
    const fixedBounds = L.latLngBounds([
      [37.511403, 127.10198],
      [37.513631, 127.107132],
      [37.512106, 127.108334],
      [37.509022, 127.104349],
    ]);
    map.fitBounds(fixedBounds, { animate: false });
  }
};

// 모든 디바이스 목록을 가져오는 함수 (로봇 이름 매핑용)
const fetchDevices = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/devices`);
    devices.value = response.data;
    console.log('All devices fetched for name mapping:', devices.value);
  } catch (error) {
    console.error('디바이스 목록 조회 실패:', error);
    showMessageBox(
      '디바이스 목록 조회에 실패했습니다. 백엔드 서버가 실행 중인지, ' +
        'API_BASE_URL이 올바른지 확인해주세요.',
      'error'
    );
  }
};

// 디바이스 ID로 디바이스 이름을 가져오는 함수
const getDeviceName = (deviceId) => {
  const device = devices.value.find((d) => d.deviceId === deviceId);
  return device ? device.deviceName : '알 수 없음';
};

// 로봇 위치 데이터를 가져오는 함수
const fetchRobotLocation = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/device-status/robot-location`);
    const robotData = response.data;

    const formattedRobotData = robotData.map((robot) => ({
      ...robot,
      deviceId: robot.deviceId || robot.device_id,
      batteryLevel: robot.batteryLevel || robot.battery_level,
      currentStatus: robot.currentStatus || robot.current_status,
      filterLifeRemaining: robot.filterLifeRemaining || robot.filter_life_remaining,
      purifiedVolumeLiters: robot.purifiedVolumeLiters || robot.purified_volume_liters,
      errorCode: robot.errorCode || robot.error_code,
    }));

    activeRobotLocations.value = formattedRobotData;
    console.log('Active Robot Locations fetched:', activeRobotLocations.value);

    updateRobotLocationOnMap(activeRobotLocations.value);
  } catch (error) {
    console.error('로봇 위치 조회 실패:', error);
    showMessageBox(
      '로봇 위치 조회에 실패했습니다. 백엔드 서버가 실행 중인지, ' +
        'API_BASE_URL이 올바른지 확인해주세요.',
      'error'
    );
    activeRobotLocations.value = [];
    updateRobotLocationOnMap([]);
  }
};

// 가장 최근에 업데이트된 로봇으로 지도를 이동하는 함수
const goToLatestRobot = () => {
  if (activeRobotLocations.value.length > 0) {
    const latestRobot = activeRobotLocations.value.reduce((prev, current) =>
      new Date(prev.timestamp) > new Date(current.timestamp) ? prev : current
    );
    if (map && latestRobot.latitude && latestRobot.longitude) {
      map.setView([latestRobot.latitude, latestRobot.longitude], 15); // 줌 레벨 15로 이동
      // 해당 로봇 마커의 팝업을 열 수도 있습니다.
      robotMarkers.value[latestRobot.deviceId]?.openPopup();
    } else {
      showMessageBox('가장 최근 로봇의 위치 정보가 유효하지 않습니다.', 'info');
    }
  } else {
    showMessageBox('조회된 로봇이 없습니다.', 'info');
  }
};

// 컴포넌트 마운트 시 맵 초기화 및 데이터 로드 시작
onMounted(() => {
  nextTick(async () => {
    await fetchDevices();
    initMap();
    fetchRobotLocation();

    refreshInterval = setInterval(fetchRobotLocation, 10000);
  });
});

// 컴포넌트 언마운트 시 인터벌 정리
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
  border-radius: 0.75rem;
}
/* 카드 컨테이너에 그리드 레이아웃 적용 */
.grid-cols-1 {
  grid-template-columns: repeat(1, minmax(0, 1fr));
}
@media (min-width: 768px) {
  /* md breakpoint */
  .md\:grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (min-width: 1024px) {
  /* lg breakpoint */
  .lg\:grid-cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
