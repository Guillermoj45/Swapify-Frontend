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
import {MensajeRecibeDTO, WebSocketService} from "../../Services/websocket";
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

    // Instancia del servicio WebSocket
    const [webSocketService] = useState(WebSocketService)
    const [isConnected, setIsConnected] = useState(false);
    const currentUserId = sessionStorage.getItem('userId') || 'user';
    const currentUserName = sessionStorage.getItem('nickname') || 'Usuario';

    // Estado para los chats
    const [chats, setChats] = useState<Chat[]>([
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
        },
        {
            id: 'soporte',
            idProduct: 'f3a92b1c-8d47-4c61-9e4d-123456789abc',
            idProfileProduct: 'a1b2c3d4-5e6f-7g8h-9i0j-klmnopqrstuv',
            idProfile: 'b2c3d4e5-6f7g-8h9i-0j1k-lmnopqrstuvw',
            name: 'Soporte Técnico',
            avatar: 'S',
            lastMessage: '¿Cómo podemos ayudarte?',
            timestamp: new Date(Date.now() - 3 * 3600000),
            unreadCount: 0,
            isOnline: true
        },
        {
            id: 'desarrollo',
            idProduct: 'e4f5g6h7-8i9j-0k1l-2m3n-opqrstuvwxyz',
            idProfileProduct: 'c4d5e6f7-8g9h-0i1j-2k3l-mnopqrstuvwx',
            idProfile: 'd5e6f7g8-9h0i-1j2k-3l4m-nopqrstuvwxy',
            name: 'Grupo Desarrollo',
            avatar: 'D',
            lastMessage: 'Discusión sobre el próximo sprint',
            timestamp: new Date(Date.now() - 1 * 86400000),
            unreadCount: 0,
            isOnline: false
        }
    ]);

    // Estado para los mensajes del chat activo
    const [messages, setMessages] = useState<Message[]>([]);

    // Estado para el chat activo actual
    const [activeChat, setActiveChat] = useState<Chat | null>(null);

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

    // Ref para el contenedor de mensajes
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Ref para el input de mensaje
    const inputRef = useRef<HTMLInputElement>(null);

    // Ref para el contenedor principal
    const chatMainRef = useRef<HTMLDivElement>(null);

    // Efecto para conectar el WebSocket al montar el componente
    useEffect(() => {
        const connectWebSocket = async () => {
            try {
                await webSocketService.waitForConnection();
                setIsConnected(true);

                // Configurar el callback para recibir mensajes
                webSocketService.setMessageCallback((messageData) => {
                    try {
                        // Intentar parsear el mensaje si es un string
                        const parsedData = typeof messageData === 'string'
                            ? JSON.parse(messageData)
                            : messageData;

                        console.log("Mensaje recibido:", parsedData);

                        // Crear un nuevo mensaje para el chat
                        const newMessage: Message = {
                            id: Date.now().toString(),
                            content: parsedData.content || parsedData.hola || "Mensaje recibido",
                            sender: parsedData.userId === currentUserId ? 'user' : 'other',
                            senderName: parsedData.senderName || 'Otro usuario',
                            timestamp: new Date(),
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
                });
            } catch (error) {
                console.error("Error al conectar con WebSocket:", error);
            }
        };

        connectWebSocket();

        return () => {
            webSocketService.disconnect();
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
            webSocketService.unsubscribeFromRoom();

            // Suscribirse a la nueva sala
            webSocketService.subscribeToChat(activeChat.idProduct, activeChat.idProfileProduct, activeChat.idProfile);

            // Cargar mensajes del chat (esto podría ser una llamada API en una implementación real)
            // Por ahora, lo simulamos con mensajes de bienvenida
            const initialMessage: Message = {
                id: 'welcome',
                content: `Bienvenido a ${activeChat.name}`,
                sender: 'ai',
                timestamp: new Date(),
                read: true
            };

            setMessages([initialMessage]);
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
    const sendMessage = () => {
        if (inputMessage.trim() === '' || !activeChat || !isConnected) return;

        const messageToSend : MensajeRecibeDTO = {
            content: inputMessage,
            senderName: currentUserName,
            userName: currentUserName,
            token: sessionStorage.getItem('token') || '',
            timestamp: new Date().toISOString(),
            type: 'chat'
        };

        console.log("Mensaje a enviar:", messageToSend);

        // Enviar el mensaje a través de WebSocket
        webSocketService.sendMessage(activeChat.idProduct, activeChat.idProfileProduct, activeChat.idProfile, messageToSend);

        // Añadir el mensaje a la UI inmediatamente (optimistic update)
        const newMessage: Message = {
            id: Date.now().toString(),
            content: inputMessage,
            sender: 'user',
            timestamp: new Date(),
            read: true
        };

        setMessages(prev => [...prev, newMessage]);
        setInputMessage('');

        // Actualizar el último mensaje en la lista de chats
        updateLastMessage(activeChat.id, inputMessage, new Date());

        // Simular indicador de escritura (opcional)
        setIsTyping(true);
        setTimeout(() => {
            setIsTyping(false);
        }, 1000);
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

    return (
        <div className={`chat-view ${darkMode ? '' : 'light-mode'}`}>
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
                    </div>
                    <div className="header-actions">
                        <button className="action-icon-button">
                            <IonIcon icon={chatbubbleEllipsesOutline} />
                        </button>
                        <button className="action-icon-button" onClick={toggleTheme}>
                            <IonIcon icon={darkMode ? sunnyOutline : moonOutline} />
                        </button>
                    </div>
                </div>

                <div className="search-container">
                    <div className="chat-search">
                        <IonIcon icon={searchOutline} />
                        <input type="text" placeholder="Buscar chats" />
                    </div>
                </div>

                <div className="chats-list">
                    {chats.map(chat => (
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
                    ))}
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
                                        {activeChat.isOnline ? 'En línea' : 'Último acceso hace 3h'}
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
                                        placeholder="Escribe un mensaje..."
                                        value={inputMessage}
                                        onChange={(e) => setInputMessage(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                        ref={inputRef}
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
                                    <button className="send-button" onClick={sendMessage}>
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
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatPage;
