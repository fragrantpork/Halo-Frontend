<script setup lang="ts">
import { onMounted } from 'vue'
import { useDrones } from '@/composables/useDrones'
import { DroneStatus } from '@/types/fleet'

const { drones, loading, error, isLive, fetchDrones, deleteDrone } = useDrones()

onMounted(() => {
  fetchDrones()
})

/**
 * Maps drone operational status to color-coded chips for quick visual assessment of fleet readiness.
 */
const getStatusColor = (status: DroneStatus): string => {
  switch (status) {
    case DroneStatus.Ready: return 'success'
    case DroneStatus.Flying: return 'info'
    case DroneStatus.Charging: return 'warning'
    case DroneStatus.Maintenance: return 'error'
    default: return 'grey'
  }
}

/**
 * Maps battery percentage values to color-coded progress bars for quick visual assessment of drone fuel levels.
 */
const getBatteryColor = (percent: number): string => {
  if (percent > 50) return 'success'
  if (percent > 20) return 'warning'
  return 'error'
}

/**
 * Defines the column headers for the drone fleet data table, including sorting and alignment options.
 */
const tableHeaders = [
  { title: 'Callsign / Name', key: 'name', sortable: true },
  { title: 'Operational Status', key: 'status', sortable: true },
  { title: 'Battery Fuel', key: 'batteryPercent', width: '220px' },
  { title: 'Assigned Mission', key: 'missionName', sortable: true },
  { title: 'Management Actions', key: 'actions', sortable: false, align: 'end' as const },
]

/**
 * Production-safe deletion interceptor to prevent accidental pilot misclicks.
 */
const confirmDecommission = async (id: number, name: string) => {
  const confirmed = window.confirm(`Are you absolutely sure you want to decommission drone unit "${name}"?`)
  if (confirmed) {
    try {
      await deleteDrone(id)
    } catch (err) {
      window.alert('Failed to delete drone. Check backend database logs.')
    }
  }
}
</script>

<template>
  <v-container fluid class="pa-6">
    <!-- Header -->
    <v-row align="center" class="mb-4">
      <v-col>
        <div class="d-flex align-center ga-3">
          <h1 class="text-h4 font-weight-black">Drone Fleet Telemetry Dashboard</h1>
          
          <!-- Live Status Chip -->
          <v-chip
            :color="isLive ? 'success' : 'error'"
            size="x-small"
            variant="flat"
            class="text-uppercase font-weight-bold"
          >
            {{ isLive ? 'Live Sync Active' : 'Offline' }}
          </v-chip>
        </div>
      </v-col>
    </v-row>

    <!-- Fleet Connection Error Alert -->
    <v-alert
      v-if="error"
      type="error"
      variant="tonal"
      title="Fleet Connection Error"
      text="Unable to pull tracking parameters from the Micronaut backend gateway matrix."
      closable
      class="mb-6"
    />

    <!-- Drone Fleet Data Table -->
    <v-card variant="outlined" class="border-opacity-25 rounded-lg">
      <v-data-table 
        :headers="tableHeaders" 
        :items="drones" 
        :loading="loading"
        hover
        class="elevation-0"
      >
        <!-- Custom slot templates for each column to enhance UX with dynamic styling and interactivity -->
        <template #item:status="{ item }">
          <v-chip 
            :color="getStatusColor(item.status)" 
            size="small" 
            variant="tonal"
            class="font-weight-medium text-uppercase"
          >
            {{ item.status }}
          </v-chip>
        </template>

        <!-- battery progress tracking column layout -->
        <template #item:batteryPercent="{ item }">
          <v-progress-linear 
            :model-value="item.batteryPercent" 
            :color="getBatteryColor(item.batteryPercent)"
            height="18" 
            rounded
          >
            <template #default="{ value }">
              <strong class="text-caption text-white font-weight-black">
                {{ Math.round(value) }}%
              </strong>
            </template>
          </v-progress-linear>
        </template>

        <!-- Action buttons for each row, with safety interlocks -->
        <template #item:actions="{ item }">
          <v-btn 
            icon="mdi-delete-outline" 
            size="small" 
            color="error"
            variant="text" 
            :disabled="item.status === DroneStatus.Flying"
            @click="confirmDecommission(item.id, item.name)" 
          />
        </template>
      </v-data-table>
    </v-card>
  </v-container>
</template>
