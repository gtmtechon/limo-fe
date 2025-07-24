<template>
  <div class="card bg-base-100 shadow-xl">
    <h2 class="text-2xl font-semibold mb-4">디바이스 상태 조회</h2>
    <div class="flex items-center space-x-4 mb-4">
      <label for="statusDeviceType" class="label">
        <span class="label-text">디바이스 타입:</span>
      </label>
      <select
        id="statusDeviceType"
        v-model="selectedDeviceType"
        @change="fetchDeviceStatus"
        class="select select-bordered w-auto"
      >
        <option value="">전체</option>
        <option value="sensor">센서</option>
        <option value="water-purifier-robot">수질 정화 로봇</option>
        <option value="cctv">CCTV</option>
        <!-- CCTV 옵션 추가 -->
      </select>
      <button @click="fetchDeviceStatus" class="btn btn-primary">조회</button>
    </div>

    <h3 class="text-xl font-semibold mb-3">현재 디바이스 상태</h3>
    <div v-if="sortedDeviceStatusList.length === 0" class="text-gray-500">
      조회된 디바이스 상태가 없습니다.
    </div>
    <div class="overflow-x-auto" v-else>
      <table class="table table-zebra w-full">
        <thead>
          <tr>
            <th @click="sortBy('deviceId')" class="cursor-pointer">
              장치 ID
              <span v-if="sortKey === 'deviceId'">{{ sortOrder === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th @click="sortBy('deviceName')" class="cursor-pointer">
              장비 이름
              <span v-if="sortKey === 'deviceName'">{{ sortOrder === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th @click="sortBy('deviceType')" class="cursor-pointer">
              타입
              <span v-if="sortKey === 'deviceType'">{{ sortOrder === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th @click="sortBy('timestamp')" class="cursor-pointer">
              시간
              <span v-if="sortKey === 'timestamp'">{{ sortOrder === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th @click="sortBy('batteryLevel')" class="cursor-pointer">
              배터리
              <span v-if="sortKey === 'batteryLevel'">{{ sortOrder === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th @click="sortBy('currentStatus')" class="cursor-pointer">
              상태
              <span v-if="sortKey === 'currentStatus'">{{ sortOrder === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th>확장속성</th>
            <!-- 확장속성 열 추가 (정렬 불가) -->
            <th @click="sortBy('latitude')" class="cursor-pointer">
              위도
              <span v-if="sortKey === 'latitude'">{{ sortOrder === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th @click="sortBy('longitude')" class="cursor-pointer">
              경도
              <span v-if="sortKey === 'longitude'">{{ sortOrder === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th @click="sortBy('errorCode')" class="cursor-pointer">
              에러 코드
              <span v-if="sortKey === 'errorCode'">{{ sortOrder === 'asc' ? '▲' : '▼' }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="status in sortedDeviceStatusList" :key="status.id">
            <td>{{ status.deviceId }}</td>
            <td>{{ getDeviceName(status.deviceId) }}</td>
            <td>{{ getDeviceType(status.deviceId) }}</td>
            <td>{{ status.timestamp ? new Date(status.timestamp).toLocaleString() : '-' }}</td>
            <td>{{ status.batteryLevel ? status.batteryLevel + '%' : '-' }}</td>
            <td>{{ status.currentStatus }}</td>
            <td class="whitespace-normal break-all text-xs">
              {{ status.xprops ? JSON.stringify(status.xprops) : '-' }}
            </td>
            <td>{{ status.latitude ? status.latitude : '-' }}</td>
            <td>{{ status.longitude ? status.longitude : '-' }}</td>
            <td>{{ status.errorCode ? status.errorCode : '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, inject, computed } from 'vue'; // computed import
import axios from 'axios';

const API_BASE_URL = process.env.VUE_APP_API_BASE_URL;

const devices = ref([]); // 모든 디바이스 목록 (장비 이름 매핑용)
const selectedDeviceType = ref('');
const deviceStatusList = ref([]);

// 정렬 관련 상태
const sortKey = ref('');
const sortOrder = ref('asc'); // 'asc' 또는 'desc'

// main.js에서 provide된 showMessageBox 함수 inject
const showMessageBox = inject('showMessageBox');

// 함수 정의 순서: 사용되기 전에 정의
const fetchDevicesForTypeMapping = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/devices`);
    devices.value = response.data;
  } catch (error) {
    console.error('디바이스 목록 조회 실패:', error);
    showMessageBox(
      '디바이스 목록 조회에 실패했습니다. 백엔드 서버가 실행 중인지, ' +
        'API_BASE_URL이 올바른지 확인해주세요.',
      'error'
    );
  }
};

const fetchDeviceStatus = async () => {
  try {
    const deviceStatusRes = await axios.get(`${API_BASE_URL}/device-status`, {
      params: { deviceType: selectedDeviceType.value },
    });
    deviceStatusList.value = deviceStatusRes.data;
    console.log('Device Status fetched:', deviceStatusList.value);
  } catch (error) {
    console.error('디바이스 상태 조회 실패:', error);
    showMessageBox(
      '디바이스 상태 조회에 실패했습니다. 백엔드 서버가 실행 중인지, ' +
        'API_BASE_URL이 올바른지 확인해주세요.',
      'error'
    );
  }
};

// 디바이스 ID로 디바이스 타입을 가져오는 함수
const getDeviceType = (deviceId) => {
  const device = devices.value.find((d) => d.deviceId === deviceId);
  return device ? device.deviceType : '알 수 없음';
};

// 디바이스 ID로 디바이스 이름을 가져오는 함수 추가
const getDeviceName = (deviceId) => {
  const device = devices.value.find((d) => d.deviceId === deviceId);
  return device ? device.deviceName : '알 수 없음';
};

// 정렬 함수
const sortBy = (key) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortOrder.value = 'asc';
  }
};

// 정렬된 디바이스 상태 목록을 반환하는 computed 속성
const sortedDeviceStatusList = computed(() => {
  if (!sortKey.value) {
    return deviceStatusList.value;
  }

  return [...deviceStatusList.value].sort((a, b) => {
    let valA = a[sortKey.value];
    let valB = b[sortKey.value];

    // timestamp 필드 특별 처리
    if (sortKey.value === 'timestamp') {
      // eslint-disable-next-line prettier/prettier
      valA = a.timestamp ? new Date(a.timestamp).getTime() : sortOrder.value === 'asc' ? -Infinity : Infinity;
      // eslint-disable-next-line prettier/prettier
      valB = b.timestamp ? new Date(b.timestamp).getTime() : sortOrder.value === 'asc' ? -Infinity : Infinity;
    } else if (sortKey.value === 'deviceName' || sortKey.value === 'deviceType') {
      // 장비 이름과 타입은 getDeviceName/Type 함수를 통해 가져와서 비교
      valA =
        (sortKey.value === 'deviceName' ? getDeviceName(a.deviceId) : getDeviceType(a.deviceId)) ||
        '';
      valB =
        (sortKey.value === 'deviceName' ? getDeviceName(b.deviceId) : getDeviceType(b.deviceId)) ||
        '';
      return sortOrder.value === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    } else if (typeof valA === 'string') {
      valA = valA.toLowerCase();
      valB = valB.toLowerCase();
    }

    if (valA < valB) {
      return sortOrder.value === 'asc' ? -1 : 1;
    }
    if (valA > valB) {
      return sortOrder.value === 'asc' ? 1 : -1;
    }
    return 0;
  });
});

// 컴포넌트 마운트 시 디바이스 목록 및 상태 로드
onMounted(() => {
  fetchDevicesForTypeMapping();
  fetchDeviceStatus();
});
</script>

<style scoped>
/* 이 컴포넌트에만 적용되는 스타일 */
.cursor-pointer {
  cursor: pointer;
}
.cursor-pointer:hover {
  background-color: #f0f4f8; /* 호버 효과 */
}
</style>
