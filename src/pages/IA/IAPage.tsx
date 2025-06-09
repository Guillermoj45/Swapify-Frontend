"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import {
    IonContent,
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonFooter,
    IonTextarea,
    IonIcon,
    IonButton,
    IonAvatar,
    IonSpinner,
    IonChip,
    IonLabel,
    IonText,
    IonButtons,
    IonMenuButton,
    useIonToast,
    IonRefresher,
    IonRefresherContent,
    type RefresherEventDetail,
} from "@ionic/react"
import { driver } from "driver.js"
import "driver.js/dist/driver.css"
import {
    camera,
    refresh,
    arrowUp,
    closeCircle,
    trash,
    checkmark,
    menuOutline,
    chatboxEllipses,
    add,
    chevronBack,
    createOutline,
    readerOutline,
    informationCircleOutline,
} from "ionicons/icons"

// Services
import { IAChat } from "../../Services/IAService"
import { ConversationService } from "../../Services/IAService"
import useAuthRedirect from "../../Services/useAuthRedirect"
import { Settings as SettingsService } from "../../Services/SettingsService"
import { ProductService } from "../../Services/ProductService"
import cloudinaryImage from "../../Services/CloudinaryService"

// Components
import Navegacion from "../../components/Navegation"

// Styles
import "./IA.css"
import "./chat-alert.css"
import ProfileService, { type ProfileDTO } from "../../Services/ProfileService"
import cloudinaryService from "../../Services/CloudinaryService";

// ==================== INTERFACES & TYPES ====================
interface Message {
    id: number | string
    text: string
    sender: "user" | "ai"
    timestamp: Date
    image?: string
    images?: string[]
    isCopied?: boolean
}

interface ChatSession {
    id: string
    title?: string
    lastMessage: string
    timestamp: Date
    messages: Message[]
    unread?: number
    loadedFromBackend?: boolean
}

interface SideContentProps {
    side: "start" | "end"
    contentId: string
    className?: string
    collapsed?: boolean
    children?: React.ReactNode
}

// ✅ MEJORADO: Interface para el producto con categorías
interface ProductInfo {
    name: string
    image: string
    price: number
    description: string
    categories?: Array<{
        name: string
        description: string
    }>
}

interface ProductSidePanelProps {
    showProductSidebar: boolean
    setShowProductSidebar: (show: boolean) => void
    productInfo: ProductInfo
    handleProductAction: (action: "upload" | "cancel") => void
}

// ==================== UTILITY COMPONENTS ====================
const SideContent: React.FC<SideContentProps> = ({ children, className, collapsed }) => {
    return <div className={`custom-side-content ${className || ""} ${collapsed ? "collapsed" : ""}`}>{children}</div>
}

