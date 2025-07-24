<template>
  <div class="card bg-base-100 shadow-xl">
    <h2 class="text-2xl font-semibold mb-4">센서 데이터 차트</h2>
    <div class="flex items-center space-x-4 mb-4">
      <!-- 센서 선택 콤보 박스 제거됨 -->
      <button @click="reloadPage" class="btn btn-primary">
        최근 1시간 데이터 조회
      </button>
    </div>

    <div v-if="sensorChartData.length > 0">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="card bg-base-200 shadow-md p-4">
          <h3 class="text-xl font-semibold mb-2">온도 변화</h3>
          <canvas id="temperatureChart"></canvas>
        </div>
        <div class="card bg-base-200 shadow-md p-4">
          <h3 class="text-xl font-semibold mb-2">pH 변화</h3>
          <canvas id="phChart"></canvas>
        </div>
        <div class="card bg-base-200 shadow-md p-4">
          <h3 class="text-xl font-semibold mb-2">용존 산소 변화</h3>
          <canvas id="dissolvedOxygenChart"></canvas>
        </div>
        <div class="card bg-base-200 shadow-md p-4">
          <h3 class="text-xl font-semibold mb-2">탁도 변화</h3>
          <canvas id="turbidityChart"></canvas>
        </div>
      </div>
    </div>
    <div v-else class="text-gray-500">
      조회할 센서 데이터가 없습니다. '최근 1시간 데이터 조회' 버튼을 눌러주세요.
    </div>

    <!-- 최근 호수 상태 (센서 데이터) 테이블 추가 -->
    <h3 class="text-xl font-semibold mt-6 mb-3">최근 호수 상태 (센서 데이터)</h3>
    <div v-if="filteredLakeStatusList.length === 0" class="text-gray-500">
      조회된 호수 상태 데이터가 없습니다. (차트 범례를 확인하세요)
    </div>
    <div class="overflow-x-auto" v-else>
      <table class="table table-zebra w-full">
        <thead>
          <tr>
            <th>센서 ID</th>
            <th>시간</th>
            <th>온도 (°C)</th>
            <th>pH</th>
            <th>용존 산소</th>
            <th>탁도</th>
            <th>오염도</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="status in filteredLakeStatusList" :key="status.id">
            <td>{{ status.sensorName }} ({{ status.sensorId }})</td>
            <td>{{ status.ttimestamp ? new Date(status.ttimestamp).toLocaleString() : '-' }}</td>
            <td>{{ status.temperature }}</td>
            <td>{{ status.ph }}</td>
            <td>{{ status.dissolvedOxygen }}</td>
            <td>{{ status.turbidity }}</td>
            <td>{{ status.pollutionLevel }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, inject, computed } from 'vue';
import axios from 'axios';
import Chart from 'chart.js/auto';
import 'chartjs-adapter-date-fns';

const API_BASE_URL = process.env.VUE_APP_API_BASE_URL;

const sensors = ref([]);
const sensorChartData = ref([]);
const lakeStatusList = ref([]);
const visibleSensorIds = ref(new Set());

let temperatureChart = null;
let phChart = null;
let dissolvedOxygenChart = null;
let turbidityChart = null;
// let refreshInterval = null; // 자동 새로고침 인터벌 주석 처리

const showMessageBox = inject('showMessageBox');

const sensorColors = new Map();
const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

const reloadPage = () => {
  window.location.reload(); // 현재 브라우저 페이지를 새로고침합니다.
};

const getSensorColor = (sensorId) => {
  if (!sensorColors.has(sensorId)) {
    sensorColors.set(sensorId, getRandomColor());
  }
  return sensorColors.get(sensorId);
};

