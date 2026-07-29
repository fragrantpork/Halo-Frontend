import {DroneStatus, MissionStatus} from '@/types/fleet'

// Provides color mappings for drone and mission status values

export function useFleetStyles() {
    //maps colors for mission status
    const getMissionStatusColor = (status: MissionStatus): string => {
        switch (status) {
            case MissionStatus.Planning: return 'blue-grey'
            case MissionStatus.Active: return 'info'
            case MissionStatus.Completed: return 'success'
            case MissionStatus.Aborted: return 'error'
            default: return 'grey'
        }
    }

    //maps colors for drone status
    const getDroneStatusColor = (status: DroneStatus): string => {
        switch (status) {
            case DroneStatus.Ready: return 'success'
            case DroneStatus.Flying: return 'info'
            case DroneStatus.Charging: return 'warning'
            case DroneStatus.Maintenance: return 'error'
            default: return 'grey'
        }
    }

    //battery visual progress based on charge level
    const getBatteryColor = (percent: number): string => {
        if (percent > 50) return 'success'
        if (percent > 25) return 'warning'
        return 'error'
    }

    return {
        getMissionStatusColor,
        getDroneStatusColor,
        getBatteryColor
    }
}