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
    useIonToast
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
    sunny,
    moon
} from 'ionicons/icons';
import './IA.css';
import Navegacion from '../../components/Navegation';
import { IAChat } from '../../Services/IAService'; // Importamos el servicio

// Interfaz para manejar la respuesta de la API
interface ConversIA {
    id: string;
    message: string;
    response: string;
    images?: string[];
    timestamp: Date;
}

// Definir interfaces para una escritura TypeScript adecuada
interface Message {
    id: number | string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
    image?: string;
    images?: string[];
    isCopied?: boolean;
}

const AIChatPage: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([
        { id: 1, text: "Hola, soy tu asistente IA. ¿En qué puedo ayudarte hoy?", sender: "ai", timestamp: new Date() }
    ]);
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

    const fileInputRef = useRef<HTMLInputElement>(null);
    const contentRef = useRef<HTMLIonContentElement>(null);
    const textareaRef = useRef<HTMLIonTextareaElement>(null);

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

    const handleSend = async (): Promise<void> => {
        if (inputText.trim() === '' && selectedImages.length === 0) return;

        try {
            // Add user message to UI
            const userMessage: Message = {
                id: Date.now(),
                text: inputText,
                sender: "user",
                timestamp: new Date(),
                images: previewImages.length > 0 ? previewImages : undefined
            };

            setMessages(prevMessages => [...prevMessages, userMessage]);
            setIsTyping(true);

            // Prepare for API call
            const files = selectedImages;
            const message = inputText;

            // Debug before sending
            console.log('Enviando mensaje a la IA:');
            console.log('- Texto:', message);
            console.log('- Número de imágenes:', files.length);
            console.log('- ID de chat actual:', currentChatId || 'nuevo chat');

            // Reset UI state
            setInputText('');
            setSelectedImages([]);
            setPreviewImages([]);

            // Call API with service function
            const response = await IAChat(
                files,
                message,
                currentChatId || undefined,
                productId || undefined
            );

            // Debug response
            console.log('Respuesta recibida de la IA:');
            console.log(response);

            // Process response from API
            if (response) {
                // Save chat ID for continued conversation
                setCurrentChatId(response.id);

                // Show AI response
                const aiResponse: Message = {
                    id: response.id,
                    text: response.response || 'No se recibió respuesta de texto',
                    sender: "ai",
                    timestamp: new Date(response.timestamp),
                    images: response.images
                };

                // Verificar si el mensaje original se mantiene
                console.log('Mensaje original enviado:', message);
                console.log('Mensaje devuelto por API:', response.message);

                setMessages(prevMessages => [...prevMessages, aiResponse]);
            }
        } catch (error) {
            console.error("Error sending message:", error);
            presentToast({
                message: 'Error al enviar el mensaje. Inténtalo de nuevo.',
                duration: 3000,
                color: 'danger'
            });
        } finally {
            setIsTyping(false);
        }
    };

    // Cambiar entre modo oscuro y claro
    const toggleDarkMode = (): void => {
        setDarkMode(prevMode => !prevMode);
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
            // Convert FileList to array for easier handling
            const fileArray = Array.from(files);
            setSelectedImages(prev => [...prev, ...fileArray]);

            // Create preview URLs for all selected images
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
        setMessages(messages.filter(m => m.id !== id));
        setShowOptions({ open: false, id: null });
    };

    const formatTime = (date: Date): string => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const handleClearChat = () => {
        setMessages([
            { id: Date.now(), text: "Chat reiniciado. ¿En qué puedo ayudarte?", sender: "ai", timestamp: new Date() }
        ]);
        // Reset conversation state
        setCurrentChatId(null);
        setProductId(null);
    };

    return (
        <>
            <Navegacion isDesktop={isDesktop} isChatView={true} />

            <IonPage id="main-content" className={`ai-chat-page ${!darkMode ? 'light-mode' : ''}`}>
                <IonHeader className="ai-chat-header">
                    <IonToolbar>
                        <IonButtons slot="start">
                            <IonMenuButton>
                                <IonIcon icon={menuOutline} />
                            </IonMenuButton>
                        </IonButtons>
                        <IonTitle className="ion-text-center">Asistente IA</IonTitle>
                        <IonButtons slot="end">
                            <IonButton onClick={toggleDarkMode}>
                                <IonIcon icon={darkMode ? sunny : moon} />
                            </IonButton>
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

            </IonPage>
        </>
    );
};

export default AIChatPage;