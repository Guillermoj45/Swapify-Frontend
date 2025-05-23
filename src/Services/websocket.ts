import { Client, Message, StompSubscription } from '@stomp/stompjs';
import ProfileService from "./ProfileService";
import { notificationsOutline } from "ionicons/icons";
import {useState} from "react";

type MessageCallback = (message: { content: string, roomId: string }) => void;

export interface MensajeRecibeDTO {
  content: string;
  senderName: string;
  token?: string;
  timestamp: string;
  type: string;
  userName: string;
}

export const WebSocketService = new class {
  private client: Client | null = null;
  private messageCallback: MessageCallback | null = null;
  private notificationCallback:MessageCallback | null = null;
  private headers = {
    'Authorization': `Bearer ${sessionStorage.getItem('token')}`
  };
  private subscribeChatMessages?: StompSubscription;
  private isConnected = false;

  async connect(): Promise<boolean> {
    if (this.client) {
      console.log('Ya está conectado al WebSocket');
      return Promise.resolve(false);
    }

    return new Promise((resolve) => {
      this.client = new Client({
        brokerURL: import.meta.env.VITE_API_WEB_SOCKET_URL || 'ws://localhost:8080/ws-native',
        connectHeaders: this.headers,
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: () => {
          console.log('Conectado al WebSocket');
          this.isConnected = true;
          resolve(true);
        },
        onDisconnect: () => {
          console.log('Desconectado del WebSocket');
          this.isConnected = false;
        },
      });

      this.client.activate();
    });
  }

  async waitForConnection(): Promise<void> {
    if (!this.client) {
      await this.connect();
    }

    await new Promise(resolve => {
      const interval = setInterval(() => {
        if (this.isConnected) {
          clearInterval(interval);
          resolve(true);
        }
      }, 100);
    });
  }

  async subscribeToNotification() {
    await this.waitForConnection();

    const profile = await ProfileService.getProfileInfo();
    if (!profile) throw new Error('No se pudo obtener el perfil');

    this.client!.subscribe(
        `/topic/notification/${profile.id}`,
        (message: Message) => {
          if (this.notificationCallback) {
            const data = JSON.parse(message.body);
            this.notificationCallback({
              id: Date.now(),
              title: data.title || 'Nueva notificación',
              description: data.content || 'Sin descripción',
              time: 'Ahora',
              icon: notificationsOutline,
              unread: true,
            });
          }
        },
        this.headers
    );
  }

  subscribeToChat(idProduct: string, idProfileProduct: string, idProfile: string) {
    if (!this.client) return;

    this.subscribeChatMessages = this.client.subscribe(
        `/topic/messages/${idProduct}/${idProfileProduct}/${idProfile}`,
        (message: Message) => {
          if (this.messageCallback) {
            const data = JSON.parse(message.body);
            this.messageCallback(data);
          }
        },
        this.headers
    );
  }

  unsubscribeFromRoom() {
    if (this.subscribeChatMessages) {
      this.subscribeChatMessages.unsubscribe();
      this.subscribeChatMessages = undefined;
    }
  }

  async sendMessage(idProduct: string, idProfileProduct: string, idProfile: string, message: MensajeRecibeDTO): Promise<void> {
    if (!this.client) return;

    this.client.publish({
      destination: `/app/chat/${idProduct}/${idProfileProduct}/${idProfile}`,
      body: JSON.stringify(message),
    });
  }

  setMessageCallback(callback: MessageCallback) {
    this.messageCallback = callback;
  }

  setNotificationCallback(callback: MessageCallback)   {
    console.log("Configurando callback de notificación");
    this.notificationCallback = callback;
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate().then(() => {
        this.client = null;
        this.isConnected = false;
      });
    }
  }
};
