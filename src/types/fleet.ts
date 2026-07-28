// Domain Enums
export enum DroneStatus {
  Ready = 'READY',
  Flying = 'FLYING',
  Charging = 'CHARGING',
  Maintenance = 'MAINTENANCE'
}

export enum MissionStatus {
  Planning = 'PLANNING',
  Active = 'ACTIVE',
  Completed = 'COMPLETED',
  Aborted = 'ABORTED'
}


// Data Models

//drone tracking
export interface Drone {
  id: number;
  name: string;
  status: DroneStatus;
  batteryPercent: number;
  latitude: number | null;
  longitude: number | null;
  missionId: number | null;
  missionName: string | null;
  lastUpdated: string | null; // ISO-8601 string payload format
}

// flight plan
export interface Mission {
  id: number;
  name: string;
  description: string | null;
  status: MissionStatus;
  droneCount: number;
}

// Payload

export type DroneRequest = Omit<Drone, 'id' | 'missionName' | 'lastUpdated'>;

// updating mission status
export interface MissionRequest {
  name: string;
  description: string | null;
  status: MissionStatus;
}