const renderCharts = () => {
  // 기존 차트 파괴 및 인스턴스 초기화
  if (temperatureChart) {
    temperatureChart.destroy();
    temperatureChart = null;
  }
  if (phChart) {
    phChart.destroy();
    phChart = null;
  }
  if (dissolvedOxygenChart) {
    dissolvedOxygenChart.destroy();
    dissolvedOxygenChart = null;
  }
  if (turbidityChart) {
    turbidityChart.destroy();
    turbidityChart = null;
  }

  const createChartDatasets = (dataKey) => {
    const datasets = [];
    sensorChartData.value.forEach((sensorData) => {
      datasets.push({
        label: sensorData.deviceName,
        data: sensorData.data.map((d) => ({ x: new Date(d.ttimestamp), y: d[dataKey] })),
        borderColor: getSensorColor(sensorData.deviceId),
        borderWidth: 2, // 선 굵기 설정
        tension: 0.1,
        sensorId: sensorData.deviceId,
        hidden: !visibleSensorIds.value.has(sensorData.deviceId), // 초기 가시성 설정
      });
    });
    return datasets;
  };

  const commonXAxisOptions = {
    type: 'time',
    time: {
      unit: 'minute',
      tooltipFormat: 'yyyy-MM-dd HH:mm:ss',
      displayFormats: {
        minute: 'HH:mm',
        hour: 'HH:mm',
      },
    },
    title: {
      display: true,
      text: '시간',
    },
  };

  const commonPluginOptions = {
    legend: {
      position: 'bottom',
      labels: {
        font: {
          size: 10,
        },
        boxWidth: 10,
      },
      onClick: (e, legendItem, legend) => {
        const chart = legend.chart;
        const dataset = chart.data.datasets[legendItem.datasetIndex];
        const clickedSensorId = dataset.sensorId;

        // Chart.js의 기본 범례 토글 동작 수행
        dataset.hidden = !dataset.hidden;
        chart.update();

        // 내부 visibleSensorIds 상태 업데이트 (테이블 필터링에는 영향 없음, 차트 가시성만 제어)
        if (dataset.hidden) {
          visibleSensorIds.value.delete(clickedSensorId);
        } else {
          visibleSensorIds.value.add(clickedSensorId);
        }
      },
    },
  };

  temperatureChart = new Chart(document.getElementById('temperatureChart'), {
    type: 'line',
    data: {
      datasets: createChartDatasets('temperature'),
    },
    options: {
      responsive: true,
      plugins: commonPluginOptions,
      scales: {
        x: commonXAxisOptions,
        y: {
          // Y축 범위 명시적 설정
          beginAtZero: false,
          min: -50,
          max: 50,
          title: {
            display: true,
            text: '온도 (°C)',
          },
        },
      },
    },
  });

  phChart = new Chart(document.getElementById('phChart'), {
    type: 'line',
    data: {
      datasets: createChartDatasets('ph'),
    },
    options: {
      responsive: true,
      plugins: commonPluginOptions,
      scales: {
        x: commonXAxisOptions,
        y: {
          // Y축 범위 명시적 설정
          beginAtZero: false,
          min: 0,
          max: 10,
          title: {
            display: true,
            text: 'pH',
          },
        },
      },
    },
  });

  dissolvedOxygenChart = new Chart(document.getElementById('dissolvedOxygenChart'), {
    type: 'line',
    data: {
      datasets: createChartDatasets('dissolvedOxygen'),
    },
    options: {
      responsive: true,
      plugins: commonPluginOptions,
      scales: {
        x: commonXAxisOptions,
        y: {
          // Y축 범위 명시적 설정
          beginAtZero: false,
          min: 0,
          max: 15,
          title: {
            display: true,
            text: '용존 산소',
          },
        },
      },
    },
  });

  turbidityChart = new Chart(document.getElementById('turbidityChart'), {
    type: 'line',
    data: {
      datasets: createChartDatasets('turbidity'),
    },
    options: {
      responsive: true,
      plugins: commonPluginOptions,
      scales: {
        x: commonXAxisOptions,
        y: {
          // Y축 범위 명시적 설정
          beginAtZero: true,
          max: 100,
          title: {
            display: true,
            text: '탁도',
          },
        },
      },
    },
  });
};

