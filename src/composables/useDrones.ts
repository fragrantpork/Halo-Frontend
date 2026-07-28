import { ref } from 'vue'
import { api } from '@/services/api'
import type { Drone, DroneRequest } from '@/types/fleet'
import { useFleetSocket } from './useFleetSocket'

export function useDrones() {
  const drones = ref<Drone[]>([])
  const isLoading = ref(false)
  const errorMsg = ref<string | null>(null)

  // ** REST API calls
  const fetchDrones = async (): Promise<void> => {
    isLoading.value = true
    errorMsg.value = null
    
    try {
      const response = await api.get<Drone[]>('/drones')
      drones.value = response.data
    } catch (err) {
      console.error('REST flight telemetry synch failed:', err)
      errorMsg.value = 'Failed to load active fleet data.'
    } finally {
      isLoading.value = false
    }
  }

  const createDrone = async (request: DroneRequest): Promise<void> => {
    try {
      await api.post('/drones', request)
      //skip local state update, because socket will push new drone array automatically
    } catch (err) {
      console.error('Failed to dispatch registration payload for new drone:', err)
      throw err
    }
  }

  const updateDrone = async (id: number, request: DroneRequest): Promise<void> => {
    try {
      await api.put(`/drones/${id}`, request)
    } catch (err) {
      console.error(`Failed to push telemetry updates for drone ID ${id}:`, err)
      throw err
    }
  }

  const deleteDrone = async (id: number): Promise<void> => {
    try {
      await api.delete(`/drones/${id}`)
    } catch (err) {
      console.error(`Failed to decommission drone unit ID ${id}:`, err)
      throw err
    }
  }

  // ** Live Socket event handlers

  const handleSocketEvent = (event: { type: string; payload: unknown }) => {
    switch (event.type) {
      case 'DRONE_CREATED': {
        const newDrone = event.payload as Drone
        // Prevent duplicate appending loops if local REST calls race against sockets
        if (!drones.value.some(drone => drone.id === newDrone.id)) {
          drones.value.push(newDrone)
        }
        break
      }

      case 'DRONE_UPDATED': {
        const updatedDrone = event.payload as Drone
        const targetIndex = drones.value.findIndex(drone => drone.id === updatedDrone.id)
        
        if (targetIndex !== -1) {
          //replace current drone array with an updated one.
          drones.value[targetIndex] = updatedDrone
        } else {
          drones.value.push(updatedDrone)
        }
        break
      }

      case 'DRONE_DELETED': {
        const decommissionedId = Number(event.payload)
        drones.value = drones.value.filter(drone => drone.id !== decommissionedId)
        break
      }
      
      default:
        //ignore other events
        break
    }
  }

  //bind to live stream engine
  const { isConnected } = useFleetSocket(handleSocketEvent)

  return { 
    drones, 
    loading: isLoading, 
    error: errorMsg,
    isLive: isConnected,
    fetchDrones, 
    createDrone, 
    updateDrone, 
    deleteDrone 
  }
}
