import React, { useState, useRef, useEffect, useCallback } from 'react';
import './Chat.css';
import {
    IonIcon,
    IonSpinner,
    IonButtons,
    IonMenuButton
} from '@ionic/react';
import {
    sunnyOutline,
    moonOutline,
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
    refreshOutline
} from 'ionicons/icons';
import Navegacion from '../../components/Navegation';
import { chatService, ChatDTO, MensajeRecibeDTO, MessageDTO } from "../../Services/ChatService";
import useAuthRedirect from "../../Services/useAuthRedirect";
import { ProductService } from "../../Services/ProductService";
import cloudinaryImage from "../../Services/CloudinaryService";

// Interfaces para los tipos de datos
interface Message {
    id: string;
    content: string;
    sender: 'user' | 'ai' | 'other';
    timestamp: Date;
    read: boolean;
    image?: string;
    senderName?: string;
}

interface Chat {
    id: string;
    idProduct: string;
    idProfileProduct: string;
    idProfile: string;
    name: string;
    avatar: string;
    lastMessage: string;
    timestamp: Date;
    unreadCount: number;
    isOnline: boolean;
}

const ChatPage: React.FC = () => {
    useAuthRedirect();

    // Estado de conexión
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const currentUserId = sessionStorage.getItem('userId') || 'user';
    const currentUserName = sessionStorage.getItem('nickname') || 'Usuario';

    // Estado para los chats
    const [chats, setChats] = useState<Chat[]>([]);

    // Estado para los mensajes del chat activo
    const [messages, setMessages] = useState<Message[]>([]);

    // Estado para el chat activo actual
    const [activeChat, setActiveChat] = useState<Chat | null>(null);

    // Estado para las suscripciones activas
    const [activeSubscription, setActiveSubscription] = useState<string | null>(null);

    // Estado para el mensaje de entrada
    const [inputMessage, setInputMessage] = useState('');

    // Estado para mostrar el indicador de escritura
    const [isTyping, setIsTyping] = useState(false);

    // Estado para el modo de tema claro/oscuro
    const [darkMode, setDarkMode] = useState(true);

    // Estado para mostrar/ocultar panel de chat en móvil
    const [showChatPanel, setShowChatPanel] = useState(false);

    // Detectar si está en móvil
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    // Estado para controlar si el teclado está visible
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

    // Estados para manejo de errores y carga
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Refs
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const chatMainRef = useRef<HTMLDivElement>(null);

    const [loadingProductNames, setLoadingProductNames] = useState<Set<string>>(new Set());
    const [loadingMessages, setLoadingMessages] = useState(false);

    // Función para cargar el nombre del producto de un chat específico
    const loadProductNameForChat = useCallback(async (chatId: string, productId: string, profileProductId: string) => {
        if (!productId || !profileProductId) {
            console.warn('No se pueden cargar nombres sin IDs válidos:', { productId, profileProductId });
            return;
        }

        setLoadingProductNames(prev => new Set(prev).add(chatId));

        try {
            console.log(`Cargando nombre del producto para chat ${chatId}:`, { productId, profileProductId });
            const product = await ProductService.getProductById(productId, profileProductId);

            console.log('Producto obtenido:', product);

            const productName = product.name || 'Producto sin nombre';
            const productAvatar = productName.charAt(0).toUpperCase();

            // Actualizar el chat específico con el nombre del producto
            setChats(prevChats =>
                prevChats.map(chat =>
                    chat.id === chatId
                        ? {
                            ...chat,
                            name: productName,
                            avatar: productAvatar
                        }
                        : chat
                )
            );

            console.log(`Nombre del producto actualizado para chat ${chatId}: ${productName}`);
        } catch (error) {
            console.error(`Error al cargar nombre del producto para chat ${chatId}:`, error);

            // Actualizar con un mensaje de error
            setChats(prevChats =>
                prevChats.map(chat =>
                    chat.id === chatId
                        ? { ...chat, name: 'Producto no disponible', avatar: 'X' }
                        : chat
                )
            );
        } finally {
            setLoadingProductNames(prev => {
                const newSet = new Set(prev);
                newSet.delete(chatId);
                return newSet;
            });
        }
    }, []);

    const convertMessageDTOToMessage = useCallback((messageDTO: MessageDTO): Message => {
        return {
            id: messageDTO.id,
            content: messageDTO.content,
            sender: messageDTO.senderNickname === currentUserName ? 'user' : 'other',
            senderName: messageDTO.senderNickname,
            timestamp: new Date(messageDTO.createdAt),
            read: true // Los mensajes históricos se consideran leídos
        };
    }, [currentUserName]);

    const loadChatMessages = useCallback(async (chat: Chat) => {
        if (!chat.idProduct || !chat.idProfileProduct || !chat.idProfile) {
            console.warn('No se pueden cargar mensajes sin IDs válidos:', chat);
            return;
        }

        setLoadingMessages(true);
        try {
            console.log('Cargando mensajes para chat:', chat.name);

            const messageDTOs = await chatService.getMessages(
                chat.idProduct,
                chat.idProfileProduct,
                chat.idProfile
            );

            console.log('Mensajes cargados:', messageDTOs);

            // Convertir MessageDTOs a Messages
            const historicalMessages = messageDTOs.map(convertMessageDTOToMessage);

            // Agregar mensaje de bienvenida si no hay mensajes históricos
            const welcomeMessage: Message = {
                id: 'welcome',
                content: `Chat con ${chat.name}`,
                sender: 'ai',
                timestamp: new Date(),
                read: true
            };

            // Si no hay mensajes históricos, solo mostrar el mensaje de bienvenida
            if (historicalMessages.length === 0) {
                setMessages([welcomeMessage]);
            } else {
                // Mostrar mensajes históricos sin el mensaje de bienvenida
                setMessages(historicalMessages);
            }

            console.log(`Cargados ${historicalMessages.length} mensajes históricos para ${chat.name}`);

        } catch (error) {
            console.error('Error al cargar mensajes históricos:', error);
            setError('Error al cargar los mensajes. Inténtalo de nuevo.');

            // En caso de error, mostrar solo el mensaje de bienvenida
            const welcomeMessage: Message = {
                id: 'welcome',
                content: `Chat con ${chat.name}`,
                sender: 'ai',
                timestamp: new Date(),
                read: true
            };
            setMessages([welcomeMessage]);
        } finally {
            setLoadingMessages(false);
        }
    }, [convertMessageDTOToMessage]);

    // Función para convertir ChatDTO a Chat - simplificada
    const convertChatDTOToChat = useCallback((chatDTO: ChatDTO): Chat => {
        console.log('Convirtiendo ChatDTO:', chatDTO);

        // Extraer datos de la estructura real del backend
        const productId = chatDTO.product?.id || '';
        const profileProductId = chatDTO.product?.profile?.id || '';
        const profileId = chatDTO.profileNoProduct?.id || '';

        // Determinar quién es el "otro usuario" y el nombre del chat
        let chatName: string;
        let chatAvatar: string;

        if (chatDTO.profileProductSender) {
            // Si el sender es el dueño del producto, el chat se llama como el usuario sin producto
            chatName = chatDTO.profileNoProduct?.nickname || 'Usuario desconocido';
            chatAvatar = chatDTO.profileNoProduct?.avatar || chatName.charAt(0).toUpperCase();
        } else {
            // Si el sender no es el dueño del producto, el chat se llama como el producto
            chatName = chatDTO.product?.name || 'Producto desconocido';
            chatAvatar = chatName.charAt(0).toUpperCase();
        }

        // Crear un ID único para el chat combinando los IDs relevantes
        const chatId = `${productId}-${profileProductId}-${profileId}`;

        const chat: Chat = {
            id: chatId,
            idProduct: productId,
            idProfileProduct: profileProductId,
            idProfile: profileId,
            name: chatName,
            avatar: chatAvatar,
            lastMessage: chatDTO.message || 'No hay mensajes',
            timestamp: chatDTO.createdAt ? new Date(chatDTO.createdAt) : new Date(),
            unreadCount: 0,
            isOnline: true
        };

        console.log('Chat convertido:', chat);
        return chat;
    }, []);

    // Actualizar el último mensaje de un chat
    const updateLastMessage = useCallback((chatId: string, message: string, timestamp: Date) => {
        setChats(prevChats =>
            prevChats.map(chat =>
                chat.id === chatId
                    ? {
                        ...chat,
                        lastMessage: message,
                        timestamp,
                        unreadCount: chat.id !== activeChat?.id ? chat.unreadCount + 1 : 0
                    }
                    : chat
            )
        );
    }, [activeChat?.id]);

    // Función para manejar mensajes recibidos
    const handleMessageReceived = useCallback((messageData: MensajeRecibeDTO) => {
        try {
            console.log("Mensaje recibido por WebSocket:", messageData);

            if (!messageData.content) {
                console.warn('Mensaje recibido sin contenido:', messageData);
                return;
            }

            const newMessage: Message = {
                id: `${Date.now()}-${Math.random()}`,
                content: messageData.content,
                sender: messageData.userName === currentUserName ? 'user' : 'other',
                senderName: messageData.userName || 'Usuario desconocido',
                timestamp: messageData.timestamp ? new Date(messageData.timestamp) : new Date(),
                read: false
            };

            console.log('Mensaje procesado:', newMessage);
            setMessages(prev => [...prev, newMessage]);

            if (activeChat) {
                updateLastMessage(activeChat.id, newMessage.content, newMessage.timestamp);
            }
        } catch (error) {
            console.error("Error al procesar el mensaje recibido:", error);
        }
    }, [currentUserName, activeChat, updateLastMessage]);

    // Función para cargar los chats desde el backend
    const loadChats = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            if (!token) {
                setError('No se encontró token de autenticación. Por favor, inicia sesión nuevamente.');
                setChats([]);
                setLoading(false);
                return;
            }

            console.log('Cargando chats del backend...');
            const chatDTOs = await chatService.getChats();
            console.log('Chats recibidos del backend:', chatDTOs);

            // Convertir todos los chats de forma síncrona primero
            const convertedChats = chatDTOs.map(chatDTO => convertChatDTOToChat(chatDTO));
            setChats(convertedChats);

            console.log('Chats convertidos y cargados:', convertedChats);

            // Después, cargar los nombres de productos de forma asíncrona para los que lo necesiten
            const chatsNeedingProductNames = convertedChats.filter(chat =>
                chat.name === 'Cargando...' && chat.idProduct && chat.idProfileProduct
            );

            console.log('Chats que necesitan cargar nombres de productos:', chatsNeedingProductNames);

            // Cargar nombres de productos de forma paralela
            const loadPromises = chatsNeedingProductNames.map(chat =>
                loadProductNameForChat(chat.id, chat.idProduct, chat.idProfileProduct)
            );

            if (loadPromises.length > 0) {
                await Promise.allSettled(loadPromises);
                console.log('Carga de nombres de productos completada');
            }

        } catch (error: any) {
            console.error('Error al cargar chats:', error);

            if (error?.response?.status === 401 || error?.response?.status === 403) {
                setError('Sesión expirada. Por favor, inicia sesión nuevamente.');
            } else if (error?.response?.status === 500) {
                setError('Error del servidor. Inténtalo más tarde.');
            } else if (error?.message?.includes('Network Error')) {
                setError('Error de conexión. Verifica tu conexión a internet.');
            } else {
                setError('Error al cargar los chats. Inténtalo de nuevo.');
            }

            if (error?.response?.status !== 401 && error?.response?.status !== 403) {
                setChats([]);
            }
        } finally {
            setLoading(false);
        }
    }, [convertChatDTOToChat, loadProductNameForChat]);

    // Función para manejar errores en suscripciones
    const handleSubscriptionError = useCallback((error: any) => {
        console.error("Error en suscripción:", error);
        setError('Error en la conexión del chat. Intentando reconectar...');
    }, []);

    // Función para conectar al WebSocket
    const connectToWebSocket = useCallback(async () => {
        if (isConnecting || isConnected) return;

        try {
            setIsConnecting(true);
            setError(null);

            console.log('Iniciando conexión WebSocket...');

            await chatService.connect(
                () => {
                    console.log('WebSocket conectado exitosamente');
                    setIsConnected(true);
                    setIsConnecting(false);
                    setError(null);
                },
                (error) => {
                    console.error('Error de conexión WebSocket:', error);
                    setIsConnected(false);
                    setIsConnecting(false);

                    if (error?.toString().includes('401') || error?.toString().includes('403')) {
                        setError('Error de autenticación en el chat. Inicia sesión nuevamente.');
                    } else {
                        setError('Error de conexión al chat. Reintentando...');
                    }
                }
            );
        } catch (error: any) {
            console.error('Error al conectar WebSocket:', error);
            setIsConnected(false);
            setIsConnecting(false);

            if (error?.message?.includes('autenticación')) {
                setError('Error de autenticación. Por favor, inicia sesión nuevamente.');
            } else {
                setError('No se pudo conectar al servicio de chat.');
            }
        }
    }, [isConnecting, isConnected]);

    // Función para enviar mensaje
    const sendMessage = useCallback(async () => {
        if (inputMessage.trim() === '' || !activeChat || !isConnected) {
            console.warn('No se puede enviar mensaje:', {
                hasMessage: inputMessage.trim() !== '',
                hasActiveChat: !!activeChat,
                isConnected
            });
            return;
        }

        const messageContent = inputMessage.trim();

        try {
            setInputMessage('');

            const newMessage: Message = {
                id: `temp-${Date.now()}-${Math.random()}`,
                content: messageContent,
                sender: 'user',
                timestamp: new Date(),
                read: true
            };

            setMessages(prev => [...prev, newMessage]);
            updateLastMessage(activeChat.id, messageContent, new Date());

            console.log('Enviando mensaje:', messageContent);
            chatService.sendMessage(
                activeChat.idProduct,
                activeChat.idProfileProduct,
                activeChat.idProfile,
                messageContent
            );

            console.log('Mensaje enviado exitosamente');

        } catch (error) {
            console.error('Error al enviar mensaje:', error);
            setError('Error al enviar el mensaje. Inténtalo de nuevo.');
            setInputMessage(messageContent);
            setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')));
        }
    }, [inputMessage, activeChat, isConnected, updateLastMessage]);

    // Manejar cambio de chat
    const handleChatSelect = useCallback(async (chat: Chat) => {
        console.log('Seleccionando chat:', chat); // Para debug
        console.log('IDs del chat:', {
            idProduct: chat.idProduct,
            idProfileProduct: chat.idProfileProduct,
            idProfile: chat.idProfile
        });

        setActiveChat(chat);

        // Marcar como leído
        setChats(prevChats =>
            prevChats.map(c =>
                c.id === chat.id ? { ...c, unreadCount: 0 } : c
            )
        );

        // Si el chat todavía muestra "Cargando..." y tiene los IDs necesarios, intentar cargar el nombre
        if (chat.name === 'Cargando...' && chat.idProduct && chat.idProfileProduct) {
            loadProductNameForChat(chat.id, chat.idProduct, chat.idProfileProduct);
        }

        if (isMobile) {
            setShowChatPanel(true);
        }
    }, [isMobile, loadProductNameForChat]);

    // Volver a la lista de chats (para móvil)
    const handleBackToList = useCallback(() => {
        setShowChatPanel(false);
        setActiveChat(null);
    }, []);

    // Cambiar modo claro/oscuro
    const toggleTheme = useCallback(() => {
        setDarkMode(prev => !prev);
    }, []);

    // Función para recargar chats
    const handleRefreshChats = useCallback(async () => {
        await loadChats();
    }, [loadChats]);

    // Función para reintentar conexión
    const handleRetryConnection = useCallback(async () => {
        console.log('Reintentando conexión completa...');
        setError(null);

        try {
            if (chatService.isWebSocketConnected()) {
                chatService.disconnect();
                setIsConnected(false);
            }

            await loadChats();
            await connectToWebSocket();
        } catch (error) {
            console.error('Error al reintentar conexión:', error);
        }
    }, [loadChats, connectToWebSocket]);

    // Formateo de tiempo
    const formatMessageTime = useCallback((date: Date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }, []);

    const formatChatTime = useCallback((date: Date) => {
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Ayer';
        } else {
            return date.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
        }
    }, []);

    // Efecto para inicializar la conexión y cargar chats
    useEffect(() => {
        const initializeChat = async () => {
            console.log('Inicializando chat...');

            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            if (!token) {
                setError('No se encontró token de autenticación. Por favor, inicia sesión.');
                setLoading(false);
                return;
            }

            try {
                await loadChats();
                await connectToWebSocket();
            } catch (error) {
                console.error('Error en inicialización:', error);
            }
        };

        initializeChat();

        return () => {
            console.log('Limpiando conexiones de chat...');
            if (activeSubscription) {
                chatService.unsubscribeFromChat(activeSubscription);
            }
            chatService.disconnect();
        };
    }, []);

    // Efecto para detectar el tamaño de la pantalla
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Efecto para detectar cuando el teclado virtual aparece/desaparece
    useEffect(() => {
        const handleVisibilityChange = () => {
            const isKeyboardOpen = window.innerHeight < window.outerHeight * 0.75;
            setIsKeyboardVisible(isKeyboardOpen);

            if (isKeyboardOpen && inputRef.current) {
                setTimeout(() => {
                    inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
            }
        };

        window.addEventListener('resize', handleVisibilityChange);
        return () => window.removeEventListener('resize', handleVisibilityChange);
    }, []);

    // Scroll al último mensaje cuando se añaden nuevos mensajes
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // Suscribirse a la sala de chat cuando cambia el chat activo
    useEffect(() => {
        if (isConnected && activeChat) {
            console.log('Configurando suscripción para chat:', activeChat.name);

            if (activeSubscription) {
                console.log('Cancelando suscripción anterior:', activeSubscription);
                chatService.unsubscribeFromChat(activeSubscription);
                setActiveSubscription(null);
            }

            try {
                const subscriptionKey = chatService.subscribeToChat(
                    activeChat.idProduct,
                    activeChat.idProfileProduct,
                    activeChat.idProfile,
                    handleMessageReceived,
                    handleSubscriptionError
                );

                setActiveSubscription(subscriptionKey);

                // Cargar mensajes históricos en lugar de solo mostrar mensaje de bienvenida
                loadChatMessages(activeChat);

                console.log(`Suscrito exitosamente al chat: ${activeChat.name}`);
            } catch (error) {
                console.error('Error al suscribirse al chat:', error);
                setError('Error al conectar con el chat. Inténtalo de nuevo.');
            }
        }
    }, [isConnected, activeChat, handleMessageReceived, handleSubscriptionError, activeSubscription, loadChatMessages]);


    // Enfoque en el input cuando se cambia de chat
    useEffect(() => {
        if (activeChat && !isMobile) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 300);
        }
    }, [activeChat, isMobile]);

    // Determinar si debemos mostrar el TabBar
    const shouldShowNavigation = isMobile && !showChatPanel;

    // Mostrar indicador de carga inicial
    if (loading) {
        return (
            <div className={`chat-view ${darkMode ? '' : 'light-mode'} loading-view`}>
                <div className="loading-content">
                    <IonSpinner name="crescent" />
                    <p>Cargando chats...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`chat-view ${darkMode ? '' : 'light-mode'}`}>
            {/* Banner de error */}
            {error && (
                <div className="error-banner">
                    <span>{error}</span>
                    <button onClick={() => setError(null)} aria-label="Cerrar error">×</button>
                </div>
            )}

            {/* Sidebar de chats */}
            <div className={`chat-sidebar ${showChatPanel ? 'hidden-mobile' : ''}`}>
                <div className="sidebar-header">
                    <div className="user-profile">
                        {!isMobile && (
                            <IonButtons slot="start" className="hamburger-menu-button">
                                <IonMenuButton>
                                    <IonIcon
                                        icon={menuOutline}
                                        style={{ color: darkMode ? 'white' : 'black', fontSize: '24px' }}
                                    />
                                </IonMenuButton>
                            </IonButtons>
                        )}
                        <div className="user-avatar">{currentUserName.charAt(0).toUpperCase()}</div>
                        <h3>{currentUserName}</h3>
                        <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
                            {isConnecting ? 'Conectando...' : isConnected ? 'En línea' : 'Desconectado'}
                        </div>
                    </div>

                    <div className="header-actions">
                        <button
                            className="action-icon-button"
                            onClick={handleRefreshChats}
                            title="Recargar chats"
                        >
                            <IonIcon icon={refreshOutline} />
                        </button>
                        <button
                            className="action-icon-button"
                            onClick={toggleTheme}
                            title="Cambiar tema"
                        >
                            <IonIcon icon={darkMode ? sunnyOutline : moonOutline} />
                        </button>
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
                        <input type="text" placeholder="Buscar chats" />
                    </div>
                </div>

                <div className="chats-list">
                    {chats.length === 0 ? (
                        <div className="no-chats">
                            <p>No hay chats disponibles</p>
                            <button onClick={handleRefreshChats}>Recargar</button>
                        </div>
                    ) : (
                        chats.map(chat => (
                            <div
                                key={chat.id}
                                className={`chat-item ${activeChat?.id === chat.id ? 'active' : ''}`}
                                onClick={() => handleChatSelect(chat)}
                            >
                                <div className={`chat-avatar ${chat.isOnline ? 'online' : ''}`}>
                                    <div className="user-avatar-chat">
                                        {loadingProductNames.has(chat.id) ? (
                                            <IonSpinner name="crescent" />
                                        ) : (
                                            <img src={cloudinaryImage(chat.avatar)}/>
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
                                        {chat.unreadCount > 0 && (
                                            <span className="unread-badge">{chat.unreadCount}</span>
                                        )}
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
            <div className={`chat-main ${showChatPanel ? 'shown-mobile' : ''}`} ref={chatMainRef}>
                {activeChat ? (
                    <>
                        {/* Header del chat */}
                        <div className="chat-header">
                            <div className="header-content">
                                <button className="back-button" onClick={handleBackToList}>
                                    <IonIcon icon={arrowBackOutline} />
                                </button>
                                <div className={`chat-avatar ${activeChat.isOnline ? 'online' : ''}`}>
                                    <div className="user-avatar-chat">
                                        <img src={cloudinaryImage(activeChat.avatar)} alt={"Avatar"}/>
                                    </div>
                                </div>
                                <div className="chat-info">
                                    <h3>{activeChat.name}</h3>
                                    <span className="status-text">
                                        {isConnected
                                            ? (activeChat.isOnline ? 'En línea' : 'Último acceso hace 3h')
                                            : 'Desconectado'
                                        }
                                    </span>
                                </div>
                            </div>
                            <div className="header-actions">
                                <button className="action-icon-button">
                                    <IonIcon icon={searchOutline} />
                                </button>
                                <button className="action-icon-button">
                                    <IonIcon icon={ellipsisVerticalOutline} />
                                </button>
                            </div>
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
                                    {messages.map(message => (
                                        <div
                                            key={message.id}
                                            className={`message-container ${
                                                message.sender === 'user' ? 'user-message' :
                                                    message.sender === 'ai' ? 'ai-message' : 'other-message'
                                            }`}
                                        >
                                            <div className="message-avatar">
                                                {message.sender === 'ai' ? (
                                                    <div className="ai-avatar">AI</div>
                                                ) : message.sender === 'user' ? (
                                                    <div className="user-avatar">
                                                        {currentUserName.charAt(0).toUpperCase()}
                                                    </div>
                                                ) : (
                                                    <div className="user-avatar-chat">
                                                        {message.senderName?.charAt(0).toUpperCase() || 'O'}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="message-content">
                                                {message.sender === 'other' && (
                                                    <div className="sender-name">{message.senderName}</div>
                                                )}
                                                <div className="message-bubble">
                                                    {message.image && (
                                                        <div className="message-image-container">
                                                            <img
                                                                src={message.image}
                                                                alt="Imagen adjunta"
                                                                className="message-image"
                                                            />
                                                        </div>
                                                    )}
                                                    <div className="message-text">{message.content}</div>
                                                    <div className="message-time">
                                                        {formatMessageTime(message.timestamp)}
                                                        {message.sender === 'user' && (
                                                            <span className="read-status">
                                        <IonIcon
                                            icon={message.read ? checkmarkDoneOutline : checkmarkOutline}
                                        />
                                    </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

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
                        <div className={`chat-footer ${isKeyboardVisible ? 'keyboard-visible' : ''}`}>
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
                                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                        ref={inputRef}
                                        disabled={!isConnected}
                                    />
                                </div>
                                {inputMessage.trim() ? (
                                    <button
                                        className="send-button"
                                        onClick={sendMessage}
                                        disabled={!isConnected}
                                    >
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
    );
};

export default ChatPage;