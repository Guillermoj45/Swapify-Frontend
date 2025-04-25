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
    IonButton,
    IonIcon
} from '@ionic/react';
import { informationCircle, checkmarkCircle } from 'ionicons/icons';
import { useHistory } from "react-router-dom";
import './SuscripcionPage.css';

const SuscripcionPage: React.FC = () => {

    const premiumFeatures = [
        "Prioridad de visibilidad de productos",
        "Alertas prioritarias",
        "Numero ilimitado de productos para subir",
        "Sumar hasta 20 puntos mas al precio evaluado",
        "Ver todos los productos sin restricción"
    ];

    const history = useHistory();


    return (
        <IonPage>
            <IonHeader>
                <IonToolbar color="primary" className="main-toolbar">
                    <IonTitle>Suscripción</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding subscription-content">
                {/* Top section with phone image */}
                <IonGrid className="hero-section">
                    <IonRow>
                        <IonCol size="12" sizeMd="7" className="hero-content">
                            <div className="premium-header">
                                <h1>Plan Premium</h1>
                                <p className="premium-subtitle">Desbloquea todo el potencial de nuestra aplicación</p>
                            </div>

                            {/* Features list */}
                            <IonList lines="none" className="features-list">
                                {premiumFeatures.map((feature, index) => (
                                    <IonItem key={index} className="feature-item">
                                        <IonIcon icon={checkmarkCircle} slot="start" className="feature-icon" />
                                        <IonLabel>{feature}</IonLabel>
                                    </IonItem>
                                ))}
                            </IonList>
                        </IonCol>

                        <IonCol size="12" sizeMd="5" className="ion-text-center">
                            <div className="phone-container">
                                <IonImg
                                    src="/image 78.png"
                                    alt="Phone mockup"
                                    className="phone-image"
                                />
                                <div className="glow-effect"></div>
                            </div>
                        </IonCol>
                    </IonRow>
                </IonGrid>

                {/* Bottom section with plans */}
                <div className="plans-comparison">
                    <h2 className="comparison-title">
                        <IonIcon icon={informationCircle} className="info-icon" />
                        Comparativa de planes
                    </h2>

                    <div className="plans-container">
                        {/* Premium plan card */}
                        <IonCard className="plan-card premium-card">
                            <div className="plan-badge premium-badge">Recomendado</div>
                            <IonCardContent>
                                <div className="plan-header">
                                    <h3>PLAN PREMIUM</h3>
                                    <div className="plan-price">
                                        <span className="price">9,99€</span>
                                        <span className="period">/mes</span>
                                    </div>
                                </div>

                                <ul className="plan-features">
                                    <li><IonIcon icon={checkmarkCircle} /> Todas las funciones</li>
                                    <li><IonIcon icon={checkmarkCircle} /> Soporte prioritario</li>
                                    <li><IonIcon icon={checkmarkCircle} /> Sin anuncios</li>
                                    <li><IonIcon icon={checkmarkCircle} /> Actualizaciones anticipadas</li>
                                </ul>

                                <IonButton
                                    expand="block"
                                    className="premium-button"
                                    onClick={() => history.push('/paymentGateway')}
                                >
                                    Suscribirse ahora
                                </IonButton>
                            </IonCardContent>
                        </IonCard>

                        {/* Free plan card */}
                        <IonCard className="plan-card free-card">
                            <IonCardContent>
                                <div className="plan-header">
                                    <h3>PLAN GRATUITO</h3>
                                    <div className="free-badge">FREE</div>
                                </div>

                                <ul className="plan-features">
                                    <li><IonIcon icon={checkmarkCircle} /> Funciones básicas</li>
                                    <li><IonIcon icon={checkmarkCircle} /> Soporte comunitario</li>
                                    <li><IonIcon icon={checkmarkCircle} className="limited-icon" /> Publicidad</li>
                                    <li><IonIcon icon={checkmarkCircle} className="limited-icon" /> Funciones limitadas</li>
                                </ul>

                                <IonButton
                                    expand="block"
                                    className="premium-button"
                                    onClick={() => history.push('/products')}
                                >
                                    Suscribirse ahora
                                </IonButton>
                            </IonCardContent>
                        </IonCard>
                    </div>

                    <p className="guarantee-text">
                        30 días de garantía de devolución de dinero. Sin compromiso.
                    </p>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default SuscripcionPage;