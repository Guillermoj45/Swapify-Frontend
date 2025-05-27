import API from './api';
import SockJS from 'sockjs-client/dist/sockjs';
import { Stomp, CompatClient } from '@stomp/stompjs';

// Interfaces para los DTOs
export interface MensajeRecibeDTO {
    content: string;
    timestamp?: string;
    token?: string;
    userName?: string;
}

export interface ChatDTO {
    id: string;
    productId: string;
    profileProductId: string;
    profileId: string;
    lastMessage?: string;
    lastMessageTime?: string;
    productName?: string;
    otherUserName?: string;
    // Añade más campos según tu DTO del backend
}

export interface MessageCallback {
    (message: MensajeRecibeDTO): void;
}

export interface ConnectionCallback {
    (): void;
}

export interface ErrorCallback {
    (error: any): void;
}

class ChatService {
    private stompClient: CompatClient | null = null;
    private isConnected: boolean = false;
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 5;
    private reconnectDelay: number = 3000;
    private subscriptions: Map<string, any> = new Map();

    /**
     * Obtiene todos los chats del usuario autenticado
     */
    async getChats(): Promise<ChatDTO[]> {
        try {
            const response = await API.get('/chat/get');
            return response.data;
        } catch (error) {
            console.error('Error al obtener chats:', error);
            throw error;
        }
    }

    /**
     * Conecta al WebSocket
     */
    connect(
        onConnected?: ConnectionCallback,
        onError?: ErrorCallback
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                // Crear la conexión SockJS
                const socket = new SockJS(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/ws`);
                this.stompClient = Stomp.over(socket);

                // Configurar headers si es necesario
                const headers: any = {};

                // Obtener token para autenticación
                const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                if (token) {
                    headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
                }

                // Configurar logging (opcional, puedes deshabilitarlo en producción)
                this.stompClient.debug = (str) => {
                    console.log('STOMP: ' + str);
                };

                // Conectar
                this.stompClient.connect(
                    headers,
                    (frame) => {
                        console.log('Conectado al WebSocket:', frame);
                        this.isConnected = true;
                        this.reconnectAttempts = 0;
                        onConnected?.();
                        resolve();
                    },
                    (error) => {
                        console.error('Error de conexión WebSocket:', error);
                        this.isConnected = false;
                        this.handleReconnect();
                        onError?.(error);
                        reject(error);
                    }
                );

            } catch (error) {
                console.error('Error al crear conexión WebSocket:', error);
                onError?.(error);
                reject(error);
            }
        });
    }

    /**
     * Desconecta del WebSocket
     */
    disconnect(): void {
        if (this.stompClient && this.isConnected) {
            // Cancelar todas las suscripciones
            this.subscriptions.forEach((subscription, key) => {
                subscription.unsubscribe();
            });
            this.subscriptions.clear();

            this.stompClient.disconnect(() => {
                console.log('Desconectado del WebSocket');
                this.isConnected = false;
            });
        }
    }

    /**
     * Suscribe a los mensajes de un chat específico
     */
    subscribeToChat(
        idProduct: string,
        idProfileProduct: string,
        idProfile: string,
        onMessage: MessageCallback,
        onError?: ErrorCallback
    ): string {
        if (!this.isConnected || !this.stompClient) {
            throw new Error('WebSocket no está conectado');
        }

        const destination = `/topic/messages/${idProduct}/${idProfileProduct}/${idProfile}`;
        const subscriptionKey = `${idProduct}-${idProfileProduct}-${idProfile}`;

        // Cancelar suscripción anterior si existe
        if (this.subscriptions.has(subscriptionKey)) {
            this.subscriptions.get(subscriptionKey).unsubscribe();
        }

        const subscription = this.stompClient.subscribe(
            destination,
            (message) => {
                try {
                    const messageData: MensajeRecibeDTO = JSON.parse(message.body);
                    onMessage(messageData);
                } catch (error) {
                    console.error('Error al parsear mensaje:', error);
                    onError?.(error);
                }
            },
            (error) => {
                console.error('Error en suscripción:', error);
                onError?.(error);
            }
        );

        this.subscriptions.set(subscriptionKey, subscription);
        return subscriptionKey;
    }

    /**
     * Cancela la suscripción a un chat específico
     */
    unsubscribeFromChat(subscriptionKey: string): void {
        if (this.subscriptions.has(subscriptionKey)) {
            this.subscriptions.get(subscriptionKey).unsubscribe();
            this.subscriptions.delete(subscriptionKey);
        }
    }

    /**
     * Envía un mensaje a un chat específico
     */
    sendMessage(
        idProduct: string,
        idProfileProduct: string,
        idProfile: string,
        content: string
    ): void {
        if (!this.isConnected || !this.stompClient) {
            throw new Error('WebSocket no está conectado');
        }

        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
            throw new Error('Token de autenticación no encontrado');
        }

        const message: MensajeRecibeDTO = {
            content,
            token: token.replace('Bearer ', ''), // Remover Bearer prefix si existe
            timestamp: new Date().toISOString()
        };

        const destination = `/app/chat/${idProduct}/${idProfileProduct}/${idProfile}`;

        try {
            this.stompClient.send(destination, {}, JSON.stringify(message));
            console.log('Mensaje enviado:', message);
        } catch (error) {
            console.error('Error al enviar mensaje:', error);
            throw error;
        }
    }

    /**
     * Maneja la reconexión automática
     */
    private handleReconnect(): void {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Intentando reconectar... Intento ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

            setTimeout(() => {
                this.connect()
                    .then(() => {
                        console.log('Reconexión exitosa');
                        // Reestablecer suscripciones si es necesario
                        this.reestablishSubscriptions();
                    })
                    .catch((error) => {
                        console.error('Fallo en reconexión:', error);
                    });
            }, this.reconnectDelay * this.reconnectAttempts);
        } else {
            console.error('Máximo número de intentos de reconexión alcanzado');
        }
    }

    /**
     * Reestablece las suscripciones después de una reconexión
     */
    private reestablishSubscriptions(): void {
        // Esta función podría implementarse si necesitas mantener las suscripciones
        // activas después de una reconexión. Por ahora, las suscripciones se
        // manejan desde los componentes que las crean.
        console.log('Reestableciendo suscripciones...');
    }

    /**
     * Verifica si el WebSocket está conectado
     */
    isWebSocketConnected(): boolean {
        return this.isConnected;
    }

    /**
     * Obtiene el estado de la conexión
     */
    getConnectionState(): string {
        if (!this.stompClient) return 'DISCONNECTED';
        return this.stompClient.connected ? 'CONNECTED' : 'DISCONNECTED';
    }
}

// Exportar una instancia singleton del servicio
export const chatService = new ChatService();
export default chatService;