import React, { useState, useRef, useEffect } from 'react';
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
    IonPopover,
    IonList,
    IonItem,
    IonText,
    IonButtons,
    IonMenuButton,
    TextareaCustomEvent,
    IonBadge,
    useIonToast, IonInput,
} from '@ionic/react';
import { TextareaChangeEventDetail } from '@ionic/core';
import {
    camera,
    mic,
    refresh,
    arrowUp,
    closeCircle,
    ellipsisVertical,
    copy,
    trash,
    checkmark,
    menuOutline,
    chatboxEllipses,
    add,
    chevronBack,
    createOutline, star, time, pricetag, checkmarkCircle,
} from 'ionicons/icons';
import './IA.css';
import Navegacion from '../../components/Navegation';
import { IAChat } from '../../Services/IAService'; // Importamos el servicio

// Definir interfaces para una escritura TypeScript adecuada
interface Message {
    id: number | string;
    text: string;
    sender: 'user' | 'ai';  // Explicitly limited to these two values
    timestamp: Date;
    image?: string;
    images?: string[];
    isCopied?: boolean;
}

interface ChatSession {
    id: string;
    title: string;
    lastMessage: string;
    timestamp: Date;
    messages: Message[];
    unread?: number;
}

// Custom type for a non-existent Ionic component
interface SideContentProps {
    side: "start" | "end";
    contentId: string;
    className?: string;
    collapsed?: boolean;
    children?: React.ReactNode;
}

interface ProductSidePanelProps {
    showProductSidebar: boolean;
    setShowProductSidebar: (show: boolean) => void;
    productInfo: {
        name: string;
        image: string;
        price: string;
        description: string;
        rating?: string;
        delivery?: string;
        discount?: string;
        stock?: string;
    };
    handleProductAction: (action: 'upload' | 'cancel') => void;
}

// Create a custom component to replace IonSideContent
const SideContent: React.FC<SideContentProps> = ({ children, className, collapsed }) => {
    return (
        <div className={`custom-side-content ${className || ''} ${collapsed ? 'collapsed' : ''}`}>
            {children}
        </div>
    );
};

