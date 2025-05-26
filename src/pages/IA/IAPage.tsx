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
    IonItem,
    IonText,
    IonButtons,
    IonMenuButton,
    TextareaCustomEvent,
    IonBadge,
    useIonToast,
    IonInput,
    IonRefresher,
    IonRefresherContent,
    RefresherEventDetail,
} from '@ionic/react';
import { TextareaChangeEventDetail } from '@ionic/core';
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
    createOutline, readerOutline,
} from 'ionicons/icons';
import './IA.css';
import Navegacion from '../../components/Navegation';
import { IAChat } from '../../Services/IAService';
import { ConversationService, ConversationDTO } from '../../Services/IAService';
import useAuthRedirect from "../../Services/useAuthRedirect";
import { Settings as SettingsService } from '../../Services/SettingsService';
import {ProductService} from "../../Services/ProductService";

interface Message {
    id: number | string;
    text: string;
    sender: 'user' | 'ai';
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
    loadedFromBackend?: boolean; // Flag para saber si se cargó del backend
}

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
        price: number;
        description: string;
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
    useAuthRedirect()

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
    const [darkMode, setDarkMode] = useState<boolean>(true);
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);
    const [productId, setProductId] = useState<string | null>(null);
    const [presentToast] = useIonToast();

    // Estado para el panel lateral de chats
    const [showChatSidebar, setShowChatSidebar] = useState<boolean>(true);
    const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
    const [activeChatId, setActiveChatId] = useState<string>('default');
    const [showNewChatAlert, setShowNewChatAlert] = useState<boolean>(false);
    const [newChatTitle, setNewChatTitle] = useState<string>('');
    const [isLoadingConversations, setIsLoadingConversations] = useState<boolean>(false);
    const [conversationsPage, setConversationsPage] = useState<number>(0);
    const [hasMoreConversations, setHasMoreConversations] = useState<boolean>(true);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const contentRef = useRef<HTMLIonContentElement>(null);
    const textareaRef = useRef<HTMLIonTextareaElement>(null);
    const sidebarRef = useRef<HTMLDivElement>(null);

    const [loadingError, setLoadingError] = useState<string | null>(null);

    const [showProductSidebar, setShowProductSidebar] = useState<boolean>(false);
    const [productInfo, setProductInfo] = useState({
        name: "Auriculares Premium XM4",
        image: "",
        price: 0,
        description: "Auriculares inalámbricos con cancelación de ruido activa, hasta 30 horas de batería y sonido de alta resolución. Perfectos para trabajo y ocio.",
    });

    const [productSummaryMode, setProductSummaryMode] = useState<boolean>(false);

    // Cargar conversaciones del backend al iniciar
    useEffect(() => {
        loadConversationsFromBackend();
    }, []);

    const loadConversationMessages = async (conversationId: string) => {
        try {
            const conversationDetail = await ConversationService.getConversationDetail(conversationId);
            const formattedMessages = ConversationService.convertMessagesToFrontendFormat(conversationDetail.messages);

            // Si no hay mensajes, agregar el mensaje inicial de la IA
            const messagesWithInitial = formattedMessages.length > 0
                ? formattedMessages
                : [initialAIMessage];

            setMessages(messagesWithInitial);
            setCurrentChatId(conversationId);

            // Actualizar la sesión de chat con los mensajes cargados
            setChatSessions(prev => prev.map(session =>
                session.id === conversationId
                    ? { ...session, messages: messagesWithInitial, loadedFromBackend: true }
                    : session
            ));
        } catch (error) {
            console.error('Error al cargar mensajes de la conversación:', error);
            // Si hay error, usar el mensaje inicial
            setMessages([initialAIMessage]);
            setCurrentChatId(null);
        }
    };

    // Función para cargar conversaciones del backend
    const loadConversationsFromBackend = async (page: number = 0, append: boolean = false) => {
        try {
            setIsLoadingConversations(true);
            setLoadingError(null);

            const conversations = await ConversationService.getConversations(page);

            if (conversations.length === 0) {
                setHasMoreConversations(false);
                if (!append) {
                    createDefaultConversation();
                }
                return;
            }

            const formattedConversations = ConversationService.convertToFrontendFormat(conversations);

            if (append) {
                setChatSessions(prev => [...prev, ...formattedConversations]);
            } else {
                setChatSessions(formattedConversations);
                if (formattedConversations.length > 0 && (!activeChatId || activeChatId === 'default')) {
                    const firstChat = formattedConversations[0];
                    setActiveChatId(firstChat.id);
                    await loadConversationMessages(firstChat.id);
                }
            }

            setConversationsPage(page);
            setHasMoreConversations(conversations.length >= 10);
        } catch (error) {
            console.error('Error al cargar conversaciones:', error);
            setLoadingError('Error al cargar conversaciones. Intenta de nuevo.');

            if (!append) {
                createDefaultConversation();
            }
        } finally {
            setIsLoadingConversations(false);
        }
    };

    // Crear conversación por defecto cuando no hay conversaciones
    const createDefaultConversation = () => {
        const defaultChat: ChatSession = {
            id: 'default',
            title: 'Nueva conversación',
            lastMessage: 'Hola, soy tu asistente IA. ¿En qué puedo ayudarte hoy?',
            timestamp: new Date(),
            messages: [initialAIMessage],
            loadedFromBackend: false
        };
        setChatSessions([defaultChat]);
        setActiveChatId('default');
    };

    // Función para cargar más conversaciones (paginación)
    const loadMoreConversations = async () => {
        if (hasMoreConversations && !isLoadingConversations) {
            await loadConversationsFromBackend(conversationsPage + 1, true);
        }
    };

    // Función para refrescar conversaciones
    const handleRefreshConversations = async (event: CustomEvent<RefresherEventDetail>) => {
        try {
            await loadConversationsFromBackend(0, false);
            event.detail.complete();
        } catch (error) {
            console.error('Error al refrescar conversaciones:', error);
            event.detail.complete();
        }
    };

    // Configuración inicial del tema
    useEffect(() => {
        const loadThemeSettings = async () => {
            const modoOscuroStorage = sessionStorage.getItem('modoOscuroClaro');

            if (modoOscuroStorage !== null) {
                const isDarkMode = modoOscuroStorage === 'true';
                setDarkMode(isDarkMode);
                document.body.classList.remove('light-theme', 'dark-theme');
                document.body.classList.add(isDarkMode ? 'dark-theme' : 'light-theme');
            } else {
                if (sessionStorage.getItem("token")) {
                    try {
                        const modoOscuroBackend = await SettingsService.getModoOcuro();
                        const isDarkMode = modoOscuroBackend === true;
                        sessionStorage.setItem('modoOscuroClaro', isDarkMode.toString());
                        setDarkMode(isDarkMode);
                        document.body.classList.remove('light-theme', 'dark-theme');
                        document.body.classList.add(isDarkMode ? 'dark-theme' : 'light-theme');
                    } catch (error) {
                        console.error('Error al obtener modo oscuro del backend:', error);
                        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                        setDarkMode(prefersDark);
                        document.body.classList.remove('light-theme', 'dark-theme');
                        document.body.classList.add(prefersDark ? 'dark-theme' : 'light-theme');
                        sessionStorage.setItem('modoOscuroClaro', prefersDark.toString());
                    }
                } else {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    setDarkMode(prefersDark);
                    document.body.classList.remove('light-theme', 'dark-theme');
                    document.body.classList.add(prefersDark ? 'dark-theme' : 'light-theme');
                    sessionStorage.setItem('modoOscuroClaro', prefersDark.toString());
                }
            }
        };

        loadThemeSettings();
    }, []);

    // Escuchar cambios en el sessionStorage
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'modoOscuroClaro' && e.newValue !== null) {
                const isDarkMode = e.newValue === 'true';
                setDarkMode(isDarkMode);
                document.body.classList.remove('light-theme', 'dark-theme');
                document.body.classList.add(isDarkMode ? 'dark-theme' : 'light-theme');
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // Detectar cambios en el tamaño de la pantalla
    useEffect(() => {
        const handleResize = () => {
            setIsDesktop(window.innerWidth >= 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Aplicar clase de tema
    useEffect(() => {
        document.body.classList.toggle('light-mode', !darkMode);
        document.body.classList.toggle('dark-mode', darkMode);

        const backgroundColor = darkMode ? "#111827" : "#f5f7fa";
        document.body.style.backgroundColor = backgroundColor;
        document.documentElement.style.backgroundColor = backgroundColor;

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
        if (activeChat && !activeChat.loadedFromBackend) {
            // Solo actualizar mensajes para conversaciones locales (no cargadas del backend)
            setMessages([...activeChat.messages]);
            setCurrentChatId(null); // Resetear para conversaciones nuevas
        }
        // Para conversaciones del backend, los mensajes se cargan en handleSwitchChat
    }, [activeChatId, chatSessions]);

    // Scroll to bottom when messages change
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

    const toggleProductSummaryMode = () => {
        setProductSummaryMode(prev => !prev);
        presentToast({
            message: productSummaryMode ?
                'Modo resumen de producto desactivado' :
                'Modo resumen de producto activado. La próxima respuesta incluirá un resumen del producto.',
            duration: 2000,
            color: productSummaryMode ? 'medium' : 'primary'
        });
    };

    const handleProductAction = async (action: 'upload' | 'cancel') => {
        if (action === 'upload') {
            if (!productId) {
                presentToast({
                    message: 'Error: No se encontró información del producto',
                    duration: 3000,
                    color: 'danger'
                });
                return;
            }

            try {
                presentToast({
                    message: 'Subiendo producto...',
                    duration: 1000,
                    color: 'primary'
                });

                const success = await ProductService.activeProduct(productId);

                if (success) {
                    presentToast({
                        message: 'Producto activado correctamente. Ahora es visible para otros usuarios.',
                        duration: 3000,
                        color: 'success'
                    });
                } else {
                    presentToast({
                        message: 'Error al activar el producto. Inténtalo de nuevo.',
                        duration: 3000,
                        color: 'danger'
                    });
                }
            } catch (error) {
                console.error('Error al activar producto:', error);
                presentToast({
                    message: 'Error al subir el producto. Verifica tu conexión e inténtalo de nuevo.',
                    duration: 3000,
                    color: 'danger'
                });
            }
        } else {
            presentToast({
                message: 'Operación cancelada',
                duration: 2000,
                color: 'medium'
            });
        }
        setShowProductSidebar(false);
    };

    const handleSend = async (): Promise<void> => {
        console.log('handleSend called - inputText:', `"${inputText}"`, 'selectedImages:', selectedImages.length); // Debug

        // Obtener valores actuales al momento de la llamada
        const currentText = inputText.trim();
        const currentImages = [...selectedImages];
        const currentPreviews = [...previewImages];

        console.log('Current values - text:', `"${currentText}"`, 'images:', currentImages.length); // Debug

        if (currentText === '' && currentImages.length === 0) {
            console.log('No text and no images, aborting send'); // Debug
            return;
        }

        try {
            // IMPORTANTE: Determinar qué texto mostrar en la UI
            let displayText: string;
            if (currentText !== '') {
                displayText = currentText;
            } else if (currentImages.length > 0) {
                displayText = ""; // Mostrar solo las imágenes si no hay texto
            } else {
                displayText = '';
            }

            const userMessage: Message = {
                id: Date.now(),
                text: displayText,
                sender: "user",
                timestamp: new Date(),
                images: currentPreviews.length > 0 ? currentPreviews : undefined
            };

            const updatedMessages = [...messages, userMessage];
            setMessages(updatedMessages);
            updateChatSession(activeChatId, updatedMessages, displayText || "Imagen enviada");

            setIsTyping(true);

            // CRÍTICO: Determinar qué mensaje enviar a la API
            let messageToAPI: string;
            if (currentText !== '') {
                messageToAPI = currentText;
            } else {
                messageToAPI = "Analiza esta imagen";
            }

            console.log('Message to API:', messageToAPI); // Debug

            // Limpiar inputs INMEDIATAMENTE después de preparar todo
            setInputText('');
            setSelectedImages([]);
            setPreviewImages([]);

            console.log('Inputs cleared, calling IAChat'); // Debug

            const response = await IAChat(
                currentImages,
                messageToAPI,
                currentChatId || undefined,
                productId || undefined
            );

            if (response) {
                console.log('Response received:', response); // Debug

                // Resto del código de manejo de respuesta...
                setCurrentChatId(response.id);
                updateChatSessionAsBackendLoaded(activeChatId, response.id);

                if (response.product) {
                    setProductId(response.product.id);
                }

                const lastAIMessage = response.lastMessage;
                if (!lastAIMessage) {
                    throw new Error('No se encontró respuesta de la IA en los mensajes');
                }

                const messageImages = lastAIMessage?.images || [];
                const aiResponse: Message = {
                    id: lastAIMessage.id || response.id,
                    text: lastAIMessage.message || 'No se recibió respuesta de texto',
                    sender: "ai",
                    timestamp: new Date(lastAIMessage.createdAt || response.createdAt || Date.now()),
                    images: messageImages.length > 0 ? messageImages : undefined
                };

                if (response && response.product) {
                    setProductInfo({
                        name: response.product.name || 'Producto detectado',
                        image: response.product.points?.toString() || "0",
                        price: response.product.points || productInfo.price,
                        description: response.product.description || 'IA ha detectado un posible producto basado en tu imagen.'
                    });

                    if (productSummaryMode) {
                        setShowProductSidebar(true);
                        setProductSummaryMode(false);
                    }
                }

                if (productSummaryMode && response) {
                    setShowProductSidebar(true);
                    setProductSummaryMode(false);
                }

                const finalMessages = [...updatedMessages, aiResponse];
                setMessages(finalMessages);
                updateChatSession(
                    activeChatId,
                    finalMessages,
                    aiResponse.text.substring(0, 50) + (aiResponse.text.length > 50 ? '...' : '')
                );

                // Actualizar título si es una conversación nueva
                const currentChat = chatSessions.find(chat => chat.id === activeChatId);
                if (currentChat && (currentChat.title === 'Nueva conversación' || !currentChat.loadedFromBackend)) {
                    const titleText = currentText !== '' ? currentText : displayText;
                    const suggestedTitle = generateChatTitle(titleText);
                    updateChatTitle(activeChatId, suggestedTitle);
                }
            }
        } catch (error) {
            console.error("Error sending message:", error);

            const errorMessage: Message = {
                id: Date.now(),
                text: "Lo siento, ocurrió un error al procesar tu mensaje. Por favor, intenta nuevamente.",
                sender: "ai",
                timestamp: new Date()
            };

            const finalMessages = [...messages, errorMessage];
            setMessages(finalMessages);
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

    // Función para marcar una sesión de chat como cargada del backend
    const updateChatSessionAsBackendLoaded = (tempChatId: string, backendChatId: string) => {
        setChatSessions(prevSessions => prevSessions.map(session =>
            session.id === tempChatId
                ? {
                    ...session,
                    id: backendChatId,
                    loadedFromBackend: true
                }
                : session
        ));

        // Actualizar también el activeChatId si es necesario
        if (activeChatId === tempChatId) {
            setActiveChatId(backendChatId);
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

    const generateChatTitle = (message: string): string => {
        if (!message || message.trim() === '') return 'Nueva conversación';
        const maxLength = 30;
        const title = message.trim().split('\n')[0];
        return title.length > maxLength
            ? title.substring(0, maxLength) + '...'
            : title;
    };

    const handleKeyPress = (e: React.KeyboardEvent): void => {
        // Solo como backup, el handler principal está en el useEffect
        console.log('React KeyPress - Key:', e.key, 'Shift:', e.shiftKey); // Debug

        if (e.key === 'Enter' && !e.shiftKey) {
            const currentText = inputText.trim();
            const hasImages = selectedImages.length > 0;

            if (currentText === '' && !hasImages) {
                console.log('React KeyPress - Empty message, preventing default'); // Debug
                e.preventDefault();
                return;
            }

            console.log('React KeyPress - Valid message, will send'); // Debug
        }
    };

    useEffect(() => {
        let cleanup: (() => void) | undefined;

        const setupKeyboardHandlers = async () => {
            try {
                if (textareaRef.current) {
                    const textareaElement = await textareaRef.current.getInputElement();

                    if (textareaElement) {
                        const handleKeyDown = (e: KeyboardEvent) => {
                            console.log('Key pressed:', e.key, 'Shift:', e.shiftKey, 'Input text:', inputText.trim()); // Debug

                            if (e.key === 'Enter' && !e.shiftKey) {
                                // Verificar que no hay modales abiertos
                                if (!showNewChatAlert && !showProductSidebar) {
                                    e.preventDefault();
                                    e.stopPropagation();

                                    // Verificar contenido antes de enviar
                                    const currentText = inputText.trim();
                                    const hasImages = selectedImages.length > 0;

                                    console.log('About to send - Text:', currentText, 'Images:', hasImages); // Debug

                                    if (currentText !== '' || hasImages) {
                                        console.log('Calling handleSend from keyboard'); // Debug
                                        handleSend();
                                    } else {
                                        console.log('Empty message, not sending'); // Debug
                                    }
                                }
                            }
                        };

                        textareaElement.addEventListener('keydown', handleKeyDown);

                        cleanup = () => {
                            textareaElement.removeEventListener('keydown', handleKeyDown);
                        };
                    }
                }
            } catch (error) {
                console.error('Error setting up keyboard handlers:', error);
            }
        };

        setupKeyboardHandlers();

        return () => {
            if (cleanup) cleanup();
        };
    }, [inputText, selectedImages, showNewChatAlert, showProductSidebar]);

    const handleImageSelect = (): void => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
            const fileArray: File[] = [];
            let hasOverSizedFiles = false;

            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                if (file.size > MAX_FILE_SIZE) {
                    hasOverSizedFiles = true;
                    presentToast({
                        message: `El archivo ${file.name} excede el tamaño máximo de 5MB`,
                        duration: 3000,
                        color: 'warning'
                    });
                    continue;
                }

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

        setMessages([newMessage]);
        updateChatSession(activeChatId, [newMessage], "Chat reiniciado. ¿En qué puedo ayudarte?");
        setProductId(null);
        setCurrentChatId(null); // Resetear el chat ID para empezar una nueva conversación
    };

    const handleToggleSidebar = () => {
        setShowChatSidebar(prev => !prev);
    };

    const handleCreateNewChat = () => {
        const newChatId = `temp-${Date.now()}`;
        const initialMessage: Message = {
            id: Date.now(),
            text: "Hola, soy tu asistente IA. ¿En qué puedo ayudarte hoy?",
            sender: "ai",
            timestamp: new Date()
        };

        const newChat: ChatSession = {
            id: newChatId,
            title: newChatTitle || 'Nueva conversación',
            lastMessage: "Hola, soy tu asistente IA. ¿En qué puedo ayudarte hoy?",
            timestamp: new Date(),
            messages: [initialMessage],
            loadedFromBackend: false
        };

        setChatSessions(prev => [newChat, ...prev]);
        setActiveChatId(newChatId);
        setMessages([initialMessage]);
        setCurrentChatId(null);
        setProductId(null);

        setShowNewChatAlert(false);
        setNewChatTitle('');

        if (!isDesktop) {
            setShowChatSidebar(false);
        }
    };

    const handleSwitchChat = async (chatId: string) => {
        setActiveChatId(chatId);

        const selectedChat = chatSessions.find(chat => chat.id === chatId);
        if (selectedChat) {
            if (selectedChat.loadedFromBackend && selectedChat.messages.length > 1) {
                // Si ya está cargada del backend y tiene mensajes, usar los mensajes existentes
                setMessages(selectedChat.messages);
                setCurrentChatId(selectedChat.id);
            } else if (selectedChat.loadedFromBackend) {
                // Si está cargada del backend pero no tiene mensajes completos, cargarlos
                await loadConversationMessages(chatId);
            } else {
                // Si es una conversación local (nueva), usar sus mensajes
                setMessages(selectedChat.messages);
                setCurrentChatId(null); // Resetear para crear nueva conversación en el backend
            }
        }

        // En dispositivos móviles, cerrar el sidebar después de seleccionar
        if (!isDesktop) {
            setShowChatSidebar(false);
        }
    };

    const handleEditChatTitle = async (chatId: string, newTitle: string) => {
        if (newTitle.trim() === '') return;

        try {
            const chatToUpdate = chatSessions.find(chat => chat.id === chatId);

            // Si es una conversación del backend, actualizar en el servidor
            if (chatToUpdate?.loadedFromBackend) {
                const success = await ConversationService.updateConversationName(chatId, newTitle);
                if (!success) {
                    presentToast({
                        message: 'Error al actualizar el título en el servidor',
                        duration: 3000,
                        color: 'danger'
                    });
                    return;
                }
            }

            // Actualizar localmente
            updateChatTitle(chatId, newTitle);

            presentToast({
                message: 'Título actualizado correctamente',
                duration: 2000,
                color: 'success'
            });
        } catch (error) {
            console.error('Error al actualizar título:', error);
            presentToast({
                message: 'Error al actualizar el título',
                duration: 3000,
                color: 'danger'
            });
        }
    };

    const handleDeleteChat = async (chatId: string) => {
        try {
            const chatToDelete = chatSessions.find(chat => chat.id === chatId);

            // Si es una conversación del backend, eliminarla del servidor
            if (chatToDelete?.loadedFromBackend) {
                const success = await ConversationService.deleteConversation(chatId);
                if (!success) {
                    presentToast({
                        message: 'Error al eliminar la conversación del servidor',
                        duration: 3000,
                        color: 'danger'
                    });
                    return;
                }
            }

            // Eliminar de la lista local
            setChatSessions(prev => prev.filter(chat => chat.id !== chatId));

            // Si se elimina la sesión activa, cambiar a otra
            if (chatId === activeChatId) {
                const remainingSessions = chatSessions.filter(chat => chat.id !== chatId);
                if (remainingSessions.length > 0) {
                    await handleSwitchChat(remainingSessions[0].id);
                } else {
                    // Si no quedan sesiones, crear una nueva
                    handleCreateNewChat();
                }
            }

            presentToast({
                message: 'Conversación eliminada correctamente',
                duration: 2000,
                color: 'success'
            });
        } catch (error) {
            console.error('Error al eliminar conversación:', error);
            presentToast({
                message: 'Error al eliminar la conversación',
                duration: 3000,
                color: 'danger'
            });
        }
    };

    const ChatListWithLoadingImproved = () => (
        <IonContent className="chat-list-content">
            <IonRefresher slot="fixed" onIonRefresh={handleRefreshConversations}>
                <IonRefresherContent></IonRefresherContent>
            </IonRefresher>

            <div className="chat-list">
                {loadingError && (
                    <div className="error-message">
                        <IonText color="danger">{loadingError}</IonText>
                        <IonButton
                            size="small"
                            fill="clear"
                            onClick={() => loadConversationsFromBackend(0, false)}
                        >
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
                        {chatSessions.map(chat => (
                            <div
                                key={chat.id}
                                className={`chat-item ${activeChatId === chat.id ? 'active' : ''}`}
                                onClick={() => handleSwitchChat(chat.id)}
                            >
                                <div className="chat-item-avatar">
                                    <div className="ai-avatar">AI</div>
                                    {!chat.loadedFromBackend && (
                                        <div className="local-chat-indicator" title="Conversación local"></div>
                                    )}
                                </div>
                                <div className="chat-item-content">
                                    <div className="chat-item-header">
                                        <div className="chat-item-title">{chat.title}</div>
                                        <div className="chat-item-time">{formatDate(chat.timestamp)}</div>
                                    </div>
                                    <div className="chat-item-message">{chat.lastMessage}</div>
                                </div>
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
                                {chat.unread && chat.unread > 0 && (
                                    <IonBadge color="primary" className="unread-badge">
                                        {chat.unread}
                                    </IonBadge>
                                )}
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
                                        <span style={{ marginLeft: '8px' }}>Cargando...</span>
                                    </>
                                ) : (
                                    'Cargar más conversaciones'
                                )}
                            </IonButton>
                        )}
                    </>
                ) : (
                    !loadingError && (
                        <div className="no-chats-message">
                            <p>No hay conversaciones disponibles</p>
                            <IonButton
                                expand="block"
                                onClick={() => setShowNewChatAlert(true)}
                                className="create-first-chat-btn"
                            >
                                Crear primera conversación
                            </IonButton>
                        </div>
                    )
                )}
            </div>
        </IonContent>
    );

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
                            onKeyPress={(e: React.KeyboardEvent) => {
                                // Backup handler
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    console.log('onKeyPress backup triggered'); // Debug
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
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

                            <IonButton
                                fill="clear"
                                onClick={toggleProductSummaryMode}
                                className="action-button"
                                color={productSummaryMode ? "primary" : "medium"}
                            >
                                <IonIcon icon={readerOutline}/>
                                {productSummaryMode && (
                                    <div className="mode-indicator"></div>
                                )}
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