// ==================== MAIN COMPONENT ====================
const AIChatPage: React.FC = () => {
    useAuthRedirect()

    // ==================== CONSTANTS ====================
    const initialAIMessage: Message = {
        id: 1,
        text: "Hola, soy tu asistente IA. ¿En qué puedo ayudarte hoy?",
        sender: "ai",
        timestamp: new Date(),
    }

    const suggestedPrompts = [
        "¿Puedes analizar esta imagen?",
        "Cuéntame sobre la IA generativa",
        "Necesito ayuda con mi código",
        "¿Cómo puedo mejorar mi proyecto?",
    ]

    // ==================== STATE MANAGEMENT ====================
    // Core chat state
    const [messages, setMessages] = useState<Message[]>([initialAIMessage])
    const [inputText, setInputText] = useState<string>("")
    const [isTyping, setIsTyping] = useState<boolean>(false)
    const [currentChatId, setCurrentChatId] = useState<string | null>(null)
    const [productId, setProductId] = useState<string | null>(null)

    // Image handling state
    const [selectedImages, setSelectedImages] = useState<File[]>([])
    const [previewImages, setPreviewImages] = useState<string[]>([])

    const [isDesktop, setIsDesktop] = useState<boolean>(window.innerWidth >= 768)
    const [darkMode, setDarkMode] = useState<boolean>(true)

    // Chat sessions state
    const [showChatSidebar, setShowChatSidebar] = useState<boolean>(true)
    const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
    const [activeChatId, setActiveChatId] = useState<string>("default")
    const [isLoadingConversations, setIsLoadingConversations] = useState<boolean>(false)
    const [conversationsPage, setConversationsPage] = useState<number>(0)
    const [hasMoreConversations, setHasMoreConversations] = useState<boolean>(true)
    const [loadingError, setLoadingError] = useState<string | null>(null)
    const [isButtonSelected, setIsButtonSelected] = useState<boolean>(false)
    const [showNewChatAlert, setShowNewChatAlert] = useState<boolean>(false)

    // ✅ MEJORADO: Estado del producto con categorías
    const [showProductSidebar, setShowProductSidebar] = useState<boolean>(false)
    const [productInfo, setProductInfo] = useState<ProductInfo>({
        name: "",
        image: "",
        price: 0,
        description: "",
        categories: [],
    })
    const [productSummaryMode, setProductSummaryMode] = useState<boolean>(false)

    // ==================== REFS ====================
    const fileInputRef = useRef<HTMLInputElement>(null)
    const contentRef = useRef<HTMLIonContentElement>(null)
    const textareaRef = useRef<HTMLIonTextareaElement>(null)
    const sidebarRef = useRef<HTMLDivElement>(null)

    // ==================== HOOKS ====================
    const [presentToast] = useIonToast()

    const [currentUserProfile, setCurrentUserProfile] = useState<ProfileDTO | null>(null)

    // ==================== UTILITY FUNCTIONS ====================
    const formatTime = (date: Date): string => {
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }

    const formatDate = (date: Date): string => {
        const now = new Date()
        const yesterday = new Date(now)
        yesterday.setDate(now.getDate() - 1)

        if (date.toDateString() === now.toDateString()) {
            return "Hoy"
        } else if (date.toDateString() === yesterday.toDateString()) {
            return "Ayer"
        } else {
            return date.toLocaleDateString("es-ES", {
                day: "numeric",
                month: "short",
            })
        }
    }

    const generateChatTitle = (message: string): string => {
        if (!message || message.trim() === "") return "Nueva conversación"

        const maxLength = 30
        let title = message.trim()

        title = title.replace(/\n+/g, " ").replace(/\s+/g, " ")

        const firstSentence = title.split(/[.!?]/)[0]
        if (firstSentence.length > 0 && firstSentence.length <= maxLength) {
            return firstSentence
        }

        if (title.length > maxLength) {
            const words = title.split(" ")
            let result = ""

            for (const word of words) {
                if ((result + " " + word).length <= maxLength - 3) {
                    result += (result ? " " : "") + word
                } else {
                    break
                }
            }

            return result + (title.length > maxLength ? "..." : "")
        }

        return title
    }

    // ==================== CONVERSATION MANAGEMENT ====================
    const createDefaultConversation = () => {
        const defaultChat: ChatSession = {
            id: "default",
            title: "Nueva conversación",
            lastMessage: "Hola, soy tu asistente IA. ¿En qué puedo ayudarte hoy?",
            timestamp: new Date(),
            messages: [initialAIMessage],
            loadedFromBackend: false,
        }
        setChatSessions([defaultChat])
        setActiveChatId("default")
    }

    const updateChatSession = (chatId: string, updatedMessages: Message[], lastMessageText: string) => {
        setChatSessions((prevSessions) =>
            prevSessions.map((session) =>
                session.id === chatId
                    ? {
                        ...session,
                        messages: updatedMessages,
                        lastMessage: lastMessageText,
                        timestamp: new Date(),
                    }
                    : session,
            ),
        )
    }

    const updateChatTitle = (chatId: string, newTitle: string) => {
        setChatSessions((prevSessions) =>
            prevSessions.map((session) => (session.id === chatId ? { ...session, title: newTitle } : session)),
        )
    }

    const updateChatSessionAsBackendLoaded = (tempChatId: string, backendChatId: string) => {
        setChatSessions((prevSessions) =>
            prevSessions.map((session) =>
                session.id === tempChatId
                    ? {
                        ...session,
                        id: backendChatId,
                        loadedFromBackend: true,
                    }
                    : session,
            ),
        )

        if (activeChatId === tempChatId) {
            setActiveChatId(backendChatId)
        }
    }

    // ✅ CORREGIDO: Función mejorada para cargar mensajes de conversación sin usar processImageUrl en el frontend
    const loadConversationMessages = async (conversationId: string) => {
        try {
            console.log("🔍 Cargando mensajes completos para conversación:", conversationId)

            if (!conversationId || conversationId === "default") {
                console.warn("⚠️ ID de conversación inválido:", conversationId)
                setMessages([initialAIMessage])
                return
            }

            const existingChat = chatSessions.find((chat) => chat.id === conversationId)
            if (existingChat && existingChat.messages.length > 1) {
                console.log("📋 Usando mensajes ya cargados")
                setMessages(existingChat.messages)
                setCurrentChatId(conversationId)
                return
            }

            const fullConversation = await ConversationService.loadFullConversation(conversationId)
            console.log("📨 Conversación completa cargada:", fullConversation)

            if (!fullConversation) {
                console.warn("⚠️ No se pudo cargar la conversación completa")
                setMessages([initialAIMessage])
                return
            }

            let messagesToSet = [initialAIMessage]

            if (
                fullConversation.messages &&
                Array.isArray(fullConversation.messages) &&
                fullConversation.messages.length > 0
            ) {
                try {
                    messagesToSet = fullConversation.messages.map((msg: any) => ({
                        id: msg.id || Date.now() + Math.random(),
                        text: msg.message || msg.text || "",
                        sender: msg.sender || (msg.isUser ? "user" : "ai"),
                        timestamp: msg.createdAt ? new Date(msg.createdAt) : new Date(),
                        // ✅ CORREGIDO: Las imágenes ya vienen procesadas del servicio
                        images: msg.images || undefined,
                    }))

                    console.log("💬 Mensajes procesados:", messagesToSet.length)
                } catch (msgError) {
                    console.error("❌ Error al procesar mensajes individuales:", msgError)
                    messagesToSet = [initialAIMessage]
                }
            }

            setMessages(messagesToSet)
            setCurrentChatId(conversationId)

            // ✅ NUEVO: Cargar información del producto si existe
            if (fullConversation.product) {
                setProductInfo({
                    name: fullConversation.product.name || "Producto detectado",
                    image: fullConversation.product.imagenes?.[0] || "",
                    price: fullConversation.product.points || 0,
                    description: fullConversation.product.description || "",
                    categories: fullConversation.product.categories || [],
                })
                setProductId(fullConversation.product.id)
            }

            setChatSessions((prev) =>
                prev.map((session) =>
                    session.id === conversationId
                        ? {
                            ...session,
                            messages: messagesToSet,
                            loadedFromBackend: true,
                            title: fullConversation.nombre || fullConversation.title || session.title,
                            lastMessage: messagesToSet[messagesToSet.length - 1]?.text?.substring(0, 50) + "..." || "Sin mensajes",
                        }
                        : session,
                ),
            )
        } catch (error) {
            console.error("❌ Error al cargar mensajes de la conversación:", error)
            setMessages([initialAIMessage])
            setCurrentChatId(null)

            presentToast({
                message: "Error al cargar los mensajes de la conversación",
                duration: 3000,
                color: "danger",
            })
        }
    }

    // ✅ CORREGIDO: Función para procesar imágenes directamente en el frontend
    const processImageUrlLocal = (imageUrl: string): string => {
        if (!imageUrl) return "/placeholder.svg"

        // Si ya es una URL completa, devolverla tal como está
        if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
            return imageUrl
        }

        // Si es una ruta relativa que empieza con /, devolverla tal como está
        if (imageUrl.startsWith("/")) {
            return imageUrl
        }

        // Si es solo el nombre del archivo, asumir que está en la carpeta uploads
        return `/uploads/${imageUrl}`
    }

    const loadConversationsFromBackend = async (page = 0, append = false) => {
        try {
            setIsLoadingConversations(true)
            setLoadingError(null)

            console.log("🔍 Cargando conversaciones, página:", page)
            const conversations = await ConversationService.getConversations(page)
            console.log("📦 Conversaciones recibidas del backend:", conversations)

            if (!conversations || conversations.length === 0) {
                console.log("📭 No hay conversaciones en el backend")
                setHasMoreConversations(false)
                if (!append) {
                    createDefaultConversation()
                }
                return
            }

            const frontendConversations: ChatSession[] = []

            for (const conversation of conversations) {
                console.log("🔄 Procesando conversación:", conversation)

                try {
                    if (!conversation.id) {
                        console.warn("⚠️ Conversación sin ID:", conversation)
                        continue
                    }

                    const chatSession: ChatSession = {
                        id: conversation.id,
                        title: conversation.titulo || conversation.nombre || "Conversación sin título",
                        lastMessage: conversation.lastMessages || "Sin mensajes",
                        timestamp: conversation.lastMesageDate
                            ? new Date(conversation.lastMesageDate)
                            : new Date(conversation.createdAt),
                        messages: [initialAIMessage],
                        loadedFromBackend: true,
                        unread: 0,
                    }

                    try {
                        console.log("💬 Cargando mensajes completos para conversación:", conversation.id)
                        const conversationDetail = await ConversationService.getConversationDetail(conversation.id)

                        if (
                            conversationDetail.messages &&
                            Array.isArray(conversationDetail.messages) &&
                            conversationDetail.messages.length > 0
                        ) {
                            const processedMessages = conversationDetail.messages.map((msg: any) => ({
                                id: msg.id || Date.now(),
                                text: msg.message || msg.text || "",
                                sender: msg.user ? "user" : "ai",
                                timestamp: msg.createdAt ? new Date(msg.createdAt) : new Date(),
                                // ✅ CORREGIDO: Usar la función local para procesar imágenes
                                images:
                                    msg.images && msg.images.length > 0
                                        ? msg.images.map((img: string) => cloudinaryService(img))
                                        : undefined,
                            }))

                            chatSession.messages = processedMessages as Message[]

                            const lastMsg = processedMessages[processedMessages.length - 1]
                            if (lastMsg) {
                                chatSession.lastMessage =
                                    lastMsg.text.length > 50 ? lastMsg.text.substring(0, 50) + "..." : lastMsg.text
                            }
                        }
                    } catch (msgError) {
                        console.error("❌ Error cargando mensajes completos:", msgError)
                        if (conversation.lastMessages) {
                            chatSession.lastMessage =
                                conversation.lastMessages.length > 50
                                    ? conversation.lastMessages.substring(0, 50) + "..."
                                    : conversation.lastMessages
                        }
                    }

                    frontendConversations.push(chatSession)
                    console.log("✅ Conversación procesada:", chatSession)
                } catch (convError) {
                    console.error("❌ Error procesando conversación individual:", convError)
                    continue
                }
            }

            console.log("📋 Total conversaciones procesadas:", frontendConversations.length)

            if (append) {
                setChatSessions((prev) => [...prev, ...frontendConversations])
            } else {
                setChatSessions(frontendConversations)

                if (frontendConversations.length > 0 && (!activeChatId || activeChatId === "default")) {
                    const firstChat = frontendConversations[0]
                    console.log("📝 Seleccionando primer chat:", firstChat)
                    setActiveChatId(firstChat.id)
                    setMessages(firstChat.messages)
                    setCurrentChatId(firstChat.id)
                }
            }

            setConversationsPage(page)
            setHasMoreConversations(conversations.length >= 10)
        } catch (error) {
            console.error("❌ Error al cargar conversaciones:", error)
            setLoadingError("Error al cargar conversaciones. Intenta de nuevo.")
            if (!append) {
                createDefaultConversation()
            }
        } finally {
            setIsLoadingConversations(false)
        }
    }

    const loadMoreConversations = async () => {
        if (hasMoreConversations && !isLoadingConversations) {
            await loadConversationsFromBackend(conversationsPage + 1, true)
        }
    }

    const handleRefreshConversations = async (event: CustomEvent<RefresherEventDetail>) => {
        try {
            await loadConversationsFromBackend(0, false)
            event.detail.complete()
        } catch (error) {
            console.error("Error al refrescar conversaciones:", error)
            event.detail.complete()
        }
    }

    // ==================== CHAT ACTIONS ====================
    const handleSwitchChat = async (chatId: string) => {
        console.log("🔄 Cambiando a chat:", chatId)

        setActiveChatId(chatId)

        const selectedChat = chatSessions.find((chat) => chat.id === chatId)
        if (!selectedChat) {
            console.error("❌ Chat no encontrado:", chatId)
            return
        }

        try {
            if (selectedChat.loadedFromBackend) {
                await loadConversationMessages(chatId)
            } else {
                setMessages(selectedChat.messages)
                setCurrentChatId(null)
            }
        } catch (error) {
            console.error("❌ Error al cambiar de chat:", error)
            setMessages([initialAIMessage])
        }

        if (!isDesktop) {
            setShowChatSidebar(false)
        }
    }

    const [isCreatingChat, setIsCreatingChat] = useState<boolean>(false)

    const handleCreateNewChat = async () => {
        // Prevenir múltiples ejecuciones
        if (isCreatingChat) {
            console.log("Ya se está creando un chat, ignorando...")
            return
        }

        setIsCreatingChat(true)

        try {
            // Validar que hay un título o usar uno por defecto
            const chatTitle = undefined

            // Crear el nuevo chat
            const newChatId = `temp-${Date.now()}`
            const initialMessage: Message = {
                id: Date.now(),
                text: "Hola, soy tu asistente IA. ¿En qué puedo ayudarte hoy?",
                sender: "ai",
                timestamp: new Date(),
            }

            const newChat: ChatSession = {
                id: newChatId,
                title: chatTitle,
                lastMessage: "Hola, soy tu asistente IA. ¿En qué puedo ayudarte hoy?",
                timestamp: new Date(),
                messages: [initialMessage],
                loadedFromBackend: false,
            }

            // Actualizar estados
            setChatSessions((prev) => [newChat, ...prev])
            setActiveChatId(newChatId)
            setMessages([initialMessage])
            setCurrentChatId(null)
            setProductId(null)

            if (!isDesktop) {
                setShowChatSidebar(false)
            }
        } catch (error) {
            console.error("Error al crear nuevo chat:", error)
        } finally {
            // Resetear el flag después de un pequeño delay para evitar problemas de timing
            setTimeout(() => {
                setIsCreatingChat(false)
            }, 500)
        }
    }

    const handleEditChatTitle = async (chatId: string, newTitle: string) => {
        if (newTitle.trim() === "") return

        try {
            const chatToUpdate = chatSessions.find((chat) => chat.id === chatId)

            if (chatToUpdate?.loadedFromBackend) {
                const success = await ConversationService.updateConversationTitle(chatId, newTitle)
                if (!success) {
                    presentToast({
                        message: "Error al actualizar el título en el servidor",
                        duration: 3000,
                        color: "danger",
                    })
                    return
                }
            }

            updateChatTitle(chatId, newTitle)

            presentToast({
                message: "Título actualizado correctamente",
                duration: 2000,
                color: "success",
            })
        } catch (error) {
            console.error("Error al actualizar título:", error)
            presentToast({
                message: "Error al actualizar el título",
                duration: 3000,
                color: "danger",
            })
        }
    }

    const handleDeleteChat = async (chatId: string) => {
        try {
            const chatToDelete = chatSessions.find((chat) => chat.id === chatId)

            if (chatToDelete?.loadedFromBackend) {
                const success = await ConversationService.deleteConversation(chatId)
                if (!success) {
                    presentToast({
                        message: "Error al eliminar la conversación del servidor",
                        duration: 3000,
                        color: "danger",
                    })
                    return
                }
            }

            setChatSessions((prev) => prev.filter((chat) => chat.id !== chatId))

            if (chatId === activeChatId) {
                const remainingSessions = chatSessions.filter((chat) => chat.id !== chatId)
                if (remainingSessions.length > 0) {
                    await handleSwitchChat(remainingSessions[0].id)
                } else {
                    handleCreateNewChat()
                }
            }

            presentToast({
                message: "Conversación eliminada correctamente",
                duration: 2000,
                color: "success",
            })
        } catch (error) {
            console.error("Error al eliminar conversación:", error)
            presentToast({
                message: "Error al eliminar la conversación",
                duration: 3000,
                color: "danger",
            })
        }
    }

    const handleClearChat = () => {
        const newMessage: Message = {
            id: Date.now(),
            text: "Chat reiniciado. ¿En qué puedo ayudarte?",
            sender: "ai",
            timestamp: new Date(),
        }

        setMessages([newMessage])
        updateChatSession(activeChatId, [newMessage], "Chat reiniciado. ¿En qué puedo ayudarte?")
        setProductId(null)
        setCurrentChatId(null)
    }

    // ==================== MESSAGE HANDLING ====================
    const handleSend = async (): Promise<void> => {
        const currentText = inputText.trim()
        const currentImages = [...selectedImages]
        const currentPreviews = [...previewImages]

        if (currentText === "" && !currentImages) {
            console.log("No text and no images, aborting send")
            return
        }

        try {
            let displayText: string
            if (currentText !== "") {
                displayText = currentText
            } else if (currentImages.length > 0) {
                displayText = ""
            } else {
                displayText = ""
            }

            const userMessage: Message = {
                id: Date.now(),
                text: displayText,
                sender: "user",
                timestamp: new Date(),
                images: currentPreviews.length > 0 ? currentPreviews : undefined,
            }

            const updatedMessages = [...messages, userMessage]
            setMessages(updatedMessages)
            updateChatSession(activeChatId, updatedMessages, displayText || "Imagen enviada")

            setIsTyping(true)

            let messageToAPI: string
            if (currentText !== "") {
                messageToAPI = currentText
            } else {
                messageToAPI = "Analiza esta imagen"
            }

            let tituloToSend: string | undefined = undefined

            if (!currentChatId) {
                const currentChat = chatSessions.find((chat) => chat.id === activeChatId)

                if (currentChat) {
                    if (currentChat.title !== "Nueva conversación") {
                        tituloToSend = currentChat.title
                    } else {
                        const titleText = currentText !== "" ? currentText : displayText
                        tituloToSend = generateChatTitle(titleText)
                    }
                }
            }

            setInputText("")
            setSelectedImages([])
            setPreviewImages([])

            const guille = isButtonSelected.valueOf()

            const response = await IAChat(
                currentImages,
                messageToAPI,
                currentChatId || undefined,
                productId || undefined,
                tituloToSend,
                guille,
            )

            if (response) {
                console.log("Response received:", response)

                const chat = chatSessions.find((chat) => chat.id === activeChatId)

                if (!chat) {
                    console.error("Chat not found for activeChatId:", activeChatId)
                    return
                }

                chat.id = response.id
                chat.title = response.nombre

                console.log("Chat session updated with new ID and title:", chatSessions)

                if (response.product) {
                    setProductId(response.product.id)
                    setIsButtonSelected(false)
                }

                const lastAIMessage = response.lastMessage
                if (!lastAIMessage) {
                    throw new Error("No se encontró respuesta de la IA en los mensajes")
                }

                const messageImages = lastAIMessage?.images || []
                const aiResponse: Message = {
                    id: lastAIMessage.id || response.id,
                    text: lastAIMessage.message || "No se recibió respuesta de texto",
                    sender: "ai",
                    timestamp: new Date(lastAIMessage.createdAt || response.createdAt || Date.now()),
                    // ✅ CORREGIDO: Procesar las imágenes de la respuesta de la IA usando la función local
                    images: messageImages.length > 0 ? messageImages.map((img: string) => processImageUrlLocal(img)) : undefined,
                }
                console.log("AI response message created:", aiResponse)

                // ✅ MEJORADO: Actualizar información del producto con categorías
                if (response && response.product) {
                    setProductInfo({
                        name: response.product.name || "Producto detectado",
                        image: response.product.imagenes[0],
                        price: response.product.points || productInfo.price,
                        description: response.product.description || "IA ha detectado un posible producto basado en tu imagen.",
                        categories: response.product.categories || [], // ✅ NUEVO: Incluir categorías
                    })

                    if (productSummaryMode) {
                        setShowProductSidebar(true)
                        setProductSummaryMode(false)
                    }
                }

                if (productSummaryMode && response) {
                    setShowProductSidebar(true)
                    setProductSummaryMode(false)
                }

                const finalMessages = [...updatedMessages, aiResponse]
                setMessages(finalMessages)
                updateChatSession(
                    activeChatId,
                    finalMessages,
                    aiResponse.text.substring(0, 50) + (aiResponse.text.length > 50 ? "..." : ""),
                )

                const currentChat = chatSessions.find((chat) => chat.id === activeChatId)
                console.log("EL TITULO ES::::::", response.nombre)
                if (currentChat) {
                    const finalTitle = response.nombre || generateChatTitle(currentText !== "" ? currentText : displayText)
                    updateChatTitle(activeChatId, finalTitle)
                }
                setChatSessions((prevSessions) => {
                    const updatedSessions = prevSessions.map((session) =>
                        session.id === activeChatId ? { ...session, id: response.id, title: response.nombre } : session,
                    )

                    setActiveChatId(response.id)
                    setCurrentChatId(response.id)

                    return updatedSessions
                })
            }
        } catch (error) {
            console.error("Error sending message:", error)

            const errorMessage: Message = {
                id: Date.now(),
                text: "Lo siento, ocurrió un error al procesar tu mensaje. Por favor, intenta nuevamente.",
                sender: "ai",
                timestamp: new Date(),
            }

            const finalMessages = [...messages, errorMessage]
            setMessages(finalMessages)
            updateChatSession(activeChatId, finalMessages, "Error al procesar el mensaje")

            presentToast({
                message: "Error al enviar el mensaje. Intenta con un archivo más pequeño o diferente formato.",
                duration: 3000,
                color: "danger",
            })
        } finally {
            setIsTyping(false)
        }
    }

    // ==================== IMAGE HANDLING ====================
    const handleImageSelect = (): void => {
        if (fileInputRef.current) {
            fileInputRef.current.click()
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const files = e.target.files
        if (files && files.length > 0) {
            const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
            const fileArray: File[] = []

            for (let i = 0; i < files.length; i++) {
                const file = files[i]

                if (file.size > MAX_FILE_SIZE) {
                    presentToast({
                        message: `El archivo ${file.name} excede el tamaño máximo de 5MB`,
                        duration: 3000,
                        color: "warning",
                    })
                    continue
                }

                if (!file.type.startsWith("image/")) {
                    presentToast({
                        message: `El archivo ${file.name} no es una imagen válida`,
                        duration: 3000,
                        color: "warning",
                    })
                    continue
                }

                fileArray.push(file)
            }

            if (fileArray.length > 0) {
                setSelectedImages((prev) => [...prev, ...fileArray])

                fileArray.forEach((file) => {
                    const reader = new FileReader()
                    reader.onloadend = () => {
                        const result = reader.result
                        if (typeof result === "string") {
                            setPreviewImages((prev) => [...prev, result])
                        }
                    }
                    reader.readAsDataURL(file)
                })
            }

            if (e.target) {
                e.target.value = ""
            }
        }
    }

    const handleClearImages = (): void => {
        setSelectedImages([])
        setPreviewImages([])
    }

    // ==================== PRODUCT HANDLING ====================
    const toggleProductSummaryMode = () => {
        setProductSummaryMode((prev) => !prev)
        presentToast({
            message: productSummaryMode
                ? "Modo resumen de producto desactivado"
                : "Modo resumen de producto activado. La próxima respuesta incluirá un resumen del producto.",
            duration: 2000,
            color: productSummaryMode ? "medium" : "primary",
        })
    }

    const handleProductAction = async (action: "upload" | "cancel") => {
        if (action === "upload") {
            if (!productId) {
                presentToast({
                    message: "Error: No se encontró información del producto",
                    duration: 3000,
                    color: "danger",
                })
                return
            }

            try {
                presentToast({
                    message: "Subiendo producto...",
                    duration: 1000,
                    color: "primary",
                })

                const success = await ProductService.activeProduct(productId)

                if (success) {
                    presentToast({
                        message: "Producto activado correctamente. Ahora es visible para otros usuarios.",
                        duration: 3000,
                        color: "success",
                    })
                } else {
                    presentToast({
                        message: "Error al activar el producto. Inténtalo de nuevo.",
                        duration: 3000,
                        color: "danger",
                    })
                }
            } catch (error) {
                console.error("Error al activar producto:", error)
                presentToast({
                    message: "Error al subir el producto. Verifica tu conexión e inténtalo de nuevo.",
                    duration: 3000,
                    color: "danger",
                })
            }
        } else {
            presentToast({
                message: "Operación cancelada",
                duration: 2000,
                color: "medium",
            })
        }
        setShowProductSidebar(false)
    }

    // ==================== UI HANDLERS ====================
    const handleToggleSidebar = () => {
        setShowChatSidebar((prev) => !prev)
    }

    const handleSuggestedPrompt = (prompt: string): void => {
        setInputText(prompt)
        if (textareaRef.current) {
            textareaRef.current.setFocus()
        }
    }

    // ==================== TUTORIAL ====================
    const startIATutorial = () => {
        const driverObj = driver({
            showProgress: true,
            steps: [
                {
                    element: ".chat-sidebar-toggle",
                    popover: {
                        title: "📂 Panel de Chats",
                        description: "Accede a todas tus conversaciones guardadas y crea nuevas 🗂️.",
                        side: "right",
                    },
                },
                {
                    element: ".custom-side-content",
                    popover: {
                        title: "🧾 Lista de Conversaciones",
                        description: "Aquí encontrarás todas tus conversaciones con la IA 🤖.",
                        side: "right",
                    },
                },
                {
                    element: ".action-button",
                    popover: {
                        title: "📷 Adjuntar Imágenes",
                        description: "Aquí puedes subir imágenes para que la IA las analice 🧠.",
                        side: "top",
                    },
                },
                {
                    element: ".reader-icon",
                    popover: {
                        title: "🛍️ Subir productos",
                        description: "Al pulsarlo dices a la IA que quieres subir un producto para que otros usuarios lo vean 🌐.",
                        side: "top",
                    },
                },
                {
                    element: ".chat-input",
                    popover: {
                        title: "💬 Escribe tu Mensaje",
                        description: "Escribe aquí tus preguntas o mensajes para la IA ✍️.",
                        side: "top",
                    },
                },
                {
                    element: ".send-button",
                    popover: {
                        title: "📨 Enviar Mensaje",
                        description: "Presiona este botón para enviar tu mensaje a la IA 🚀.",
                        side: "left",
                    },
                },
                {
                    element: ".refresh-icon",
                    popover: {
                        title: "🔄 Limpiar Conversación",
                        description: "Reinicia la conversación actual para comenzar una nueva 🧼.",
                        side: "left",
                    },
                },
            ],
            allowClose: true,
            animate: true,
        })
        driverObj.drive()
    }

    // ==================== EFFECTS ====================
    useEffect(() => {
        console.log("🚀 Componente montado, iniciando carga de conversaciones...")
        loadConversationsFromBackend()

        // Función asíncrona interna para manejar la carga del perfil
        const loadUserProfile = async () => {
            const token = sessionStorage.getItem("token")
            if (!token) {
                return
            }

            try {
                const profile = await ProfileService.getProfileInfo()
                setCurrentUserProfile(profile)
                console.log("✅ Perfil del usuario actual cargado:", profile.nickname)
            } catch (error) {
                console.error("Error al cargar el perfil del usuario:", error)
                // No establecer error aquí para permitir la redirección de useAuthRedirect
            }
        }

        // Llamar a la función asíncrona
        loadUserProfile()
    }, [])

    useEffect(() => {
        const loadThemeSettings = async () => {
            const modoOscuroStorage = sessionStorage.getItem("modoOscuroClaro")

            if (modoOscuroStorage !== null) {
                const isDarkMode = modoOscuroStorage === "true"
                setDarkMode(isDarkMode)
                document.body.classList.remove("light-theme", "dark-theme")
                document.body.classList.add(isDarkMode ? "dark-theme" : "light-theme")
            } else {
                if (sessionStorage.getItem("token")) {
                    try {
                        const modoOscuroBackend = await SettingsService.getModoOcuro()
                        const isDarkMode = modoOscuroBackend === true
                        sessionStorage.setItem("modoOscuroClaro", isDarkMode.toString())
                        setDarkMode(isDarkMode)
                        document.body.classList.remove("light-theme", "dark-theme")
                        document.body.classList.add(isDarkMode ? "dark-theme" : "light-theme")
                    } catch (error) {
                        console.error("Error al obtener modo oscuro del backend:", error)
                        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
                        setDarkMode(prefersDark)
                        document.body.classList.remove("light-theme", "dark-theme")
                        document.body.classList.add(prefersDark ? "dark-theme" : "light-theme")
                        sessionStorage.setItem("modoOscuroClaro", prefersDark.toString())
                    }
                } else {
                    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
                    setDarkMode(prefersDark)
                    document.body.classList.remove("light-theme", "dark-theme")
                    document.body.classList.add(prefersDark ? "dark-theme" : "light-theme")
                    sessionStorage.setItem("modoOscuroClaro", prefersDark.toString())
                }
            }
        }

        loadThemeSettings()
    }, [])

    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === "modoOscuroClaro" && e.newValue !== null) {
                const isDarkMode = e.newValue === "true"
                setDarkMode(isDarkMode)
                document.body.classList.remove("light-theme", "dark-theme")
                document.body.classList.add(isDarkMode ? "dark-theme" : "light-theme")
            }
        }

        window.addEventListener("storage", handleStorageChange)
        return () => window.removeEventListener("storage", handleStorageChange)
    }, [])

    useEffect(() => {
        const handleResize = () => {
            setIsDesktop(window.innerWidth >= 768)
        }

        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    useEffect(() => {
        document.body.classList.toggle("light-mode", !darkMode)
        document.body.classList.toggle("dark-mode", darkMode)

        const backgroundColor = darkMode ? "#111827" : "#f5f7fa"
        document.body.style.backgroundColor = backgroundColor
        document.documentElement.style.backgroundColor = backgroundColor

        const parentElements = document.querySelectorAll("ion-router-outlet, ion-content")
        parentElements.forEach((el) => {
            if (el instanceof HTMLElement) {
                el.style.backgroundColor = backgroundColor
            }
        })
    }, [darkMode])

    useEffect(() => {
        const activeChat = chatSessions.find((chat) => chat.id === activeChatId)
        if (activeChat && !activeChat.loadedFromBackend) {
            setMessages([...activeChat.messages])
            setCurrentChatId(null)
        }
    }, [activeChatId, chatSessions])

    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.scrollToBottom(500)
        }
    }, [messages])

    useEffect(() => {
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.setFocus()
            }
        }, 500)
    }, [])

    // ==================== SUB-COMPONENTS ====================
    const ChatListWithLoadingImproved = () => (
        <IonContent className="chat-list-content">
            <IonRefresher slot="fixed" onIonRefresh={handleRefreshConversations}>
                <IonRefresherContent></IonRefresherContent>
            </IonRefresher>

            <div className="chat-list">
                {loadingError && (
                    <div className="error-message">
                        <IonText color="danger">{loadingError}</IonText>
                        <IonButton size="small" fill="clear" onClick={() => loadConversationsFromBackend(0, false)}>
                            Reintentar
                        </IonButton>
                    </div>
                )}

                {isLoadingConversations && chatSessions.length === 0 ? (
                    <div className="loading-conversations">
                        <IonSpinner name="crescent" />
                        <p>Cargando conversaciones...</p>
                    </div>
                ) : chatSessions.length > 0 ? (
                    <>
                        {chatSessions.map((chat) => (
                            <div
                                key={chat.id}
                                className={`chat-item ${activeChatId === chat.id ? "active" : ""}`}
                                onClick={() => handleSwitchChat(chat.id)}
                            >
                                <div className="chat-item-avatar">
                                    <div className="ai-avatar">
                                        <img src={"public/Swapify.png"} alt={"IA"} />
                                    </div>
                                    {!chat.loadedFromBackend && <div className="local-chat-indicator" title="Conversación local"></div>}
                                </div>
                                <div className="chat-item-content">
                                    <div className="chat-item-header">
                                        <div className="chat-item-title">{chat.title || "Conversación sin título"}</div>
                                        <div className="chat-item-time">{formatDate(chat.timestamp)}</div>
                                    </div>
                                    <div className="chat-item-message">{chat.lastMessage || "Sin mensajes disponibles"}</div>
                                </div>
                                <div className="chat-item-actions">
                                    <IonButton
                                        fill="clear"
                                        size="large"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            const newTitle = prompt("Editar título de la conversación:", chat.title)
                                            if (newTitle && newTitle.trim()) {
                                                handleEditChatTitle(chat.id, newTitle.trim())
                                            }
                                        }}
                                    >
                                        <IonIcon icon={createOutline} size="medium" />
                                    </IonButton>
                                    <IonButton
                                        fill="clear"
                                        size="large"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            if (confirm("¿Estás seguro de eliminar esta conversación?")) {
                                                handleDeleteChat(chat.id)
                                            }
                                        }}
                                    >
                                        <IonIcon icon={trash} size="medium" />
                                    </IonButton>
                                </div>
                            </div>
                        ))}

                        {hasMoreConversations && (
                            <IonButton
                                expand="block"
                                className="load-more-button"
                                onClick={loadMoreConversations}
                                disabled={isLoadingConversations}
                            >
                                {isLoadingConversations ? (
                                    <>
                                        <IonSpinner name="crescent" />
                                        <span style={{ marginLeft: "8px" }}>Cargando...</span>
                                    </>
                                ) : (
                                    "Cargar más conversaciones"
                                )}
                            </IonButton>
                        )}
                    </>
                ) : (
                    !loadingError && (
                        <div className="no-chats-message">
                            <p>No hay conversaciones disponibles</p>
                            <IonButton expand="block" onClick={() => setShowNewChatAlert(true)} className="create-first-chat-btn">
                                Crear primera conversación
                            </IonButton>
                        </div>
                    )
                )}
            </div>
        </IonContent>
    )

    // ✅ MEJORADO: Componente del panel de producto con categorías
    const ProductSidePanel: React.FC<ProductSidePanelProps> = ({
                                                                   showProductSidebar,
                                                                   setShowProductSidebar,
                                                                   productInfo,
                                                                   handleProductAction,
                                                               }) => (
        <div className={`product-sidebar ${showProductSidebar ? "visible" : "collapsed"}`}>
            <div className="sidebar-header">
                <IonTitle>Producto Detectado</IonTitle>
                <IonButton fill="clear" className="close-sidebar-btn" onClick={() => setShowProductSidebar(false)}>
                    <IonIcon icon={closeCircle} />
                </IonButton>
            </div>

            <div className="product-info-container">
                <div className="product-image-container">
                    <img
                        src={cloudinaryImage(productInfo.image) || "/placeholder.svg"}
                        alt={productInfo.name}
                        className="product-image"
                    />
                </div>

                <div className="product-name">
                    <h2>{productInfo.name || "Producto Premium"}</h2>
                    <div style={{ display: "flex", justifyContent: "center", gap: "8px", flexWrap: "wrap" }}>
                        {productInfo.categories &&
                            productInfo.categories.length > 0 &&
                            productInfo.categories.map((category, index) => (
                                <span key={index} className="product-badge category-badge" title={category.description}>
                  {category.name}
                </span>
                            ))}
                    </div>
                </div>

                <div className="product-price">{productInfo.price || "€149,99"}</div>

                <div className="product-description-IA">
                    <p>
                        {productInfo.description ||
                            "Este producto premium ofrece características excepcionales diseñadas para satisfacer tus necesidades. Fabricado con materiales de alta calidad y acabados profesionales, garantiza durabilidad y rendimiento superior. Perfecto para uso diario o profesional."}
                    </p>
                </div>

            </div>

            <div className="product-actions">
                <IonButton
                    expand="block"
                    fill="outline"
                    className="product-action-button cancel-button"
                    onClick={() => handleProductAction("cancel")}
                >
                    Cancelar
                </IonButton>

                <IonButton
                    expand="block"
                    className="product-action-button confirm-button"
                    onClick={() => handleProductAction("upload")}
                >
                    Subir Producto
                </IonButton>
            </div>
        </div>
    )

    const handleSendClick = () => {
        const currentText = inputText.trim()
        const hasImages = selectedImages.length > 0

        if (currentText !== "" || hasImages) {
            handleSend()
        }
    }

    // ==================== RENDER ====================
    return (
        <>
            <Navegacion isDesktop={isDesktop} isChatView={true} />

            <IonPage id="main-content" className={`ai-chat-page ${!showChatSidebar && isDesktop ? "sidebar-hidden" : ""}`}>
                {/* Panel lateral de chats */}
                <SideContent
                    side="start"
                    className={`custom-side-content ${showChatSidebar ? "visible" : ""} ${!showChatSidebar ? "collapsed" : ""}`}
                    contentId="main-content"
                    collapsed={!showChatSidebar}
                >
                    <div className="sidebar-header" ref={sidebarRef}>
                        <IonTitle>Conversaciones</IonTitle>
                        <IonButton fill="clear" className="close-sidebar-btn" onClick={() => setShowChatSidebar(false)}>
                            <IonIcon icon={chevronBack} />
                        </IonButton>
                    </div>

                    <div className="new-chat-button-wrapper">
                        <IonButton expand="block" className="new-chat-button" onClick={() => handleCreateNewChat()}>
                            <IonIcon icon={add} slot="start" />
                            Nueva conversación
                        </IonButton>
                    </div>

                    <ChatListWithLoadingImproved />
                </SideContent>

                <ProductSidePanel
                    showProductSidebar={showProductSidebar}
                    setShowProductSidebar={setShowProductSidebar}
                    productInfo={productInfo}
                    handleProductAction={handleProductAction}
                />

                <IonHeader className="ai-chat-header">
                    <IonToolbar>
                        <IonButtons slot="start">
                            <IonButton onClick={handleToggleSidebar} className="chat-sidebar-toggle">
                                <IonIcon icon={chatboxEllipses} />
                            </IonButton>

                            <IonMenuButton>
                                <IonIcon icon={menuOutline} />
                            </IonMenuButton>
                        </IonButtons>
                        <IonTitle className="ion-text-center">
                            {chatSessions.find((chat) => chat.id === activeChatId)?.title || "Asistente IA"}
                        </IonTitle>
                        <IonButtons slot="end">
                            <IonButton onClick={startIATutorial}>
                                <IonIcon icon={informationCircleOutline} />
                            </IonButton>
                            <IonButton className="refresh-icon" onClick={handleClearChat}>
                                <IonIcon icon={refresh} />
                            </IonButton>
                        </IonButtons>
                    </IonToolbar>
                </IonHeader>

                <IonContent ref={contentRef} className="ai-chat-content" scrollEvents={true}>
                    <div className="chat-container">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`message-container ${message.sender === "user" ? "user-message" : "ai-message"}`}
                            >
                                <div className="message-avatar">
                                    {message.sender === "ai" ? (
                                        <IonAvatar>
                                            <div className="ai-avatar">
                                                <img src={"public/Swapify.png"} alt={"AI"} />
                                            </div>
                                        </IonAvatar>
                                    ) : (
                                        <IonAvatar>
                                            <div className="user-avatar">
                                                <img
                                                    src={currentUserProfile?.avatar || "/default-avatar.png"}
                                                    alt={currentUserProfile?.nickname || "Usuario"}
                                                    onError={(e) => {
                                                        // Imagen de respaldo si falla la carga
                                                        e.currentTarget.src = "/default-avatar.png"
                                                    }}
                                                />
                                            </div>
                                        </IonAvatar>
                                    )}
                                </div>
                                <div className="message-bubble">
                                    {message.images && message.images.length > 0 && (
                                        <div className="message-images-container">
                                            {message.images.map((img, index) => (
                                                <img
                                                    key={index}
                                                    src={img || "/placeholder.svg"}
                                                    alt={`Imagen ${index + 1}`}
                                                    className="message-image"
                                                />
                                            ))}
                                        </div>
                                    )}
                                    <div className="message-text">{message.text}</div>
                                    <div className="message-time">
                                        {formatTime(message.timestamp)}
                                        {message.isCopied && (
                                            <span className="copied-indicator">
                        <IonIcon icon={checkmark} /> Copiado
                      </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="message-container ai-message">
                                <div className="message-avatar">
                                    <div className="ai-avatar">AI</div>
                                </div>
                                <div className="message-bubble typing-indicator">
                                    <IonSpinner name="dots" />
                                </div>
                            </div>
                        )}
                    </div>
                </IonContent>

                {suggestedPrompts.length > 0 && selectedImages.length === 0 && (
                    <div className="suggested-prompts">
                        {suggestedPrompts.map((prompt, index) => (
                            <IonChip key={index} className="prompt-chip" onClick={() => handleSuggestedPrompt(prompt)}>
                                <IonLabel>{prompt}</IonLabel>
                            </IonChip>
                        ))}
                    </div>
                )}

                {previewImages.length > 0 && (
                    <div className="preview-container">
                        <div className="preview-images-wrapper">
                            {previewImages.map((previewImage, index) => (
                                <div key={index} className="preview-image-item">
                                    <img
                                        src={previewImage || "/placeholder.svg"}
                                        alt={`Vista previa ${index + 1}`}
                                        className="preview-image"
                                    />
                                    <IonButton
                                        fill="clear"
                                        className="clear-image-btn single-image"
                                        onClick={() => {
                                            setPreviewImages(previewImages.filter((_, i) => i !== index))
                                            setSelectedImages(selectedImages.filter((_, i) => i !== index))
                                        }}
                                    >
                                        <IonIcon icon={closeCircle} />
                                    </IonButton>
                                </div>
                            ))}
                        </div>
                        {previewImages.length > 1 && (
                            <IonButton fill="clear" className="clear-all-images-btn" onClick={handleClearImages}>
                                Borrar todas
                            </IonButton>
                        )}
                    </div>
                )}

                <IonFooter className="ai-chat-footer">
                    <div className="input-container">
                        <IonTextarea
                            ref={textareaRef}
                            value={inputText}
                            onIonInput={(e: any) => setInputText(e.detail.value ?? "")}
                            onKeyDown={(e) => {
                                // Detectar Enter sin Shift - manejo directo como en chat-page.tsx
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault()
                                    e.stopPropagation()

                                    // Obtener el valor actual directamente del elemento
                                    const currentValue = (e.target as HTMLTextAreaElement).value || inputText
                                    const currentText = currentValue.trim()
                                    const hasImages = selectedImages.length > 0

                                    console.log("Enter pressed - Current text:", currentText, "Has images:", hasImages)

                                    if (currentText !== "" || hasImages) {
                                        // Actualizar el estado antes de enviar
                                        setInputText(currentValue)
                                        handleSend()
                                    }
                                }
                            }}
                            placeholder="Escribe aqui..."
                            autoGrow={true}
                            rows={1}
                            maxlength={1000}
                            className="chat-input"
                        />

                        <div className="input-buttons">
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                ref={fileInputRef}
                                style={{ display: "none" }}
                                onChange={handleFileChange}
                            />

                            <IonButton fill="clear" onClick={handleImageSelect} className="action-button">
                                <IonIcon icon={camera} />
                            </IonButton>

                            <IonButton
                                fill="clear"
                                onClick={() => {
                                    toggleProductSummaryMode()
                                    setIsButtonSelected((prev) => !prev)
                                }}
                                className="action-button"
                                color={productSummaryMode ? "primary" : "medium"}
                            >
                                <IonIcon className="reader-icon" icon={readerOutline} />
                                {productSummaryMode && <div className="mode-indicator"></div>}
                            </IonButton>

                            <IonButton
                                className="send-button-IA"
                                disabled={inputText.trim() === "" && selectedImages.length === 0}
                                onClick={handleSendClick}
                            >
                                <IonIcon icon={arrowUp} />
                            </IonButton>
                        </div>
                    </div>

                    {inputText.length > 0 && (
                        <div className="character-counter">
                            <IonText color={inputText.length > 800 ? (inputText.length > 900 ? "danger" : "warning") : "medium"}>
                                {inputText.length}/1000
                            </IonText>
                        </div>
                    )}
                </IonFooter>
            </IonPage>
        </>
    )
}

export default AIChatPage
