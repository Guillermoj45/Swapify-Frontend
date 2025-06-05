import API from "./api"
import SockJS from "sockjs-client"
import {Stomp, type CompatClient, StompHeaders} from "@stomp/stompjs"

// INTERFAZ CORREGIDA: Agregar los campos necesarios
export interface MensajeRecibeDTO {
    id?: string
    content: string
    timestamp?: string
    createdAt?: string
    token?: string
    userName?: string
    senderNickname?: string
    profileProductSender?: boolean // ¡CAMPO FALTANTE!
}

export interface ProfileDTO {
    id: string
    nickname: string
    avatar: string
    banAt: boolean
    premium: string
    ubicacion: string | null
    banner?: string
    newUser: boolean
}

export interface CategoryDTO {
    name: string
    description: string
}

export interface ProductDTO {
    id: string
    name: string
    description: string
    points: number
    createdAt: string
    updatedAt: string
    imagenes: string[]
    profile: ProfileDTO
    categories: CategoryDTO[]
}

// Interfaz actualizada para el ChatDTO que viene del backend
export interface ChatDTO {
    profileNoProduct: ProfileDTO
    product: ProductDTO
    createdAt: string
    message: string
    profileProductSender: boolean

    // Campos opcionales para mantener compatibilidad con código existente
    id?: string
    productId?: string
    profileProductId?: string
    profileId?: string
    idProduct?: string
    idProfileProduct?: string
    idProfile?: string
    lastMessage?: string
    lastMessageTime?: string
    productName?: string
    otherUserName?: string
}

// Nueva interfaz para los mensajes individuales
export interface MessageDTO {
    id: string
    content: string
    createdAt: string
    senderNickname: string
    profileProductSender: boolean
}

export type MessageCallback = (message: MensajeRecibeDTO) => void

export type ConnectionCallback = () => void

export type ErrorCallback = (error: any) => void

class ChatService {
    private stompClient: CompatClient | null = null
    private isConnected = false
    private reconnectAttempts = 0
    private maxReconnectAttempts = 5
    private reconnectDelay = 3000
    private subscriptions: Map<string, any> = new Map()
    private reconnectTimeout: NodeJS.Timeout | null = null
    private pendingSubscriptions: Map<
        string,
        {
            idProduct: string
            idProfileProduct: string
            idProfile: string
            onMessage: MessageCallback
            onError?: ErrorCallback
        }
    > = new Map()

    /**
     * Obtiene todos los chats del usuario autenticado
     */
    async getChats(): Promise<ChatDTO[]> {
        try {
            const token = this.getAuthToken()
            if (!token) {
                throw new Error("No se encontró token de autenticación")
            }

            const response = await API.get("/chat/conversations-native", {
                headers: {
                    Authorization: token,
                },
            })
            return response.data
        } catch (error) {
            console.error("Error al obtener chats:", error)
            throw error
        }
    }

    /**
     * Obtiene todos los mensajes entre dos usuarios relacionados con un producto específico
     */
    async getMessages(idProduct: string, idProfileProduct: string, idProfileNoProduct: string): Promise<MessageDTO[]> {
        try {
            const token = this.getAuthToken()
            if (!token) {
                throw new Error("No se encontró token de autenticación")
            }

            // Validar parámetros
            if (!this.validateChatParams(idProduct, idProfileProduct, idProfileNoProduct)) {
                throw new Error("Parámetros inválidos para obtener mensajes")
            }

            const response = await API.get(`/chat/messages/${idProduct}/${idProfileProduct}/${idProfileNoProduct}`, {
                headers: {
                    Authorization: token,
                },
            })

            console.log("✅ Mensajes obtenidos exitosamente:", response.data.length)
            return response.data
        } catch (error) {
            console.error("❌ Error al obtener mensajes:", error)
            throw error
        }
    }

    /**
     * Obtiene el token de autenticación correctamente formateado
     */
    private getAuthToken(): string | null {
        let token = localStorage.getItem("token") || sessionStorage.getItem("token")
        if (!token) return null

        // Asegurar que el token tenga el prefijo Bearer
        if (!token.startsWith("Bearer ")) {
            token = `Bearer ${token}`
        }
        return token
    }

