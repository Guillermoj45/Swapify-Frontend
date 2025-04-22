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
    settingsOutline
} from 'ionicons/icons';

interface Props {
    isDesktop: boolean;
    isChatView?: boolean;
}

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
                                <IonItem button routerLink="/favorites">
                                    <IonIcon slot="start" icon={heartOutline} />
                                    <IonLabel>Favoritos</IonLabel>
                                </IonItem>
                            </IonMenuToggle>
                            <IonMenuToggle>
                                <IonItem button routerLink="/add">
                                    <IonIcon slot="start" icon={addOutline} />
                                    <IonLabel>Añadir</IonLabel>
                                </IonItem>
                            </IonMenuToggle>
                            <IonMenuToggle>
                                <IonItem button routerLink="/messages">
                                    <IonIcon slot="start" icon={mailOutline} />
                                    <IonLabel>Mensajes</IonLabel>
                                </IonItem>
                            </IonMenuToggle>
                            <IonMenuToggle>
                                <IonItem button routerLink="/settings">
                                    <IonIcon slot="start" icon={settingsOutline} />
                                    <IonLabel>Configuración</IonLabel>
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
                        <IonTabButton tab="favorites" href="/favorites">
                            <IonIcon icon={heartOutline} />
                        </IonTabButton>
                        <IonTabButton tab="add" href="/add">
                            <IonIcon icon={addOutline} />
                        </IonTabButton>
                        <IonTabButton tab="messages" href="/messages">
                            <IonIcon icon={mailOutline} />
                        </IonTabButton>
                        <IonTabButton tab="settings" href="/settings">
                            <IonIcon icon={settingsOutline} />
                        </IonTabButton>
                    </IonTabBar>
                </IonFooter>
            )}
        </>
    );
};

export default Navegacion;