import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type { WsAlertMessage } from '../types';
import { useAlertStore } from '../store/alertStore';

let stompClient: Client | null = null;

export function connectWebSocket(token: string) {
  stompClient = new Client({
    webSocketFactory: () => new SockJS('/ws/admin'),
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
