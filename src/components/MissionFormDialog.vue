<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { MissionStatus } from '@/types/fleet'
import type { Mission } from '@/types/fleet'

const props = defineProps<{
  modelValue: boolean
  mission: Mission | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: [payload: { name: string; description: string; status: MissionStatus }]
}>()


const name = ref('')
const description = ref('')
const status = ref<MissionStatus>(MissionStatus.Planning)

const isFormValid = ref(false)

const statusOptions = [
  { title: 'Planning Phase', value: MissionStatus.Planning },
  { title: 'Active / Deployed', value: MissionStatus.Active },
  { title: 'Completed Successfully', value: MissionStatus.Completed },
  { title: 'Aborted / Cancelled', value: MissionStatus.Aborted },
]

// --- watcher hooks ---

watch(
  () => props.mission,
  (targetMission) => {
    name.value = targetMission?.name ?? ''
    description.value = targetMission?.description ?? ''
    status.value = targetMission?.status ?? MissionStatus.Planning
  },
  { immediate: true }
)

// --- action transmitters ---

const closeFormOverlay = () => {
  emit('update:modelValue', false)
}

const handleFormSubmission = () => {
  if (!name.value.trim()) {
    return
  }
  
  emit('save', {
    name: name.value.trim(),
    description: description.value.trim(),
    status: status.value,
  })
}

// --- validation rules ---
const inputValidationRules = {
  required: (value: string) => !!value?.trim() || 'Mission identifier callsign name is required.',
  maxLength: (value: string) => (value?.length ?? 0) <= 255 || 'Description parameter bounds exceeded.',
}

// card title based on new or existing mission
const formContextTitle = computed(() => (props.mission ? 'Modify Mission Context' : 'Schedule New Flight Mission'))
</script>

<template>
  <v-dialog 
    :model-value="modelValue" 
    max-width="540px"
    persistent
    @update:model-value="closeFormOverlay"
  >
    <v-card class="rounded-xl pa-2">
      <!-- header -->
      <v-card-title class="text-h6 font-weight-black pa-4 pb-2">
        {{ formContextTitle }}
      </v-card-title>

      <!-- input card-->
      <v-card-text class="pa-4 pt-0">
        <v-form v-model="isFormValid" @submit.prevent="handleFormSubmission">
          
          <!-- mission name input -->
          <v-text-field
            v-model="name"
            label="Mission Operations Name"
            placeholder="e.g. Sector-4 Agricultural Grid"
            :rules="[inputValidationRules.required]"
            variant="outlined"
            density="comfortable"
            class="mb-3"
            clearable
          />

          <!-- flight description -->
          <v-textarea
            v-model="description"
            label="Strategic Flight Brief Description"
            placeholder="Provide operational boundaries, targets, or camera profile details..."
            :rules="[inputValidationRules.maxLength]"
            variant="outlined"
            density="comfortable"
            rows="3"
            auto-grow
            class="mb-3"
          />

          <!-- status menu -->
          <v-select
            v-model="status"
            :items="statusOptions"
            item-title="title"
            item-value="value"
            label="Current Mission Lifecycle Phase"
            variant="outlined"
            density="comfortable"
          />
        </v-form>
      </v-card-text>

      <!-- action buttons-->
      <v-card-actions class="pa-4 pt-0">
        <v-spacer />
        <v-btn 
          variant="text" 
          color="secondary" 
          class="font-weight-bold" 
          @click="closeFormOverlay"
        >
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          class="font-weight-bold px-4"
          :disabled="!isFormValid"
          @click="handleFormSubmission"
        >
          {{ mission ? 'Update Plan' : 'Create Mission' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
