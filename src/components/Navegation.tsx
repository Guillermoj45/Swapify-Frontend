import React, { useState, useEffect } from 'react';
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
    IonBadge,
} from '@ionic/react';
import {
    homeOutline,
    heartOutline,
    addOutline,
    mailOutline,
    settingsOutline,
    medicalOutline,
    sunnyOutline,
    moonOutline
} from 'ionicons/icons';
import './Navegation.css';

const Navegacion: React.FC<{isDesktop: boolean, isChatView?: boolean}> = ({ isDesktop, isChatView = false }) => {
    // Estado para el modo oscuro/claro
    const [darkMode, setDarkMode] = useState(true);

    // Siempre mostramos el menú hamburguesa para todas las pantallas en vistas de chat
    // En otras vistas, seguimos la lógica original basada en el tamaño de pantalla
    const showHamburgerMenu = isDesktop || isChatView;
    const showTabBar = !isDesktop && !isChatView;

    // Cambiar modo claro/oscuro
    const toggleTheme = () => {
        setDarkMode(!darkMode);
    };

    // Efecto para aplicar la clase al body para tema claro/oscuro global
    useEffect(() => {
        document.body.classList.toggle('light-mode', !darkMode);
        return () => {
            document.body.classList.remove('light-mode');
        };
    }, [darkMode]);

    return (
        <div className={`navegacion-container ${darkMode ? '' : 'light-mode'}`}>
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
                                <button className="theme-toggle" onClick={toggleTheme}>
                                    <IonIcon icon={darkMode ? sunnyOutline : moonOutline} />
                                </button>
                            </div>
                        </IonToolbar>
                    </IonHeader>
                    <IonContent>
                        <IonList>
                            <IonMenuToggle autoHide={false}>
                                <IonItem button routerLink="/home">
                                    <IonIcon slot="start" icon={homeOutline} />
                                    <IonLabel>Inicio</IonLabel>
                                </IonItem>
                            </IonMenuToggle>
                            <IonMenuToggle autoHide={false}>
                                <IonItem button routerLink="/products">
                                    <IonIcon slot="start" icon={heartOutline} />
                                    <IonLabel>Productos</IonLabel>
                                </IonItem>
                            </IonMenuToggle>
                            <IonMenuToggle autoHide={false}>
                                <IonItem button routerLink="/profile">
                                    <IonIcon slot="start" icon={addOutline} />
                                    <IonLabel>Perfil</IonLabel>
                                </IonItem>
                            </IonMenuToggle>
                            <IonMenuToggle autoHide={false}>
                                <IonItem button routerLink="/IA">
                                    <IonIcon slot="start" icon={mailOutline} />
                                    <IonLabel>IA</IonLabel>
                                    <IonBadge color="primary" slot="end">2</IonBadge>
                                </IonItem>
                            </IonMenuToggle>
                            <IonMenuToggle autoHide={false}>
                                <IonItem button routerLink="/login">
                                    <IonIcon slot="start" icon={settingsOutline} />
                                    <IonLabel>Login</IonLabel>
                                </IonItem>
                            </IonMenuToggle>
                            <IonMenuToggle autoHide={false}>
                                <IonItem button routerLink="/premiumSuscribe">
                                    <IonIcon slot="start" icon={medicalOutline} />
                                    <IonLabel>Suscripción</IonLabel>
                                </IonItem>
                            </IonMenuToggle>
                        </IonList>
                    </IonContent>
                </IonMenu>
            )}

            {/* TabBar (solo en pantallas pequeñas y cuando NO es vista de chat) */}
            {showTabBar && (
                <IonFooter>
                    <IonTabBar slot="bottom">
                        <IonTabButton tab="home" href="/home">
                            <IonIcon icon={homeOutline} />
                        </IonTabButton>
                        <IonTabButton tab="products" href="/products">
                            <IonIcon icon={heartOutline} />
                        </IonTabButton>
                        <IonTabButton tab="profile" href="/profile">
                            <IonIcon icon={addOutline} />
                        </IonTabButton>
                        <IonTabButton tab="ia" href="/IA">
                            <IonIcon icon={mailOutline} />
                            <IonBadge color="primary">2</IonBadge>
                        </IonTabButton>
                        <IonTabButton tab="premium" href="/premiumSuscribe">
                            <IonIcon icon={medicalOutline} />
                        </IonTabButton>
                    </IonTabBar>
                </IonFooter>
            )}
        </div>
    );
};

export default Navegacion;