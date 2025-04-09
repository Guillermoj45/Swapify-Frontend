import React, { useState } from 'react';
import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonBadge,
    IonList,
    IonThumbnail,
    IonFab,
    IonFabButton,
    IonSearchbar
} from '@ionic/react';
import {
    moonOutline,
    personOutline,
    notificationsOutline,
    swapHorizontalOutline,
    addOutline,
    starOutline,
    trendingUpOutline,
    imageOutline
} from 'ionicons/icons';
import { FaRobot } from 'react-icons/fa';

const HomePage = () => {
    const [searchText, setSearchText] = useState('');
    const userPoints = 1250;

    const featuredItems = [
        { id: 1, name: "Bicicleta de montaña", points: 450, image: "bike.jpg" },
        { id: 2, name: "Consola de videojuegos", points: 380, image: "console.jpg" },
        { id: 3, name: "Set de cocina profesional", points: 290, image: "kitchen.jpg" }
    ];

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar color="primary">
                    <IonTitle>Swapify</IonTitle>
                    <IonButtons slot="end">
                        <IonButton>
                            <IonIcon icon={notificationsOutline} />
                        </IonButton>
                        <IonButton routerLink="/perfil">
                            <IonIcon icon={personOutline} />
                        </IonButton>
                        <IonButton>
                            <IonIcon icon={moonOutline} />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>

            <IonContent className="ion-padding">
                {/* Bienvenida y puntos del usuario */}
                <div className="ion-padding-bottom">
                    <h2>¡Bienvenido a Swapify!</h2>
                    <IonItem lines="none">
                        <IonIcon icon={starOutline} slot="start" color="warning" />
                        <IonLabel>Tus puntos de intercambio</IonLabel>
                        <IonBadge color="success" slot="end">{userPoints} pts</IonBadge>
                    </IonItem>
                </div>

                {/* Buscador */}
                <IonSearchbar
                    value={searchText}
                    onIonChange={e => setSearchText(e.detail.value!)}
                    placeholder="Buscar objetos para intercambiar"
                />

                {/* Card de introducción */}
                <IonCard>
                    <IonCardHeader>
                        <IonCardTitle>Intercambia objetos de forma inteligente</IonCardTitle>
                        <IonCardSubtitle>Powered by IA</IonCardSubtitle>
                    </IonCardHeader>
                    <IonCardContent>
                        <div className="ion-text-center ion-padding-bottom">
                            <FaRobot size={48} style={{ color: '#3880ff' }} />
                        </div>
                        <p>
                            Swapify revoluciona la forma de intercambiar objetos. Nuestra IA analiza tus artículos
                            y les asigna un valor en puntos basado en su condición, demanda y valor real.
                        </p>
                        <p>
                            Acumula puntos al subir tus objetos y úsalos para obtener lo que realmente necesitas.
                            ¡Comercio justo y sostenible al alcance de tu mano!
                        </p>
                        <div className="ion-padding-top">
                            <IonButton expand="block" color="secondary">
                                <IonIcon icon={trendingUpOutline} slot="start" />
                                Descubre cómo funciona
                            </IonButton>
                        </div>
                    </IonCardContent>
                </IonCard>

                {/* Sección de artículos destacados */}
                <div className="ion-padding-top">
                    <h3>Artículos destacados</h3>
                    <IonList>
                        {featuredItems.map(item => (
                            <IonItem key={item.id} button detail routerLink={`/item/${item.id}`}>
                                <IonThumbnail slot="start">
                                    <IonIcon icon={imageOutline} size="large" />
                                </IonThumbnail>
                                <IonLabel>
                                    <h2>{item.name}</h2>
                                    <p>Valor estimado por IA</p>
                                </IonLabel>
                                <IonBadge color="primary" slot="end">{item.points} pts</IonBadge>
                            </IonItem>
                        ))}
                    </IonList>
                </div>

                {/* Card de acciones rápidas */}
                <IonCard className="ion-margin-top">
                    <IonCardHeader>
                        <IonCardTitle>Acciones rápidas</IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                        <div className="ion-grid">
                            <div className="ion-row">
                                <div className="ion-col ion-text-center">
                                    <IonButton fill="clear" routerLink="/add-item">
                                        <div className="ion-text-center">
                                            <IonIcon icon={addOutline} size="large" />
                                            <p>Agregar objeto</p>
                                        </div>
                                    </IonButton>
                                </div>
                                <div className="ion-col ion-text-center">
                                    <IonButton fill="clear" routerLink="/swaps">
                                        <div className="ion-text-center">
                                            <IonIcon icon={swapHorizontalOutline} size="large" />
                                            <p>Mis intercambios</p>
                                        </div>
                                    </IonButton>
                                </div>
                            </div>
                        </div>
                    </IonCardContent>
                </IonCard>

            </IonContent>
        </IonPage>
    );
};

export default HomePage;