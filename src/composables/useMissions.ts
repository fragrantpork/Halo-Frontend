// src/composables/useMissions.ts
import { ref } from 'vue'
import { api } from '@/services/api'
import type { Mission, MissionStatus } from '@/types/fleet'
import { useFleetSocket } from './useFleetSocket'

interface MissionRequest { name: string; description: string; status: MissionStatus }

export function useMissions() {
  const missions = ref<Mission[]>([])
  const loading = ref(false)

  const fetchMissions = async () => {
    loading.value = true
    missions.value = (await api.get<Mission[]>('/missions')).data
    loading.value = false
  }

  const createMission = (req: MissionRequest) => api.post('/missions', req)
  const updateMission = (id: number, req: MissionRequest) => api.put(`/missions/${id}`, req)
  const deleteMission = (id: number) => api.delete(`/missions/${id}`)

  useFleetSocket((event) => {
    if (event.type === 'MISSION_UPDATED') {
      const updated = event.payload as Mission
      const idx = missions.value.findIndex((m) => m.id === updated.id)
      if (idx !== -1) missions.value[idx] = updated
      else missions.value.push(updated)
    } else if (event.type === 'MISSION_DELETED') {
      missions.value = missions.value.filter((m) => m.id !== (event.payload as number))
    }
  })

  return { missions, loading, fetchMissions, createMission, updateMission, deleteMission }
}