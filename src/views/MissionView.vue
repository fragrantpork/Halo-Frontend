<!-- src/views/MissionsView.vue -->
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMissions } from '@/composables/useMissions'
import MissionFormDialog from '@/components/MissionFormDialog.vue'
import { MissionStatus } from '@/types/fleet'
import type { Mission } from '@/types/fleet'

const router = useRouter()

const { 
  missions, 
  loading, 
  error, 
  isLive, 
  fetchMissions, 
  createMission, 
  updateMission, 
  deleteMission 
} = useMissions()

const isDialogOpen = ref(false)
const activeEditingTarget = ref<Mission | null>(null)

onMounted(() => {
  fetchMissions()
})

/** Maps color to status */
const getStatusColor = (status: MissionStatus): string => {
  switch (status) {
    case MissionStatus.Planning: return 'blue-grey-lighten-1'
    case MissionStatus.Active: return 'info'
    case MissionStatus.Completed: return 'success'
    case MissionStatus.Aborted: return 'error'
    default: return 'grey'
  }
}

const openCreateModal = () => {
  activeEditingTarget.value = null
  isDialogOpen.value = true
}

const openEditModal = (targetMission: Mission) => {
  activeEditingTarget.value = targetMission
  isDialogOpen.value = true
}

/**
 * crud update: mission creation and modification.
 */
const handleSaveTransaction = async (payload: { name: string; description: string; status: MissionStatus }) => {
  try {
    if (activeEditingTarget.value) {
      await updateMission(activeEditingTarget.value.id, payload)
    } else {
      await createMission(payload)
    }
    isDialogOpen.value = false
  } catch (err) {
    window.alert('Failed to process mission modifications. Check backend server logs.')
  }
}

/** mission deletion: for accidental delete if MIssion is active.
 */
const handlePurgeRequest = async (id: number, name: string, status: MissionStatus) => {
  if (status === MissionStatus.Active) {
    window.alert('Operation Blocked: Cannot wipe an active, deployed tactical mission configuration.')
    return
  }

  const confirmed = window.confirm(`Are you absolutely sure you want to permanently erase mission "${name}"?`)
  if (confirmed) {
    try {
      await deleteMission(id)
    } catch (err) {
      window.alert('Delete failed. Ensure no active drone airframes remain assigned to this mission.')
    }
  }
}

const tableHeaders = [
  { title: 'Operations Mission Profile', key: 'name', sortable: true },
  { title: 'Lifecycle Phase', key: 'status', sortable: true },
  { title: 'Assigned Airframes', key: 'droneCount', align: 'center' as const, sortable: true },
  { title: 'Management Controls', key: 'actions', sortable: false, align: 'end' as const },
]
</script>

<template>
  <v-container fluid class="pa-6">
    <!-- header -->
    <v-row align="center" class="mb-4">
      <v-col>
        <div class="d-flex align-center ga-3 flex-wrap">
          <h1 class="text-h4 font-weight-black">Flight Matrix Operations Missions</h1>
          
          <!-- live telemetry status -->
          <v-chip
            :color="isLive ? 'success' : 'error'"
            size="x-small"
            variant="flat"
            class="text-uppercase font-weight-bold"
          >
            {{ isLive ? 'Live Sync' : 'Disconnected' }}
          </v-chip>
        </div>
      </v-col>
      <v-col cols="auto">
        <v-btn 
          color="primary" 
          prepend-icon="mdi-plus" 
          class="font-weight-bold px-4"
          @click="openCreateModal"
        >
          Schedule New Mission
        </v-btn>
      </v-col>
    </v-row>

    <!-- system alerts -->
    <v-alert
      v-if="error"
      type="error"
      variant="tonal"
      title="Relational Data Failure"
      text="Could not sync operational tracking models with your Micronaut backend service layer."
      class="mb-6"
    />

    <!-- mission data table -->
    <v-card variant="outlined" class="border-opacity-25 rounded-lg">
      <v-data-table 
        :headers="tableHeaders" 
        :items="missions" 
        :loading="loading"
        hover
        class="elevation-0"
      >
        <!-- column template for mission -->
        <template #item:name="{ item }">
          <v-btn
            variant="text"
            color="primary"
            class="text-none font-weight-bold pa-0 h-auto"
            style="min-width: 0;"
            @click="router.push(`/missions/${item.id}`)"
          >
            {{ item.name }}
          </v-btn>
        </template>

        <!-- Dynamic Status Tag Element Component mapping -->
        <template #item:status="{ item }">
          <v-chip 
            :color="getStatusColor(item.status)" 
            size="small" 
            variant="flat"
            class="font-weight-black text-uppercase tracking-wide"
          >
            {{ item.status }}
          </v-chip>
        </template>

        <!-- drone counter -->
        <template #item:droneCount="{ item }">
          <v-badge 
            :content="item.droneCount" 
            :color="item.droneCount > 0 ? 'primary' : 'grey-lighten-1'"
            inline
            class="font-weight-bold"
          />
        </template>

        <!-- action button controls -->
        <template #item:actions="{ item }">
          <div class="d-flex justify-end ga-1">
            <v-btn 
              icon="mdi-pencil-outline" 
              size="small" 
              color="secondary"
              variant="text" 
              @click="openEditModal(item)" 
            />
            <v-btn 
              icon="mdi-trash-can-outline" 
              size="small" 
              color="error"
              variant="text" 
              :disabled="item.status === MissionStatus.Active"
              @click="handlePurgeRequest(item.id, item.name, item.status)" 
            />
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- mission form  -->
    <MissionFormDialog 
      v-model="isDialogOpen" 
      :mission="activeEditingTarget" 
      @save="handleSaveTransaction" 
    />
  </v-container>
</template>
