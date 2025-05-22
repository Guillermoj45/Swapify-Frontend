import {Client, Message, StompSubscription} from '@stomp/stompjs';
import ProfileService from "./ProfileService";

type MessageCallback = (
    message: { content: string, roomId: string })
    => void;

interface MensajeRecibeDTO {
  content: string;      // Contenido del mensaje
  senderName: string;
  token?: string;       // token mio (opcional)
  timestamp: string;
  type: string;
  userName: string;     // El que envía el mensaje
}

export const WebSocketService = new class {

  private client: Client | null = null;
  private messageCallback: MessageCallback | null = null;
  private _notificationCallback: MessageCallback | null = null;
  private headers = {
      'Authorization': `Bearer ${sessionStorage.getItem('token')}`
  };
  private subscribeChatMessages?: StompSubscription = null;
  private isConnected: boolean = false;

  connect(): Promise<boolean> {
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
          return resolve(true);
        },
        onDisconnect: () => {
          console.log('Desconectado del WebSocket');
          this.isConnected = false;
        },
      });

      this.client.activate();
    });
  }

  async waitForConnection(): Promise<boolean> {
    if (!this.client) {
      await this.connect();
    }

    // Espera a que la conexión esté activa
    await new Promise(resolve => {
      const checkConnection = setInterval(() => {
        if (this.isConnected) {
          clearInterval(checkConnection);
          resolve(true);
        }
      }, 100);
    });

    return true;
  }



  async subscribeToNotification() {
    if (!this.client) {
      await this.waitForConnection();
    }

    const profile = await ProfileService.getProfileInfo();
    if (!profile) throw new Error('No se pudo obtener el perfil');

    this.subscribeChatMessages = this.client!.subscribe(
      `/topic/notification/${profile.id}`,
      (message: Message) => {
        if (this._notificationCallback) {
          const data = JSON.parse(message.body);
          this._notificationCallback(data);
          console.log("Hola", data);
        }
        console.log("Hola");
      },
      this.headers
    );
  }


  subscribeToChat(idProduct: string, idProfileProduct: string, idProfile: string) {
    if (!this.client) return;
    this.subscribeChatMessages = this.client.subscribe(`/topic/messages/${idProduct}/${idProfileProduct}/${idProfile}`, (message: Message) => {
      if (this.messageCallback) {
        const data = JSON.parse(message.body);
        this.messageCallback(data);
        console.log("Hola",data)
      }
      console.log("Hola")
    }, this.headers);
  }

  unsubscribeFromRoom() {
      if (this.subscribeChatMessages) {
      this.subscribeChatMessages.unsubscribe();
      this.subscribeChatMessages = undefined;
      }
  }

  async sendMessage(idProduct: string, idProfileProduct: string, idProfile: string, message:MensajeRecibeDTO): Promise<void> {
    if (!this.client) return;

    try {
      this.client.publish({
        destination: `/app/chat/${idProduct}/${idProfileProduct}/${idProfile}`,
        body: JSON.stringify(message), // Asegura que el mensaje se envía como JSON,
      });
    } catch (error) {
      console.error('Error al enviar el mensaje:', error);
      throw error;
    }
  }

  setMessageCallback(callback: MessageCallback) {
    this.messageCallback = callback;
  }
  setnotificationCallback(value: MessageCallback) {
    this._notificationCallback = value;
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate().then();
      this.client = null;
    }
  }
}