    /**
     * Valida que los parámetros no sean undefined o vacíos
     */
    private validateChatParams(idProduct: string, idProfileProduct: string, idProfile: string): boolean {
        if (!idProduct || idProduct === "undefined" || idProduct.trim() === "") {
            console.error("idProduct es inválido:", idProduct)
            return false
        }
        if (!idProfileProduct || idProfileProduct === "undefined" || idProfileProduct.trim() === "") {
            console.error("idProfileProduct es inválido:", idProfileProduct)
            return false
        }
        if (!idProfile || idProfile === "undefined" || idProfile.trim() === "") {
            console.error("idProfile es inválido:", idProfile)
            return false
        }
        return true
    }

    /**
     * Conecta al WebSocket con mejor manejo de errores
     */
    connect(onConnected?: ConnectionCallback, onError?: ErrorCallback): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                // Verificar token antes de conectar
                const token = this.getAuthToken()
                if (!token) {
                    const error = new Error("No se encontró token de autenticación")
                    onError?.(error)
                    reject(error)
                    return
                }

                // Si ya hay una conexión activa, no crear otra
                if (this.isConnected && this.stompClient?.connected) {
                    console.log("Ya hay una conexión WebSocket activa")
                    onConnected?.()
                    resolve()
                    return
                }

                console.log("Iniciando conexión WebSocket...")

                // Crear la conexión SockJS con configuración mejorada
                const socket = new SockJS(`${import.meta.env.VITE_API_WEB_SOCKET_URL || "http://localhost:8080"}/ws`, null, {
                    timeout: 30000, // 30 segundos de timeout
                })

                this.stompClient = Stomp.over(() => socket)

                // Configurar heartbeat y timeouts
                this.stompClient.heartbeatIncoming = 4000
                this.stompClient.heartbeatOutgoing = 4000
                this.stompClient.reconnectDelay = 0 // Manejamos reconexión manualmente

                // Configurar logging
                if (import.meta.env.DEV) {
                    this.stompClient.debug = (str) => {
                        console.log("STOMP: " + str)
                    }
                } else {
                    this.stompClient.debug = () => {}
                }

                // Configurar callbacks
                this.stompClient.onConnect = (frame) => {
                    console.log("✅ Conectado al WebSocket exitosamente:", frame.headers)
                    this.isConnected = true
                    this.reconnectAttempts = 0

                    // Limpiar timeout de reconexión si existe
                    if (this.reconnectTimeout) {
                        clearTimeout(this.reconnectTimeout)
                        this.reconnectTimeout = null
                    }

                    onConnected?.()
                    resolve()
                }

                this.stompClient.onStompError = (frame) => {
                    console.error("❌ Error STOMP:", {
                        command: frame.command,
                        headers: frame.headers,
                        body: frame.body,
                    })

                    this.isConnected = false
                    const errorMessage = frame.headers?.message || frame.body || "Error desconocido de STOMP"
                    const error = new Error(`STOMP Error: ${errorMessage}`)

                    // No reconectar en errores de autenticación
                    if (errorMessage.includes("401") || errorMessage.includes("403") || errorMessage.includes("Unauthorized")) {
                        console.error("Error de autenticación, no se intentará reconectar")
                        onError?.(error)
                        reject(error)
                        return
                    }

                    // Para otros errores, intentar reconectar después de un delay
                    setTimeout(() => {
                        this.handleReconnect(onConnected, onError)
                    }, 1000)

                    onError?.(error)
                    reject(error)
                }

                this.stompClient.onWebSocketError = (event) => {
                    console.error("❌ Error WebSocket:", event)
                    this.isConnected = false

                    setTimeout(() => {
                        this.handleReconnect(onConnected, onError)
                    }, 1000)

                    onError?.(event)
                    reject(event)
                }

                this.stompClient.onWebSocketClose = (event) => {
                    console.log("🔌 WebSocket cerrado:", {
                        code: event.code,
                        reason: event.reason,
                        wasClean: event.wasClean,
                    })

                    this.isConnected = false

                    // Solo reconectar si el cierre no fue intencional (código 1000 = cierre normal)
                    if (event.code !== 1000 && event.code !== 1001) {
                        setTimeout(() => {
                            this.handleReconnect(onConnected, onError)
                        }, 1000)
                    }
                }

