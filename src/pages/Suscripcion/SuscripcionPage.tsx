import React from 'react';
import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonRow,
    IonCol,
    IonGrid,
    IonImg,
} from '@ionic/react';


const SuscripcionPage: React.FC = () => {
    // Determine if desktop for navigation component

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar color="primary">
                    <IonTitle>Suscripción</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">

                {/* Top section with phone image */}
                <IonGrid>
                    <IonRow>
                        <IonCol size="12" sizeMd="7">
                            <div style={{ padding: '20px' }}>
                                <h1 style={{
                                    fontSize: '24px',
                                    fontWeight: 'bold',
                                    marginBottom: '20px'
                                }}>
                                    Plan Premium
                                </h1>

                                {/* Features list */}
                                <IonList lines="none">
                                    {[1, 2, 3, 4, 5, 6].map((item) => (
                                        <IonItem key={item}>
                                            <IonLabel>Características de esta ventaja</IonLabel>
                                        </IonItem>
                                    ))}
                                </IonList>
                            </div>
                        </IonCol>

                        <IonCol size="12" sizeMd="5" className="ion-text-center">
                            <div style={{
                                background: 'linear-gradient(135deg, #ff8a00, #e52e71)',
                                borderRadius: '10px',
                                padding: '20px',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <IonImg
                                    src="/assets/images/phone-mockup.png"
                                    alt="Phone mockup"
                                    style={{
                                        maxWidth: '200px',
                                        margin: '0 auto'
                                    }}
                                />
                            </div>
                        </IonCol>
                    </IonRow>
                </IonGrid>

                {/* Bottom section with plans */}
                <div style={{
                    background: '#005685',
                    color: 'white',
                    padding: '20px',
                    marginTop: '20px',
                    borderRadius: '10px'
                }}>
                    <h2 style={{
                        textAlign: 'center',
                        marginBottom: '30px',
                        fontSize: '22px'
                    }}>
                        Detalles de los planes... PREMIUM VS GRATUITO
                    </h2>

                    {/* Premium plan card */}
                    <IonCard style={{
                        marginBottom: '20px',
                        borderRadius: '10px'
                    }}>
                        <IonCardContent style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '20px'
                        }}>
                            <IonLabel style={{
                                fontWeight: 'bold',
                                fontSize: '18px'
                            }}>
                                PLAN PREMIUM
                            </IonLabel>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: '#ccc',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <svg width="24" height="24" viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M12 2L1 21h22L12 2zm-1 10V9h2v3h-2zm0 5v-3h2v3h-2z"/>
                                </svg>
                            </div>
                        </IonCardContent>
                    </IonCard>

                    {/* Free plan card */}
                    <IonCard style={{
                        borderRadius: '10px'
                    }}>
                        <IonCardContent style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '20px'
                        }}>
                            <IonLabel style={{
                                fontWeight: 'bold',
                                fontSize: '18px'
                            }}>
                                PLAN GRATUITO
                            </IonLabel>
                            <div style={{
                                background: '#333',
                                color: 'white',
                                padding: '5px 10px',
                                borderRadius: '4px'
                            }}>
                                FREE
                            </div>
                        </IonCardContent>
                    </IonCard>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default SuscripcionPage;