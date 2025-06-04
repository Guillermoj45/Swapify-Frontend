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
import { useLocation } from "react-router-dom"

// Import trade system components
import { ProductSelectionModal } from "./modal/productSelectionModal"
import { ProductMessage } from "./modal/productMessage"
import { TradeSummaryModal } from "./modal/TradeSummaryModal"
import { useTradeSystem } from "../../hooks/UseTradeSystemProps"
import type { Product } from "../../Services/ProductService"

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
    isTradeMessage?: boolean
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
    isTemporaryChat?: boolean
}

interface TemporaryChatData {
    productId: string
    profileProductId: string
    productName?: string
    productAvatar?: string
    sellerNickname?: string
}

const ChatPage: React.FC = () => {
    useAuthRedirect()
    const location = useLocation()

    // Estado de conexión
    const [isConnected, setIsConnected] = useState(false)
    const [isConnecting, setIsConnecting] = useState(false)
    const [currentUserProfile, setCurrentUserProfile] = useState<ProfileDTO | null>(null)
    const [loadingProfile, setLoadingProfile] = useState(true)

    // Estado para los chats
    const [chats, setChats] = useState<Chat[]>([])

    // Estado para chat temporal
    const [temporaryChatData, setTemporaryChatData] = useState<TemporaryChatData | null>(null)
    const [isTemporaryChat, setIsTemporaryChat] = useState(false)

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

    // Estado para el indicador de escritura
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

    // Estado para modal de productos
    const [showProductModal, setShowProductModal] = useState(false)

    // Determinar si el usuario actual es el dueño del producto
    const isCurrentUserProductOwner = useMemo(() => {
        return activeChat?.idProfileProduct === currentUserProfile?.id
    }, [activeChat?.idProfileProduct, currentUserProfile?.id])

    // FUNCIÓN NUEVA: Refrescar chats
    const refreshChats = useCallback(async () => {
        console.log("🔄 Refrescando chats después de intercambio...")
        try {
            await loadChats()
            console.log("✅ Chats refrescados exitosamente")
        } catch (error) {
            console.error("❌ Error al refrescar chats:", error)
        }
    }, [])

    // FUNCIÓN NUEVA: Cerrar todos los modales
    const closeAllModals = useCallback(() => {
        console.log("🔒 Cerrando todos los modales...")
        setShowProductModal(false)
    }, [])

    // INTEGRACIÓN DEL SISTEMA DE INTERCAMBIO CON MEJORAS
    const {
        tradeState,
        handleProductsSelected: handleTradeProductsSelected,
        processTradeMessage,
        confirmTrade,
        closeTradeSummary,
        cancelTrade,
    } = useTradeSystem({
        chatId: activeChat?.id || "",
        currentUserId: currentUserProfile?.id || "",
        isCurrentUserProductOwner,
        productDelChat: activeChat?.idProduct || "",
        onModalsClose: closeAllModals,
        onRefreshChats: refreshChats, // NUEVO: Pasar función de refresh
        onTradeConfirmed: async (tradeOffer) => {
            console.log("🎉 Intercambio confirmado:", tradeOffer)

            try {
                // NUEVO: Cerrar todos los modales inmediatamente
                closeAllModals()

                // MEJORADO: Crear mensaje de confirmación más detallado
                const confirmationMessage = JSON.stringify({
                    type: "trade_confirmed",
                    tradeId: tradeOffer.id,
                    message: "¡Intercambio confirmado! El dueño del producto ha aceptado la propuesta.",
                    timestamp: new Date().toISOString(),
                    traderProducts: tradeOffer.traderProducts,
                    nonTraderProducts: tradeOffer.nonTraderProducts,
                })

                // Enviar mensaje de confirmación
                if (activeChat && !activeChat.isTemporaryChat) {
                    await chatService.sendMessage(
                        activeChat.idProduct,
                        activeChat.idProfileProduct,
                        activeChat.idProfile,
                        confirmationMessage,
                    )

                    console.log("✅ Confirmación de intercambio enviada al chat")
                }

                // NUEVO: Refrescar chats inmediatamente y luego después de un delay
                await refreshChats()

                // Segundo refresh para asegurar que ambos usuarios vean los cambios
                setTimeout(async () => {
                    await refreshChats()
                    console.log("🔄 Segunda recarga de chats completada")
                }, 3000)
            } catch (error) {
                console.error("❌ Error al enviar confirmación:", error)
                setError("Error al enviar la confirmación del intercambio.")
            }
        },
    })

    // FUNCIÓN NUEVA: Filtrar mensajes de intercambio JSON
    const shouldDisplayMessage = useCallback((message: Message): boolean => {
        try {
            if (message.content.startsWith('{"type":"trade_selection"')) {
                console.log("🚫 Filtrando mensaje JSON de intercambio:", message.id)
                return false
            }

            if (message.content.startsWith('{"type":"trade_confirmed"')) {
                return true
            }

            return true
        } catch (error) {
            return true
        }
    }, [])

    // NUEVA FUNCIÓN: Parsear parámetros de URL para chat temporal
    const parseUrlParams = useCallback(() => {
        const urlParams = new URLSearchParams(location.search)
        const productId = urlParams.get("productId")
        const profileProductId = urlParams.get("profileProductId")
        const initChat = urlParams.get("initChat")

        console.log("Parámetros de URL detectados:", {
            productId,
            profileProductId,
            initChat,
            fullSearch: location.search,
        })

        if (productId && profileProductId && initChat === "true") {
            return {
                productId,
                profileProductId,
            }
        }

        return null
    }, [location.search])

    // NUEVA FUNCIÓN: Crear chat temporal
    const createTemporaryChat = useCallback(
        async (productId: string, profileProductId: string) => {
            try {
                console.log("🆕 Creando chat temporal para producto:", { productId, profileProductId })

                const product = await ProductService.getProductById(productId, profileProductId)

                console.log("📦 Producto cargado para chat temporal:", product)

                const tempChatData: TemporaryChatData = {
                    productId,
                    profileProductId,
                    productName: product.name,
                    productAvatar: product.imagenes?.[0] || product.name.charAt(0).toUpperCase(),
                    sellerNickname: product.profile.nickname,
                }

                setTemporaryChatData(tempChatData)

                const temporaryChat: Chat = {
                    id: `temp-${productId}-${profileProductId}`,
                    idProduct: productId,
                    idProfileProduct: profileProductId,
                    idProfile: currentUserProfile?.id || "",
                    name: product.name,
                    avatar: product.imagenes?.[0] || product.name.charAt(0).toUpperCase(),
                    lastMessage: "Conversación iniciada",
                    timestamp: new Date(),
                    unreadCount: 0,
                    isOnline: true,
                    isTemporaryChat: true,
                }

                setChats((prevChats) => [temporaryChat, ...prevChats])
                setActiveChat(temporaryChat)
                setIsTemporaryChat(true)

                const welcomeMessage: Message = {
                    id: "welcome-temp",
                    content: `¡Hola! Estás a punto de iniciar una conversación sobre "${product.name}" con ${product.profile.nickname}. Escribe tu mensaje para comenzar.`,
                    sender: "ai",
                    timestamp: new Date(),
                    read: true,
                    delivered: true,
                    status: "read",
                }

                setMessages([welcomeMessage])

                if (isMobile) {
                    setShowChatPanel(true)
                }

                console.log("✅ Chat temporal creado exitosamente")
            } catch (error) {
                console.error("❌ Error al crear chat temporal:", error)
                setError("Error al iniciar la conversación. Inténtalo de nuevo.")
            }
        },
        [currentUserProfile, isMobile],
    )

    // FUNCIÓN CORREGIDA: Lógica centralizada para determinar si un mensaje es del usuario actual
    const isMessageFromCurrentUser = useCallback(
        (profileProductSender: boolean): boolean => {
            if (!currentUserProfile || !activeChat) {
                return false
            }

            const isCurrentUserProductOwner = activeChat.idProfileProduct === currentUserProfile.id
            return isCurrentUserProductOwner ? profileProductSender : !profileProductSender
        },
        [activeChat, currentUserProfile],
    )

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

    // FUNCIÓN CORREGIDA: Convertir MessageDTO a Message usando la lógica centralizada
    const convertMessageDTOToMessage = useCallback(
        (messageDTO: MessageDTO): Message => {
            if (!currentUserProfile || !activeChat) {
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
                    isTradeMessage: messageDTO.content.startsWith('{"type":"trade_'),
                }
            }

            const isFromCurrentUser = isMessageFromCurrentUser(messageDTO.profileProductSender)

            console.log("🔍 Convirtiendo MessageDTO:", {
                messageId: messageDTO.id,
                senderNickname: messageDTO.senderNickname,
                profileProductSender: messageDTO.profileProductSender,
                isFromCurrentUser,
                currentUserNickname: currentUserProfile.nickname,
                isCurrentUserProductOwner: activeChat.idProfileProduct === currentUserProfile.id,
            })

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
                isTradeMessage: messageDTO.content.startsWith('{"type":"trade_'),
            }
        },
        [activeChat, currentUserProfile, isMessageFromCurrentUser],
    )

    const loadChatMessages = useCallback(
        async (chat: Chat) => {
            if (chat.isTemporaryChat) {
                console.log("📝 Chat temporal detectado, no cargando mensajes del servidor")
                return
            }

            if (!chat.idProduct || !chat.idProfileProduct || !chat.idProfile) {
                console.warn("No se pueden cargar mensajes sin IDs válidos:", chat)
                return
            }

            setLoadingMessages(true)
            try {
                console.log("Cargando mensajes para chat:", chat.name)

                const messageDTOs = await chatService.getMessages(chat.idProduct, chat.idProfileProduct, chat.idProfile)

                console.log("Mensajes cargados:", messageDTOs)

                const historicalMessages = messageDTOs.map(convertMessageDTOToMessage).filter(shouldDisplayMessage)

                const welcomeMessage: Message = {
                    id: "welcome",
                    content: `Chat con ${chat.name}`,
                    sender: "ai",
                    timestamp: new Date(),
                    read: true,
                    delivered: true,
                    status: "read",
                }

                if (historicalMessages.length === 0) {
                    setMessages([welcomeMessage])
                } else {
                    setMessages(historicalMessages)
                }

                console.log(`Cargados ${historicalMessages.length} mensajes históricos para ${chat.name}`)
            } catch (error) {
                console.error("Error al cargar mensajes históricos:", error)
                setError("Error al cargar los mensajes. Inténtalo de nuevo.")

                const welcomeMessage: Message = {
                    id: "welcome",
                    content: `Chat con ${chat.name}`,
                    sender: "ai",
                    timestamp: new Date(),
                    read: true,
                    delivered: true,
                    status: "read",
                }
                setMessages([welcomeMessage])
            } finally {
                setLoadingMessages(false)
            }
        },
        [convertMessageDTOToMessage, shouldDisplayMessage],
    )

    // Función para convertir ChatDTO a Chat - simplificada
    const convertChatDTOToChat = useCallback(
        (chatDTO: ChatDTO): Chat => {
            console.log("Convirtiendo ChatDTO:", chatDTO)

            const productId = chatDTO.product?.id || ""
            const profileProductId = chatDTO.product?.profile?.id || ""
            const profileId = chatDTO.profileNoProduct?.id || ""

            let chatName: string
            let chatAvatar: string

            const isCurrentUserProductOwner = currentUserProfile?.id === profileProductId

            if (isCurrentUserProductOwner) {
                chatName = chatDTO.profileNoProduct?.nickname || "Usuario desconocido"
                chatAvatar = chatDTO.profileNoProduct?.avatar || chatName.charAt(0).toUpperCase()
            } else {
                chatName = chatDTO.product?.name || "Producto desconocido"
                chatAvatar = chatDTO.product?.imagenes?.[0] || chatDTO.product?.name?.charAt(0).toUpperCase() || "P"
            }

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
                isTemporaryChat: false,
            }

            console.log("Chat convertido:", chat)
            console.log("Usuario actual es dueño del producto:", isCurrentUserProductOwner)
            console.log("Nombre del chat asignado:", chatName)

            return chat
        },
        [currentUserProfile],
    )

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

    // FUNCIÓN MODIFICADA: Manejar mensajes recibidos por WebSocket con filtrado mejorado
    const handleMessageReceived = useCallback(
        (messageData: MensajeRecibeDTO) => {
            try {
                console.log("📨 Mensaje recibido por WebSocket:", messageData)

                if (!messageData.content || !currentUserProfile || !activeChat) {
                    console.warn("Mensaje recibido sin contenido o falta información del usuario/chat:", {
                        hasContent: !!messageData.content,
                        hasCurrentUserProfile: !!currentUserProfile,
                        hasActiveChat: !!activeChat,
                    })
                    return
                }

                // NUEVO: Verificar si es un mensaje de confirmación de intercambio
                if (messageData.content.startsWith('{"type":"trade_confirmed"')) {
                    console.log("🎉 Mensaje de confirmación de intercambio recibido")

                    // Cerrar todos los modales
                    closeAllModals()

                    // Recargar chats para ambos usuarios
                    setTimeout(async () => {
                        await refreshChats()
                        console.log("🔄 Chats recargados tras confirmación de intercambio")
                    }, 1000)

                    updateLastMessage(activeChat.id, "¡Intercambio confirmado!", new Date(messageData.createdAt || Date.now()))
                    return
                }

                // PRIMERO: Verificar si es un mensaje de intercambio
                const isTradeMessage = processTradeMessage(messageData.content)

                if (isTradeMessage) {
                    console.log("✅ Mensaje de intercambio procesado")

                    // NUEVO: No actualizar el último mensaje si es un JSON de selección
                    if (!messageData.content.startsWith('{"type":"trade_selection"')) {
                        updateLastMessage(activeChat.id, "Propuesta de intercambio", new Date(messageData.createdAt || Date.now()))
                    }
                    return
                }

                // SEGUNDO: Procesar como mensaje normal
                if (messageData.profileProductSender === undefined) {
                    console.error("❌ PROBLEMA: El mensaje de WebSocket NO tiene el campo 'profileProductSender'")
                    console.error("📋 Campos disponibles:", Object.keys(messageData))
                    console.error("🚨 El backend debe incluir 'profileProductSender' en los mensajes de WebSocket")

                    const isFromCurrentUser =
                        messageData.senderNickname === currentUserProfile.nickname ||
                        messageData.userName === currentUserProfile.nickname

                    if (isFromCurrentUser) {
                        console.log("⚠️ Mensaje ignorado: es del usuario actual (usando fallback de nickname)")
                        return
                    }
                } else {
                    const isFromCurrentUser = isMessageFromCurrentUser(messageData.profileProductSender)

                    console.log("🔍 Análisis del remitente del mensaje WebSocket:", {
                        senderNickname: messageData.senderNickname,
                        currentUserNickname: currentUserProfile.nickname,
                        profileProductSender: messageData.profileProductSender,
                        isCurrentUserProductOwner: activeChat.idProfileProduct === currentUserProfile.id,
                        isFromCurrentUser,
                    })

                    if (isFromCurrentUser) {
                        console.log("⚠️ Mensaje ignorado: es del usuario actual")
                        return
                    }
                }

                // Crear el nuevo mensaje desde el DTO recibido (solo para otros usuarios)
                const newMessage: Message = {
                    id: messageData.id || `received-${Date.now()}-${Math.random()}`,
                    content: messageData.content,
                    sender: "other",
                    timestamp: messageData.createdAt ? new Date(messageData.createdAt) : new Date(),
                    read: false,
                    delivered: true,
                    status: "delivered",
                    senderName: messageData.senderNickname || messageData.userName || "Usuario",
                    senderId: messageData.senderNickname || messageData.userName,
                    isTemporary: false,
                    isTradeMessage: messageData.content.startsWith('{"type":"trade_'),
                }

                // NUEVO: Verificar si el mensaje debe mostrarse
                if (!shouldDisplayMessage(newMessage)) {
                    console.log("🚫 Mensaje filtrado, no se mostrará en la UI")
                    return
                }

                console.log("✅ Nuevo mensaje de otro usuario procesado:", newMessage)

                setMessages((prevMessages) => {
                    const exists = prevMessages.some((msg) => msg.id === newMessage.id)
                    if (exists) {
                        console.log("Mensaje ya existe, no se agrega duplicado")
                        return prevMessages
                    }

                    console.log("✅ Agregando mensaje de otro usuario al chat activo")
                    return [...prevMessages, newMessage]
                })

                setTimeout(() => {
                    setMessages((prevMessages) =>
                        prevMessages.map((msg) => (msg.id === newMessage.id ? { ...msg, read: true, status: "read" } : msg)),
                    )
                }, 1000)

                updateLastMessage(activeChat.id, messageData.content, new Date(messageData.createdAt || Date.now()))
            } catch (error) {
                console.error("❌ Error al procesar el mensaje recibido:", error)
            }
        },
        [
            activeChat,
            updateLastMessage,
            currentUserProfile,
            isMessageFromCurrentUser,
            processTradeMessage,
            shouldDisplayMessage,
            closeAllModals,
            refreshChats,
        ],
    )

    // FUNCIÓN MODIFICADA: Manejar selección de productos con sistema de intercambio
    const handleProductsSelected = useCallback(
        (products: Product[]) => {
            console.log("🛍️ Productos seleccionados:", products)

            // Usar el sistema de intercambio para manejar la selección
            const tradeMessage = handleTradeProductsSelected(products)

            if (tradeMessage && activeChat) {
                const tempId = `temp-trade-${Date.now()}-${Math.random()}`

                // NUEVO: Crear mensaje temporal visible para el usuario
                const userVisibleMessage: Message = {
                    id: tempId,
                    content: `Has seleccionado ${products.length} producto(s) para intercambio`,
                    sender: "user",
                    timestamp: new Date(),
                    read: false,
                    delivered: false,
                    status: "sending",
                    isTemporary: true,
                }

                setMessages((prev) => [...prev, userVisibleMessage])
                updateLastMessage(activeChat.id, `Productos seleccionados: ${products.length}`, new Date())

                // Enviar mensaje de intercambio (JSON) al backend
                if (!activeChat.isTemporaryChat) {
                    chatService
                        .sendMessage(
                            activeChat.idProduct,
                            activeChat.idProfileProduct,
                            activeChat.idProfile,
                            JSON.stringify(tradeMessage),
                        )
                        .then(() => {
                            setMessages((prevMessages) =>
                                prevMessages.map((msg) =>
                                    msg.id === tempId ? { ...msg, status: "sent", delivered: true, isTemporary: false } : msg,
                                ),
                            )
                            console.log("✅ Mensaje de intercambio enviado")
                        })
                        .catch((error) => {
                            console.error("❌ Error al enviar mensaje de intercambio:", error)
                            setError("Error al enviar la propuesta de intercambio")
                        })
                }
            }

            setShowProductModal(false)
        },
        [handleTradeProductsSelected, activeChat, updateLastMessage],
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

            // NUEVO: Filtrar mensajes antes de agrupar
            const visibleMessages = messages.filter(shouldDisplayMessage)

            visibleMessages.forEach((message) => {
                const messageDate = new Date(message.timestamp)
                const messageDateString = messageDate.toDateString()

                let existingGroup = groups.find((group) => group.date.toDateString() === messageDateString)

                if (!existingGroup) {
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

            groups.sort((a, b) => a.date.getTime() - b.date.getTime())

            return groups
        },
        [formatDateLabel, shouldDisplayMessage],
    )

    // Modificar el useMemo de filteredMessages para incluir agrupación por fecha
    const { filteredMessages, messageGroups } = useMemo(() => {
        // NUEVO: Filtrar mensajes JSON primero
        const visibleMessages = messages.filter(shouldDisplayMessage)
        let filtered = visibleMessages

        if (messageSearchTerm.trim()) {
            const term = messageSearchTerm.toLowerCase().trim()
            filtered = visibleMessages.filter((message) => message.content.toLowerCase().includes(term))
        }

        const groups = groupMessagesByDate(filtered)

        return {
            filteredMessages: filtered,
            messageGroups: groups,
        }
    }, [messages, messageSearchTerm, groupMessagesByDate, shouldDisplayMessage])

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

            const convertedChats = chatDTOs.map((chatDTO) => convertChatDTOToChat(chatDTO))

            if (temporaryChatData) {
                const existingTemporaryChat = chats.find((chat) => chat.isTemporaryChat)
                if (existingTemporaryChat) {
                    setChats([existingTemporaryChat, ...convertedChats])
                } else {
                    setChats(convertedChats)
                }
            } else {
                setChats(convertedChats)
            }

            console.log("Chats convertidos y cargados:", convertedChats)

            const chatsNeedingProductNames = convertedChats.filter(
                (chat) => chat.name === "Cargando..." && chat.idProduct && chat.idProfileProduct,
            )

            console.log("Chats que necesitan cargar nombres de productos:", chatsNeedingProductNames)

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
    }, [convertChatDTOToChat, loadProductNameForChat, temporaryChatData, chats])

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

            console.log("🔌 Iniciando conexión WebSocket...")

            await chatService.connect(
                () => {
                    console.log("✅ WebSocket conectado exitosamente")
                    setIsConnected(true)
                    setIsConnecting(false)
                    setError(null)
                },
                (error) => {
                    console.error("❌ Error de conexión WebSocket:", error)
                    setIsConnected(false)
                    setIsConnecting(false)

                    if (error?.toString().includes("401") || error?.toString().includes("403")) {
                        setError("Error de autenticación en el chat. Inicia sesión nuevamente.")
                    } else {
                        setError("Error de conexión al chat. Reintentando...")

                        setTimeout(() => {
                            if (!isConnected) {
                                console.log("🔄 Reintentando conexión automáticamente...")
                                connectToWebSocket()
                            }
                        }, 3000)
                    }
                },
            )
        } catch (error: any) {
            console.error("❌ Error al conectar WebSocket:", error)
            setIsConnected(false)
            setIsConnecting(false)

            if (error?.message?.includes("autenticación")) {
                setError("Error de autenticación. Por favor, inicia sesión nuevamente.")
            } else {
                setError("No se pudo conectar al servicio de chat.")
            }
        }
    }, [isConnecting, isConnected])

    // FUNCIÓN MODIFICADA: Enviar mensaje (ahora maneja chats temporales)
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
        const tempId = `temp-${Date.now()}-${Math.random()}`

        try {
            setInputMessage("")

            const newMessage: Message = {
                id: tempId,
                content: messageContent,
                sender: "user",
                timestamp: new Date(),
                read: false,
                delivered: false,
                status: "sending",
                isTemporary: true,
            }

            setMessages((prev) => [...prev, newMessage])
            updateLastMessage(activeChat.id, messageContent, new Date())

            console.log("📤 Enviando mensaje:", messageContent)

            if (activeChat.isTemporaryChat && temporaryChatData) {
                console.log("🔄 Convirtiendo chat temporal a chat real...")

                await chatService.sendMessage(
                    temporaryChatData.productId,
                    temporaryChatData.profileProductId,
                    currentUserProfile?.id || "",
                    messageContent,
                )

                const updatedChat: Chat = {
                    ...activeChat,
                    isTemporaryChat: false,
                    idProfile: currentUserProfile?.id || "",
                }

                setActiveChat(updatedChat)
                setIsTemporaryChat(false)

                setChats((prevChats) => prevChats.map((chat) => (chat.id === activeChat.id ? updatedChat : chat)))

                setTemporaryChatData(null)

                console.log("✅ Chat temporal convertido a chat real")
            } else {
                await chatService.sendMessage(
                    activeChat.idProduct,
                    activeChat.idProfileProduct,
                    activeChat.idProfile,
                    messageContent,
                )
            }

            setMessages((prevMessages) =>
                prevMessages.map((msg) =>
                    msg.id === tempId ? { ...msg, status: "sent", delivered: true, isTemporary: false } : msg,
                ),
            )

            console.log("✅ Mensaje enviado exitosamente")
        } catch (error) {
            console.error("❌ Error al enviar mensaje:", error)
            setError("Error al enviar el mensaje. Inténtalo de nuevo.")

            setInputMessage(messageContent)
            setMessages((prev) => prev.filter((msg) => msg.id !== tempId))
        }
    }, [inputMessage, activeChat, isConnected, updateLastMessage, temporaryChatData, currentUserProfile])

    // Manejar cambio de chat
    const handleChatSelect = useCallback(
        async (chat: Chat) => {
            console.log("🎯 Seleccionando chat:", chat.name)
            console.log("IDs del chat:", {
                idProduct: chat.idProduct,
                idProfileProduct: chat.idProfileProduct,
                idProfile: chat.idProfile,
            })

            setActiveChat(chat)
            setIsTemporaryChat(chat.isTemporaryChat || false)

            setChats((prevChats) => prevChats.map((c) => (c.id === chat.id ? { ...c, unreadCount: 0 } : c)))

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
        setIsTemporaryChat(false)
    }, [])

    // Función para recargar chats
    const handleRefreshChats = useCallback(async () => {
        await loadChats()
    }, [loadChats])

    // Función para reintentar conexión
    const handleRetryConnection = useCallback(async () => {
        console.log("🔄 Reintentando conexión completa...")
        setError(null)

        try {
            if (chatService.isWebSocketConnected()) {
                chatService.disconnect()
                setIsConnected(false)
            }

            await loadChats()
            await connectToWebSocket()
        } catch (error) {
            console.error("❌ Error al reintentar conexión:", error)
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

    // Función para renderizar contenido de mensajes (incluyendo productos)
    const renderMessageContent = (message: Message) => {
        try {
            if (message.content.startsWith('{"type":"product"')) {
                const productData = JSON.parse(message.content)
                if (productData.type === "product") {
                    const product: Product = {
                        id: productData.productId,
                        name: productData.productName,
                        description: "Producto compartido en el chat",
                        points: productData.productPoints,
                        createdAt: "",
                        updatedAt: "",
                        imagenes: productData.productImage ? [productData.productImage] : [],
                        profile: { id: "", nickname: "", avatar: "", banAt: false, premium: "", newUser: false },
                        categories: [],
                    }

                    return <ProductMessage product={product} />
                }
            }

            // Verificar si es un mensaje de confirmación de intercambio
            if (message.content.startsWith('{"type":"trade_confirmed"')) {
                const tradeData = JSON.parse(message.content)
                return (
                    <div className="trade-confirmation-message">
                        <div className="trade-confirmation-icon">🎉</div>
                        <div className="trade-confirmation-text">
                            <strong>¡Intercambio Confirmado!</strong>
                            <p>El dueño del producto ha aceptado la propuesta de intercambio.</p>
                        </div>
                    </div>
                )
            }

            return message.content
        } catch (e) {
            return message.content
        }
    }

    // useEffect para cargar el perfil del usuario actual al montar el componente
    useEffect(() => {
        const loadCurrentUserProfile = async () => {
            try {
                setLoadingProfile(true)

                try {
                    const modo = await SettingsService.getModoOcuro()
                    sessionStorage.setItem("modoOscuroClaro", modo.toString())
                    setDarkMode(modo)
                    console.log("Modo oscuro cargado del backend:", modo)
                } catch (error) {
                    console.error("Error al obtener modo oscuro del backend:", error)
                    const modoOscuroStorage = sessionStorage.getItem("modoOscuroClaro")
                    if (modoOscuroStorage !== null) {
                        setDarkMode(modoOscuroStorage === "true")
                    } else {
                        sessionStorage.setItem("modoOscuroClaro", "false")
                        setDarkMode(false)
                    }
                }

                const token = sessionStorage.getItem("token")
                if (token) {
                    try {
                        const profile = await ProfileService.getProfileInfo()
                        setCurrentUserProfile(profile)
                        console.log("✅ Perfil del usuario actual cargado:", profile.nickname)
                    } catch (error) {
                        console.error("Error al cargar el perfil del usuario:", error)
                    }
                }
            } catch (error) {
                console.error("Error al cargar el perfil del usuario actual:", error)
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

    // NUEVO useEffect: Detectar parámetros de URL para chat temporal
    useEffect(() => {
        const urlParams = parseUrlParams()
        if (urlParams && currentUserProfile) {
            console.log("🆕 Detectados parámetros para chat temporal:", urlParams)
            createTemporaryChat(urlParams.productId, urlParams.profileProductId)
        }
    }, [parseUrlParams, createTemporaryChat, currentUserProfile])

    // También agrega este useEffect adicional para escuchar cambios en sessionStorage
    useEffect(() => {
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

        checkAndApplyMode()

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === "modoOscuroClaro" && e.newValue !== null) {
                const shouldBeDark = e.newValue === "true"
                setDarkMode(shouldBeDark)
                console.log("Modo actualizado por storage event:", shouldBeDark)
            }
        }

        const handleSessionStorageChange = () => {
            checkAndApplyMode()
        }

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
            console.log("🚀 Inicializando chat...")

            const token = localStorage.getItem("token") || sessionStorage.getItem("token")
            if (!token) {
                setError("No se encontró token de autenticación. Por favor, inicia sesión.")
                setLoading(false)
                return
            }

            if (!currentUserProfile || loadingProfile) {
                return
            }

            try {
                await loadChats()
                await connectToWebSocket()
            } catch (error) {
                console.error("❌ Error en inicialización:", error)
            }
        }

        initializeChat()
    }, [currentUserProfile, loadingProfile])

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
        if (isConnected && activeChat && currentUserProfile && !loadingProfile && !activeChat.isTemporaryChat) {
            console.log("🔔 Configurando suscripción para chat:", activeChat.name)

            if (activeSubscription) {
                console.log("🗑️ Cancelando suscripción anterior:", activeSubscription)
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

                loadChatMessages(activeChat)

                console.log(`✅ Suscrito exitosamente al chat: ${activeChat.name}`)
            } catch (error) {
                console.error("❌ Error al suscribirse al chat:", error)
                setError("Error al conectar con el chat. Inténtalo de nuevo.")
            }
        }

        return () => {
            if (activeSubscription) {
                console.log("🧹 Limpiando suscripción en cleanup:", activeSubscription)
                chatService.unsubscribeFromChat(activeSubscription)
            }
        }
    }, [
        isConnected,
        activeChat,
        handleMessageReceived,
        handleSubscriptionError,
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
                            <img src={currentUserProfile?.avatar || "/placeholder.svg"} alt={"currentUserProfile?.avatar1116"} />
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
                                className={`chat-item ${activeChat?.id === chat.id ? "active" : ""} ${chat.isTemporaryChat ? "temporary-chat" : ""}`}
                                onClick={() => handleChatSelect(chat)}
                            >
                                <div className={`chat-avatar ${chat.isOnline ? "online" : ""}`}>
                                    <div className="user-avatar-chat">
                                        {loadingProductNames.has(chat.id) ? (
                                            <IonSpinner name="crescent" />
                                        ) : (
                                            <img src={cloudinaryImage(chat.avatar) || "/placeholder.svg"} alt={"chat.avatar1178"} />
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
                                        {chat.isTemporaryChat && <span className="temp-badge">Nuevo</span>}
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
                                        <img src={cloudinaryImage(activeChat.avatar) || "/placeholder.svg"} alt={"activeChat.avatar1216"} />
                                    </div>
                                </div>
                                <div className="chat-info">
                                    <h3>{activeChat.name}</h3>
                                    <span className="status-text">
                    {isConnected ? (activeChat.isOnline ? "En línea" : "Último acceso hace 3h") : "Desconectado"}
                                        {activeChat.isTemporaryChat && " • Conversación nueva"}
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
                                                                <div>AI</div>
                                                            ) : message.sender === "user" ? (
                                                                <div className="user-avatar">
                                                                    <img
                                                                        src={currentUserProfile?.avatar || "/placeholder.svg"}
                                                                        alt={"currentUserProfile?.avatar1298"}
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <div className="user-avatar-chat">
                                                                    <img
                                                                        src={cloudinaryImage(activeChat.avatar) || "/placeholder.svg"}
                                                                        alt={"activeChat.avatar1302"}
                                                                    />
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
                                                                <div className="message-text">{renderMessageContent(message)}</div>
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
                                                <div>AI</div>
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
                                <button className="action-button" onClick={() => setShowProductModal(true)}>
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

            {/* Modal de selección de productos */}
            <ProductSelectionModal
                isOpen={showProductModal}
                onClose={() => setShowProductModal(false)}
                onProductsSelected={handleProductsSelected}
            />

            {/* Modal de resumen de intercambio */}
            <TradeSummaryModal
                isOpen={tradeState.isTradeModalOpen}
                onClose={closeTradeSummary}
                onConfirmTrade={confirmTrade}
                traderProductIds={tradeState.currentOffer?.traderProducts || []}
                nonTraderProductIds={tradeState.currentOffer?.nonTraderProducts || []}
                traderUserId={tradeState.currentOffer?.traderUserId || ""}
                nonTraderUserId={tradeState.currentOffer?.nonTraderUserId || ""}
                traderNickname={isCurrentUserProductOwner ? currentUserProfile?.nickname || "Tú" : "Vendedor"}
                nonTraderNickname={isCurrentUserProductOwner ? "Comprador" : currentUserProfile?.nickname || "Tú"}
                currentUserIsTrader={isCurrentUserProductOwner}
                productDelChatName={activeChat?.name}
            />
        </div>
    )
}

export default ChatPage
