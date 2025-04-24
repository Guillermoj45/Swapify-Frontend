import React from 'react';
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
    heartOutline,
    addOutline,
    mailOutline,
    settingsOutline, medicalOutline
} from 'ionicons/icons';

const Navegacion: React.FC<{isDesktop: boolean, isChatView?: boolean}> = ({ isDesktop, isChatView = false }) => {
    // Siempre mostramos el menú hamburguesa para todas las pantallas en vistas de chat
    // En otras vistas, seguimos la lógica original basada en el tamaño de pantalla
    const showHamburgerMenu = isDesktop || isChatView;
    const showTabBar = !isDesktop && !isChatView;

    return (
        <>
            {/* Menú hamburguesa (siempre en vistas de chat, o cuando es escritorio en otras vistas) */}
            {showHamburgerMenu && (
                <IonMenu contentId="main-content">
                    <IonHeader>
                        <IonToolbar color="primary">
                            <IonLabel style={{margin: '20px'}}>Swapify Menu</IonLabel>
                        </IonToolbar>
                    </IonHeader>
                    <IonContent>
                        <IonList>
                            <IonMenuToggle>
                                <IonItem button routerLink="/home">
                                    <IonIcon slot="start" icon={homeOutline} />
                                    <IonLabel>Inicio</IonLabel>
                                </IonItem>
                            </IonMenuToggle>
                            <IonMenuToggle>
                                <IonItem button routerLink="/products">
                                    <IonIcon slot="start" icon={heartOutline} />
                                    <IonLabel>Productos</IonLabel>
                                </IonItem>
                            </IonMenuToggle>
                            <IonMenuToggle>
                                <IonItem button routerLink="/profile">
                                    <IonIcon slot="start" icon={addOutline} />
                                    <IonLabel>Perfil</IonLabel>
                                </IonItem>
                            </IonMenuToggle>
                            <IonMenuToggle>
                                <IonItem button routerLink="/IA">
                                    <IonIcon slot="start" icon={mailOutline} />
                                    <IonLabel>IA</IonLabel>
                                </IonItem>
                            </IonMenuToggle>
                            <IonMenuToggle>
                                <IonItem button routerLink="/login">
                                    <IonIcon slot="start" icon={settingsOutline} />
                                    <IonLabel>Login</IonLabel>
                                </IonItem>
                            </IonMenuToggle>
                            <IonMenuToggle>
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
                        </IonTabButton>
                        <IonTabButton tab="premium" href="/premiumSuscribe">
                            <IonIcon icon={medicalOutline} />
                        </IonTabButton>
                    </IonTabBar>
                </IonFooter>
            )}
        </>
    );
};

export default Navegacion;