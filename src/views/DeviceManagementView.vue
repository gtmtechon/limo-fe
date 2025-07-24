<template>
  <div class="card bg-base-100 shadow-xl">
    <h2 class="text-2xl font-semibold mb-4">디바이스 관리</h2>

    <!-- 디바이스 목록 영역 -->
    <h3 class="text-xl font-semibold mb-3">등록된 디바이스 목록</h3>
    <div v-if="sortedDevices.length === 0" class="text-gray-500 mb-4">
      등록된 디바이스가 없습니다.
    </div>
    <div class="overflow-x-auto mb-6" v-else>
      <table class="table table-zebra w-full">
        <thead>
          <tr>
            <th @click="sortBy('deviceId')" class="cursor-pointer">
              ID
              <span v-if="sortKey === 'deviceId'">{{ sortOrder === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th @click="sortBy('deviceName')" class="cursor-pointer">
              이름
              <span v-if="sortKey === 'deviceName'">{{ sortOrder === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th @click="sortBy('deviceType')" class="cursor-pointer">
              타입
              <span v-if="sortKey === 'deviceType'">{{ sortOrder === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th @click="sortBy('owner')" class="cursor-pointer">
              소유자
              <span v-if="sortKey === 'owner'">{{ sortOrder === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th @click="sortBy('latitude')" class="cursor-pointer">
              위도
              <span v-if="sortKey === 'latitude'">{{ sortOrder === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th @click="sortBy('longitude')" class="cursor-pointer">
              경도
              <span v-if="sortKey === 'longitude'">{{ sortOrder === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th @click="sortBy('status')" class="cursor-pointer">
              상태
              <span v-if="sortKey === 'status'">{{ sortOrder === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th @click="sortBy('createdAt')" class="cursor-pointer">
              등록일
              <span v-if="sortKey === 'createdAt'">{{ sortOrder === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th>액션</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="device in sortedDevices"
            :key="device.deviceId"
            :class="{ 'bg-base-300': selectedDeviceId === device.deviceId, 'cursor-pointer': true }"
            @click="selectDevice(device.deviceId)"
          >
            <td>{{ device.deviceId }}</td>
            <td>{{ device.deviceName }}</td>
            <td>{{ device.deviceType }}</td>
            <td>{{ device.owner }}</td>
            <td>{{ device.latitude }}</td>
            <td>{{ device.longitude }}</td>
            <td>{{ device.status }}</td>
            <td>{{ new Date(device.createdAt).toLocaleDateString() }}</td>
            <td class="flex space-x-2 items-center">
              <button
                @click.stop="editDevice(device)"
                class="btn btn-ghost btn-xs btn-info tooltip tooltip-top"
                data-tip="수정"
              >
                <i class="fas fa-edit"></i>
              </button>
              <button
                @click.stop="confirmDeleteDevice(device.deviceId)"
                class="btn btn-ghost btn-xs btn-error tooltip tooltip-top"
                data-tip="삭제"
              >
                <i class="fas fa-trash-alt"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 신규 등록 버튼 (이제 수정/삭제 버튼은 각 행에 있습니다) -->
    <div class="flex justify-end space-x-2 mb-6">
      <button @click="newDevice" class="btn btn-success">신규 등록</button>
      <!-- 기존 수정/삭제 버튼 제거 -->
    </div>

    <!-- 디바이스 등록/수정 폼 영역 -->
    <div v-if="showForm" class="card bg-base-200 shadow-md p-6">
      <h3 class="text-xl font-semibold mb-4">
        {{ formMode === 'new' ? '새 디바이스 등록' : '디바이스 정보 수정' }}
      </h3>
      <form @submit.prevent="saveDevice" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="form-control">
          <label for="deviceId" class="label">
            <span class="label-text">디바이스 ID</span>
          </label>
          <input
            type="text"
            id="deviceId"
            v-model="currentDevice.deviceId"
            required
            disabled
            class="input input-bordered"
          />
        </div>
        <div class="form-control">
          <label for="deviceName" class="label">
            <span class="label-text">디바이스 이름</span>
          </label>
          <input
            type="text"
            id="deviceName"
            v-model="currentDevice.deviceName"
            required
            class="input input-bordered"
          />
        </div>
        <div class="form-control">
          <label for="deviceType" class="label">
            <span class="label-text">디바이스 타입</span>
          </label>
          <select
            id="deviceType"
            v-model="currentDevice.deviceType"
            required
            class="select select-bordered"
          >
            <option value="">선택</option>
            <option value="sensor">센서</option>
            <option value="water-purifier-robot">수질 정화 로봇</option>
            <option value="cctv">CCTV</option>
          </select>
        </div>
        <div class="form-control">
          <label for="owner" class="label">
            <span class="label-text">소유자</span>
          </label>
          <input
            type="text"
            id="owner"
            v-model="currentDevice.owner"
            class="input input-bordered"
          />
        </div>
        <div class="form-control">
          <label for="latitude" class="label">
            <span class="label-text">위도</span>
          </label>
          <input
            type="number"
            step="any"
            id="latitude"
            v-model="currentDevice.latitude"
            class="input input-bordered"
          />
        </div>
        <div class="form-control">
          <label for="longitude" class="label">
            <span class="label-text">경도</span>
          </label>
          <input
            type="number"
            step="any"
            id="longitude"
            v-model="currentDevice.longitude"
            class="input input-bordered"
          />
        </div>
        <div class="form-control">
          <label for="status" class="label">
            <span class="label-text">상태</span>
          </label>
          <select id="status" v-model="currentDevice.status" class="select select-bordered">
            <option value="active">활성</option>
            <option value="inactive">비활성</option>
            <option value="maintenance">점검 중</option>
          </select>
        </div>
        <div class="md:col-span-2 form-control">
          <label for="description" class="label">
            <span class="label-text">설명</span>
          </label>
          <textarea
            id="description"
            v-model="currentDevice.description"
            rows="2"
            class="textarea textarea-bordered"
          ></textarea>
        </div>
        <div class="md:col-span-2 flex justify-end space-x-2 mt-4">
          <button type="submit" class="btn btn-primary">확인</button>
          <button type="button" @click="cancelForm" class="btn btn-neutral">취소</button>
        </div>
      </form>
    </div>
  </div>

  <!-- 삭제 확인 모달 -->
  <input type="checkbox" id="delete_modal" class="modal-toggle" v-model="showDeleteModal" />
  <div class="modal" role="dialog">
    <div class="modal-box">
      <h3 class="font-bold text-lg">디바이스 삭제 확인</h3>
      <p class="py-4">
        정말로 '<span class="font-semibold">{{ deviceToDeleteId }}</span
        >' 디바이스를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
      </p>
      <div class="modal-action">
        <label for="delete_modal" class="btn btn-neutral" @click="cancelDelete">취소</label>
        <button class="btn btn-error" @click="deleteDevice">삭제</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, inject, computed } from 'vue'; // computed import
import axios from 'axios';

const API_BASE_URL = process.env.VUE_APP_API_BASE_URL;

const devices = ref([]);
const currentDevice = ref({
  deviceId: '',
  deviceName: '',
  deviceType: '',
  owner: '',
  latitude: null,
  longitude: null,
  coordSystem: 'WGS84',
  status: 'active',
  description: '',
});
const showDeleteModal = ref(false);
const deviceToDeleteId = ref(null);

// UI 상태 관리
const selectedDeviceId = ref(null); // 목록에서 선택된 디바이스 ID
const showForm = ref(false); // 폼 표시 여부
const formMode = ref('new'); // 'new' 또는 'edit'

// 정렬 관련 상태
const sortKey = ref('');
const sortOrder = ref('asc'); // 'asc' 또는 'desc'

// main.js에서 provide된 showMessageBox 함수 inject
const showMessageBox = inject('showMessageBox');
// 전역 메시지 박스의 직접적인 상태 변수들도 inject (main.js 또는 App.vue에서 provide 필요)
const message = inject('message');
const messageType = inject('messageType');
const showMessage = inject('showMessage');

// 16자리 임의의 영숫자 해시를 생성하는 함수
const generateRandomHash = (length) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

// 함수 정의 순서: 사용되기 전에 정의
const resetForm = () => {
  currentDevice.value = {
    deviceId: '',
    deviceName: '',
    deviceType: '',
    owner: '',
    latitude: null,
    longitude: null,
    coordSystem: 'WGS84',
    status: 'active',
    description: '',
  };
  selectedDeviceId.value = null; // 폼 초기화 시 선택 해제
};

const cancelForm = () => {
  showForm.value = false;
  resetForm();
};

const fetchDevices = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/devices`);
    devices.value = response.data;
    console.log('Devices fetched:', devices.value);
  } catch (error) {
    console.error('디바이스 목록 조회 실패:', error);
    showMessageBox(
      '디바이스 목록 조회에 실패했습니다. 백엔드 서버가 실행 중인지, ' +
        'API_BASE_URL이 올바른지 확인해주세요.',
      'error'
    );
  }
};

const selectDevice = (deviceId) => {
  if (selectedDeviceId.value === deviceId) {
    selectedDeviceId.value = null; // 이미 선택된 항목을 다시 클릭하면 선택 해제
  } else {
    selectedDeviceId.value = deviceId;
  }
  showForm.value = false; // 다른 디바이스 선택 시 폼 숨기기
  resetForm(); // 폼 내용 초기화
};

const newDevice = () => {
  resetForm();
  formMode.value = 'new';
  // 신규 등록 시 16자리 임의의 해시 값 할당
  currentDevice.value.deviceId = generateRandomHash(16);
  showForm.value = true;
};

// editDevice 함수는 이제 테이블 행의 버튼에서 직접 호출됩니다.
const editDevice = (device) => {
  currentDevice.value = { ...device };
  formMode.value = 'edit';
  showForm.value = true;
  selectedDeviceId.value = device.deviceId; // 선택된 행 하이라이트 유지
};

const saveDevice = async () => {
  // 저장 확인 메시지
  const confirmSave = await new Promise((resolve) => {
    showMessageBox(
      `${formMode.value === 'new' ? '등록' : '수정'}하시겠습니까?`,
      'info',
      5000 // 5초 후 메시지 사라짐
    );
    // 확인/취소 버튼을 포함한 커스텀 모달이 필요하지만,
    // 현재 showMessageBox는 단순 알림이므로, 여기서는 바로 진행합니다.
    // 실제 구현에서는 confirm 모달을 띄우고 사용자의 응답을 기다려야 합니다.
    resolve(true); // 일단 항상 true로 가정
  });

  if (!confirmSave) return;

  try {
    const deviceData = { ...currentDevice.value };

    deviceData.latitude = deviceData.latitude ? parseFloat(deviceData.latitude) : null;
    deviceData.longitude = deviceData.longitude ? parseFloat(deviceData.longitude) : null;

    if (formMode.value === 'edit') {
      const response = await axios.put(
        `${API_BASE_URL}/devices/${deviceData.deviceId}`,
        deviceData
      );
      console.log('디바이스 수정 성공:', response.data);
      showMessageBox('디바이스가 성공적으로 수정되었습니다.', 'success');
    } else {
      // formMode.value === 'new'
      const response = await axios.post(`${API_BASE_URL}/devices`, deviceData);
      console.log('디바이스 등록 성공:', response.data);
      showMessageBox('디바이스가 성공적으로 등록되었습니다.', 'success');
    }
    cancelForm(); // 저장 후 폼 숨기기 및 초기화
    fetchDevices(); // 목록 새로고침
  } catch (error) {
    console.error('디바이스 저장 실패:', error);
    showMessageBox(
      '디바이스 저장에 실패했습니다: ' +
        (error.response?.data?.message || error.message) +
        '. 백엔드 서버가 실행 중인지, API_BASE_URL이 올바른지 확인해주세요.',
      'error'
    );
  }
};

// 함수 정의 순서: 사용되기 전에 정의 (deleteDevice보다 위에 위치)
const cancelDelete = () => {
  showDeleteModal.value = false;
  deviceToDeleteId.value = null; // 삭제할 디바이스 ID 초기화
  selectedDeviceId.value = null; // 선택된 디바이스 하이라이트 해제

  // 전역 메시지 박스(토스트)가 있다면 즉시 숨김
  if (showMessage.value) {
    showMessage.value = false;
    message.value = '';
    messageType.value = '';
  }
};

const confirmDeleteDevice = (deviceId) => {
  if (!deviceId) {
    showMessageBox('삭제할 디바이스를 목록에서 선택해주세요.', 'info');
    return;
  }
  deviceToDeleteId.value = deviceId;
  showDeleteModal.value = true; // v-model을 통해 모달을 엽니다.
};

const deleteDevice = async () => {
  if (!deviceToDeleteId.value) return;

  try {
    await axios.delete(`${API_BASE_URL}/devices/${deviceToDeleteId.value}`);
    console.log('디바이스 삭제 성공:', deviceToDeleteId.value);
    showMessageBox('디바이스가 성공적으로 삭제되었습니다.', 'success');
    fetchDevices(); // 목록 새로고침
  } catch (error) {
    console.error('디바이스 삭제 실패:', error);
    showMessageBox(
      '디바이스 삭제에 실패했습니다: ' +
        (error.response?.data?.message || error.message) +
        '. 백엔드 서버가 실행 중인지, API_BASE_URL이 올바른지 확인해주세요.',
      'error'
    );
  } finally {
    cancelDelete(); // 성공/실패 여부와 관계없이 모달을 닫고 상태 초기화
  }
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

// 정렬된 디바이스 목록을 반환하는 computed 속성
const sortedDevices = computed(() => {
  if (!sortKey.value) {
    return devices.value;
  }

  return [...devices.value].sort((a, b) => {
    let valA = a[sortKey.value];
    let valB = b[sortKey.value];

    // createdAt 필드 특별 처리 (날짜 객체로 변환하여 비교)
    if (sortKey.value === 'createdAt') {
      // eslint-disable-next-line prettier/prettier
      valA = a.createdAt ? new Date(a.createdAt).getTime() : (sortOrder.value === 'asc' ? -Infinity : Infinity);
      // eslint-disable-next-line prettier/prettier
      valB = b.createdAt ? new Date(b.createdAt).getTime() : (sortOrder.value === 'asc' ? -Infinity : Infinity);
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

// 컴포넌트 마운트 시 디바이스 목록 로드
onMounted(() => {
  fetchDevices();
});
</script>

<style scoped>
/* 이 컴포넌트에만 적용되는 스타일 */
/* DaisyUI 클래스를 주로 사용하므로, 여기에 커스텀 스타일은 최소화됩니다. */
.cursor-pointer {
  cursor: pointer;
}
.cursor-pointer:hover {
  background-color: #f0f4f8; /* 호버 효과 */
}
</style>