const AIChatPage: React.FC = () => {
    const initialAIMessage: Message = {
        id: 1,
        text: "Hola, soy tu asistente IA. ¿En qué puedo ayudarte hoy?",
        sender: "ai",
        timestamp: new Date()
    };

    const [messages, setMessages] = useState<Message[]>([initialAIMessage]);
    const [inputText, setInputText] = useState<string>('');
    const [isTyping, setIsTyping] = useState<boolean>(false);
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [previewImages, setPreviewImages] = useState<string[]>([]);
    const [showOptions, setShowOptions] = useState<{ open: boolean, id: number | string | null }>({ open: false, id: null });
    const [suggestedPrompts] = useState<string[]>([
        "¿Puedes analizar esta imagen?",
        "Cuéntame sobre la IA generativa",
        "Necesito ayuda con mi código",
        "¿Cómo puedo mejorar mi proyecto?"
    ]);
    const [isDesktop, setIsDesktop] = useState<boolean>(window.innerWidth >= 768);
    const [darkMode, setDarkMode] = useState<boolean>(true); // Por defecto en modo oscuro
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);
    const [productId, setProductId] = useState<string | null>(null);
    const [presentToast] = useIonToast();

    // Estado para el panel lateral de chats
    const [showChatSidebar, setShowChatSidebar] = useState<boolean>(true);
    const [chatSessions, setChatSessions] = useState<ChatSession[]>([
        {
            id: 'default',
            title: 'Nueva conversación',
            lastMessage: 'Hola, soy tu asistente IA. ¿En qué puedo ayudarte hoy?',
            timestamp: new Date(),
            messages: [initialAIMessage],
        }
    ]);
    const [activeChatId, setActiveChatId] = useState<string>();
    const [showNewChatAlert, setShowNewChatAlert] = useState<boolean>(false);
    const [newChatTitle, setNewChatTitle] = useState<string>('');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const contentRef = useRef<HTMLIonContentElement>(null);
    const textareaRef = useRef<HTMLIonTextareaElement>(null);
    const sidebarRef = useRef<HTMLDivElement>(null);

    const [showProductSidebar, setShowProductSidebar] = useState<boolean>(false);
    const [productInfo, setProductInfo] = useState({
        name: "Auriculares Premium XM4",
        image: "/assets/images/product-headphones.jpg", // Ruta a tu imagen
        price: "€149,99",
        description: "Auriculares inalámbricos con cancelación de ruido activa, hasta 30 horas de batería y sonido de alta resolución. Perfectos para trabajo y ocio.",
    });

    // Detectar cambios en el tamaño de la pantalla
    useEffect(() => {
        const handleResize = () => {
            setIsDesktop(window.innerWidth >= 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Aplicar clase de tema al elemento raíz y configurar colores de fondo
    useEffect(() => {
        document.body.classList.toggle('light-mode', !darkMode);
        document.body.classList.toggle('dark-mode', darkMode);

        // Configurar colores de fondo según el modo
        const backgroundColor = darkMode ? "#111827" : "#f5f7fa";
        document.body.style.backgroundColor = backgroundColor;
        document.documentElement.style.backgroundColor = backgroundColor;

        // Encontrar y estilizar contenedores padres
        const parentElements = document.querySelectorAll('ion-router-outlet, ion-content');
        parentElements.forEach(el => {
            if (el instanceof HTMLElement) {
                el.style.backgroundColor = backgroundColor;
            }
        });
    }, [darkMode]);

    // Actualizar mensajes cuando cambia la conversación activa
    useEffect(() => {
        const activeChat = chatSessions.find(chat => chat.id === activeChatId);
        if (activeChat) {
            setMessages([...activeChat.messages]);
            setCurrentChatId(activeChat.id);
        }
    }, [activeChatId, chatSessions]);

    // Scroll to bottom when messages change and ensure proper layout
    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.scrollToBottom(500);
        }
    }, [messages]);

    // Focus on textarea when component mounts
    useEffect(() => {
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.setFocus();
            }
        }, 500);
    }, []);

    const handleProductAction = (action: 'upload' | 'cancel') => {
        if (action === 'upload') {
            presentToast({
                message: 'Producto subido correctamente',
                duration: 2000,
                color: 'success'
            });
        } else {
            presentToast({
                message: 'Operación cancelada',
                duration: 2000,
                color: 'medium'
            });
        }
        // Cierra el panel lateral después de la acción
        setShowProductSidebar(false);
    };

    const handleSend = async (): Promise<void> => {
        if (inputText.trim() === '' && selectedImages.length === 0) return;

        try {
            // Crear mensaje de usuario para la UI
            const userMessage: Message = {
                id: Date.now(),
                text: inputText || (selectedImages.length > 0 ? 'Análisis de imagen' : ''),
                sender: "user",
                timestamp: new Date(),
                images: previewImages.length > 0 ? previewImages : undefined
            };

            // Actualizar mensajes de la sesión actual
            const updatedMessages = [...messages, userMessage];
            setMessages(updatedMessages);

            // Actualizar la conversación en las sesiones de chat
            updateChatSession(activeChatId, updatedMessages, inputText || 'Análisis de imagen');

            setIsTyping(true);

            // Preparar para la llamada a la API
            const files = selectedImages;
            const message = inputText || "Analiza esta imagen";  // Mensaje por defecto si solo hay imágenes

            // Reiniciar estado de UI
            setInputText('');
            setSelectedImages([]);
            setPreviewImages([]);

            // Llamar a la API con la función de servicio
            const response = await IAChat(
                files,
                message,
                currentChatId || undefined,
                productId || undefined
            );

            // Procesar respuesta de la API
            if (response) {
                // Guardar ID de chat para continuar la conversación
                setCurrentChatId(response.id);

                // Si hay un producto en la respuesta, guardar su ID
                if (response.product) {
                    setProductId(response.product.id);
                }

                // Obtener el último mensaje de la IA
                const lastAIMessage = response.messagesIA[response.messagesIA.length - 1];

                if (!lastAIMessage) {
                    throw new Error('No se encontró respuesta de la IA en los mensajes');
                }

                // Obtener imágenes del último mensaje si están disponibles
                const messageImages = lastAIMessage?.images || [];

                // Mostrar respuesta de la IA
                const aiResponse: Message = {
                    id: lastAIMessage.id || response.id,
                    text: lastAIMessage.message || 'No se recibió respuesta de texto',
                    sender: "ai",
                    timestamp: new Date(lastAIMessage.createdAt || response.createdAt || Date.now()),
                    images: messageImages.length > 0 ? messageImages : undefined
                };

                if (response && response.product) {
                    // Extraer info del producto si existe
                    setProductInfo({
                        name: response.product.name || 'Producto detectado',
                        image: response.product.points || 'src/pages/IA/img.png',
                        price: response.product.points || productInfo.price,
                        description: response.product.description || 'IA ha detectado un posible producto basado en tu imagen.'
                    });
                    // Mostrar el panel lateral
                    setShowProductSidebar(true);
                }

                const finalMessages = [...updatedMessages, aiResponse];
                setMessages(finalMessages);

                // Actualizar la conversación en las sesiones de chat
                updateChatSession(
                    activeChatId,
                    finalMessages,
                    aiResponse.text.substring(0, 50) + (aiResponse.text.length > 50 ? '...' : '')
                );

                // Actualizar título si es una conversación nueva
                if (chatSessions.find(chat => chat.id === activeChatId)?.title === 'Nueva conversación') {
                    const suggestedTitle = generateChatTitle(inputText);
                    updateChatTitle(activeChatId, suggestedTitle);
                }
            }
        } catch (error) {
            console.error("Error sending message:", error);

            // Añadir mensaje de error a la conversación
            const errorMessage: Message = {
                id: Date.now(),
                text: "Lo siento, ocurrió un error al procesar tu mensaje. Por favor, intenta nuevamente.",
                sender: "ai",
                timestamp: new Date()
            };

            const finalMessages = [...messages, errorMessage];
            setMessages(finalMessages);

            // Actualizar la conversación en las sesiones de chat
            updateChatSession(activeChatId, finalMessages, "Error al procesar el mensaje");

            presentToast({
                message: 'Error al enviar el mensaje. Intenta con un archivo más pequeño o diferente formato.',
                duration: 3000,
                color: 'danger'
            });
        } finally {
            setIsTyping(false);
        }
    };

    // Función para actualizar una sesión de chat
    const updateChatSession = (chatId: string, updatedMessages: Message[], lastMessageText: string) => {
        setChatSessions(prevSessions => prevSessions.map(session =>
            session.id === chatId
                ? {
                    ...session,
                    messages: updatedMessages,
                    lastMessage: lastMessageText,
                    timestamp: new Date()
                }
                : session
        ));
    };

    // Función para actualizar el título de un chat
    const updateChatTitle = (chatId: string, newTitle: string) => {
        setChatSessions(prevSessions => prevSessions.map(session =>
            session.id === chatId
                ? { ...session, title: newTitle }
                : session
        ));
    };

    // Genera un título sugerido para la conversación basado en el primer mensaje
    const generateChatTitle = (message: string): string => {
        if (!message || message.trim() === '') return 'Nueva conversación';

        // Limitar a 30 caracteres y añadir puntos suspensivos si es necesario
        const maxLength = 30;
        const title = message.trim().split('\n')[0]; // Tomar solo la primera línea

        return title.length > maxLength
            ? title.substring(0, maxLength) + '...'
            : title;
    };

    const handleKeyPress = (e: React.KeyboardEvent): void => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleImageSelect = (): void => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const files = e.target.files;
        if (files && files.length > 0) {
            // Verificar el tamaño de los archivos (máximo 5MB por archivo)
            const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
            const fileArray: File[] = [];
            let hasOverSizedFiles = false;

            // Convertir FileList a array para un manejo más fácil
            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                // Verificar tamaño
                if (file.size > MAX_FILE_SIZE) {
                    hasOverSizedFiles = true;
                    presentToast({
                        message: `El archivo ${file.name} excede el tamaño máximo de 5MB`,
                        duration: 3000,
                        color: 'warning'
                    });
                    continue;
                }

                // Verificar tipo de archivo
                if (!file.type.startsWith('image/')) {
                    presentToast({
                        message: `El archivo ${file.name} no es una imagen válida`,
                        duration: 3000,
                        color: 'warning'
                    });
                    continue;
                }

                fileArray.push(file);
            }

            if (fileArray.length > 0) {
                setSelectedImages(prev => [...prev, ...fileArray]);

                // Crear vistas previas para todas las imágenes seleccionadas
                fileArray.forEach(file => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const result = reader.result;
                        if (typeof result === 'string') {
                            setPreviewImages(prev => [...prev, result]);
                        }
                    };
                    reader.readAsDataURL(file);
                });
            }

            // Limpiar el input para permitir seleccionar el mismo archivo nuevamente
            if (e.target) {
                e.target.value = '';
            }
        }
    };

    const handleClearImages = (): void => {
        setSelectedImages([]);
        setPreviewImages([]);
    };

    const handleSuggestedPrompt = (prompt: string): void => {
        setInputText(prompt);
        if (textareaRef.current) {
            textareaRef.current.setFocus();
        }
    };

    const handleCopyMessage = (id: number | string): void => {
        const message = messages.find(m => m.id === id);
        if (message) {
            navigator.clipboard.writeText(message.text);

            // Update message to show "Copied" status temporarily
            setMessages(messages.map(m =>
                m.id === id ? { ...m, isCopied: true } : m
            ));

            // Reset copied status after 2 seconds
            setTimeout(() => {
                setMessages(messages.map(m =>
                    m.id === id ? { ...m, isCopied: false } : m
                ));
            }, 2000);
        }
        setShowOptions({ open: false, id: null });
    };

    const handleDeleteMessage = (id: number | string): void => {
        const updatedMessages = messages.filter(m => m.id !== id);
        setMessages(updatedMessages);

        // Actualizar la sesión de chat
        updateChatSession(
            activeChatId,
            updatedMessages,
            updatedMessages.length > 0
                ? updatedMessages[updatedMessages.length - 1].text.substring(0, 50)
                : 'Conversación vacía'
        );

        setShowOptions({ open: false, id: null });
    };

    const formatTime = (date: Date): string => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (date: Date): string => {
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);

        if (date.toDateString() === now.toDateString()) {
            return 'Hoy';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Ayer';
        } else {
            return date.toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short',
            });
        }
    };

    const handleClearChat = () => {
        const newMessage: Message = {
            id: Date.now(),
            text: "Chat reiniciado. ¿En qué puedo ayudarte?",
            sender: "ai",
            timestamp: new Date()
        };

        // Limpieza del chat activo
        setMessages([newMessage]);

        // Actualizar la sesión de chat
        updateChatSession(activeChatId, [newMessage], "Chat reiniciado. ¿En qué puedo ayudarte?");

        // Reset conversation state
        setProductId(null);
    };

    const handleToggleSidebar = () => {
        setShowChatSidebar(prev => !prev);
    };

    const handleCreateNewChat = () => {
        // Crear un nuevo ID único para la conversación
        const newChatId = `chat-${Date.now()}`;

        // Mensaje inicial
        const initialMessage: Message = {
            id: Date.now(),
            text: "Hola, soy tu asistente IA. ¿En qué puedo ayudarte hoy?",
            sender: "ai",
            timestamp: new Date()
        };

        // Añadir nueva conversación a la lista
        const newChat: ChatSession = {
            id: newChatId,
            title: newChatTitle || 'Nueva conversación',
            lastMessage: "Hola, soy tu asistente IA. ¿En qué puedo ayudarte hoy?",
            timestamp: new Date(),
            messages: [initialMessage],
        };

        setChatSessions(prev => [newChat, ...prev]);

        // Cambiar a la nueva conversación
        setActiveChatId(newChatId);
        setMessages([initialMessage]);
        setCurrentChatId(null); // Resetear ID de chat actual con la API
        setProductId(null); // Resetear ID de producto si existe

        // Cerrar alerta y limpiar input
        setShowNewChatAlert(false);
        setNewChatTitle('');

        // En dispositivos móviles, cerrar el sidebar después de seleccionar
        if (!isDesktop) {
            setShowChatSidebar(false);
        }
    };

    const handleSwitchChat = (chatId: string) => {
        setActiveChatId(chatId);

        // En dispositivos móviles, cerrar el sidebar después de seleccionar
        if (!isDesktop) {
            setShowChatSidebar(false);
        }
    };

    const handleEditChatTitle = (chatId: string, newTitle: string) => {
        if (newTitle.trim() !== '') {
            updateChatTitle(chatId, newTitle);
        }
    };

    const handleDeleteChat = (chatId: string) => {
        // Filtrar las sesiones para eliminar la seleccionada
        setChatSessions(prev => prev.filter(chat => chat.id !== chatId));

        // Si se elimina la sesión activa, cambiar a la primera disponible
        if (chatId === activeChatId && chatSessions.length > 1) {
            const remainingSessions = chatSessions.filter(chat => chat.id !== chatId);
            if (remainingSessions.length > 0) {
                setActiveChatId(remainingSessions[0].id);
                setMessages(remainingSessions[0].messages);
                setCurrentChatId(remainingSessions[0].id);
            } else {
                // Si no quedan sesiones, crear una nueva
                handleCreateNewChat();
            }
        }
    };

    const NewChatAlert = () => (
        <IonPopover
            isOpen={showNewChatAlert}
            onDidDismiss={() => setShowNewChatAlert(false)}
            className="new-chat-alert"
        >
            <div className="alert-content">
                <h3>Nueva conversación</h3>
                <IonItem>
                    <IonLabel position="floating">Título (opcional)</IonLabel>
                    <IonInput
                        value={newChatTitle}
                        onIonChange={e => setNewChatTitle(e.detail.value || '')}
                        placeholder="Ej: Consulta sobre IA"
                    />
                </IonItem>
                <div className="alert-buttons">
                    <IonButton onClick={() => setShowNewChatAlert(false)}>
                        Cancelar
                    </IonButton>
                    <IonButton onClick={handleCreateNewChat} strong={true}>
                        Crear
                    </IonButton>
                </div>
            </div>
        </IonPopover>
    );

    const ProductSidePanel: React.FC<ProductSidePanelProps> = ({ showProductSidebar, setShowProductSidebar, productInfo, handleProductAction }) => (
        <div className={`product-sidebar ${showProductSidebar ? 'visible' : 'collapsed'}`}>
            <div className="sidebar-header">
                <IonTitle>Producto Detectado</IonTitle>
                <IonButton
                    fill="clear"
                    className="close-sidebar-btn"
                    onClick={() => setShowProductSidebar(false)}
                >
                    <IonIcon icon={closeCircle}/>
                </IonButton>
            </div>

            <div className="product-info-container">
                <div className="product-image-container">
                    <img src={productInfo.image || "/api/placeholder/400/220"} alt={productInfo.name} className="product-image" />
                </div>

                <div className="product-name">
                    <h2>{productInfo.name || "Producto Premium"}</h2>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                        <span className="product-badge">Nuevo</span>
                        <span className="product-badge">Premium</span>
                    </div>
                </div>

                <div className="product-price">
                    {productInfo.price || "€149,99"}
                </div>

                {
                    /*
                    * <div className="product-specs">
                    <div className="spec-item">
                        <IonIcon icon={star} color="warning" style={{ fontSize: '20px', marginBottom: '5px' }} />
                        <span className="spec-label">Valoración</span>
                        <span className="spec-value">{productInfo.rating || "4.8/5"}</span>
                    </div>
                    <div className="spec-item">
                        <IonIcon icon={time} color="primary" style={{ fontSize: '20px', marginBottom: '5px' }} />
                        <span className="spec-label">Envío</span>
                        <span className="spec-value">{productInfo.delivery || "24-48h"}</span>
                    </div>
                    <div className="spec-item">
                        <IonIcon icon={pricetag} color="success" style={{ fontSize: '20px', marginBottom: '5px' }} />
                        <span className="spec-label">Descuento</span>
                        <span className="spec-value">{productInfo.discount || "15%"}</span>
                    </div>
                    <div className="spec-item">
                        <IonIcon icon={checkmarkCircle} color="tertiary" style={{ fontSize: '20px', marginBottom: '5px' }} />
                        <span className="spec-label">Stock</span>
                        <span className="spec-value">{productInfo.stock || "Disponible"}</span>
                    </div>
                </div>
                    * */
                }
                <div className="product-description-IA">
                    <p>{productInfo.description || "Este producto premium ofrece características excepcionales diseñadas para satisfacer tus necesidades. Fabricado con materiales de alta calidad y acabados profesionales, garantiza durabilidad y rendimiento superior. Perfecto para uso diario o profesional."}</p>
                </div>
            </div>

            <div className="product-actions">
                <IonButton
                    expand="block"
                    fill="outline"
                    className="product-action-button cancel-button"
                    onClick={() => handleProductAction('cancel')}
                >
                    Cancelar
                </IonButton>

                <IonButton
                    expand="block"
                    className="product-action-button confirm-button"
                    onClick={() => handleProductAction('upload')}
                >
                    Subir Producto
                </IonButton>
            </div>
        </div>
    );

    return (
        <>
            <Navegacion isDesktop={isDesktop} isChatView={true} />

            <IonPage id="main-content" className={`ai-chat-page ${!showChatSidebar && isDesktop ? 'sidebar-hidden' : ''}`}>
                {/* Panel lateral de chats - replaced IonSideContent with our custom component */}
                <SideContent
                    side="start"
                    className={`custom-side-content ${showChatSidebar ? 'visible' : ''} ${!showChatSidebar ? 'collapsed' : ''}`}
                    contentId="main-content"
                    collapsed={!showChatSidebar}
                >
                    <div className="sidebar-header" ref={sidebarRef}>
                        <IonTitle>Conversaciones</IonTitle>
                        <IonButton
                            fill="clear"
                            className="close-sidebar-btn"
                            onClick={() => setShowChatSidebar(false)}
                        >
                            <IonIcon icon={chevronBack}/>
                        </IonButton>
                    </div>

                    <div className="new-chat-button-wrapper">
                        <IonButton
                            expand="block"
                            className="new-chat-button"
                            onClick={() => setShowNewChatAlert(true)}
                        >
                            <IonIcon icon={add} slot="start"/>
                            Nueva conversación
                        </IonButton>
                    </div>

                    <div className="chat-list">
                        {chatSessions.length > 0 ? (
                            chatSessions.map(chat => (
                                <div
                                    key={chat.id}
                                    className={`chat-item ${activeChatId === chat.id ? 'active' : ''}`}
                                    onClick={() => handleSwitchChat(chat.id)}
                                >
                                    <div className="chat-item-avatar">
                                        <div className="ai-avatar">AI</div>
                                    </div>
                                    <div className="chat-item-content">
                                        <div className="chat-item-header">
                                            <div className="chat-item-title">{chat.title}</div>
                                            <div className="chat-item-time">{formatDate(chat.timestamp)}</div>
                                        </div>
                                        <div className="chat-item-message">{chat.lastMessage}</div>
                                    </div>

                                    {/* Botones de acción del chat */}
                                    <div className="chat-item-actions">
                                        <IonButton fill="clear" size="large" onClick={(e) => {
                                            e.stopPropagation();
                                            const newTitle = prompt('Editar título de la conversación:', chat.title);
                                            if (newTitle) handleEditChatTitle(chat.id, newTitle);
                                        }}>
                                            <IonIcon icon={createOutline} size="medium"/>
                                        </IonButton>
                                        <IonButton fill="clear" size="large" onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm('¿Estás seguro de eliminar esta conversación?')) {
                                                handleDeleteChat(chat.id);
                                            }
                                        }}>
                                            <IonIcon icon={trash} size="medium"/>
                                        </IonButton>
                                    </div>

                                    {/* Badge para mensajes no leídos */}
                                    {chat.unread && chat.unread > 0 && (
                                        <IonBadge color="primary" className="unread-badge">
                                            {chat.unread}
                                        </IonBadge>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="no-chats-message">
                                No hay conversaciones disponibles
                            </div>
                        )}
                    </div>
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
                            {/* Botón para mostrar/ocultar el sidebar de chats */}
                            <IonButton onClick={handleToggleSidebar} className="chat-sidebar-toggle">
                                <IonIcon icon={chatboxEllipses} />
                            </IonButton>

                            {/* Botón original del menú */}
                            <IonMenuButton>
                                <IonIcon icon={menuOutline} />
                            </IonMenuButton>
                        </IonButtons>
                        <IonTitle className="ion-text-center">
                            {chatSessions.find(chat => chat.id === activeChatId)?.title || 'Asistente IA'}
                        </IonTitle>
                        <IonButtons slot="end">
                            <IonButton onClick={handleClearChat}>
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
                                className={`message-container ${message.sender === 'user' ? 'user-message' : 'ai-message'}`}
                            >
                                <div className="message-avatar">
                                    {message.sender === 'ai' ? (
                                        <div className="ai-avatar">AI</div>
                                    ) : (
                                        <IonAvatar>
                                            <div className="user-avatar">TÚ</div>
                                        </IonAvatar>
                                    )}
                                </div>
                                <div className="message-bubble">
                                    {message.images && message.images.length > 0 && (
                                        <div className="message-images-container">
                                            {message.images.map((img, index) => (
                                                <img
                                                    key={index}
                                                    src={img}
                                                    alt={`Imagen ${index + 1}`}
                                                    className="message-image"
                                                />
                                            ))}
                                        </div>
                                    )}
                                    <div className="message-text">{message.text}</div>
                                    <div className="message-time">
                                        {formatTime(message.timestamp)}
                                        {message.isCopied && <span className="copied-indicator"><IonIcon icon={checkmark} /> Copiado</span>}
                                    </div>
                                </div>

                                {/* Options button for messages */}
                                <div className="message-options">
                                    <IonButton
                                        fill="clear"
                                        size="small"
                                        className="options-button"
                                        onClick={() => setShowOptions({ open: true, id: message.id })}
                                    >
                                        <IonIcon icon={ellipsisVertical} size="small" />
                                    </IonButton>

                                    <IonPopover
                                        isOpen={showOptions.open && showOptions.id === message.id}
                                        onDidDismiss={() => setShowOptions({ open: false, id: null })}
                                        className="options-popover"
                                    >
                                        <IonList>
                                            <IonItem button onClick={() => handleCopyMessage(message.id)}>
                                                <IonIcon slot="start" icon={copy} />
                                                <IonLabel>Copiar mensaje</IonLabel>
                                            </IonItem>
                                            <IonItem button onClick={() => handleDeleteMessage(message.id)}>
                                                <IonIcon slot="start" icon={trash} />
                                                <IonLabel>Eliminar mensaje</IonLabel>
                                            </IonItem>
                                        </IonList>
                                    </IonPopover>
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
                            <IonChip
                                key={index}
                                className="prompt-chip"
                                onClick={() => handleSuggestedPrompt(prompt)}
                            >
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
                                    <img src={previewImage} alt={`Vista previa ${index + 1}`} className="preview-image" />
                                    <IonButton
                                        fill="clear"
                                        className="clear-image-btn single-image"
                                        onClick={() => {
                                            setPreviewImages(previewImages.filter((_, i) => i !== index));
                                            setSelectedImages(selectedImages.filter((_, i) => i !== index));
                                        }}
                                    >
                                        <IonIcon icon={closeCircle} />
                                    </IonButton>
                                </div>
                            ))}
                        </div>
                        {previewImages.length > 1 && (
                            <IonButton
                                fill="clear"
                                className="clear-all-images-btn"
                                onClick={handleClearImages}
                            >
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
                            onIonChange={(e: TextareaCustomEvent<TextareaChangeEventDetail>) =>
                                setInputText(e.detail.value ?? '')
                            }
                            placeholder="Escribe un mensaje..."
                            autoGrow={true}
                            rows={1}
                            maxlength={1000}
                            className="chat-input"
                            onKeyDown={handleKeyPress}
                        />

                        <div className="input-buttons">
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                onChange={handleFileChange}
                            />

                            <IonButton fill="clear" onClick={handleImageSelect} className="action-button">
                                <IonIcon icon={camera} />
                            </IonButton>

                            <IonButton fill="clear" className="action-button">
                                <IonIcon icon={mic} />
                            </IonButton>

                            <IonButton
                                className="send-button"
                                disabled={inputText.trim() === '' && selectedImages.length === 0}
                                onClick={handleSend}
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
                <NewChatAlert />
            </IonPage>
        </>
    );
};

export default AIChatPage;