<template>
  <div id="app" class="container">
    <div class="card bg-base-100 shadow-xl flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-gray-800">수질관리 시스템</h1>
    </div>

    <!-- 네비게이션 탭 디자인 개선 -->
    <!-- py-4 클래스를 추가하여 탭 배경의 수직 패딩을 조정합니다. -->
    <div class="card bg-base-100 shadow-xl flex justify-between items-center mb-6py-2">
      <div role="tablist" class="tabs tabs-boxed mb-6 py-3"> 
        <router-link to="/" role="tab" class="tab" :class="{ 'tab-active': $route.path === '/' }">
          디바이스 관리
        </router-link>
        <router-link
          to="/device-status"
          role="tab"
          class="tab"
          :class="{ 'tab-active': $route.path === '/device-status' }"
        >
          디바이스 상태
        </router-link>
        <router-link
          to="/robot-location"
          role="tab"
          class="tab"
          :class="{ 'tab-active': $route.path === '/robot-location' }"
        >
          로봇 위치 추적
        </router-link>
        <router-link
          to="/sensor-data-chart"
          role="tab"
          class="tab"
          :class="{ 'tab-active': $route.path === '/sensor-data-chart' }"
        >
          센서 데이터 차트
        </router-link>
        <router-link
          to="/cctv-images"
          role="tab"
          class="tab"
          :class="{ 'tab-active': $route.path === '/cctv-images' }"
        >
          CCTV 이미지
        </router-link>
      </div>
    </div>

    <!-- 전역 메시지 박스 -->
    <div v-if="showMessage" :class="['message-box', messageType]">
      {{ message }}
    </div>

    <router-view></router-view>
  </div>
</template>

<script setup>
import { inject } from 'vue';

// main.js에서 provide된 메시지 박스 상태 및 함수를 inject
const message = inject('message');
const messageType = inject('messageType');
const showMessage = inject('showMessage');
</script>

<style>
/* 전역 스타일은 src/assets/global.css에 정의되었으므로 여기서는 최소화 */
</style>
