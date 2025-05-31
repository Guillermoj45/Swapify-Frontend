"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import "./Chat.css"
import { IonIcon, IonSpinner, IonButtons, IonMenuButton, IonContent, IonPage } from "@ionic/react"
import {
    searchOutline,
    arrowBackOutline,
    ellipsisVerticalOutline,
    checkmarkOutline,
    checkmarkDoneOutline,
    addOutline,
    imageOutline,
    sendOutline,
    micOutline,
    chatbubblesOutline,
    menuOutline,
} from "ionicons/icons"
import Navegacion from "../../components/Navegation"
import { chatService, type ChatDTO, type MensajeRecibeDTO, type MessageDTO } from "../../Services/ChatService"
import useAuthRedirect from "../../Services/useAuthRedirect"
import { ProductService } from "../../Services/ProductService"
import cloudinaryImage from "../../Services/CloudinaryService"
import { ProfileService, type ProfileDTO } from "../../Services/ProfileService"
import { Settings as SettingsService } from "../../Services/SettingsService"

// Interfaces para los tipos de datos
interface Message {
    id: string
    content: string
    sender: "user" | "ai" | "other"
    timestamp: Date
    read: boolean
    delivered: boolean
    status: "sending" | "sent" | "delivered" | "read" | "error"
    image?: string
    senderName?: string
    senderId?: string
    isTemporary?: boolean
}

interface Chat {
    id: string
    idProduct: string
    idProfileProduct: string
    idProfile: string
    name: string
    avatar: string
    lastMessage: string
    timestamp: Date
    unreadCount: number
    isOnline: boolean
    lastSeen?: Date
}

// Eliminar la llamada al perfil en el nivel superior
// const profile = await ProfileService.getProfileInfo()

