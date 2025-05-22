import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
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

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.class.css'; */
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

setupIonicReact();

const App: React.FC = () => {
    // Detectar si es vista de escritorio
    const [isDesktop, setIsDesktop] = useState(false);

    // Detectar si es vista de chat
    const [isChatView, setIsChatView] = useState(false);

    WebSocketService.connect().then((conectado) => {
        if (conectado) {
            console.log('Conexión exitosa al WebSocket');
            WebSocketService.subscribeToNotification().then(() => console.log("Hola")).catch((error => {console.error("Error al suscribirse a las notificaciones", error)}));
        }

          const connectWebSocket = async () => {
            try {
                await WebSocketService.waitForConnection();

                // Configurar el callback para recibir mensajes
                WebSocketService.setnotificationCallback((messageData) => {
                        try {
                            // Intentar parsear el mensaje si es un string
                            const parsedData = typeof messageData === 'string'
                                ? JSON.parse(messageData)
                                : messageData;

                            console.log('Mensaje recibido:', parsedData);
                        } catch (error) {
                            console.error('Error al parsear el mensaje:', error);
                        }
                    }
                );
            } catch (error) {
                console.error('Error al conectar al WebSocket:', error);
            }
        }
        connectWebSocket()
    }).catch((error) => {
        console.error('Error al conectar al WebSocket:', error);
    });

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
                </IonRouterOutlet>
            </IonReactRouter>
        </IonApp>
    );
};

export default App;