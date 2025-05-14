import React, { useState, useRef, useEffect } from 'react';
import './Chat.css';
import { IonIcon, IonSpinner } from '@ionic/react';
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
    chatbubblesOutline
} from 'ionicons/icons';
import Navegacion from '../../components/Navegation';
import {WebSocketService} from "../../Services/websocket";

interface Message {
    id: string;
    content: string;
    sender: 'user' | 'ai';
    timestamp: Date;
    read: boolean;
    image?: string;
}

interface Chat {
    id: string;
    name: string;
    avatar: string;
    lastMessage: string;
    timestamp: Date;
    unreadCount: number;
    isOnline: boolean;
}



const ChatView: React.FC = () => {
    const web = new WebSocketService()

    web.connect().then(() => {
        const mensaje = {
            type: 'chat',
            content: 'Hola mundo',
            timestamp: new Date().toISOString(),
            roomId: 'sala1'  // Si necesitas especificar una sala
        };
        web.subscribeToRoom('sala1');
        web.unsubscribeFromRoom()
        web.setMessageCallback((message) => {
            console.log('Mensaje recibido:', message);
        });

        web.sendMessage('sala1', JSON.stringify(mensaje));
    })

    // Estado para los chats
    const [chats, setChats] = useState<Chat[]>([
        {
            id: '1',
            name: 'Asistente AI',
            avatar: 'ai',
            lastMessage: 'Hola, ¿en qué puedo ayudarte hoy?',
            timestamp: new Date(Date.now() - 5 * 60000),
            unreadCount: 2,
            isOnline: true
        },
        {
            id: '2',
            name: 'Soporte Técnico',
            avatar: 'S',
            lastMessage: 'Tu ticket ha sido resuelto',
            timestamp: new Date(Date.now() - 3 * 3600000),
            unreadCount: 0,
            isOnline: true
        },
        {
            id: '3',
            name: 'Grupo Desarrollo',
            avatar: 'G',
            lastMessage: 'Juan: Se completó la revisión del sprint',
            timestamp: new Date(Date.now() - 1 * 86400000),
            unreadCount: 5,
            isOnline: false
        },
        {
            id: '4',
            name: 'Equipo Marketing',
            avatar: 'M',
            lastMessage: 'Ana: Envié los materiales para la campaña',
            timestamp: new Date(Date.now() - 2 * 86400000),
            unreadCount: 0,
            isOnline: false
        },
        {
            id: '5',
            name: 'Cliente Premium',
            avatar: 'C',
            lastMessage: 'Gracias por la información',
            timestamp: new Date(Date.now() - 3 * 86400000),
            unreadCount: 0,
            isOnline: false
        }
    ]);

    // Estado para los mensajes del chat activo
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            content: 'Hola, ¿cómo puedo ayudarte hoy?',
            sender: 'ai',
            timestamp: new Date(Date.now() - 15 * 60000),
            read: true
        },
        {
            id: '2',
            content: 'Necesito información sobre el nuevo producto',
            sender: 'user',
            timestamp: new Date(Date.now() - 14 * 60000),
            read: true
        },
        {
            id: '3',
            content: 'Claro, el nuevo producto tiene características mejoradas incluyendo mejor rendimiento y una interfaz renovada. ¿Hay algo específico que quieras saber?',
            sender: 'ai',
            timestamp: new Date(Date.now() - 13 * 60000),
            read: true
        },
        {
            id: '4',
            content: '¿Cuándo estará disponible?',
            sender: 'user',
            timestamp: new Date(Date.now() - 12 * 60000),
            read: true
        },
        {
            id: '5',
            content: 'El lanzamiento está programado para el próximo mes. Los clientes premium tendrán acceso anticipado una semana antes del lanzamiento oficial.',
            sender: 'ai',
            timestamp: new Date(Date.now() - 11 * 60000),
            read: true
        },
    ]);

    // Estado para el chat activo actual
    const [activeChat, setActiveChat] = useState<Chat | null>(chats[0]);

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

    // Función para enviar mensaje
    const sendMessage = () => {
        if (inputMessage.trim() === '') return;

        const newMessage: Message = {
            id: Date.now().toString(),
            content: inputMessage,
            sender: 'user',
            timestamp: new Date(),
            read: true
        };

        setMessages([...messages, newMessage]);
        setInputMessage('');

        // Simular respuesta del asistente
        setIsTyping(true);
        setTimeout(() => {
            const aiResponse: Message = {
                id: (Date.now() + 1).toString(),
                content: 'Gracias por tu mensaje. Estoy procesando tu consulta...',
                sender: 'ai',
                timestamp: new Date(),
                read: false
            };
            setMessages(prev => [...prev, aiResponse]);
            setIsTyping(false);

            // Actualizar el último mensaje en la lista de chats
            if (activeChat) {
                const updatedChats = chats.map(chat => {
                    if (chat.id === activeChat.id) {
                        return {
                            ...chat,
                            lastMessage: aiResponse.content,
                            timestamp: aiResponse.timestamp,
                            unreadCount: 0
                        };
                    }
                    return chat;
                });
                setChats(updatedChats);
            }
        }, 2000);
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

    // Scroll al último mensaje
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

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
                        <div className="user-avatar">U</div>
                        <h3>Usuario</h3>
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
                        <Navegacion isDesktop={false} isChatView={false} />
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
                                        className={`message-container ${message.sender === 'user' ? 'user-message' : 'ai-message'}`}
                                    >
                                        <div className="message-avatar">
                                            {message.sender === 'ai' ? (
                                                <div className="ai-avatar">AI</div>
                                            ) : (
                                                <div className="user-avatar">U</div>
                                            )}
                                        </div>
                                        <div className="message-content">
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

export default ChatView;