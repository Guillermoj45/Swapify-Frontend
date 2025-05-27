
import { Redirect, Route } from 'react-router-dom';
import {IonApp, IonRouterOutlet, IonToast, setupIonicReact} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { useState, useEffect } from 'react';
import Navegacion from './components/Navegation';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';
import RegisterPage from "./pages/Register/RegisterPage";
import LoginPage from "./pages/Login/LoginPage";
import ProductsPage from "./pages/Products/ProductsPage";
import ProfilePage from "./pages/Profile/ProfilePage";
import PasswordRecover from "./pages/PasswordRecovery/PasswordRecover";
import IA from "./pages/IA/IAPage";
import ChatPage from "./pages/Chats/ChatPage";
import SuscripcionPage from "./pages/Suscripcion/SuscripcionPage";
import PagoPremium from "./pages/PagoPremium/PagoPremium";
import ProductDetailPage from "./pages/ProductDetail/ProductDetailPage";
import SettingsPage from "./pages/Settings/SettingsPage";
import {WebSocketService} from "./Services/websocket";
import Notification from "./pages/Notification/Notification";
import { MensajeRecibeDTO } from './Services/websocket';
import { addNotification } from './Services/DatosParaExoportar';

setupIonicReact();

const App: React.FC = () => {
    // Detectar si es vista de escritorio
    const [isDesktop, setIsDesktop] = useState(false);

    // Detectar si es vista de chat
    const [isChatView, setIsChatView] = useState(false);

    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');


    // NUEVO useEffect para manejar la conexión WebSocket
    useEffect(() => {
        WebSocketService.connect()
            .then((conectado) => {
                if (conectado) {
                    console.log('Conexión exitosa al WebSocket');
                    return WebSocketService.subscribeToNotification().then(() => {
                        WebSocketService.setNotificationCallback((newNotification) => {
                            console.log("Nueva notificación (App):", newNotification);

                            const transformedNotification: MensajeRecibeDTO = {
                                timestamp: newNotification.timestamp || new Date().toISOString(),
                                token: sessionStorage.getItem('token') || '',
                                type: newNotification.type || 'notification',
                                userName: newNotification.userName || 'Sistema',
                                senderName: newNotification.senderName || 'Sistema',
                                content: newNotification.content || 'Nueva notificación'
                            };

                            console.log("Agregando notificación:", transformedNotification);
                            // Usar la función global para agregar la notificación
                            addNotification(transformedNotification);

                            setToastMessage(`${transformedNotification.senderName}: ${transformedNotification.content}`);
                            setShowToast(true);
                        });
                    });
                }
            })
            .catch((error) => {
                console.error('Error al conectar al WebSocket:', error);
            });
    }, []); // Se ejecuta una sola vez al montar el componente

    useEffect(() => {
        const mediaQuery = window.matchMedia('(min-width: 768px)');
        const handleResize = (e: MediaQueryListEvent | MediaQueryList) => {
            setIsDesktop(e.matches);
        };

        // Inicializar el estado
        handleResize(mediaQuery);

        // Escuchar cambios en el tamaño de la ventana
        mediaQuery.addEventListener('change', handleResize);

        // Limpiar event listener
        return () => {
            mediaQuery.removeEventListener('change', handleResize);
        };
    }, []);

    // Actualizar estado de vista de chat basado en la URL actual
    useEffect(() => {
        const checkIfChatView = () => {
            const path = window.location.pathname;
            setIsChatView(path.includes('/Chat') || path.includes('/IA'));
        };

        checkIfChatView();

        // Escuchar cambios en la ruta
        window.addEventListener('popstate', checkIfChatView);

        return () => {
            window.removeEventListener('popstate', checkIfChatView);
        };
    }, []);

    return (
        <IonApp>
            <IonReactRouter>
                {/* Navegación global que se mantiene en toda la aplicación */}
                <Navegacion isDesktop={isDesktop} isChatView={isChatView} />

                <IonRouterOutlet id="main-content">
                    <Route exact path="/">
                        <Redirect to="/register" />
                    </Route>
                    <Route exact path="/register">
                        <RegisterPage />
                    </Route>
                    <Route exact path="/login">
                        <LoginPage />
                    </Route>
                    <Route exact path="/products">
                        <ProductsPage />
                    </Route>
                    <Route exact path="/profile">
                        <ProfilePage />
                    </Route>
                    <Route exact path="/passwordRecover">
                        <PasswordRecover/>
                    </Route>
                    <Route exact path="/IA">
                        <IA/>
                    </Route>
                    <Route exact path="/premiumSuscribe">
                        <SuscripcionPage />
                    </Route>
                    <Route exact path="/paymentGateway">
                        <PagoPremium/>
                    </Route>
                    <Route exact path="/chat">
                        <ChatPage/>
                    </Route>
                    <Route exact path="/product/:id/:profileId">
                        <ProductDetailPage/>
                    </Route>
                    <Route exact path="/settings">
                        <SettingsPage />
                    </Route>
                    <Route exact path="/notification">
                        <Notification/>
                    </Route>
                </IonRouterOutlet>
            </IonReactRouter>

            <IonToast
                isOpen={showToast}
                onDidDismiss={() => setShowToast(false)}
                message={toastMessage}
                duration={3000}
                position="bottom"
                buttons={[
                    {
                        text: 'Ver',
                        handler: () => {
                            window.location.href = '/notification';
                        }
                    }
                ]}
            />
        </IonApp>
    );
};

export default App;

