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
    IonIcon,
} from '@ionic/react';
import {
    informationCircle,
    checkmarkCircle,
    moon,
    sunny,
    flashOutline,
    notificationsOutline,
    cloudUploadOutline,
    statsChartOutline,
    eyeOutline,
    arrowForward
} from 'ionicons/icons';
import { useHistory } from "react-router-dom";
import './SuscripcionPage.css';
import { useState, useEffect } from 'react';

const SuscripcionPage: React.FC = () => {

    const premiumFeatures = [
        {
            icon: eyeOutline,
            text: "Prioridad de visibilidad de productos"
        },
        {
            icon: notificationsOutline,
            text: "Alertas prioritarias"
        },
        {
            icon: cloudUploadOutline,
            text: "Numero ilimitado de productos para subir"
        },
        {
            icon: statsChartOutline,
            text: "Sumar hasta 20 puntos más al precio evaluado"
        },
        {
            icon: flashOutline,
            text: "Ver todos los productos sin restricción"
        }
    ];

    const history = useHistory();

    const [isDarkMode, setDarkMode] = useState(false);

    useEffect(() => {
        document.body.classList.toggle('dark', isDarkMode);
    }, [isDarkMode]);

    const toggleDarkMode = () => {
        setDarkMode(prev => !prev);
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar color="primary" className="main-toolbar">
                    <IonTitle>Suscripción</IonTitle>
                    <IonButton
                        fill="clear"
                        slot="end"
                        onClick={toggleDarkMode}
                        className="theme-toggle-btn"
                    >
                        <IonIcon icon={isDarkMode ? sunny : moon} />
                    </IonButton>
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
                                        <IonIcon icon={feature.icon} slot="start" className="feature-icon" />
                                        <IonLabel>{feature.text}</IonLabel>
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
                            <IonCardContent>
                                <div className="plan-header">
                                    <h3>PLAN PREMIUM</h3>
                                    <div className="plan-price">
                                        <span className="price">9,99€</span>
                                        <span className="period">/mes</span>
                                    </div>
                                </div>

                                <ul className="plan-features">
                                    <li>
                                        <IonIcon icon={checkmarkCircle} className="limited-icon" />
                                        Prioridad de visibilidad de productos
                                    </li>
                                    <li>
                                        <IonIcon icon={checkmarkCircle} className="limited-icon" />
                                        Alertas prioritarias
                                    </li>
                                    <li>
                                        <IonIcon icon={checkmarkCircle} className="limited-icon" />
                                        Productos ilimitados para subir
                                    </li>
                                    <li>
                                        <IonIcon icon={checkmarkCircle} className="limited-icon" />
                                        +20 puntos al precio evaluado
                                    </li>
                                    <li>
                                        <IonIcon icon={checkmarkCircle} className="limited-icon" />
                                        Acceso a todos los productos sin restricción
                                    </li>
                                </ul>

                                <IonButton
                                    expand="block"
                                    className="premium-button"
                                    onClick={() => history.push('/paymentGateway')}
                                >
                                    Suscribirse ahora
                                    <IonIcon icon={arrowForward} slot="end" />
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
                                    <li>
                                        <IonIcon icon={checkmarkCircle} />
                                        Visibilidad estándar de productos
                                    </li>
                                    <li>
                                        <IonIcon icon={checkmarkCircle} />
                                        Alertas básicas
                                    </li>
                                    <li>
                                        <IonIcon icon={checkmarkCircle} />
                                        Máximo 5 productos para subir
                                    </li>
                                    <li>
                                        <IonIcon icon={checkmarkCircle} />
                                        Sin bonus al precio evaluado
                                    </li>
                                    <li>
                                        <IonIcon icon={checkmarkCircle} />
                                        Acceso limitado a productos
                                    </li>
                                </ul>

                                <IonButton
                                    expand="block"
                                    className="free-button"
                                    fill="outline"
                                    onClick={() => history.push('/products')}
                                >
                                    Seguir en plan normal
                                </IonButton>
                            </IonCardContent>
                        </IonCard>
                    </div>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default SuscripcionPage;