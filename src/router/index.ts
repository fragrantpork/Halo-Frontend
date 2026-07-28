import { createRouter, createWebHistory } from 'vue-router'
import FleetDashboard from '@/views/FleetDashboard.vue'
import MissionView from '@/views/MissionView.vue'
import MissionDetail from '@/views/MissionDetail.vue'

export default createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: FleetDashboard },
    { path: '/mission', component: MissionView },
    { path: '/mission/:id', component: MissionDetail },
  ],
})