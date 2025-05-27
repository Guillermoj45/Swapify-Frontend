import React, { useState, useRef, useEffect } from 'react';
import './Chat.css';
import {
    IonIcon,
    IonSpinner,
    IonButtons,
    IonMenuButton
} from '@ionic/react';
import {
    chatbubbleEllipsesOutline,
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
    menuOutline
} from 'ionicons/icons';
import Navegacion from '../../components/Navegation';
import { chatService, ChatDTO, MensajeRecibeDTO } from "../../Services/ChatService";
import useAuthRedirect from "../../Services/useAuthRedirect";

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

    // Estado de conexión WebSocket
    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);

    // Usuario actual
    const currentUserId = sessionStorage.getItem('userId') || 'user';
    const currentUserName = sessionStorage.getItem('nickname') || 'Usuario';

    // Estado para los chats
    const [chats, setChats] = useState<Chat[]>([]);
    const [isLoadingChats, setIsLoadingChats] = useState(true);

    // Estado para los mensajes del chat activo
    const [messages, setMessages] = useState<Message[]>([]);

    // Estado para el chat activo actual
    const [activeChat, setActiveChat] = useState<Chat | null>(null);
    const [activeSubscriptionKey, setActiveSubscriptionKey] = useState<string | null>(null);

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

    // Refs
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const chatMainRef = useRef<HTMLDivElement>(null);

    // Función para cargar chats desde el backend
    const loadChats = async () => {
        try {
            setIsLoadingChats(true);
            const chatsFromAPI: ChatDTO[] = await chatService.getChats();

            // Mapear los DTOs a la estructura local de Chat
            const mappedChats: Chat[] = chatsFromAPI.map((chatDTO) => ({
                idProduct: chatDTO.productId,
                idProfileProduct: chatDTO.profileProductId,
                idProfile: chatDTO.profileId,
                name: chatDTO.productName || chatDTO.otherUserName || 'Chat sin nombre',
                avatar: (chatDTO.productName || chatDTO.otherUserName || 'C').charAt(0).toUpperCase(),
                lastMessage: chatDTO.lastMessage || 'Sin mensajes',
                timestamp: chatDTO.lastMessageTime ? new Date(chatDTO.lastMessageTime) : new Date(),
                unreadCount: 0, // Esto podría venir del backend en el futuro
                isOnline: true // Esto podría venir del backend en el futuro
            }));

            setChats(mappedChats);
        } catch (error) {
            console.error('Error al cargar chats:', error);
            setConnectionError('Error al cargar los chats');
        } finally {
            setIsLoadingChats(false);
        }
    };

    // Función para conectar al WebSocket
    const connectWebSocket = async () => {
        try {
            setIsConnecting(true);
            setConnectionError(null);

            await chatService.connect(
                // onConnected
                () => {
                    console.log('WebSocket conectado exitosamente');
                    setIsConnected(true);
                    setConnectionError(null);
                },
                // onError
                (error) => {
                    console.error('Error de conexión WebSocket:', error);
                    setIsConnected(false);
                    setConnectionError('Error de conexión WebSocket');
                }
            );
        } catch (error) {
            console.error('Error al conectar WebSocket:', error);
            setIsConnected(false);
            setConnectionError('No se pudo conectar al servidor');
        } finally {
            setIsConnecting(false);
        }
    };

    // Función para manejar mensajes recibidos
    const handleMessageReceived = (messageData: MensajeRecibeDTO) => {
        console.log("Mensaje recibido:", messageData);

        // Crear un nuevo mensaje para el chat
        const newMessage: Message = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            content: messageData.content,
            sender: messageData.userName === currentUserName ? 'user' : 'other',
            senderName: messageData.userName || 'Usuario desconocido',
            timestamp: messageData.timestamp ? new Date(messageData.timestamp) : new Date(),
            read: false
        };

        // Añadir el mensaje a la lista de mensajes
        setMessages(prev => [...prev, newMessage]);

        // Actualizar el último mensaje en la lista de chats si es del chat activo
        if (activeChat) {
            updateLastMessage(
                activeChat.idProduct,
                activeChat.idProfileProduct,
                activeChat.idProfile,
                newMessage.content,
                newMessage.timestamp
            );
        }
    };

    // Efecto para inicializar la conexión y cargar chats
    useEffect(() => {
        const initialize = async () => {
            await loadChats();
            await connectWebSocket();
        };

        initialize();

        // Cleanup al desmontar el componente
        return () => {
            if (activeSubscriptionKey) {
                chatService.unsubscribeFromChat(activeSubscriptionKey);
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

    // Efecto para manejar el enfoque en el input
    useEffect(() => {
        const handleFocus = () => {
            if (inputRef.current && chatMainRef.current) {
                setTimeout(() => {
                    inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    chatMainRef.current?.scrollTo({
                        top: chatMainRef.current.scrollHeight,
                        behavior: 'smooth'
                    });
                }, 300);
            }
        };

        if (inputRef.current) {
            inputRef.current.addEventListener('focus', handleFocus);
            inputRef.current.addEventListener('click', handleFocus);
        }

        return () => {
            if (inputRef.current) {
                inputRef.current.removeEventListener('focus', handleFocus);
                inputRef.current.removeEventListener('click', handleFocus);
            }
        };
    }, [activeChat]);

    // Scroll al último mensaje cuando se añaden nuevos mensajes
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // Suscribirse al chat activo
    useEffect(() => {
        if (isConnected && activeChat) {
            // Desuscribirse del chat anterior
            if (activeSubscriptionKey) {
                chatService.unsubscribeFromChat(activeSubscriptionKey);
            }

            // Suscribirse al nuevo chat
            try {
                const subscriptionKey = chatService.subscribeToChat(
                    activeChat.idProduct,
                    activeChat.idProfileProduct,
                    activeChat.idProfile,
                    handleMessageReceived,
                    (error) => {
                        console.error('Error en suscripción al chat:', error);
                        setConnectionError('Error al conectar con el chat');
                    }
                );

                setActiveSubscriptionKey(subscriptionKey);

                // Limpiar mensajes anteriores y mostrar mensaje de bienvenida
                const welcomeMessage: Message = {
                    id: 'welcome-' + Date.now(),
                    content: `Conectado a ${activeChat.name}`,
                    sender: 'ai',
                    timestamp: new Date(),
                    read: true
                };

                setMessages([welcomeMessage]);

            } catch (error) {
                console.error('Error al suscribirse al chat:', error);
                setConnectionError('Error al conectar con el chat');
            }
        }
    }, [isConnected, activeChat]);

    // Formato de fecha para los mensajes
    const formatMessageTime = (date: Date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Formato de fecha para la lista de chats
    const formatChatTime = (date: Date) => {
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
    };

    // Actualizar el último mensaje de un chat
    const updateLastMessage = (
        idProduct: string,
        idProfileProduct: string,
        idProfile: string,
        message: string,
        timestamp: Date
    ) => {
        setChats(prevChats =>
            prevChats.map(chat => {
                const isCurrentChat = chat.idProduct === idProduct &&
                    chat.idProfileProduct === idProfileProduct &&
                    chat.idProfile === idProfile;

                if (isCurrentChat) {
                    const isActiveChat = activeChat &&
                        activeChat.idProduct === idProduct &&
                        activeChat.idProfileProduct === idProfileProduct &&
                        activeChat.idProfile === idProfile;

                    return {
                        ...chat,
                        lastMessage: message,
                        timestamp,
                        unreadCount: !isActiveChat ? chat.unreadCount + 1 : 0
                    };
                }
                return chat;
            })
        );
    };

    // Función para enviar mensaje
    const sendMessage = async () => {
        if (inputMessage.trim() === '' || !activeChat || !isConnected) return;

        try {
            // Crear mensaje optimista para la UI
            const optimisticMessage: Message = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                content: inputMessage,
                sender: 'user',
                senderName: currentUserName,
                timestamp: new Date(),
                read: true
            };

            // Añadir mensaje a la UI inmediatamente
            setMessages(prev => [...prev, optimisticMessage]);

            // Actualizar último mensaje en la lista de chats
            updateLastMessage(
                activeChat.idProduct,
                activeChat.idProfileProduct,
                activeChat.idProfile,
                inputMessage,
                new Date()
            );

            // Enviar mensaje a través del WebSocket
            chatService.sendMessage(
                activeChat.idProduct,
                activeChat.idProfileProduct,
                activeChat.idProfile,
                inputMessage
            );

            // Limpiar input
            setInputMessage('');

            // Simular indicador de escritura
            setIsTyping(true);
            setTimeout(() => {
                setIsTyping(false);
            }, 1000);

        } catch (error) {
            console.error('Error al enviar mensaje:', error);
            setConnectionError('Error al enviar mensaje');

            // Remover mensaje optimista en caso de error
            setMessages(prev => prev.filter(msg => msg.id !== (Date.now().toString() + Math.random().toString(36).substr(2, 9))));
        }
    };

    // Manejar cambio de chat
    const handleChatSelect = (chat: Chat) => {
        setActiveChat(chat);

        // Marcar como leído
        const updatedChats = chats.map(c => {
            const isSameChat = c.idProduct === chat.idProduct &&
                c.idProfileProduct === chat.idProfileProduct &&
                c.idProfile === chat.idProfile;

            if (isSameChat) {
                return { ...c, unreadCount: 0 };
            }
            return c;
        });
        setChats(updatedChats);

        // En móvil, mostrar el panel de chat
        setShowChatPanel(true);
    };

    // Volver a la lista de chats (para móvil)
    const handleBackToList = () => {
        setShowChatPanel(false);
    };

    // Cambiar modo claro/oscuro
    const toggleTheme = () => {
        setDarkMode(!darkMode);
    };

    // Función para reconectar manualmente
    const handleReconnect = () => {
        connectWebSocket();
    };

    // Determinar si debemos mostrar el TabBar
    const shouldShowNavigation = isMobile && !showChatPanel;

    // Enfoque en el input cuando se cambia de chat
    useEffect(() => {
        if (activeChat && !isMobile) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 300);
        }
    }, [activeChat, isMobile]);

    return (
        <div className={`chat-view ${darkMode ? '' : 'light-mode'}`}>
            <div className={`chat-sidebar ${showChatPanel ? 'hidden-mobile' : ''}`}>
                <div className="sidebar-header">
                    <div className="user-profile">
                        {!isMobile && (
                            <IonButtons slot="start" className="hamburger-menu-button">
                                <IonMenuButton>
                                    <IonIcon icon={menuOutline} style={{ color: darkMode ? 'white' : 'black', fontSize: '24px' }} />
                                </IonMenuButton>
                            </IonButtons>
                        )}
                        <div className="user-avatar">U</div>
                        <h3>{currentUserName}</h3>
                    </div>
                    <div className="header-actions">
                        <button className="action-icon-button" onClick={() => loadChats()}>
                            <IonIcon icon={chatbubbleEllipsesOutline} />
                        </button>
                        <button className="action-icon-button" onClick={toggleTheme}>
                            <IonIcon icon={darkMode ? sunnyOutline : moonOutline} />
                        </button>
                    </div>
                </div>

                {/* Mostrar estado de conexión */}
                {(isConnecting || connectionError || !isConnected) && (
                    <div className="connection-status">
                        {isConnecting && (
                            <div className="status-connecting">
                                <IonSpinner name="dots" />
                                <span>Conectando...</span>
                            </div>
                        )}
                        {connectionError && (
                            <div className="status-error">
                                <span>{connectionError}</span>
                                <button onClick={handleReconnect} className="reconnect-button">
                                    Reintentar
                                </button>
                            </div>
                        )}
                        {!isConnected && !isConnecting && !connectionError && (
                            <div className="status-disconnected">
                                <span>Desconectado</span>
                                <button onClick={handleReconnect} className="reconnect-button">
                                    Conectar
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <div className="search-container">
                    <div className="chat-search">
                        <IonIcon icon={searchOutline} />
                        <input type="text" placeholder="Buscar chats" />
                    </div>
                </div>

                <div className="chats-list">
                    {isLoadingChats ? (
                        <div className="loading-chats">
                            <IonSpinner name="crescent" />
                            <span>Cargando chats...</span>
                        </div>
                    ) : chats.length === 0 ? (
                        <div className="no-chats">
                            <p>No hay chats disponibles</p>
                            <button onClick={loadChats} className="reload-button">
                                Recargar
                            </button>
                        </div>
                    ) : (
                        chats.map((chat, index) => (
                            <div
                                key={`${chat.idProduct}-${chat.idProfileProduct}-${chat.idProfile}-${index}`}
                                className={`chat-item ${
                                    activeChat &&
                                    activeChat.idProduct === chat.idProduct &&
                                    activeChat.idProfileProduct === chat.idProfileProduct &&
                                    activeChat.idProfile === chat.idProfile
                                        ? 'active'
                                        : ''
                                }`}
                                onClick={() => handleChatSelect(chat)}
                            >
                                <div className={`chat-avatar ${chat.isOnline ? 'online' : ''}`}>
                                    <div className="user-avatar-chat">{chat.avatar}</div>
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

            <div
                className={`chat-main ${showChatPanel ? 'shown-mobile' : ''}`}
                ref={chatMainRef}
            >
                {activeChat ? (
                    <>
                        <div className="chat-header">
                            <div className="header-content">
                                <button className="back-button" onClick={handleBackToList}>
                                    <IonIcon icon={arrowBackOutline} />
                                </button>
                                <div className={`chat-avatar ${activeChat.isOnline ? 'online' : ''}`}>
                                    <div className="user-avatar-chat">{activeChat.avatar}</div>
                                </div>
                                <div className="chat-info">
                                    <h3>{activeChat.name}</h3>
                                    <span className="status-text">
                                        {isConnected ?
                                            (activeChat.isOnline ? 'En línea' : 'Último acceso hace 3h') :
                                            'Desconectado'
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

                        <div className="messages-container" id="messages-container">
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
                                                <div className="user-avatar">U</div>
                                            ) : (
                                                <div className="user-avatar-chat">{message.senderName?.charAt(0) || 'O'}</div>
                                            )}
                                        </div>
                                        <div className="message-content">
                                            {message.sender === 'other' && (
                                                <div className="sender-name">{message.senderName}</div>
                                            )}
                                            <div className="message-bubble">
                                                {message.image && (
                                                    <div className="message-image-container">
                                                        <img src={message.image} alt="Imagen adjunta" className="message-image" />
                                                    </div>
                                                )}
                                                <div className="message-text">{message.content}</div>
                                                <div className="message-time">
                                                    {formatMessageTime(message.timestamp)}
                                                    {message.sender === 'user' && (
                                                        <span className="read-status">
                                                            <IonIcon icon={message.read ? checkmarkDoneOutline : checkmarkOutline} />
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
                        </div>

                        <div
                            className={`chat-footer ${isKeyboardVisible ? 'keyboard-visible' : ''}`}
                            id="chat-footer"
                        >
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
                                        onClick={() => {
                                            if (isMobile) {
                                                setTimeout(() => {
                                                    inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                }, 100);
                                            }
                                        }}
                                    />
                                </div>
                                {inputMessage.trim() && isConnected ? (
                                    <button className="send-button" onClick={sendMessage}>
                                        <IonIcon icon={sendOutline} />
                                    </button>
                                ) : (
                                    <button className="action-button" disabled={!isConnected}>
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
                                <button onClick={handleReconnect} className="connect-button">
                                    Conectar al servidor
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