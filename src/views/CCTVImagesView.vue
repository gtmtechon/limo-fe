<template>
  <div class="card bg-base-100 shadow-xl">
    <h2 class="text-2xl font-semibold mb-4">CCTV 이벤트 이미지</h2>
    <button @click="fetchCCTVImages" class="btn btn-primary mb-4">이미지 조회</button>

    <div v-if="cctvImages.length === 0" class="text-gray-500">조회된 CCTV 이미지가 없습니다.</div>
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <div
        v-for="image in cctvImages"
        :key="image.id"
        class="card card-compact bg-base-200 shadow-md image-full"
      >
        <figure>
          <img :src="image.blob_url" :alt="image.description" class="w-full h-48 object-cover" />
        </figure>
        <div class="card-body p-4">
          <h2 class="card-title text-sm text-gray-600 mb-1">
            {{ new Date(image.event_timestamp).toLocaleString() }}
          </h2>
          <p class="font-semibold text-lg">{{ image.event_type }}</p>
          <p class="text-sm text-gray-700">{{ image.description }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, inject } from 'vue';
import axios from 'axios';

const API_BASE_URL = process.env.VUE_APP_API_BASE_URL;

const cctvImages = ref([]);

// main.js에서 provide된 showMessageBox 함수 inject
const showMessageBox = inject('showMessageBox');

// CCTV 이미지 조회 함수 (onMounted보다 위에 정의)
const fetchCCTVImages = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/cctv-images`);
    cctvImages.value = response.data;
    console.log('CCTV images fetched:', cctvImages.value);
  } catch (error) {
    console.error('CCTV 이미지 조회 실패:', error);
    showMessageBox(
      'CCTV 이미지 조회에 실패했습니다. 백엔드 서버가 실행 중인지, ' +
        'API_BASE_URL이 올바른지 확인해주세요.',
      'error'
    );
  }
};

// 컴포넌트 마운트 시 이미지 로드
onMounted(() => {
  fetchCCTVImages(); // 초기 이미지 로드
});
</script>

<style scoped>
/* 이 컴포넌트에만 적용되는 스타일 */
</style>
