import { ref } from 'vue'
import { api } from '@/services/api'
import { DroneStatus, type Drone, type DroneRequest } from '@/types/fleet'
import { useFleetSocket } from './useFleetSocket'

export function useDrones() {
  const drones = ref<Drone[]>([])
  const isLoading = ref(false)
  const errorMsg = ref<string | null>(null)

  // Mock Data for local development and testing without a backend.
  const LOCAL_MOCK_DRONES: Drone[] = [
  {
    id: 101,
    name: 'Ghost-01 (Mock)',
    status: DroneStatus.Ready,
    batteryPercent: 100.0,
    latitude: 45.5122,
    longitude: -122.6584,
    missionId: null,
    missionName: 'Unassigned',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 102,
    name: 'Stratus-V (Mock)',
    status: DroneStatus.Flying,
    batteryPercent: 84.5,
    latitude: 45.5201,
    longitude: -122.6702,
    missionId: 1,
    missionName: 'Alpha Grid Survey',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 103,
    name: 'Recharge-Pod-A (Mock)',
    status: DroneStatus.Charging,
    batteryPercent: 14.0,
    latitude: 45.5002,
    longitude: -122.6421,
    missionId: null,
    missionName: 'Unassigned',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 104,
    name: 'Hangar-Scout (Mock)',
    status: DroneStatus.Maintenance,
    batteryPercent: 0.0,
    latitude: 45.5010,
    longitude: -122.6435,
    missionId: null,
    missionName: 'Grounded',
    lastUpdated: new Date().toISOString()
  }
]

  // ** REST API calls
  const fetchDrones = async (): Promise<void> => {
    isLoading.value = true
    errorMsg.value = null
    
    try {
      const response = await api.get<Drone[]>('/drones')
      
      // load dummy data if server is up but datbase is empty. (for testing)
      if (!response.data || response.data.length === 0) {
        console.warn('Backend database is empty. Hydrating UI with client-side fallback telemetry.')
        drones.value = LOCAL_MOCK_DRONES
      } else {
        drones.value = response.data
      }
    } catch (err) {
      console.error('REST flight telemetry synch failed:', err)
      // local mock data fallback for dev only.
      drones.value = LOCAL_MOCK_DRONES
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
