<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/services/api'
import { useFleetSocket } from '@/composables/useFleetSocket'
import type { Drone, Mission } from '@/types/fleet'
import { useFleetStyles } from '@/composables/useFleetStyles'

const route = useRoute()
const router = useRouter()

const missionId = Number(route.params.id)

// get color mapping
const { getMissionStatusColor, getDroneStatusColor } = useFleetStyles()

const mission = ref<Mission | null>(null)
const assignedDrones = ref<Drone[]>([])

const isLoading = ref(false)
const errorMsg = ref<string | null>(null)

/** fetch active mission details and assign drones from backend*/
const fetchMissionContext = async () => {
  isLoading.value = true
  errorMsg.value = null
  
  try {
    const [missionRes, dronesRes] = await Promise.all([
      api.get<Mission>(`/missions/${missionId}`),
      api.get<Drone[]>('/drones')
    ])
    
    mission.value = missionRes.data
    assignedDrones.value = dronesRes.data.filter(drone => drone.missionId === missionId)
  } catch (err) {
    console.error('Failed to resolve tactical mission details context:', err)
    errorMsg.value = 'Could not retrieve operational data for this mission configuration.'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchMissionContext()
})

const droneHeaders = [
  { title: 'Airframe Callsign', key: 'name', sortable: true },
  { title: 'Telemetry Status', key: 'status', sortable: true },
  { title: 'Battery Fuel', key: 'batteryPercent', width: '200px' },
  { title: 'Geospatial Location', key: 'coordinates', sortable: false },
]

// --- websocket integration for live updates ---

// connect and listen to updates for mission and drone status.
useFleetSocket((event) => {
  if (event.type === 'MISSION_UPDATED') {
    const updatedMission = event.payload as Mission
    if (updatedMission.id === missionId) {
      mission.value = updatedMission
    }
  }

  if (event.type === 'DRONE_UPDATED') {
    const updatedDrone = event.payload as Drone
    
    if (updatedDrone.missionId === missionId) {
      const index = assignedDrones.value.findIndex(d => d.id === updatedDrone.id)
      if (index !== -1) {
        assignedDrones.value[index] = updatedDrone
      } else {
        assignedDrones.value.push(updatedDrone)
      }
    } else {
      // drop if drone is reassigned to a different mission
      assignedDrones.value = assignedDrones.value.filter(d => d.id !== updatedDrone.id)
    }
  }

  if (event.type === 'DRONE_DELETED') {
    const targetId = Number(event.payload)
    assignedDrones.value = assignedDrones.value.filter(d => d.id !== targetId)
  }
})
</script>

<template>
  <v-container fluid class="pa-6">
    <!-- nav back link -->
    <v-btn 
      prepend-icon="mdi-arrow-left" 
      variant="text" 
      color="secondary" 
      class="mb-4 font-weight-bold"
      @click="router.push('/missions')"
    >
      Back to Missions Overview
    </v-btn>

    <!-- loading view -->
    <v-row v-if="isLoading" justify="center" align="center" style="min-height: 250px;">
      <v-progress-circular indeterminate color="primary" size="64" />
    </v-row>

    <!-- connect error message-->
    <v-alert
      v-else-if="errorMsg"
      type="error"
      variant="tonal"
      title="Mission Context Unavailable"
      :text="errorMsg"
      class="mb-6"
    />

    <!-- system layout pannel -->
    <div v-else-if="mission">
      <v-row class="mb-6">
        <v-col cols="12">
          <v-card variant="outlined" class="border-opacity-25 pa-4 rounded-lg">
            <div class="d-flex align-center justify-space-between flex-wrap ga-3">
              <div>
                <div class="text-caption text-uppercase text-medium-emphasis font-weight-black tracking-wider">
                  Operational Control Profile #{{ mission.id }}
                </div>
                <h2 class="text-h4 font-weight-black mt-1">{{ mission.name }}</h2>
              </div>
              
              <v-chip 
                :color="getMissionStatusColor(mission.status)" 
                variant="flat" 
                size="large"
                class="text-uppercase font-weight-black tracking-wide"
              >
                {{ mission.status }}
              </v-chip>
            </div>

            <v-divider class="my-4" />

            <p class="text-body-1 text-medium-emphasis mb-0">
              {{ mission.description || 'No strategic operational parameters or flight descriptions provided.' }}
            </p>
          </v-card>
        </v-col>
      </v-row>

      <!-- assigned fleet units -->
      <h3 class="text-h6 font-weight-bold mb-3 d-flex align-center ga-2">
        <v-icon icon="mdi-quadcopter" color="primary" />
        Assigned Fleet Units ({{ assignedDrones.length }})
      </h3>

      <v-card variant="outlined" class="border-opacity-25 rounded-lg">
        <v-data-table
          :headers="droneHeaders"
          :items="assignedDrones"
          no-data-text="No airframes currently mapped to this tracking assignment pattern."
          class="elevation-0"
        >
          <!-- status chips -->
          <template #item:status="{ item }">
            <v-chip 
              :color="getDroneStatusColor(item.status)" 
              size="small" 
              variant="tonal" 
              class="font-weight-medium text-uppercase"
            >
              {{ item.status }}
            </v-chip>
          </template>

          <!-- live progress for drone battery -->
          <template #item:batteryPercent="{ item }">
            <v-progress-linear 
              :model-value="item.batteryPercent" 
              color="primary"
              height="18" 
              rounded
            >
              <template #default="{ value }">
                <span class="text-caption text-white font-weight-black">
                  {{ Math.round(value) }}%
                </span>
              </template>
            </v-progress-linear>
          </template>

          <!-- geospatial location cell -->
          <template #item:coordinates="{ item }">
            <span v-if="item.latitude !== null && item.longitude !== null" class="font-code text-caption font-weight-bold">
              {{ item.latitude.toFixed(4) }}°, {{ item.longitude.toFixed(4) }}°
            </span>
            <span v-else class="text-caption text-disabled font-italic">
              No Telemetry GPS Lock Detected
            </span>
          </template>
        </v-data-table>
      </v-card>
    </div>
  </v-container>
</template>
