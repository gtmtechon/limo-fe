import { createRouter, createWebHistory } from 'vue-router';
import DeviceManagementView from '../views/DeviceManagementView.vue';
import DeviceStatusView from '../views/DeviceStatusView.vue';
import RobotLocationView from '../views/RobotLocationView.vue';
import SensorDataChartView from '../views/SensorDataChartView.vue';
import CCTVImagesView from '../views/CCTVImagesView.vue';

const routes = [
  {
    path: '/',
    name: 'device-management',
    component: DeviceManagementView,
  },
  {
    path: '/device-status',
    name: 'device-status',
    component: DeviceStatusView,
  },
  {
    path: '/robot-location',
    name: 'robot-location',
    component: RobotLocationView,
  },
  {
    path: '/sensor-data-chart',
    name: 'sensor-data-chart',
    component: SensorDataChartView,
  },
  {
    path: '/cctv-images',
    name: 'cctv-images',
    component: CCTVImagesView,
  },
];

const router = createRouter({
  // Vue CLI 환경에서는 process.env.BASE_URL을 사용합니다.
  // import.meta.env.BASE_URL은 Vite와 같은 환경에서 사용됩니다.
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
