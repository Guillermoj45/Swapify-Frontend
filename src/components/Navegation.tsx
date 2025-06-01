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
    shieldCheckmark, notificationsCircleOutline,

} from 'ionicons/icons';
import './Navegation.css';

const Navegacion: React.FC<{isDesktop: boolean, isChatView?: boolean}> = ({ isDesktop, isChatView = false }) => {
    // Estado para el modo oscuro/claro - ahora con funcionalidad de toggle
    const [darkMode, setDarkMode] = useState(() => {
        const saved = localStorage.getItem('darkMode');
        return saved !== null ? JSON.parse(saved) : true;
    });

    const history = useHistory();
    const location = useLocation();

    // Siempre mostramos el menú hamburguesa para todas las pantallas en vistas de chat
    // En otras vistas, seguimos la lógica original basada en el tamaño de pantalla
    const showHamburgerMenu = isDesktop || isChatView;
    const showTabBar = !isDesktop && !isChatView;

    // Efecto para aplicar la clase al body para tema claro/oscuro global
    useEffect(() => {
        document.body.classList.toggle('light-mode', !darkMode);
        document.body.classList.toggle('dark-mode', darkMode);
        localStorage.setItem('darkMode', JSON.stringify(darkMode));
        return () => {
            document.body.classList.remove('light-mode', 'dark-mode');
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
        <div className={`navegacion-container ${darkMode ? 'dark-mode' : 'light-mode'}`}>
            {/* Menú hamburguesa (siempre en vistas de chat, o cuando es escritorio en otras vistas) */}
            {showHamburgerMenu && (
                <IonMenu contentId="main-content" side="start">
                    <IonHeader>
                        <IonToolbar>
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
                                <IonItem
                                    className={`menu-item inicio ${isActive('/products') ? 'active' : ''}`}
                                    button
                                    onClick={() => (window.location.href = '/products')}
                                    detail={false}
                                >
                                    <IonIcon slot="start" icon={homeOutline} />
                                    <IonLabel>Inicio</IonLabel>
                                </IonItem>
                            </IonMenuToggle>
                            <IonMenuToggle autoHide={false}>
                                <IonItem
                                    className={`menu-item perfil ${isActive('/profile') ? 'active' : ''}`}
                                    button
                                    onClick={() => (window.location.href = '/profile')}
                                    detail={false}
                                >
                                    <IonIcon slot="start" icon={personCircle} />
                                    <IonLabel>Perfil</IonLabel>
                                </IonItem>
                            </IonMenuToggle>
                            <IonMenuToggle autoHide={false}>
                                <IonItem
                                    className={`menu-item ia ${isActive('/IA') ? 'active' : ''}`}
                                    button
                                    onClick={() => (window.location.href = '/IA')}
                                    detail={false}
                                >
                                    <IonIcon slot="start" icon={addOutline} />
                                    <IonLabel>IA</IonLabel>
                                </IonItem>
                            </IonMenuToggle>
                            <IonMenuToggle autoHide={false}>
                                <IonItem
                                    className={`menu-item chat ${isActive('/chat') ? 'active' : ''}`}
                                    button
                                    onClick={() => (window.location.href = '/chat')}
                                    detail={false}
                                >
                                    <IonIcon slot="start" icon={mailOutline} />
                                    <IonLabel>Chats</IonLabel>
                                </IonItem>
                            </IonMenuToggle>
                            <IonMenuToggle autoHide={false}>
                                <IonItem
                                    className={`menu-item chat ${isActive('/notification') ? 'active' : ''}`}
                                    button
                                    onClick={() => (window.location.href = '/notification')}
                                    detail={false}
                                >
                                    <IonIcon slot="start" icon={notificationsCircleOutline} />
                                    <IonLabel>Notificaciones</IonLabel>
                                </IonItem>
                            </IonMenuToggle>
                            <IonMenuToggle autoHide={false}>
                                <IonItem
                                    className={`menu-item premium ${isActive('/premiumSuscribe') ? 'active' : ''}`}
                                    button
                                    onClick={() => (window.location.href = '/premiumSuscribe')}
                                    detail={false}
                                >
                                    <IonIcon slot="start" icon={shieldCheckmark} />
                                    <IonLabel>Premium</IonLabel>
                                </IonItem>
                            </IonMenuToggle>
                            <IonMenuToggle autoHide={false}>
                                <IonItem
                                    className={`menu-item ajustes ${isActive('/settings') ? 'active' : ''}`}
                                    button
                                    onClick={() => ( window.location.href ='/settings')}
                                    detail={false}
                                >
                                    <IonIcon slot="start" icon={settings} />
                                    <IonLabel>Ajustes</IonLabel>
                                </IonItem>
                            </IonMenuToggle>
                            <div className="menu-divider"></div>
                            <IonMenuToggle autoHide={false}>
                                <IonItem
                                    className="menu-item cerrar_sesion logout"
                                    button
                                    onClick={() => navigateTo('/login')}
                                    detail={false}
                                >
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
                    <IonTabBar slot="bottom" className="custom-tab-bar">
                        <IonTabButton
                            tab="products"
                            onClick={() => navigateTo('/products')}
                            className={`custom-tab-button ${isActive('/products') ? 'selected' : ''}`}
                        >
                            <IonIcon icon={homeOutline} />
                            <IonLabel>Inicio</IonLabel>
                        </IonTabButton>
                        <IonTabButton
                            tab="profile"
                            onClick={() => navigateTo('/profile')}
                            className={`custom-tab-button ${isActive('/profile') ? 'selected' : ''}`}
                        >
                            <IonIcon icon={personCircle} />
                            <IonLabel>Perfil</IonLabel>
                        </IonTabButton>
                        <IonTabButton
                            tab="ia"
                            onClick={() => navigateTo('/IA')}
                            className={`custom-tab-button ${isActive('/IA') ? 'selected' : ''}`}
                        >
                            <IonIcon icon={addOutline} />
                            <IonLabel>IA</IonLabel>
                        </IonTabButton>
                        <IonTabButton
                            tab="chat"
                            onClick={() => navigateTo('/chat')}
                            className={`custom-tab-button ${isActive('/chat') ? 'selected' : ''}`}
                        >
                            <IonIcon icon={mailOutline} />
                            <IonLabel>Chats</IonLabel>
                        </IonTabButton>
                        <IonTabButton
                            tab="notification"
                            onClick={() => navigateTo('/notification')}
                            className={`custom-tab-button ${isActive('/chat') ? 'selected' : ''}`}
                        >
                            <IonIcon icon={notificationsCircleOutline} />
                            <IonLabel>notifs</IonLabel>
                        </IonTabButton>
                        <IonTabButton
                            tab="premium"
                            onClick={() => navigateTo('/premiumSuscribe')}
                            className={`custom-tab-button ${isActive('/premiumSuscribe') ? 'selected' : ''}`}
                        >
                            <IonIcon icon={shieldCheckmark} />
                            <IonLabel>Premium</IonLabel>
                        </IonTabButton>
                    </IonTabBar>
                </IonFooter>
            )}
        </div>
    );
};

export default Navegacion;