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
    TextareaCustomEvent
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
    sunny, // Icono para modo claro
    moon // Icono para modo oscuro
} from 'ionicons/icons';
import './IA.css';
import Navegacion from '../../components/Navegation';

// Definir interfaces para una escritura TypeScript adecuada
interface Message {
    id: number;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
    image?: string;
    isCopied?: boolean;
}

const AIChatPage: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([
        { id: 1, text: "Hola, soy tu asistente IA. ¿En qué puedo ayudarte hoy?", sender: "ai", timestamp: new Date() }
    ]);
    const [inputText, setInputText] = useState<string>('');
    const [isTyping, setIsTyping] = useState<boolean>(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [showOptions, setShowOptions] = useState<{ open: boolean, id: number | null }>({ open: false, id: null });
    const [suggestedPrompts] = useState<string[]>([
        "¿Puedes analizar esta imagen?",
        "Cuéntame sobre la IA generativa",
        "Necesito ayuda con mi código",
        "¿Cómo puedo mejorar mi proyecto?"
    ]);
    const [isDesktop, setIsDesktop] = useState<boolean>(window.innerWidth >= 768);
    const [darkMode, setDarkMode] = useState<boolean>(true); // Por defecto en modo oscuro

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

    const handleSend = (): void => {
        if (inputText.trim() === '' && !selectedImage) return;

        // Add user message
        const userMessage: Message = {
            id: Date.now(),
            text: inputText,
            sender: "user",
            timestamp: new Date(),
            ...(previewImage && { image: previewImage })
        };

        setMessages(prevMessages => [...prevMessages, userMessage]);
        setInputText('');
        setSelectedImage(null);
        setPreviewImage(null);

        // Simulate AI typing
        setIsTyping(true);

        // Simulate AI response after a delay
        setTimeout(() => {
            const aiResponse: Message = {
                id: Date.now() + 1,
                text: userMessage.image
                    ? "He analizado tu imagen. Parece ser una fotografía interesante. ¿Quieres que te dé más detalles sobre lo que veo en ella?"
                    : generateAIResponse(inputText),
                sender: "ai",
                timestamp: new Date()
            };

            setMessages(prevMessages => [...prevMessages, aiResponse]);
            setIsTyping(false);
        }, Math.random() * 1000 + 1000); // Random delay between 1-2 seconds for more realistic feel
    };

    // Cambiar entre modo oscuro y claro
    const toggleDarkMode = (): void => {
        setDarkMode(prevMode => !prevMode);
    };

    // Generate more natural AI responses based on input
    const generateAIResponse = (input: string): string => {
        const lowercaseInput = input.toLowerCase();

        if (lowercaseInput.includes('hola') || lowercaseInput.includes('saludos') || lowercaseInput.includes('buenos días')) {
            return "¡Hola! Es un placer saludarte. ¿En qué puedo ayudarte hoy?";
        } else if (lowercaseInput.includes('código') || lowercaseInput.includes('programación') || lowercaseInput.includes('desarrollar')) {
            return "Entiendo que necesitas ayuda con código o desarrollo. Puedo ayudarte con sugerencias, revisión de código o explicación de conceptos. ¿Qué lenguaje o framework estás utilizando?";
        } else if (lowercaseInput.includes('gracias') || lowercaseInput.includes('agradezco')) {
            return "¡No hay de qué! Estoy aquí para ayudarte. Si tienes más preguntas en el futuro, no dudes en consultarme.";
        } else if (lowercaseInput.includes('imagen') || lowercaseInput.includes('foto')) {
            return "Para analizar una imagen, puedes usar el botón de cámara en la parte inferior de la pantalla para cargar una foto. Una vez cargada, podré analizarla y proporcionarte información sobre ella.";
        } else {
            return `He procesado tu mensaje sobre "${input}". ¿Puedo ofrecerte más información o ayudarte de alguna otra manera con este tema?`;
        }
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
        if (files && files[0]) {
            const file = files[0];
            setSelectedImage(file);

            // Create preview URL
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result;
                if (typeof result === 'string') {
                    setPreviewImage(result);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleClearImage = (): void => {
        setSelectedImage(null);
        setPreviewImage(null);
    };

    const handleSuggestedPrompt = (prompt: string): void => {
        setInputText(prompt);
        if (textareaRef.current) {
            textareaRef.current.setFocus();
        }
    };

    const handleCopyMessage = (id: number): void => {
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

    const handleDeleteMessage = (id: number): void => {
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
                                    {message.image && (
                                        <div className="message-image-container">
                                            <img src={message.image} alt="Imagen compartida" className="message-image" />
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

                {suggestedPrompts.length > 0 && !selectedImage && (
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

                {previewImage && (
                    <div className="preview-container">
                        <div className="preview-image-wrapper">
                            <img src={previewImage} alt="Vista previa" className="preview-image" />
                            <IonButton
                                fill="clear"
                                className="clear-image-btn"
                                onClick={handleClearImage}
                            >
                                <IonIcon icon={closeCircle} />
                            </IonButton>
                        </div>
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
                                disabled={inputText.trim() === '' && !selectedImage}
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