const fetchSensors = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/devices`, {
      params: { deviceType: 'sensor' },
    });
    sensors.value = response.data;
  } catch (error) {
    console.error('센서 목록 조회 실패:', error);
    showMessageBox(
      '센서 목록 조회에 실패했습니다. 백엔드 서버가 실행 중인지, ' +
        'API_BASE_URL이 올바른지 확인해주세요.',
      'error'
    );
  }
};

const fetchSensorDataForChart = async () => {
  if (sensors.value.length === 0) {
    showMessageBox('등록된 센서가 없습니다. 디바이스 관리에서 센서를 등록해주세요.', 'info');
    return;
  }

  sensorChartData.value = []; // 기존 차트 데이터 초기화
  visibleSensorIds.value.clear(); // 가시성 상태 초기화: 모든 범례가 보이도록

  for (const sensor of sensors.value) {
    try {
      const response = await axios.get(`${API_BASE_URL}/lake-status/hourly`, {
        params: { sensorId: sensor.deviceId },
      });
      if (response.data && response.data.length > 0) {
        sensorChartData.value.push({
          deviceId: sensor.deviceId,
          deviceName: sensor.deviceName,
          data: response.data,
        });
        visibleSensorIds.value.add(sensor.deviceId); // 초기에는 모든 센서가 보이도록 설정
      }
    } catch (error) {
      console.error(
        `센서 (${sensor.deviceName || sensor.deviceId})의 차트 데이터 조회 실패:`,
        error
      );
    }
  }

  nextTick(() => {
    if (sensorChartData.value.length > 0) {
      renderCharts();
    } else {
      // 데이터가 없으면 기존 차트 파괴 및 null 초기화
      if (temperatureChart) temperatureChart.destroy();
      if (phChart) phChart.destroy();
      if (dissolvedOxygenChart) dissolvedOxygenChart.destroy();
      if (turbidityChart) turbidityChart.destroy();
      temperatureChart = null;
      phChart = null;
      dissolvedOxygenChart = null;
      turbidityChart = null;
    }
  });
};

// 호수 상태 데이터를 가져오는 함수 (모든 센서의 최신 상태)
const fetchLakeStatus = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/lake-status`);
    lakeStatusList.value = response.data; // 모든 센서의 최신 상태 데이터를 가져옴
    console.log('Lake Status fetched:', lakeStatusList.value);
  } catch (error) {
    console.error('호수 상태 조회 실패:', error);
    showMessageBox(
      '호수 상태 조회에 실패했습니다. 백엔드 서버가 실행 중인지, ' +
        'API_BASE_URL이 올바른지 확인해주세요.',
      'error'
    );
  }
};

// 테이블에 표시될 데이터를 필터링하는 computed 속성
const filteredLakeStatusList = computed(() => {
  // 이제 visibleSensorIds에 따른 필터링 없이 모든 데이터를 반환합니다.
  return lakeStatusList.value.map((status) => {
    const sensor = sensors.value.find((s) => s.deviceId === status.sensorId);
    return {
      ...status,
      sensorName: sensor ? sensor.deviceName : '알 수 없음', // 센서 이름 추가
    };
  });
});

// 컴포넌트 마운트 시 센서 목록 로드 및 초기 차트/테이블 데이터 로드
onMounted(async () => {
  await fetchSensors(); // 센서 목록을 먼저 가져와야 차트 데이터를 가져올 수 있음
  fetchSensorDataForChart(); // 초기 차트 데이터 로드
  fetchLakeStatus(); // 초기 호수 상태 데이터 로드

  // 30초마다 데이터 새로고침 기능 주석 처리
  // refreshInterval = setInterval(() => {
  //   fetchSensorDataForChart(); // 차트 데이터 새로고침 (모든 센서)
  //   fetchLakeStatus(); // 테이블 데이터 새로고침 (모든 센서)
  // }, 30000); // 30초 = 30000ms
});

// 컴포넌트 언마운트 시 인터벌 정리
onUnmounted(() => {
  // if (refreshInterval) { // 자동 새로고침 인터벌 주석 처리
  //   clearInterval(refreshInterval);
  // }
  // 컴포넌트 언마운트 시 차트 인스턴스 파괴
  if (temperatureChart) temperatureChart.destroy();
  if (phChart) phChart.destroy();
  if (dissolvedOxygenChart) dissolvedOxygenChart.destroy();
  if (turbidityChart) turbidityChart.destroy();
});
</script>

<style scoped>
/* 이 컴포넌트에만 적용되는 스타일 */
</style>
