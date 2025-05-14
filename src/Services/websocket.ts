import {Client, Message, StompSubscription} from '@stomp/stompjs';
import api from "./api";

type MessageCallback = (message: { content: string, roomId: string }) => void;

export class WebSocketService {
  private client: Client | null = null;
  private messageCallback: MessageCallback | null = null;
  private headers = {
      'Authorization': `Bearer ${sessionStorage.getItem('token')}`
  };
  private subscribeChatMessages?: StompSubscription = null;

  connect(): Promise<void> {
    return new Promise((resolve) => {
      this.client = new Client({
        brokerURL: import.meta.env.VITE_API_WEB_SOCKET_URL || 'ws://localhost:8080/ws-native',
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
      });

      this.client.activate();
    });
  }

  subscribeToRoom(chaId: string, idProduct: string, idProfileProduct: string, idProfile: string) {
    if (!this.client) return;

    this.subscribeChatMessages = this.client.subscribe(`/topic/messages/${chaId}/${idProduct}/${idProfileProduct}/${idProfile}`, (message: Message) => {
      if (this.messageCallback) {
        const data = JSON.parse(message.body);
        this.messageCallback(data);
        console.log(api.getUri())
      }
    });
  }

    unsubscribeFromRoom() {
        if (this.subscribeChatMessages) {
        this.subscribeChatMessages.unsubscribe();
        this.subscribeChatMessages = undefined;
        }
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