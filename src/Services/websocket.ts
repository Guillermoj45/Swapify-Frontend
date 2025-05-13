import { Client, Message } from '@stomp/stompjs';

type MessageCallback = (message: { content: string, roomId: string }) => void;

export class WebSocketService {
  private client: Client | null = null;
  private messageCallback: MessageCallback | null = null;
  private headers = {
      'Authorization': `Bearer ${sessionStorage.getItem('token')}`
  };

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client = new Client({
        brokerURL: 'ws://localhost:8080/ws-native',
        connectHeaders: this.headers,
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: () => {
          console.log('Conectado al WebSocket');
          resolve();
        },
        onDisconnect: () => {
          console.log('Desconectado del WebSocket');
        },
        onError: (error) => {
          console.error('Error en WebSocket:', error);
          reject(error);
        }
      });

      this.client.activate();
    });
  }

  subscribeToRoom(roomId: string) {
    if (!this.client) return;
    this.client.subscribe(`/topic/messages/${roomId}`, (message: Message) => {
      if (this.messageCallback) {
        const data = JSON.parse(message.body);
        this.messageCallback(data);
      }
    });
  }

  sendMessage(roomId: string, message: string) {
    if (!this.client) return;

    this.client.publish({
      destination: `/app/chat/${roomId}`,
      body: JSON.stringify(message)
    });
  }

  setMessageCallback(callback: MessageCallback) {
    this.messageCallback = callback;
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
  }
}

export const wsService = new WebSocketService();