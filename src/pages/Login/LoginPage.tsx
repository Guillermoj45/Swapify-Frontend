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
    IonCardContent,
    IonItem,
    IonLabel,
    IonInput
} from '@ionic/react';
import { chevronBackOutline, moonOutline, personOutline } from 'ionicons/icons';
import { FaGoogle, FaFacebook, FaTwitter } from 'react-icons/fa';

const LoginPage = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Intentando registrar con:', { name, email, password });
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar color="primary">
                    <IonButtons slot="start">
                        <IonButton routerLink="/login">
                            <IonIcon icon={chevronBackOutline} />
                            Volver
                        </IonButton>
                    </IonButtons>
                    <IonTitle>Iniciar Sesión</IonTitle>
                    <IonButtons slot="end">
                        <IonButton>
                            <IonIcon icon={moonOutline} />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>

            <IonContent className="ion-padding">
                <div className="ion-text-center ion-padding">
                    <IonIcon icon={personOutline} style={{ fontSize: '64px', background: '#93c5fd', borderRadius: '50%', padding: '15px' }} />
                </div>

                <IonCard>
                    <IonCardContent>
                        <form onSubmit={handleSubmit}>

                            <IonItem>
                                <IonLabel position="floating">Correo electrónico</IonLabel>
                                <IonInput
                                    type="email"
                                    value={email}
                                    onIonChange={e => setEmail(e.detail.value!)}
                                    placeholder="correo@ejemplo.com"
                                    required
                                />
                            </IonItem>

                            <IonItem>
                                <IonLabel position="floating">Contraseña</IonLabel>
                                <IonInput
                                    type="password"
                                    value={password}
                                    onIonChange={e => setPassword(e.detail.value!)}
                                    placeholder="••••••••"
                                    required
                                />
                            </IonItem>

                            <div className="ion-padding-top">
                                <IonButton expand="block" type="submit">Iniciar sesión</IonButton>
                            </div>

                            <div className="ion-text-center ion-padding-top">
                                <p>O inicia sesión con</p>
                                <div className="ion-padding">
                                    <IonButton fill="clear">
                                        <FaGoogle size={24} />
                                    </IonButton>
                                    <IonButton fill="clear">
                                        <FaFacebook size={24} />
                                    </IonButton>
                                    <IonButton fill="clear">
                                        <FaTwitter size={24} />
                                    </IonButton>
                                </div>
                            </div>
                        </form>
                    </IonCardContent>
                </IonCard>
            </IonContent>
        </IonPage>
    );
};

export default LoginPage;