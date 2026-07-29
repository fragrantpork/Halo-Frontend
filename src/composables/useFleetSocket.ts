import { ref, onMounted, onUnmounted } from 'vue'

import type { Drone, Mission } from '@/types/fleet';

//constraints for the types
export type FleetEventType = 
  | 'DRONE_CREATED'
  | 'DRONE_UPDATED'
  | 'DRONE_DELETED'
  | 'MISSION_UPDATED'
  | 'MISSION_DELETED';

export interface FleetEvent {
  type: FleetEventType;
  payload: Drone | Mission | number | string;
}

export function useFleetSocket(onEvent: (event: FleetEvent) => void) {
  let socket: WebSocket | null = null;
  let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  
  const isConnected = ref(false);

  const connect = () => {
    //clear out any existing instances to avoid duplicate ghost connections
    cleanup();

    socket = new WebSocket('ws://localhost:8080/ws/fleet');

    socket.onopen = () => {
      isConnected.value = true;
    };

    socket.onmessage = (messageEvent: MessageEvent) => {
      try {
        const event = JSON.parse(messageEvent.data) as FleetEvent;
        onEvent(event);
      } catch (error) {
        console.error('Failed to parse incoming websocket payload message:', error);
      }
    };

    socket.onclose = () => {
      isConnected.value = false;
      
      //check to make sure we aren't scheduling a reload post-unmount
      reconnectTimeout = setTimeout(() => {
        console.log('Re-establishing dead fleet socket tracking link...');
        connect();
      }, 3000);
    };
  };

  const cleanup = () => {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
    if (socket) {
      socket.close();
      socket = null;
    }
  };

  onMounted(() => {
    connect();
  });

  onUnmounted(() => {
    cleanup();
  });

  //reactive connection state so views can show an active status indicator
  return {
    isConnected
  };
}
