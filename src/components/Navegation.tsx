import React, { useState, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import {
    IonMenu,
    IonHeader,
    IonToolbar,
    IonLabel,
    IonContent,
    IonList,
    IonMenuToggle,
    IonItem,
    IonIcon,
    IonFooter,
    IonTabBar,
    IonTabButton,
} from '@ionic/react';
import {
    homeOutline,
    addOutline,
    mailOutline,
    personCircle,
    logOut,
    settings,
    shieldCheckmark,
} from 'ionicons/icons';
import './Navegation.css';

const Navegacion: React.FC<{isDesktop: boolean, isChatView?: boolean}> = ({ isDesktop, isChatView = false }) => {
    // Estado para el modo oscuro/claro
    const [darkMode] = useState(true);
    const history = useHistory();
    const location = useLocation();

    // Siempre mostramos el menú hamburguesa para todas las pantallas en vistas de chat
    // En otras vistas, seguimos la lógica original basada en el tamaño de pantalla
    const showHamburgerMenu = isDesktop || isChatView;
    const showTabBar = !isDesktop && !isChatView;

    // Efecto para aplicar la clase al body para tema claro/oscuro global
    useEffect(() => {
        document.body.classList.toggle('light-mode', !darkMode);
        return () => {
            document.body.classList.remove('light-mode');
        };
    }, [darkMode]);

    // Función para manejar la navegación con un enfoque más directo
    const navigateTo = (path: string) => {
        if (path === '/chat') {
            history.replace(path);
            setTimeout(() => {
                history.go(0);
            }, 10);
        } else {
            history.push(path);
        }
    };

    // Verificar si una ruta está activa (ahora con comparación insensible a mayúsculas/minúsculas)
    const isActive = (path: string) => {
        return location.pathname.toLowerCase() === path.toLowerCase();
    };

    return (
        <>
            {/* Menú hamburguesa (siempre en vistas de chat, o cuando es escritorio en otras vistas) */}
            {showHamburgerMenu && (
                <IonMenu contentId="main-content" side="start">
                    <IonHeader>
                        <IonToolbar color="primary">
                            <div className="menu-header">
                                <div className="menu-title">
                                    <span className="menu-logo">Swapify</span>
                                    <IonLabel>Menu</IonLabel>
                                </div>
                            </div>
                        </IonToolbar>
                    </IonHeader>
                    <IonContent>
                        <IonList className="menu-list">
                            <IonMenuToggle autoHide={false}>
                                <IonItem className="inicio" button onClick={() => (window.location.href = '/products')} detail={false}>
                                    <IonIcon slot="start" icon={homeOutline} />
                                    <IonLabel>Inicio</IonLabel>
                                </IonItem>
                            </IonMenuToggle>
                            <IonMenuToggle autoHide={false}>
                                <IonItem className="perfil" button onClick={() => (window.location.href = '/profile')} detail={false}>
                                    <IonIcon slot="start" icon={personCircle} />
                                    <IonLabel>Perfil</IonLabel>
                                </IonItem>
                            </IonMenuToggle>
                            <IonMenuToggle autoHide={false}>
                                <IonItem className="ia" button onClick={() => (window.location.href = '/IA')} detail={false}>
                                    <IonIcon slot="start" icon={addOutline} />
                                    <IonLabel>IA</IonLabel>
                                </IonItem>
                            </IonMenuToggle>
                            <IonMenuToggle autoHide={false}>
                                <IonItem className="chat" button onClick={() => (window.location.href = '/chat')} detail={false}>
                                    <IonIcon slot="start" icon={mailOutline} />
                                    <IonLabel>Chats</IonLabel>
                                </IonItem>
                            </IonMenuToggle>
                            <IonMenuToggle autoHide={false}>
                                <IonItem className="premium" button onClick={() => (window.location.href = '/premiumSuscribe')} detail={false}>
                                    <IonIcon slot="start" icon={personCircle} />
                                    <IonLabel>Premium</IonLabel>
                                </IonItem>
                            </IonMenuToggle>
                            <IonMenuToggle autoHide={false}>
                                <IonItem className="ajustes" button onClick={() => ( window.location.href ='/settings')} detail={false}>
                                    <IonIcon slot="start" icon={settings} />
                                    <IonLabel>Ajustes</IonLabel>
                                </IonItem>
                            </IonMenuToggle>
                            <IonMenuToggle autoHide={false}>
                                <IonItem className="cerrar_sesion" button onClick={() => navigateTo('/login')} detail={false}>
                                    <IonIcon slot="start" icon={logOut} />
                                    <IonLabel>Cerrar sesión</IonLabel>
                                </IonItem>
                            </IonMenuToggle>
                        </IonList>
                    </IonContent>
                </IonMenu>
            )}

            {/* TabBar for mobile devices */}
            {showTabBar && (
                <IonFooter className="ion-no-border navigation-footer">
                    <IonTabBar slot="bottom">
                        <IonTabButton tab="products" onClick={() => navigateTo('/products')} selected={isActive('/products')}>
                            <IonIcon icon={homeOutline} />
                            <IonLabel>Inicio</IonLabel>
                        </IonTabButton>
                        <IonTabButton tab="profile" onClick={() => navigateTo('/profile')} selected={isActive('/profile')}>
                            <IonIcon icon={personCircle} />
                            <IonLabel>Perfil</IonLabel>
                        </IonTabButton>
                        <IonTabButton tab="ia" onClick={() => navigateTo('/IA')} selected={isActive('/IA')}>
                            <IonIcon icon={addOutline} />
                            <IonLabel>IA</IonLabel>
                        </IonTabButton>
                        <IonTabButton tab="chat" onClick={() => navigateTo('/chat')} selected={isActive('/chat')}>
                            <IonIcon icon={mailOutline} />
                            <IonLabel>Chats</IonLabel>
                        </IonTabButton>
                        <IonTabButton tab="premium" onClick={() => navigateTo('/premiumSuscribe')} selected={isActive('/premiumSuscribe')}>
                            <IonIcon icon={shieldCheckmark} />
                            <IonLabel>Suscripción</IonLabel>
                        </IonTabButton>
                    </IonTabBar>
                </IonFooter>
            )}
        </>
    );
};

export default Navegacion;