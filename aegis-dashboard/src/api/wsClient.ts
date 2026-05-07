import { Client } from '@stomp/stompjs';
import type { WsAlertMessage } from '../types';
import { useAlertStore } from '../store/alertStore';

let stompClient: Client | null = null;

// Build the WebSocket URL dynamically so it works on any host/port
function getWsUrl(): string {
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const host = window.location.host; // includes port if non-default
  return `${proto}://${host}/ws/admin/websocket`;
}

export function connectWebSocket(token: string) {
  stompClient = new Client({
    // @stomp/stompjs v7 supports native WebSocket – no SockJS needed
    brokerURL: getWsUrl(),
    connectHeaders: { Authorization: `Bearer ${token}` },
    reconnectDelay: 5000,
    onConnect: () => {
      console.log('[WS] Connected to Aegis STOMP broker');
      useAlertStore.getState().setConnected(true);

      stompClient!.subscribe('/topic/alerts', (msg) => {
        const data: WsAlertMessage = JSON.parse(msg.body);
        useAlertStore.getState().addAlert(data);
      });

      stompClient!.subscribe('/topic/scores', (msg) => {
        const data: WsAlertMessage = JSON.parse(msg.body);
        useAlertStore.getState().addAlert(data);
      });

      stompClient!.subscribe('/topic/devices', (msg) => {
        const data: WsAlertMessage = JSON.parse(msg.body);
        useAlertStore.getState().addAlert(data);
      });

      stompClient!.subscribe('/topic/patient-zero', (msg) => {
        const data: WsAlertMessage = JSON.parse(msg.body);
        useAlertStore.getState().addAlert(data);
      });
    },
    onDisconnect: () => {
      console.log('[WS] Disconnected');
      useAlertStore.getState().setConnected(false);
    },
    onStompError: (frame) => {
      console.error('[WS] STOMP error', frame);
      useAlertStore.getState().setConnected(false);
    },
  });

  stompClient.activate();
}

export function disconnectWebSocket() {
  stompClient?.deactivate();
  stompClient = null;
  useAlertStore.getState().setConnected(false);
}