const ChatPage: React.FC = () => {
    useAuthRedirect()

    // Estado de conexión
    const [isConnected, setIsConnected] = useState(false)
    const [isConnecting, setIsConnecting] = useState(false)
    const currentUserId = sessionStorage.getItem("userId") || "user"

    const [currentUserProfile, setCurrentUserProfile] = useState<ProfileDTO | null>(null)
    const [loadingProfile, setLoadingProfile] = useState(true)

    const [, setMessageStatuses] = useState<Map<string, string>>(new Map())

    // Estado para los chats
    const [chats, setChats] = useState<Chat[]>([])

    // Estado para la búsqueda de chats
    const [searchTerm, setSearchTerm] = useState("")
    const [messageSearchTerm, setMessageSearchTerm] = useState("")
    const [showSearchInHeader, setShowSearchInHeader] = useState(false)

    // Estado para los mensajes del chat activo
    const [messages, setMessages] = useState<Message[]>([])

    // Estado para el chat activo actual
    const [activeChat, setActiveChat] = useState<Chat | null>(null)

    // Estado para las suscripciones activas
    const [activeSubscription, setActiveSubscription] = useState<string | null>(null)

    // Estado para el mensaje de entrada
    const [inputMessage, setInputMessage] = useState("")

    // Estado para mostrar el indicador de escritura
    const [isTyping, setIsTyping] = useState(false)

    // Estado para el modo de tema claro/oscuro
    const [darkMode, setDarkMode] = useState(true)

    // Estado para mostrar/ocultar panel de chat en móvil
    const [showChatPanel, setShowChatPanel] = useState(false)

    // Detectar si está en móvil
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

    // Estado para controlar si el teclado está visible
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)

    // Estados para manejo de errores y carga
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Refs
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const chatMainRef = useRef<HTMLDivElement>(null)

    const [loadingProductNames, setLoadingProductNames] = useState<Set<string>>(new Set())
    const [loadingMessages, setLoadingMessages] = useState(false)

    // Función para cargar el nombre del producto de un chat específico
    const loadProductNameForChat = useCallback(async (chatId: string, productId: string, profileProductId: string) => {
        if (!productId || !profileProductId) {
            console.warn("No se pueden cargar nombres sin IDs válidos:", { productId, profileProductId })
            return
        }

        setLoadingProductNames((prev) => new Set(prev).add(chatId))

        try {
            console.log(`Cargando nombre del producto para chat ${chatId}:`, { productId, profileProductId })
            const product = await ProductService.getProductById(productId, profileProductId)

            console.log("Producto obtenido:", product)

            const productName = product.name || "Producto sin nombre"
            const productAvatar = productName.charAt(0).toUpperCase()

            // Actualizar el chat específico con el nombre del producto
            setChats((prevChats) =>
                prevChats.map((chat) =>
                    chat.id === chatId
                        ? {
                            ...chat,
                            name: productName,
                            avatar: productAvatar,
                        }
                        : chat,
                ),
            )

            console.log(`Nombre del producto actualizado para chat ${chatId}: ${productName}`)
        } catch (error) {
            console.error(`Error al cargar nombre del producto para chat ${chatId}:`, error)

            // Actualizar con un mensaje de error
            setChats((prevChats) =>
                prevChats.map((chat) => (chat.id === chatId ? { ...chat, name: "Producto no disponible", avatar: "X" } : chat)),
            )
        } finally {
            setLoadingProductNames((prev) => {
                const newSet = new Set(prev)
                newSet.delete(chatId)
                return newSet
            })
        }
    }, [])

    const convertMessageDTOToMessage = useCallback(
        (messageDTO: MessageDTO): Message => {
            if (!currentUserProfile || !activeChat) {
                // Fallback si no tenemos la información necesaria
                return {
                    id: messageDTO.id,
                    content: messageDTO.content,
                    sender: "other",
                    timestamp: new Date(messageDTO.createdAt),
                    read: true,
                    delivered: true,
                    status: "read",
                    senderName: messageDTO.senderNickname,
                    senderId: messageDTO.senderNickname,
                    isTemporary: false,
                }
            }

            // Verificar si el usuario actual es el dueño del producto
            const isCurrentUserProductOwner = activeChat.idProfileProduct === currentUserProfile.id

            // Determinar si el mensaje es del usuario actual
            const isFromCurrentUser = isCurrentUserProductOwner
                ? messageDTO.profileProductSender
                : !messageDTO.profileProductSender

            return {
                id: messageDTO.id,
                content: messageDTO.content,
                sender: isFromCurrentUser ? "user" : "other",
                timestamp: new Date(messageDTO.createdAt),
                read: true,
                delivered: true,
                status: "read",
                senderName: messageDTO.senderNickname,
                senderId: messageDTO.senderNickname,
                isTemporary: false,
            }
        },
        [activeChat, currentUserProfile],
    )

    const loadChatMessages = useCallback(
        async (chat: Chat) => {
            if (!chat.idProduct || !chat.idProfileProduct || !chat.idProfile) {
                console.warn("No se pueden cargar mensajes sin IDs válidos:", chat)
                return
            }

            setLoadingMessages(true)
            try {
                console.log("Cargando mensajes para chat:", chat.name)

                const messageDTOs = await chatService.getMessages(chat.idProduct, chat.idProfileProduct, chat.idProfile)

                console.log("Mensajes cargados:", messageDTOs)

                // Convertir MessageDTOs a Messages
                const historicalMessages = messageDTOs.map(convertMessageDTOToMessage)

                // Agregar mensaje de bienvenida si no hay mensajes históricos
                const welcomeMessage: Message = {
                    id: "welcome",
                    content: `Chat con ${chat.name}`,
                    sender: "ai",
                    timestamp: new Date(),
                    read: true,
                }

                // Si no hay mensajes históricos, solo mostrar el mensaje de bienvenida
                if (historicalMessages.length === 0) {
                    setMessages([welcomeMessage])
                } else {
                    // Mostrar mensajes históricos sin el mensaje de bienvenida
                    setMessages(historicalMessages)
                }

                console.log(`Cargados ${historicalMessages.length} mensajes históricos para ${chat.name}`)
            } catch (error) {
                console.error("Error al cargar mensajes históricos:", error)
                setError("Error al cargar los mensajes. Inténtalo de nuevo.")

                // En caso de error, mostrar solo el mensaje de bienvenida
                const welcomeMessage: Message = {
                    id: "welcome",
                    content: `Chat con ${chat.name}`,
                    sender: "ai",
                    timestamp: new Date(),
                    read: true,
                }
                setMessages([welcomeMessage])
            } finally {
                setLoadingMessages(false)
            }
        },
        [convertMessageDTOToMessage],
    )

    // Función para convertir ChatDTO a Chat - simplificada
    const convertChatDTOToChat = useCallback((chatDTO: ChatDTO): Chat => {
        console.log("Convirtiendo ChatDTO:", chatDTO)

        // Extraer datos de la estructura real del backend
        const productId = chatDTO.product?.id || ""
        const profileProductId = chatDTO.product?.profile?.id || ""
        const profileId = chatDTO.profileNoProduct?.id || ""

        // Determinar quién es el "otro usuario" y el nombre del chat
        let chatName: string
        let chatAvatar: string

        if (chatDTO.profileProductSender) {
            // Si el sender es el dueño del producto, el chat se llama como el usuario sin producto
            chatName = chatDTO.profileNoProduct?.nickname || "Usuario desconocido"
            chatAvatar = chatDTO.profileNoProduct?.avatar || chatName.charAt(0).toUpperCase()
        } else {
            // Si el sender no es el dueño del producto, el chat se llama como el producto
            chatName = chatDTO.product?.name || "Producto desconocido"
            chatAvatar = chatName.charAt(0).toUpperCase()
        }

        // Crear un ID único para el chat combinando los IDs relevantes
        const chatId = `${productId}-${profileProductId}-${profileId}`

        const chat: Chat = {
            id: chatId,
            idProduct: productId,
            idProfileProduct: profileProductId,
            idProfile: profileId,
            name: chatName,
            avatar: chatAvatar,
            lastMessage: chatDTO.message || "No hay mensajes",
            timestamp: chatDTO.createdAt ? new Date(chatDTO.createdAt) : new Date(),
            unreadCount: 0,
            isOnline: true,
        }

        console.log("Chat convertido:", chat)
        return chat
    }, [])

    // Actualizar el último mensaje de un chat
    const updateLastMessage = useCallback(
        (chatId: string, message: string, timestamp: Date) => {
            setChats((prevChats) =>
                prevChats.map((chat) =>
                    chat.id === chatId
                        ? {
                            ...chat,
                            lastMessage: message,
                            timestamp,
                            unreadCount: chat.id !== activeChat?.id ? chat.unreadCount + 1 : 0,
                        }
                        : chat,
                ),
            )
        },
        [activeChat?.id],
    )

    // Función para manejar mensajes recibidos
    const handleMessageReceived = useCallback(
        (messageData: MensajeRecibeDTO) => {
            try {
                console.log("Mensaje recibido por WebSocket:", messageData)

                if (!messageData.content) {
                    console.warn("Mensaje recibido sin contenido:", messageData)
                    return
                }
            } catch (error) {
                console.error("Error al procesar el mensaje recibido:", error)
            }
        },
        [activeChat, updateLastMessage],
    )

    // Función para manejar la búsqueda desde el header
    const handleHeaderSearch = useCallback(() => {
        setShowSearchInHeader(!showSearchInHeader)
        if (showSearchInHeader) {
            setMessageSearchTerm("")
        }
    }, [showSearchInHeader])

    // Agregar una nueva función para limpiar la búsqueda de mensajes
    const clearMessageSearch = useCallback(() => {
        setMessageSearchTerm("")
        setShowSearchInHeader(false)
    }, [])

    // Función para limpiar la búsqueda
    const clearSearch = useCallback(() => {
        setSearchTerm("")
        setShowSearchInHeader(false)
    }, [])

    // Función para formatear etiquetas de fecha como WhatsApp
    const formatDateLabel = useCallback((date: Date) => {
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)

        const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

        if (messageDate.getTime() === today.getTime()) {
            return "Hoy"
        } else if (messageDate.getTime() === yesterday.getTime()) {
            return "Ayer"
        } else {
            // Para fechas más antiguas, mostrar día de la semana y fecha
            const options: Intl.DateTimeFormatOptions = {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
            }
            return date.toLocaleDateString("es-ES", options)
        }
    }, [])

    // Función para agrupar mensajes por fecha
    const groupMessagesByDate = useCallback(
        (messages: Message[]) => {
            const groups: { date: Date; dateLabel: string; messages: Message[] }[] = []

            messages.forEach((message) => {
                const messageDate = new Date(message.timestamp)
                const messageDateString = messageDate.toDateString()

                // Buscar si ya existe un grupo para esta fecha
                let existingGroup = groups.find((group) => group.date.toDateString() === messageDateString)

                if (!existingGroup) {
                    // Crear nuevo grupo para esta fecha
                    const dateLabel = formatDateLabel(messageDate)
                    existingGroup = {
                        date: messageDate,
                        dateLabel,
                        messages: [],
                    }
                    groups.push(existingGroup)
                }

                existingGroup.messages.push(message)
            })

            // Ordenar grupos por fecha (más antiguos primero)
            groups.sort((a, b) => a.date.getTime() - b.date.getTime())

            return groups
        },
        [formatDateLabel],
    )

    // Modificar el useMemo de filteredMessages para incluir agrupación por fecha
    const { filteredMessages, messageGroups } = useMemo(() => {
        let filtered = messages

        if (messageSearchTerm.trim()) {
            const term = messageSearchTerm.toLowerCase().trim()
            filtered = messages.filter((message) => message.content.toLowerCase().includes(term))
        }

        const groups = groupMessagesByDate(filtered)

        return {
            filteredMessages: filtered,
            messageGroups: groups,
        }
    }, [messages, messageSearchTerm, groupMessagesByDate])

    // Función para cargar los chats desde el backend
    const loadChats = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)

            const token = localStorage.getItem("token") || sessionStorage.getItem("token")
            if (!token) {
                setError("No se encontró token de autenticación. Por favor, inicia sesión nuevamente.")
                setChats([])
                setLoading(false)
                return
            }

            console.log("Cargando chats del backend...")
            const chatDTOs = await chatService.getChats()
            console.log("Chats recibidos del backend:", chatDTOs)

            // Convertir todos los chats de forma síncrona primero
            const convertedChats = chatDTOs.map((chatDTO) => convertChatDTOToChat(chatDTO))
            setChats(convertedChats)

            console.log("Chats convertidos y cargados:", convertedChats)

            // Después, cargar los nombres de productos de forma asíncrona para los que lo necesiten
            const chatsNeedingProductNames = convertedChats.filter(
                (chat) => chat.name === "Cargando..." && chat.idProduct && chat.idProfileProduct,
            )

            console.log("Chats que necesitan cargar nombres de productos:", chatsNeedingProductNames)

            // Cargar nombres de productos de forma paralela
            const loadPromises = chatsNeedingProductNames.map((chat) =>
                loadProductNameForChat(chat.id, chat.idProduct, chat.idProfileProduct),
            )

            if (loadPromises.length > 0) {
                await Promise.allSettled(loadPromises)
                console.log("Carga de nombres de productos completada")
            }
        } catch (error: any) {
            console.error("Error al cargar chats:", error)

            if (error?.response?.status === 401 || error?.response?.status === 403) {
                setError("Sesión expirada. Por favor, inicia sesión nuevamente.")
            } else if (error?.response?.status === 500) {
                setError("Error del servidor. Inténtalo más tarde.")
            } else if (error?.message?.includes("Network Error")) {
                setError("Error de conexión. Verifica tu conexión a internet.")
            } else {
                setError("Error al cargar los chats. Inténtalo de nuevo.")
            }

            if (error?.response?.status !== 401 && error?.response?.status !== 403) {
                setChats([])
            }
        } finally {
            setLoading(false)
        }
    }, [convertChatDTOToChat, loadProductNameForChat])

    // Función para filtrar chats basado en el término de búsqueda
    const filteredChats = useMemo(() => {
        if (!searchTerm.trim()) {
            return chats
        }

        const term = searchTerm.toLowerCase().trim()
        return chats.filter(
            (chat) => chat.name.toLowerCase().includes(term) || chat.lastMessage.toLowerCase().includes(term),
        )
    }, [chats, searchTerm])

    // Función para manejar errores en suscripciones
    const handleSubscriptionError = useCallback((error: any) => {
        console.error("Error en suscripción:", error)
        setError("Error en la conexión del chat. Intentando reconectar...")
    }, [])

    // Función para conectar al WebSocket
    const connectToWebSocket = useCallback(async () => {
        if (isConnecting || isConnected) return

        try {
            setIsConnecting(true)
            setError(null)

            console.log("Iniciando conexión WebSocket...")

            await chatService.connect(
                () => {
                    console.log("WebSocket conectado exitosamente")
                    setIsConnected(true)
                    setIsConnecting(false)
                    setError(null)
                },
                (error) => {
                    console.error("Error de conexión WebSocket:", error)
                    setIsConnected(false)
                    setIsConnecting(false)

                    if (error?.toString().includes("401") || error?.toString().includes("403")) {
                        setError("Error de autenticación en el chat. Inicia sesión nuevamente.")
                    } else {
                        setError("Error de conexión al chat. Reintentando...")
                    }
                },
            )
        } catch (error: any) {
            console.error("Error al conectar WebSocket:", error)
            setIsConnected(false)
            setIsConnecting(false)

            if (error?.message?.includes("autenticación")) {
                setError("Error de autenticación. Por favor, inicia sesión nuevamente.")
            } else {
                setError("No se pudo conectar al servicio de chat.")
            }
        }
    }, [isConnecting, isConnected])

    // Función para enviar mensaje
    const sendMessage = useCallback(async () => {
        if (inputMessage.trim() === "" || !activeChat || !isConnected) {
            console.warn("No se puede enviar mensaje:", {
                hasMessage: inputMessage.trim() !== "",
                hasActiveChat: !!activeChat,
                isConnected,
            })
            return
        }

        const messageContent = inputMessage.trim()

        try {
            setInputMessage("")

            const newMessage: Message = {
                id: `temp-${Date.now()}-${Math.random()}`,
                content: messageContent,
                sender: "user",
                timestamp: new Date(),
                read: true,
            }

            setMessages((prev) => [...prev, newMessage])
            updateLastMessage(activeChat.id, messageContent, new Date())

            console.log("Enviando mensaje:", messageContent)
            chatService.sendMessage(activeChat.idProduct, activeChat.idProfileProduct, activeChat.idProfile, messageContent)

            console.log("Mensaje enviado exitosamente")
        } catch (error) {
            console.error("Error al enviar mensaje:", error)
            setError("Error al enviar el mensaje. Inténtalo de nuevo.")
            setInputMessage(messageContent)
            setMessages((prev) => prev.filter((msg) => !msg.id.startsWith("temp-")))
        }
    }, [inputMessage, activeChat, isConnected, updateLastMessage])

    // Manejar cambio de chat
    const handleChatSelect = useCallback(
        async (chat: Chat) => {
            console.log("Seleccionando chat:", chat) // Para debug
            console.log("IDs del chat:", {
                idProduct: chat.idProduct,
                idProfileProduct: chat.idProfileProduct,
                idProfile: chat.idProfile,
            })

            setActiveChat(chat)

            // Marcar como leído
            setChats((prevChats) => prevChats.map((c) => (c.id === chat.id ? { ...c, unreadCount: 0 } : c)))

            // Si el chat todavía muestra "Cargando..." y tiene los IDs necesarios, intentar cargar el nombre
            if (chat.name === "Cargando..." && chat.idProduct && chat.idProfileProduct) {
                loadProductNameForChat(chat.id, chat.idProduct, chat.idProfileProduct)
            }

            if (isMobile) {
                setShowChatPanel(true)
            }
        },
        [isMobile, loadProductNameForChat],
    )

    // Volver a la lista de chats (para móvil)
    const handleBackToList = useCallback(() => {
        setShowChatPanel(false)
        setActiveChat(null)
    }, [])

    // Función para recargar chats
    const handleRefreshChats = useCallback(async () => {
        await loadChats()
    }, [loadChats])

    // Función para reintentar conexión
    const handleRetryConnection = useCallback(async () => {
        console.log("Reintentando conexión completa...")
        setError(null)

        try {
            if (chatService.isWebSocketConnected()) {
                chatService.disconnect()
                setIsConnected(false)
            }

            await loadChats()
            await connectToWebSocket()
        } catch (error) {
            console.error("Error al reintentar conexión:", error)
        }
    }, [loadChats, connectToWebSocket])

    // Formateo de tiempo
    const formatMessageTime = useCallback((date: Date) => {
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }, [])

    const formatChatTime = useCallback((date: Date) => {
        const now = new Date()
        const yesterday = new Date(now)
        yesterday.setDate(yesterday.getDate() - 1)

        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        } else if (date.toDateString() === yesterday.toDateString()) {
            return "Ayer"
        } else {
            return date.toLocaleDateString([], { day: "2-digit", month: "2-digit" })
        }
    }, [])

    // useEffect para cargar el perfil del usuario actual al montar el componente
    useEffect(() => {
        const loadCurrentUserProfile = async () => {
            try {
                setLoadingProfile(true)

                // Cargar modo oscuro primero
                try {
                    const modo = await SettingsService.getModoOcuro()
                    // Si modo es true = modo oscuro, si es false = modo claro
                    sessionStorage.setItem("modoOscuroClaro", modo.toString())
                    setDarkMode(modo)
                    console.log("Modo oscuro cargado del backend:", modo)
                } catch (error) {
                    console.error("Error al obtener modo oscuro del backend:", error)
                    const modoOscuroStorage = sessionStorage.getItem("modoOscuroClaro")
                    if (modoOscuroStorage !== null) {
                        setDarkMode(modoOscuroStorage === "true")
                    } else {
                        // Valor por defecto: modo claro
                        sessionStorage.setItem("modoOscuroClaro", "false")
                        setDarkMode(false)
                    }
                }

                // Cargar perfil del usuario solo si hay token
                const token = localStorage.getItem("token") || sessionStorage.getItem("token")
                if (token) {
                    try {
                        const profile = await ProfileService.getProfileInfo()
                        setCurrentUserProfile(profile)
                        console.log("Perfil del usuario actual cargado:", profile.nickname)
                    } catch (error) {
                        console.error("Error al cargar el perfil del usuario:", error)
                        // No establecer error aquí para permitir la redirección de useAuthRedirect
                    }
                }
            } catch (error) {
                console.error("Error al cargar el perfil del usuario actual:", error)
                // En caso de error con el perfil, aún establecer modo oscuro
                const modoOscuroStorage = sessionStorage.getItem("modoOscuroClaro")
                if (modoOscuroStorage !== null) {
                    setDarkMode(modoOscuroStorage === "true")
                } else {
                    sessionStorage.setItem("modoOscuroClaro", "true")
                    setDarkMode(true)
                }
            } finally {
                setLoadingProfile(false)
            }
        }

        loadCurrentUserProfile()
    }, [])

    // También agrega este useEffect adicional para escuchar cambios en sessionStorage
    useEffect(() => {
        // Función para verificar y aplicar el modo desde sessionStorage
        const checkAndApplyMode = () => {
            const modoOscuroStorage = sessionStorage.getItem("modoOscuroClaro")
            if (modoOscuroStorage !== null) {
                const shouldBeDark = modoOscuroStorage === "true"
                if (darkMode !== shouldBeDark) {
                    setDarkMode(shouldBeDark)
                    console.log("Modo actualizado desde sessionStorage:", shouldBeDark)
                }
            }
        }

        // Verificar al montar
        checkAndApplyMode()

        // Escuchar cambios en el sessionStorage (para cambios desde otras pestañas)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === "modoOscuroClaro" && e.newValue !== null) {
                const shouldBeDark = e.newValue === "true"
                setDarkMode(shouldBeDark)
                console.log("Modo actualizado por storage event:", shouldBeDark)
            }
        }

        // Escuchar cambios en el sessionStorage desde la misma pestaña
        const handleSessionStorageChange = () => {
            checkAndApplyMode()
        }

        // Intervalo para verificar cambios (fallback)
        const interval = setInterval(checkAndApplyMode, 1000)

        window.addEventListener("storage", handleStorageChange)
        window.addEventListener("sessionstoragechange", handleSessionStorageChange)

        return () => {
            window.removeEventListener("storage", handleStorageChange)
            window.removeEventListener("sessionstoragechange", handleSessionStorageChange)
            clearInterval(interval)
        }
    }, [darkMode])

    // Efecto para inicializar la conexión y cargar chats
    useEffect(() => {
        const initializeChat = async () => {
            console.log("Inicializando chat...")

            const token = localStorage.getItem("token") || sessionStorage.getItem("token")
            if (!token) {
                setError("No se encontró token de autenticación. Por favor, inicia sesión.")
                setLoading(false)
                return
            }

            try {
                await loadChats()
                await connectToWebSocket()
            } catch (error) {
                console.error("Error en inicialización:", error)
            }
        }

        // Solo inicializar si hay token
        const token = localStorage.getItem("token") || sessionStorage.getItem("token")
        if (token) {
            initializeChat()
        } else {
            setLoading(false)
        }

        return () => {
            console.log("Limpiando conexiones de chat...")
            if (activeSubscription) {
                chatService.unsubscribeFromChat(activeSubscription)
            }
            chatService.disconnect()
        }
    }, [])

    // Efecto para detectar el tamaño de la pantalla
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768)
        }

        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    // Efecto para detectar cuando el teclado virtual aparece/desaparece
    useEffect(() => {
        const handleVisibilityChange = () => {
            const isKeyboardOpen = window.innerHeight < window.outerHeight * 0.75
            setIsKeyboardVisible(isKeyboardOpen)

            if (isKeyboardOpen && inputRef.current) {
                setTimeout(() => {
                    inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
                }, 100)
            }
        }

        window.addEventListener("resize", handleVisibilityChange)
        return () => window.removeEventListener("resize", handleVisibilityChange)
    }, [])

    // Scroll al último mensaje cuando se añaden nuevos mensajes
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [messages])

    // Suscribirse a la sala de chat cuando cambia el chat activo
    useEffect(() => {
        if (isConnected && activeChat && currentUserProfile && !loadingProfile) {
            console.log("Configurando suscripción para chat:", activeChat.name)

            if (activeSubscription) {
                console.log("Cancelando suscripción anterior:", activeSubscription)
                chatService.unsubscribeFromChat(activeSubscription)
                setActiveSubscription(null)
            }

            try {
                const subscriptionKey = chatService.subscribeToChat(
                    activeChat.idProduct,
                    activeChat.idProfileProduct,
                    activeChat.idProfile,
                    handleMessageReceived,
                    handleSubscriptionError,
                )

                setActiveSubscription(subscriptionKey)

                // Cargar mensajes históricos
                loadChatMessages(activeChat)

                console.log(`Suscrito exitosamente al chat: ${activeChat.name}`)
            } catch (error) {
                console.error("Error al suscribirse al chat:", error)
                setError("Error al conectar con el chat. Inténtalo de nuevo.")
            }
        }
    }, [
        isConnected,
        activeChat,
        handleMessageReceived,
        handleSubscriptionError,
        activeSubscription,
        loadChatMessages,
        currentUserProfile,
        loadingProfile,
    ])

    // Enfoque en el input cuando se cambia de chat
    useEffect(() => {
        if (activeChat && !isMobile) {
            setTimeout(() => {
                inputRef.current?.focus()
            }, 300)
        }
    }, [activeChat, isMobile])

    // Determinar si debemos mostrar el TabBar
    const shouldShowNavigation = isMobile && !showChatPanel

    // Mostrar indicador de carga inicial
    if (loading) {
        return (
            <div className={`chat-view ${darkMode ? "dark-theme" : "light-theme"}`}>
                <div className="loading-content">
                    <IonSpinner name="crescent" />
                    <p>Cargando chats...</p>
                </div>
            </div>
        )
    }

    if (loadingProfile) {
        return (
            <IonPage>
                <IonContent>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            height: "100%",
                        }}
                    >
                        <IonSpinner name="crescent" />
                        <p style={{ marginLeft: "10px" }}>Cargando perfil...</p>
                    </div>
                </IonContent>
            </IonPage>
        )
    }

    // Verificar si hay un token antes de mostrar el contenido principal
    const token = localStorage.getItem("token") || sessionStorage.getItem("token")
    if (!token) {
        return (
            <IonPage>
                <IonContent>
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                            height: "100%",
                            padding: "20px",
                            textAlign: "center",
                        }}
                    >
                        <h2>Necesitas iniciar sesión</h2>
                        <p>Por favor, inicia sesión para acceder al chat.</p>
                    </div>
                </IonContent>
            </IonPage>
        )
    }

    return (
        <div className={`chat-view ${darkMode ? "dark-theme" : "light-theme"}`}>
            {/* Banner de error */}
            {error && (
                <div className="error-banner">
                    <span>{error}</span>
                    <button onClick={() => setError(null)} aria-label="Cerrar error">
                        ×
                    </button>
                </div>
            )}

            {/* Sidebar de chats */}
            <div className={`chat-sidebar ${showChatPanel ? "hidden-mobile" : ""}`}>
                <div className="sidebar-header">
                    <div className="user-profile">
                        {!isMobile && (
                            <IonButtons slot="start" className="hamburger-menu-button">
                                <IonMenuButton>
                                    <IonIcon icon={menuOutline} style={{ color: darkMode ? "white" : "black", fontSize: "24px" }} />
                                </IonMenuButton>
                            </IonButtons>
                        )}
                        <div className="user-avatar">
                            <img src={currentUserProfile?.avatar || "/placeholder.svg"} alt={"Avatar"} />
                        </div>
                        <h3>{currentUserProfile?.nickname || "Usuario"}</h3>
                    </div>

                    <div className="header-actions">
                        {!isConnected && (
                            <button
                                className="action-icon-button retry-button"
                                onClick={handleRetryConnection}
                                title="Reintentar conexión"
                            >
                                <IonIcon icon={checkmarkOutline} />
                            </button>
                        )}
                    </div>
                </div>

                <div className="search-container">
                    <div className="chat-search">
                        <IonIcon icon={searchOutline} />
                        <input
                            type="text"
                            placeholder="Buscar chats"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button className="clear-search-button" onClick={clearSearch} aria-label="Limpiar búsqueda">
                                ×
                            </button>
                        )}
                    </div>
                </div>

                <div className="chats-list">
                    {filteredChats.length === 0 ? (
                        <div className="no-chats">
                            {searchTerm ? (
                                <>
                                    <p>No se encontraron chats que coincidan con "{searchTerm}"</p>
                                    <button onClick={clearSearch}>Limpiar búsqueda</button>
                                </>
                            ) : (
                                <>
                                    <p>No hay chats disponibles</p>
                                    <button onClick={handleRefreshChats}>Recargar</button>
                                </>
                            )}
                        </div>
                    ) : (
                        filteredChats.map((chat) => (
                            <div
                                key={chat.id}
                                className={`chat-item ${activeChat?.id === chat.id ? "active" : ""}`}
                                onClick={() => handleChatSelect(chat)}
                            >
                                {/* resto del contenido del chat item permanece igual */}
                                <div className={`chat-avatar ${chat.isOnline ? "online" : ""}`}>
                                    <div className="user-avatar-chat">
                                        {loadingProductNames.has(chat.id) ? (
                                            <IonSpinner name="crescent" />
                                        ) : (
                                            <img src={cloudinaryImage(chat.avatar) || "/placeholder.svg"} />
                                        )}
                                    </div>
                                </div>
                                <div className="chat-info">
                                    <div className="chat-header">
                                        <h4>{chat.name}</h4>
                                        <span className="chat-time">{formatChatTime(chat.timestamp)}</span>
                                    </div>
                                    <div className="chat-preview">
                                        <p>{chat.lastMessage}</p>
                                        {chat.unreadCount > 0 && <span className="unread-badge">{chat.unreadCount}</span>}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {shouldShowNavigation && (
                    <div className="chat-mobile-footer">
                        <Navegacion isDesktop={false} isChatView={true} />
                    </div>
                )}
            </div>

            {/* Panel principal del chat */}
            <div className={`chat-main ${showChatPanel ? "shown-mobile" : ""}`} ref={chatMainRef}>
                {activeChat ? (
                    <>
                        {/* Header del chat */}
                        <div className="chat-header">
                            <div className="header-content">
                                <button className="back-button" onClick={handleBackToList}>
                                    <IonIcon icon={arrowBackOutline} />
                                </button>
                                <div className={`chat-avatar ${activeChat.isOnline ? "online" : ""}`}>
                                    <div className="user-avatar-chat">
                                        <img src={cloudinaryImage(activeChat.avatar) || "/placeholder.svg"} alt={"Avatar"} />
                                    </div>
                                </div>
                                <div className="chat-info">
                                    <h3>{activeChat.name}</h3>
                                    <span className="status-text">
                    {isConnected ? (activeChat.isOnline ? "En línea" : "Último acceso hace 3h") : "Desconectado"}
                  </span>
                                </div>
                            </div>
                            <div className="header-actions">
                                <button className="action-icon-button" onClick={handleHeaderSearch} title="Buscar en chat">
                                    <IonIcon icon={searchOutline} />
                                </button>
                                <button className="action-icon-button">
                                    <IonIcon icon={ellipsisVerticalOutline} />
                                </button>
                            </div>
                            {showSearchInHeader && (
                                <div className="header-search-container">
                                    <div className="header-search-input">
                                        <IonIcon icon={searchOutline} />
                                        <input
                                            type="text"
                                            placeholder="Buscar en este chat..."
                                            value={messageSearchTerm}
                                            onChange={(e) => setMessageSearchTerm(e.target.value)}
                                            autoFocus
                                        />
                                        <button
                                            className="close-search-button"
                                            onClick={() => setShowSearchInHeader(false)}
                                            aria-label="Cerrar búsqueda"
                                        >
                                            ×
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Contenedor de mensajes */}
                        <div className="messages-container" id="messages-container">
                            {loadingMessages ? (
                                <div className="loading-messages">
                                    <IonSpinner name="crescent" />
                                    <p>Cargando mensajes...</p>
                                </div>
                            ) : (
                                <div className="messages-list">
                                    {messageGroups.length === 0 && messageSearchTerm ? (
                                        <div className="no-messages-found">
                                            <p>No se encontraron mensajes con "{messageSearchTerm}"</p>
                                            <button onClick={clearMessageSearch}>Limpiar búsqueda</button>
                                        </div>
                                    ) : (
                                        messageGroups.map((group, groupIndex) => (
                                            <div key={`group-${group.date.getTime()}`} className="message-group">
                                                {/* Separador de fecha */}
                                                <div className="date-separator">
                                                    <div className="date-separator-line"></div>
                                                    <div className="date-separator-text">{group.dateLabel}</div>
                                                    <div className="date-separator-line"></div>
                                                </div>

                                                {/* Mensajes del grupo */}
                                                {group.messages.map((message) => (
                                                    <div
                                                        key={message.id}
                                                        className={`message-container ${
                                                            message.sender === "user"
                                                                ? "user-message"
                                                                : message.sender === "ai"
                                                                    ? "ai-message"
                                                                    : "other-message"
                                                        } ${messageSearchTerm && message.content.toLowerCase().includes(messageSearchTerm.toLowerCase()) ? "highlighted-message" : ""}`}
                                                    >
                                                        <div className="message-avatar">
                                                            {message.sender === "ai" ? (
                                                                <div className="ai-avatar">AI</div>
                                                            ) : message.sender === "user" ? (
                                                                <div className="user-avatar">
                                                                    <img src={currentUserProfile?.avatar || "/placeholder.svg"} alt={"Avatar"} />
                                                                </div>
                                                            ) : (
                                                                <div className="user-avatar-chat">
                                                                    <img src={cloudinaryImage(activeChat.avatar) || "/placeholder.svg"} alt={"Avatar"} />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="message-content">
                                                            {message.sender === "other" && <div className="sender-name">{message.senderName}</div>}
                                                            <div className="message-bubble">
                                                                {message.image && (
                                                                    <div className="message-image-container">
                                                                        <img
                                                                            src={message.image || "/placeholder.svg"}
                                                                            alt="Imagen adjunta"
                                                                            className="message-image"
                                                                        />
                                                                    </div>
                                                                )}
                                                                <div className="message-text">{message.content}</div>
                                                                <div className="message-time">
                                                                    {formatMessageTime(message.timestamp)}
                                                                    {message.sender === "user" && (
                                                                        <span className="read-status">
                                      <IonIcon icon={message.read ? checkmarkDoneOutline : checkmarkOutline} />
                                    </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ))
                                    )}

                                    {isTyping && (
                                        <div className="message-container ai-message">
                                            <div className="message-avatar">
                                                <div className="ai-avatar">AI</div>
                                            </div>
                                            <div className="message-content">
                                                <div className="message-bubble typing-indicator">
                                                    <IonSpinner name="dots" />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div ref={messagesEndRef}></div>
                                </div>
                            )}
                        </div>

                        {/* Footer del chat (input de mensaje) */}
                        <div className={`chat-footer ${isKeyboardVisible ? "keyboard-visible" : ""}`}>
                            <div className="input-container">
                                <button className="action-button">
                                    <IonIcon icon={addOutline} />
                                </button>
                                <button className="action-button">
                                    <IonIcon icon={imageOutline} />
                                </button>
                                <div className="message-input-wrapper">
                                    <input
                                        type="text"
                                        className="chat-input"
                                        placeholder={isConnected ? "Escribe un mensaje..." : "Conectando..."}
                                        value={inputMessage}
                                        onChange={(e) => setInputMessage(e.target.value)}
                                        onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                                        ref={inputRef}
                                        disabled={!isConnected}
                                    />
                                </div>
                                {inputMessage.trim() ? (
                                    <button className="send-button" onClick={sendMessage} disabled={!isConnected}>
                                        <IonIcon icon={sendOutline} />
                                    </button>
                                ) : (
                                    <button className="action-button">
                                        <IonIcon icon={micOutline} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="no-chat-selected">
                        <div className="no-chat-content">
                            <IonIcon icon={chatbubblesOutline} size="large" />
                            <h2>Selecciona un chat para comenzar</h2>
                            <p>Escoge una conversación de la lista para ver los mensajes</p>
                            {!isConnected && (
                                <button onClick={handleRetryConnection} className="retry-connection-button">
                                    Reintentar conexión
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ChatPage
