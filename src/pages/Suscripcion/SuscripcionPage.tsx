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
    IonButtons,
    IonMenuButton
} from '@ionic/react';
import {
    informationCircle,
    checkmarkCircle,
    statsChartOutline,
    cloudUploadOutline,
    notificationsOutline,
    eyeOutline,
    arrowForward,
    closeCircle,
    sparkles,
    menuOutline
} from 'ionicons/icons';
import { useHistory } from "react-router-dom";
import './SuscripcionPage.css';
import React, { useState, useEffect } from 'react';
import ProfileService from "../../Services/ProfileService";
import Navegacion from "../../components/Navegation";

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
            icon: eyeOutline,
            text: "Ver todos los productos sin restricción"
        }
    ];

    const history = useHistory();

    const [isPremium, setIsPremium] = useState(false);
    // Estado para detectar si es escritorio
    const [isDesktop, setIsDesktop] = useState<boolean>(window.innerWidth >= 768);

    useEffect(() => {
        const checkPremiumStatus = async () => {
            try {
                const premiumStatus = await ProfileService.isPremium();
                setIsPremium(premiumStatus);
            } catch (error) {
                console.error("Error al verificar el estado premium:", error);
            }
        };

        checkPremiumStatus();
    }, []);

    // Detectar cambios en el tamaño de la pantalla
    useEffect(() => {
        const handleResize = () => {
            setIsDesktop(window.innerWidth >= 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Al inicio, obtener el estado inicial del modo oscuro
    const [isDarkMode, setDarkMode] = useState(() => {
        const storedMode = sessionStorage.getItem('modoOscuroClaro');
        return storedMode === 'true';
    });

    // Efecto para aplicar la clase cuando cambie el modo
    useEffect(() => {
        document.body.classList.remove('dark', 'light');
        document.body.classList.add(isDarkMode ? 'dark' : 'light');
    }, [isDarkMode]);

    return (
        <>
            <Navegacion isDesktop={isDesktop} />

            <IonPage id="main-content">
                <IonHeader>
                    <IonToolbar color="primary" className="main-toolbar">
                        <IonButtons slot="start">
                            <IonMenuButton>
                                <IonIcon icon={menuOutline} style={{ color: 'white', fontSize: '24px' }} />
                            </IonMenuButton>
                        </IonButtons>

                        <IonTitle className="toolbar-title">
                            <span className="title-text">Suscripción</span>
                        </IonTitle>
                    </IonToolbar>

                </IonHeader>
                <IonContent className="ion-padding subscription-content">
                    {/* Premium banner */}
                    <div className="premium-banner">
                        <div className="premium-badge">
                            <IonIcon icon={sparkles} className="badge-icon" />
                            <span>PREMIUM</span>
                        </div>
                    </div>

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
                                            <div className="feature-icon-container">
                                                <IonIcon icon={feature.icon} className="feature-icon" />
                                            </div>
                                            <IonLabel style={{ color: 'var(--feature-text-color)' }}>{feature.text}</IonLabel>
                                        </IonItem>
                                    ))}
                                </IonList>
                            </IonCol>

                            <IonCol size="12" sizeMd="5" className="ion-text-center">
                                <div className="phone-container">
                                    <div className="phone-background"></div>
                                    <IonImg
                                        src="/image 78.png"
                                        alt="Phone mockup"
                                        className="phone-image"
                                    />
                                    <div className="glow-effect"></div>
                                    <div className="pulse-circle"></div>
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
                            <IonCard className="plan-card free-card">
                                <IonCardContent>
                                    <div className="plan-header">
                                        <h3>PLAN PREMIUM</h3>
                                        <div className="free-badge">9.99€/mes</div>
                                    </div>

                                    <ul className="plan-features">
                                        <li>
                                            <div className="check-container free-check">
                                                <IonIcon icon={checkmarkCircle} className="check-icon" />
                                            </div>
                                            Prioridad de visibilidad de productos
                                        </li>
                                        <li>
                                            <div className="check-container free-check">
                                                <IonIcon icon={checkmarkCircle} className="check-icon" />
                                            </div>
                                            Alertas prioritarias
                                        </li>
                                        <li>
                                            <div className="check-container free-check">
                                                <IonIcon icon={checkmarkCircle} className="check-icon" />
                                            </div>
                                            Productos ilimitados para subir
                                        </li>
                                        <li>
                                            <div className="check-container free-check">
                                                <IonIcon icon={checkmarkCircle} className="check-icon" />
                                            </div>
                                            +20 puntos al precio evaluado
                                        </li>
                                        <li>
                                            <div className="check-container free-check">
                                                <IonIcon icon={checkmarkCircle} className="check-icon" />
                                            </div>
                                            Acceso a todos los productos sin restricción
                                        </li>
                                    </ul>

                                    <IonButton
                                        expand="block"
                                        className="premium-button"
                                        onClick={() => history.push(isPremium ? '/products' : '/paymentGateway')}
                                    >
                                        {isPremium ? 'Ya eres premium' : 'Suscribirse ahora'}
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
                                            <div className="check-container free-check">
                                                <IonIcon icon={checkmarkCircle} className="check-icon" />
                                            </div>
                                            Visibilidad estándar de productos
                                        </li>
                                        <li>
                                            <div className="check-container free-check">
                                                <IonIcon icon={checkmarkCircle} className="check-icon" />
                                            </div>
                                            Alertas básicas
                                        </li>
                                        <li>
                                            <div className="check-container free-check">
                                                <IonIcon icon={checkmarkCircle} className="check-icon" />
                                            </div>
                                            Máximo 5 productos para subir
                                        </li>
                                        <li>
                                            <div className="check-container limited-check">
                                                <IonIcon icon={closeCircle} className="limited-icon" />
                                            </div>
                                            Sin bonus al precio evaluado
                                        </li>
                                        <li>
                                            <div className="check-container limited-check">
                                                <IonIcon icon={closeCircle} className="limited-icon" />
                                            </div>
                                            Acceso limitado a productos
                                        </li>
                                    </ul>

                                    <IonButton
                                        expand="block"
                                        className="premium-button"
                                        onClick={() => history.push('/products')}
                                    >
                                        Seguir con plan normal
                                        <IonIcon icon={arrowForward} slot="end" />
                                    </IonButton>
                                </IonCardContent>
                            </IonCard>
                        </div>

                        <div className="testimonial-section">
                            <div className="quote-mark"></div>
                            <p className="testimonial-text">La suscripción premium mejoró totalmente mi experiencia. Los productos se venden mucho más rápido.</p>
                            <div className="testimonial-author">- María G., Cliente Premium</div>
                        </div>
                    </div>
                </IonContent>
            </IonPage>
        </>
    );
};

export default SuscripcionPage;