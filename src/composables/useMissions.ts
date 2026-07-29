// src/composables/useMissions.ts
import { ref } from 'vue'
import { api } from '@/services/api'
import type { Mission, MissionRequest } from '@/types/fleet'
import { useFleetSocket } from './useFleetSocket'

export function useMissions() {
  const missions = ref<Mission[]>([])
  const isLoading = ref(false)
  const errorMsg = ref<string | null>(null)

  const fetchMissions = async (): Promise<void> => {
    isLoading.value = true
    errorMsg.value = null
    
    try {
      const response = await api.get<Mission[]>('/missions')
      missions.value = response.data
    } catch (err) {
      console.error('Failed to sync global operational missions list:', err)
      errorMsg.value = 'Failed to load tracking missions.'
    } finally {
      isLoading.value = false
    }
  }

  const createMission = async (request: MissionRequest): Promise<void> => {
    try {
      await api.post('/missions', request)
      // manual fetch is not required here because the WebSocket broadcast will trigger a reactive sync across all clients.
    } catch (err) {
      console.error('Failed to create new operational flight mission configuration:', err)
      throw err
    }
  }

  const updateMission = async (id: number, request: MissionRequest): Promise<void> => {
    try {
      await api.put(`/missions/${id}`, request)
    } catch (err) {
      console.error(`Failed to dispatch mission update body for ID ${id}:`, err)
      throw err
    }
  }

  const deleteMission = async (id: number): Promise<void> => {
    try {
      await api.delete(`/missions/${id}`)
    } catch (err) {
      console.error(`Failed to terminate mission configuration entity reference ID ${id}:`, err)
      throw err
    }
  }

  // --- live stream processors---

  const handleSocketMutation = (event: { type: string; payload: unknown }) => {
    switch (event.type) {
      case 'MISSION_UPDATED': {
        const updatedMission = event.payload as Mission
        const targetIndex = missions.value.findIndex(mission => mission.id === updatedMission.id)
        
        if (targetIndex !== -1) {
          // force update the existing mission in the reactive array
          missions.value[targetIndex] = updatedMission
        } else {
          missions.value.push(updatedMission)
        }
        break
      }

      case 'MISSION_DELETED': {
        const purgedMissionId = Number(event.payload)
        missions.value = missions.value.filter(mission => mission.id !== purgedMissionId)
        break
      }

      default:
        // filter out irrelevant events to avoid unnecessary reactivity triggers
        break
    }
  }

  // websocket listener
  const { isConnected } = useFleetSocket(handleSocketMutation)

  return { 
    missions, 
    loading: isLoading, 
    error: errorMsg,
    isLive: isConnected,
    fetchMissions, 
    createMission, 
    updateMission, 
    deleteMission 
  }
}