                // Activar la conexión
                this.stompClient.activate()
            } catch (error) {
                console.error("Error al crear conexión WebSocket:", error)
                onError?.(error)
                reject(error)
            }
        })
    }

    /**
     * Desconecta del WebSocket de forma limpia
     */
    disconnect(): void {
        console.log("🔌 Desconectando WebSocket...")

        // Limpiar timeout de reconexión
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout)
            this.reconnectTimeout = null
        }

        if (this.stompClient) {
            // Cancelar todas las suscripciones
            this.subscriptions.forEach((subscription, key) => {
                try {
                    subscription.unsubscribe()
                    console.log(`Desuscrito de: ${key}`)
                } catch (error) {
                    console.warn(`Error al desuscribirse de ${key}:`, error)
                }
            })
            this.subscriptions.clear()
            this.pendingSubscriptions.clear()

            // Desactivar conexión
            try {
                this.stompClient.deactivate()
                console.log("✅ WebSocket desconectado exitosamente")
            } catch (error) {
                console.error("Error al desconectar:", error)
            }

            this.isConnected = false
            this.stompClient = null
        }
    }

    /**
     * Suscribe a los mensajes de un chat específico con validación
     */
    subscribeToChat(
                    idProduct: string,
                    idProfileProduct: string,
                    idProfile: string,
                    onMessage: MessageCallback,
                    onError?: ErrorCallback,
                ): string {
                    console.log("🔔 Intentando suscribirse al chat:", { idProduct, idProfileProduct, idProfile })

                    if (!this.validateChatParams(idProduct, idProfileProduct, idProfile)) {
                        const error = new Error("Parámetros de chat inválidos - contienen undefined o están vacíos")
                        onError?.(error)
                        throw error
                    }

                    if (!this.isConnected || !this.stompClient) {
                        const subscriptionKey = `${idProduct}-${idProfileProduct}-${idProfile}`
                        this.pendingSubscriptions.set(subscriptionKey, {
                            idProduct,
                            idProfileProduct,
                            idProfile,
                            onMessage,
                            onError,
                        })

                        const error = new Error("WebSocket no está conectado - suscripción guardada como pendiente")
                        console.warn("⚠️", error.message)
                        onError?.(error)
                        throw error
                    }

                    const destination = `/topic/messages/${idProduct}/${idProfileProduct}/${idProfile}`
                    const subscriptionKey = `${idProduct}-${idProfileProduct}-${idProfile}`

                    if (this.subscriptions.has(subscriptionKey)) {
                        try {
                            this.subscriptions.get(subscriptionKey).unsubscribe()
                            console.log(`🗑️ Cancelada suscripción anterior: ${subscriptionKey}`)
                        } catch (error) {
                            console.warn("Error al cancelar suscripción anterior:", error)
                        }
                    }

                    try {
                        const token = this.getAuthToken()
                        const headers: { [key: string]: string } = {}

                        if (token) {
                            headers.Authorization = token
                        }

                        const subscription = this.stompClient.subscribe(
                            destination,
                            (message) => {
                                try {
                                    const messageData: MensajeRecibeDTO = JSON.parse(message.body)
                                    console.log("📨 Mensaje recibido por WebSocket:", messageData)

                                    console.log("🔍 Campos del mensaje recibido:", {
                                        hasProfileProductSender: "profileProductSender" in messageData,
                                        profileProductSender: messageData.profileProductSender,
                                        senderNickname: messageData.senderNickname,
                                        userName: messageData.userName,
                                        allFields: Object.keys(messageData),
                                    })

                                    onMessage(messageData)
                                } catch (error) {
                                    console.error("Error al parsear mensaje:", error)
                                    onError?.(error)
                                }
                            },
                            headers
                        )

                        this.subscriptions.set(subscriptionKey, subscription)
                        console.log(`✅ Suscrito exitosamente a: ${destination}`)
                        return subscriptionKey
                    } catch (error) {
                        console.error("❌ Error al crear suscripción:", error)
                        throw error
                    }
                }

    /**
     * Cancela la suscripción a un chat específico
     */
    unsubscribeFromChat(subscriptionKey: string): void {
        if (this.subscriptions.has(subscriptionKey)) {
            try {
                this.subscriptions.get(subscriptionKey).unsubscribe()
                this.subscriptions.delete(subscriptionKey)
                console.log(`🗑️ Desuscrito de: ${subscriptionKey}`)
            } catch (error) {
                console.warn("Error al desuscribirse:", error)
            }
        }

        // También remover de pendientes si existe
        if (this.pendingSubscriptions.has(subscriptionKey)) {
            this.pendingSubscriptions.delete(subscriptionKey)
            console.log(`🗑️ Removida suscripción pendiente: ${subscriptionKey}`)
        }
    }

    /**
     * Envía un mensaje a un chat específico con validación
     */
    sendMessage(idProduct: string, idProfileProduct: string, idProfile: string, content: string): void {
        console.log("📤 Enviando mensaje:", { idProduct, idProfileProduct, idProfile, content })

        // Validar parámetros
        if (!this.validateChatParams(idProduct, idProfileProduct, idProfile)) {
            throw new Error("Parámetros de chat inválidos para enviar mensaje")
        }

        if (!content || content.trim() === "") {
            throw new Error("El contenido del mensaje no puede estar vacío")
        }

        if (!this.isConnected || !this.stompClient) {
            throw new Error("WebSocket no está conectado")
        }

        const token = localStorage.getItem("token") || sessionStorage.getItem("token")
        if (!token) {
            throw new Error("Token de autenticación no encontrado")
        }

        // Remover Bearer prefix para el payload del mensaje
        const cleanToken = token.replace("Bearer ", "")

        const message: MensajeRecibeDTO = {
            content: content.trim(),
            token: cleanToken,
            timestamp: new Date().toISOString(),
        }

        const destination = `/app/chat/${idProduct}/${idProfileProduct}/${idProfile}`

        try {
            // En el método sendMessage, modificar la parte del publish:
            this.stompClient.publish({
                destination: destination,
                body: JSON.stringify(message),
                headers: {
                    "content-type": "application/json",
                    ...(this.getAuthToken() && { Authorization: this.getAuthToken() as string }),
                } as StompHeaders
            })
            console.log("✅ Mensaje enviado exitosamente")
        } catch (error) {
            console.error("❌ Error al enviar mensaje:", error)
            throw error
        }
    }

    /**
     * Maneja la reconexión automática con backoff exponencial
     */
    private handleReconnect(onConnected?: ConnectionCallback, onError?: ErrorCallback): void {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error("❌ Máximo número de intentos de reconexión alcanzado")
            return
        }

        if (this.reconnectTimeout) {
            return // Ya hay un intento de reconexión en progreso
        }

        this.reconnectAttempts++
        const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000) // Max 30 segundos

        console.log(`🔄 Reconectando en ${delay}ms... Intento ${this.reconnectAttempts}/${this.maxReconnectAttempts}`)

        this.reconnectTimeout = setTimeout(() => {
            this.reconnectTimeout = null

            this.connect(onConnected, onError)
                .then(() => {
                    console.log("✅ Reconexión exitosa")
                    this.reestablishSubscriptions()
                })
                .catch((error) => {
                    console.error("❌ Fallo en reconexión:", error)
                })
        }, delay)
    }

    /**
     * Reestablece las suscripciones pendientes después de una reconexión
     */
    private reestablishSubscriptions(): void {
        console.log("🔄 Reestableciendo suscripciones pendientes...")

        if (this.pendingSubscriptions.size > 0) {
            this.pendingSubscriptions.forEach((params, key) => {
                try {
                    this.subscribeToChat(
                        params.idProduct,
                        params.idProfileProduct,
                        params.idProfile,
                        params.onMessage,
                        params.onError,
                    )
                    console.log(`✅ Reestablecida suscripción: ${key}`)
                } catch (error) {
                    console.error(`❌ Error reestableciendo suscripción ${key}:`, error)
                }
            })
        }

        // Emitir evento para que los componentes sepan que pueden re-suscribirse
        if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("websocket-reconnected"))
        }
    }

    /**
     * Verifica si el WebSocket está conectado
     */
    isWebSocketConnected(): boolean {
        return this.isConnected && this.stompClient?.connected === true
    }

    /**
     * Obtiene el estado de la conexión
     */
    getConnectionState(): string {
        if (!this.stompClient) return "DISCONNECTED"
        return this.stompClient.connected ? "CONNECTED" : "DISCONNECTED"
    }

    /**
     * Resetea los intentos de reconexión
     */
    resetReconnectAttempts(): void {
        this.reconnectAttempts = 0
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout)
            this.reconnectTimeout = null
        }
    }

    /**
     * Obtiene información de debug
     */
    getDebugInfo(): object {
        return {
            isConnected: this.isConnected,
            reconnectAttempts: this.reconnectAttempts,
            subscriptions: Array.from(this.subscriptions.keys()),
            pendingSubscriptions: Array.from(this.pendingSubscriptions.keys()),
            stompClientConnected: this.stompClient?.connected || false,
        }
    }
}

// Exportar una instancia singleton del servicio
export const chatService = new ChatService()
export default chatService
