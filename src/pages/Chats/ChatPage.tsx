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
    id: string; // ID del chat, opcional para chats generales
    idProduct: string; //UUID del producto
    idProfileProduct: string; //UUID del perfil del producto
    idProfile: string; //UUID del perfil
    name: string;
    avatar: string;
    lastMessage: string;
    timestamp: Date;
    unreadCount: number;
    isOnline: boolean;
}

const ChatPage: React.FC = () => {

    useAuthRedirect()

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

    // Ref para el contenedor de mensajes
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Ref para el input de mensaje
    const inputRef = useRef<HTMLInputElement>(null);

    // Ref para el contenedor principal
    const chatMainRef = useRef<HTMLDivElement>(null);

    // Función para convertir ChatDTO a Chat
    const convertChatDTOToChat = (chatDTO: ChatDTO): Chat => {
        return {
            id: chatDTO.id,
            idProduct: chatDTO.productId,
            idProfileProduct: chatDTO.profileProductId,
            idProfile: chatDTO.profileId,
            name: chatDTO.productName || chatDTO.otherUserName || 'Chat sin nombre',
            avatar: chatDTO.productName?.charAt(0) || chatDTO.otherUserName?.charAt(0) || 'C',
            lastMessage: chatDTO.lastMessage || 'No hay mensajes',
            timestamp: chatDTO.lastMessageTime ? new Date(chatDTO.lastMessageTime) : new Date(),
            unreadCount: 0,
            isOnline: true // Esto podría venir del backend en el futuro
        };
    };

    // Función para cargar los chats desde el backend
    const loadChats = async () => {
        try {
            setLoading(true);
            setError(null);
            const chatDTOs = await chatService.getChats();
            const convertedChats = chatDTOs.map(convertChatDTOToChat);
            setChats(convertedChats);
        } catch (error) {
            console.error('Error al cargar chats:', error);
            setError('Error al cargar los chats');
            // Fallback a chats por defecto si hay error
            setChats([
                {
                    id: 'general',
                    idProduct: 'bcc107d2-79a9-4d86-a4ec-59d7906be5e2',
                    idProfileProduct: '1ff84f03-e1aa-4ce3-b458-ced67dcaeb9f',
                    idProfile: '45552e96-18ad-4115-9859-986f591441a8',
                    name: 'Chat General',
                    avatar: 'G',
                    lastMessage: 'Bienvenido al chat general',
                    timestamp: new Date(),
                    unreadCount: 0,
                    isOnline: true
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    // Función para conectar al WebSocket
    const connectToWebSocket = async () => {
        if (isConnecting || isConnected) return;

        try {
            setIsConnecting(true);
            setError(null);

            await chatService.connect(
                // onConnected callback
                () => {
                    console.log('Conectado al chat service');
                    setIsConnected(true);
                    setIsConnecting(false);
                },
                // onError callback
                (error) => {
                    console.error('Error de conexión:', error);
                    setError('Error de conexión al chat');
                    setIsConnected(false);
                    setIsConnecting(false);
                }
            );
        } catch (error) {
            console.error('Error al conectar:', error);
            setError('Error al conectar con el servicio de chat');
            setIsConnected(false);
            setIsConnecting(false);
        }
    };

    // Función para manejar mensajes recibidos
    const handleMessageReceived = (messageData: MensajeRecibeDTO) => {
        try {
            console.log("Mensaje recibido:", messageData);

            // Crear un nuevo mensaje para el chat
            const newMessage: Message = {
                id: Date.now().toString(),
                content: messageData.content,
                sender: messageData.userName === currentUserName ? 'user' : 'other',
                senderName: messageData.userName || 'Otro usuario',
                timestamp: messageData.timestamp ? new Date(messageData.timestamp) : new Date(),
                read: false
            };

            // Añadir el mensaje a la lista de mensajes
            setMessages(prev => [...prev, newMessage]);

            // Actualizar el último mensaje en la lista de chats
            if (activeChat) {
                updateLastMessage(activeChat.id, newMessage.content, newMessage.timestamp);
            }
        } catch (error) {
            console.error("Error al procesar el mensaje recibido:", error);
        }
    };

    // Función para manejar errores en suscripciones
    const handleSubscriptionError = (error: any) => {
        console.error("Error en suscripción:", error);
        setError('Error en la conexión del chat');
    };

    // Efecto para inicializar la conexión y cargar chats
    useEffect(() => {
        const initializeChat = async () => {
            await loadChats();
            await connectToWebSocket();
        };

        initializeChat();

        // Cleanup al desmontar el componente
        return () => {
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
            // En dispositivos móviles, la altura de la ventana disminuye cuando aparece el teclado
            const isKeyboardOpen = window.innerHeight < window.outerHeight * 0.75;
            setIsKeyboardVisible(isKeyboardOpen);

            // Si el teclado está visible, aseguramos que el input sea visible
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
                // Esperamos un poco para que el teclado se abra completamente
                setTimeout(() => {
                    // Desplazamos la vista para asegurar que el input sea visible
                    inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });

                    // Desplazamos el contenedor principal hacia abajo
                    chatMainRef.current?.scrollTo({
                        top: chatMainRef.current.scrollHeight,
                        behavior: 'smooth'
                    });
                }, 300);
            }
        };

        // Añadir listeners para focus y click
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

    // Suscribirse a la sala de chat cuando cambia el chat activo
    useEffect(() => {
        if (isConnected && activeChat) {
            // Desuscribirse de la sala anterior
            if (activeSubscription) {
                chatService.unsubscribeFromChat(activeSubscription);
                setActiveSubscription(null);
            }

            try {
                // Suscribirse a la nueva sala
                const subscriptionKey = chatService.subscribeToChat(
                    activeChat.idProduct,
                    activeChat.idProfileProduct,
                    activeChat.idProfile,
                    handleMessageReceived,
                    handleSubscriptionError
                );

                setActiveSubscription(subscriptionKey);

                // Cargar mensajes iniciales del chat
                const initialMessage: Message = {
                    id: 'welcome',
                    content: `Bienvenido a ${activeChat.name}`,
                    sender: 'ai',
                    timestamp: new Date(),
                    read: true
                };

                setMessages([initialMessage]);
            } catch (error) {
                console.error('Error al suscribirse al chat:', error);
                setError('Error al conectar con el chat');
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
    const updateLastMessage = (chatId: string, message: string, timestamp: Date) => {
        setChats(prevChats =>
            prevChats.map(chat =>
                chat.id === chatId
                    ? { ...chat, lastMessage: message, timestamp, unreadCount: chat.id !== activeChat?.id ? chat.unreadCount + 1 : 0 }
                    : chat
            )
        );
    };

    // Función para enviar mensaje
    const sendMessage = async () => {
        if (inputMessage.trim() === '' || !activeChat || !isConnected) return;

        try {
            // Enviar el mensaje a través del ChatService
            chatService.sendMessage(
                activeChat.idProduct,
                activeChat.idProfileProduct,
                activeChat.idProfile,
                inputMessage
            );

            // Añadir el mensaje a la UI inmediatamente (optimistic update)
            const newMessage: Message = {
                id: Date.now().toString(),
                content: inputMessage,
                sender: 'user',
                timestamp: new Date(),
                read: true
            };

            setMessages(prev => [...prev, newMessage]);

            // Actualizar el último mensaje en la lista de chats
            updateLastMessage(activeChat.id, inputMessage, new Date());

            // Limpiar el input
            setInputMessage('');

            // Simular indicador de escritura (opcional)
            setIsTyping(true);
            setTimeout(() => {
                setIsTyping(false);
            }, 1000);

        } catch (error) {
            console.error('Error al enviar mensaje:', error);
            setError('Error al enviar el mensaje');
        }
    };

    // Manejar cambio de chat
    const handleChatSelect = (chat: Chat) => {
        setActiveChat(chat);

        // Marcar como leído
        const updatedChats = chats.map(c => {
            if (c.id === chat.id) {
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

    // Función para recargar chats
    const handleRefreshChats = async () => {
        await loadChats();
    };

    // Función para reintentar conexión
    const handleRetryConnection = async () => {
        await connectToWebSocket();
    };

    // Determinar si debemos mostrar el TabBar
    // Solo se muestra en móvil cuando estamos en la vista de lista de chats (no en un chat específico)
    const shouldShowNavigation = isMobile && !showChatPanel;

    // Enfoque en el input cuando se cambia de chat
    useEffect(() => {
        if (activeChat && !isMobile) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 300);
        }
    }, [activeChat, isMobile]);

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
            {/* Mostrar error si existe */}
            {error && (
                <div className="error-banner">
                    <span>{error}</span>
                    <button onClick={() => setError(null)}>×</button>
                </div>
            )}

            <div className={`chat-sidebar ${showChatPanel ? 'hidden-mobile' : ''}`}>
                <div className="sidebar-header">
                    <div className="user-profile">
                        {/* Agregar botón de menú hamburguesa para dispositivos móviles */}
                        {!isMobile && (
                            <IonButtons slot="start" className="hamburger-menu-button">
                                <IonMenuButton>
                                    <IonIcon icon={menuOutline} style={{ color: darkMode ? 'white' : 'black', fontSize: '24px' }} />
                                </IonMenuButton>
                            </IonButtons>
                        )}
                        <div className="user-avatar">U</div>
                        <h3>{currentUserName}</h3>
                        {/* Indicador de estado de conexión */}
                        <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
                            {isConnecting ? 'Conectando...' : isConnected ? 'En línea' : 'Desconectado'}
                        </div>
                    </div>
                    <div className="header-actions">
                        <button className="action-icon-button" onClick={handleRefreshChats}>
                            <IonIcon icon={chatbubbleEllipsesOutline} />
                        </button>
                        <button className="action-icon-button" onClick={toggleTheme}>
                            <IonIcon icon={darkMode ? sunnyOutline : moonOutline} />
                        </button>
                        {!isConnected && (
                            <button className="action-icon-button retry-button" onClick={handleRetryConnection}>
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
                                    {chat.avatar === 'ai' ?
                                        <div className="ai-avatar">AI</div> :
                                        <div className="user-avatar-chat">{chat.avatar}</div>
                                    }
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

                {/* Navegación de pie de página solo para móvil y solo en la vista de lista de chats */}
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
                                    {activeChat.avatar === 'ai' ?
                                        <div className="ai-avatar">AI</div> :
                                        <div className="user-avatar-chat">{activeChat.avatar}</div>
                                    }
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
                                            // Asegurar que el input está visible cuando se hace clic en él
                                            if (isMobile) {
                                                setTimeout(() => {
                                                    inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                }, 100);
                                            }
                                        }}
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