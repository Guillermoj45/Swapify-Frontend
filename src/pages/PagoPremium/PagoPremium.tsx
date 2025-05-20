import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonButton,
    IonCard,
    IonCardContent,
    IonInput,
    IonFooter,
    IonBackButton,
    IonButtons,
    IonIcon,
    IonItem,
    IonLabel,
    IonLoading,
    IonToast
} from '@ionic/react';
import { lockClosedOutline, checkmarkCircleOutline, closeCircleOutline, homeOutline } from 'ionicons/icons';

import { useState, useEffect } from 'react';
import './PagoPremium.css';
import UIverseCard from "../../components/UIVerseCard/UIverseCard";
import { useHistory } from 'react-router-dom';
import pagoService, { CreatePaymentIntentRequest } from "../../Services/PagoService";
import useAuthRedirect from "../../Services/useAuthRedirect";

// Define types
type PaymentMethod = 'card' | 'paypal' | 'applepay';
type PaymentStatus = 'pending' | 'success' | 'error';

// Payment Result Component
const PaymentResult: React.FC<{
    status: PaymentStatus;
    message: string;
    countdown: number;
    onRedirect: () => void;
}> = ({ status, message, countdown, onRedirect }) => {
    return (
        <IonGrid className="payment-result-container">
            <IonRow className="ion-justify-content-center">
                <IonCol size="12" sizeMd="8" className="ion-text-center">
                    <div className={`result-icon ${status}`}>
                        {status === 'success' ? (
                            <IonIcon icon={checkmarkCircleOutline} className="success-icon" />
                        ) : (
                            <IonIcon icon={closeCircleOutline} className="error-icon" />
                        )}
                    </div>
                    <h2 className={`result-title ${status}`}>
                        {status === 'success' ? '¡Pago Completado!' : 'Error en el Pago'}
                    </h2>
                    <p className="result-message">{message}</p>
                    {status === 'success' && (
                        <div className="countdown-container">
                            <p>Devolviendo al menú principal en: <span className="countdown">{countdown}</span></p>
                            <div className="progress-bar">
                                <div
                                    className="progress"
                                    style={{ width: `${(countdown / 5) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    )}
                    <IonButton
                        expand="block"
                        className="redirect-button"
                        onClick={onRedirect}
                    >
                        <IonIcon icon={homeOutline} slot="start" />
                        {status === 'success' ? 'Ir al Menú Principal' : 'Volver a Intentar'}
                    </IonButton>
                </IonCol>
            </IonRow>
        </IonGrid>
    );
};

// Checkout Form Component
const CheckoutForm: React.FC = () => {

    useAuthRedirect()

    const history = useHistory();

    // Form state
    const [paymentMethod] = useState<PaymentMethod>('card');
    const [cardNumber, setCardNumber] = useState('');
    const [cardName, setCardName] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [cvc, setCvc] = useState('');

    // UI state
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('pending');
    const [countdown, setCountdown] = useState(5);

    // Handle countdown for success redirect
    useEffect(() => {
        let timer: NodeJS.Timeout;

        if (paymentStatus === 'success' && countdown > 0) {
            timer = setTimeout(() => {
                setCountdown(countdown - 1);
            }, 1000);

            if (countdown === 1) {
                handleRedirect();
            }
        }

        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [paymentStatus, countdown]);

    const handleRedirect = () => {
        // Redirect to home or payment page based on status
        if (paymentStatus === 'success') {
            history.push('/products'); // Change to your main menu route
        } else {
            // Reset the payment form
            setPaymentStatus('pending');
        }
    };

    const createPaymentInBackend = async (): Promise<boolean> => {
        try {
            // Definir los datos para la solicitud de pago
            const paymentData: CreatePaymentIntentRequest = {
                priceId: "price_1RKFLoQBTir074R6yJjLZDKf", // Ajusta según tu configuración en Stripe
                quantity: 1
            };

            // Llamar al servicio de pago
            const response = await pagoService.createPaymentIntent(paymentData);

            // Verificar si la respuesta fue exitosa
            if (response.success) {
                return true;
            } else {
                setMessage(response.error || 'Error al procesar el pago con el servidor');
                return false;
            }
        } catch (error) {
            console.error('Error al crear intent de pago:', error);
            if (error instanceof Error) {
                setMessage(error.message);
            } else {
                setMessage('Error inesperado al procesar el pago');
            }
            return false;
        }
    }

    const handlePayment = async (): Promise<void> => {
        setLoading(true);

        try {
            // Validate inputs
            const validation = validateForm();
            if (!validation.isValid) {
                setMessage(validation.errorMessage);
                setIsSuccess(false);
                setShowToast(true);
                setLoading(false);
                return;  // Importante: retornar aquí para evitar continuar con el pago
            }

            // Simulate payment processing
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Process payment based on selected method
            if (paymentMethod === 'card') {
                // Enviar la solicitud de pago al backend
                const paymentSuccessful = await createPaymentInBackend();

                if (paymentSuccessful) {
                    setPaymentStatus('success');
                    setMessage('¡Pago completado con éxito! Tu cuenta premium está activa.');
                    setIsSuccess(true);
                } else {
                    setPaymentStatus('error');
                    setIsSuccess(false);
                    // El mensaje se establece en createPaymentInBackend si hay error
                }
            }
        } catch (error) {
            console.error('Payment error:', error);
            setPaymentStatus('error');
            setMessage(error instanceof Error ? error.message : 'Error al procesar el pago. Inténtalo de nuevo.');
            setIsSuccess(false);
            setShowToast(true);
        } finally {
            setLoading(false);
        }
    };

    // Format card number with spaces
    const formatCardNumber = (value: string): string => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const matches = v.match(/\d{4,16}/g);
        const match = matches && matches[0] || '';
        const parts = [];

        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }

        if (parts.length) {
            return parts.join(' ');
        } else {
            return value;
        }
    };

    // Format expiry date
    const formatExpiryDate = (value: string): string => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');

        if (v.length >= 2) {
            return `${v.substring(0, 2)} / ${v.substring(2, 4)}`;
        }

        return value;
    };

    // Handle card number input
    const handleCardNumberChange = (event: CustomEvent): void => {
        const input = event.detail.value;
        if (input && input.length <= 19) { // 16 digits + 3 spaces
            setCardNumber(formatCardNumber(input));
        }
    };

    // Handle expiry date input
    const handleExpiryDateChange = (event: CustomEvent): void => {
        const input = event.detail.value?.replace(' / ', '');
        if (input && input.length <= 4) {
            setExpiryDate(formatExpiryDate(input));
        }
    };

    // Validate form inputs
    const validateForm = (): { isValid: boolean; errorMessage: string } => {
        if (!cardName || cardName.trim() === '') {
            return {
                isValid: false,
                errorMessage: 'Por favor, introduce el nombre que aparece en tu tarjeta'
            };
        }

        if (!cardNumber) {
            return {
                isValid: false,
                errorMessage: 'Por favor, introduce el número de tarjeta'
            };
        }

        if (cardNumber.replace(/\s/g, '').length !== 16) {
            return {
                isValid: false,
                errorMessage: 'El número de tarjeta debe tener 16 dígitos'
            };
        }

        if (!expiryDate) {
            return {
                isValid: false,
                errorMessage: 'Por favor, introduce la fecha de caducidad'
            };
        }

        if (!expiryDate.match(/^\d{2}\s\/\s\d{2}$/)) {
            return {
                isValid: false,
                errorMessage: 'La fecha de caducidad debe tener el formato MM/AA'
            };
        }

        if (!cvc) {
            return {
                isValid: false,
                errorMessage: 'Por favor, introduce el código CVC'
            };
        }

        if (!cvc.match(/^\d{3}$/)) {
            return {
                isValid: false,
                errorMessage: 'El CVC debe ser un número de 3 dígitos'
            };
        }

        const expParts = expiryDate.split(' / ');
        const month = parseInt(expParts[0]);
        if (month < 1 || month > 12) {
            return {
                isValid: false,
                errorMessage: 'El mes debe estar entre 01 y 12'
            };
        }

        return { isValid: true, errorMessage: '' };
    };

    // If payment status is not pending, show result screen
    if (paymentStatus !== 'pending') {
        return (
            <PaymentResult
                status={paymentStatus}
                message={message}
                countdown={countdown}
                onRedirect={handleRedirect}
            />
        );
    }

    return (
        <>
            <IonLoading isOpen={loading} message={'Procesando pago...'} />

            <IonToast
                isOpen={showToast}
                onDidDismiss={() => setShowToast(false)}
                message={message}
                duration={5000}
                color={isSuccess ? 'success' : 'danger'}
                buttons={[
                    {
                        text: 'Cerrar',
                        role: 'cancel',
                    }
                ]}
            />

            <IonGrid>
                <IonRow>
                    <IonCol size="12" className="ion-text-center">
                        <h1 className="premium-title">Completa tu pago</h1>
                        <p className="premium-subtitle">
                            Introduce los datos para activar tu cuenta premium
                        </p>
                    </IonCol>
                </IonRow>

                {/* Credit Card Component */}
                <IonRow className="ion-justify-content-center">
                    <IonCol size="12" sizeMd="8" className="ion-text-center">
                        <div className="card-container">
                            <div className="flip-card">
                                <div className="flip-card-inner">
                                    <div className="flip-card-front">
                                        <p className="heading_8264">MASTERCARD</p>
                                        <svg className="logo" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="36" height="36" viewBox="0 0 48 48">
                                            <path fill="#ff9800" d="M32 10A14 14 0 1 0 32 38A14 14 0 1 0 32 10Z"></path>
                                            <path fill="#d50000" d="M16 10A14 14 0 1 0 16 38A14 14 0 1 0 16 10Z"></path>
                                            <path fill="#ff3d00" d="M18,24c0,4.755,2.376,8.95,6,11.48c3.624-2.53,6-6.725,6-11.48s-2.376-8.95-6-11.48 C20.376,15.05,18,19.245,18,24z"></path>
                                        </svg>

                                        <svg version="1.1" className="contactless" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="20px" height="20px" viewBox="0 0 50 50" xmlSpace="preserve">
                                            <image id="image0" width="50" height="50" x="0" y="0" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAQAAAC0NkA6AAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAAmJLR0QA/4ePzL8AAAAJcEhZcwAACxMAAAsTAQCanBgAAAAHdElNRQfnAg0IEzgIwaKTAAADDklEQVRYw+1XS0iUURQ+f5qPyjQflGRFEEFK76koKGxRbWyVVLSOgsCgwjZBJJYuKogSIoOonUK4q3U0WVBWFPZYiIE6kuArG3VGzK/FfPeMM/MLt99/NuHdfPd888/57jn3nvsQWWj/VcMlvMMd5KRTogqx9iCdIjUUmcGR9ImUYowyP3xN
GQJoRLVaZ2DaZf8kyjEJALhI28ELioyiwC+Rc3QZwRYyO/DH51hQgWm6DMIh10KmD4u9O16K49it1oPOAmcGAWWOepXIRScAoJZ2Frro8oN+EyTT6lWkkg6msZfMSR35QTJmjU0g15tIGSJ08ZZMJkJkHpNZgSkyXosS13TkJpZ62mPIJvOSzC1bp8vRhhCakEk7G9/o4gmZdbpsTcKu0m63FbnBP9Qrc15z
bkbemfgNDtEOI8NO5L5O9VYyRYgmJayZ9nPaxZrSjW4+F6Uw9yQqIiIZwhp2huQTf6OIvCZyGM6gDJBZbyXifJXr7FZjGXsdxADxI7HUJFB6iWvsIhFpkoiIiGTJfjJfiCuJg2ZEspq9EHGVpYgzKqwJqSAOEwuJQ/pxPvE3cYltJCLdxBLiSKKIE5HxJKcTRNeadxfhDiuYw44zVs1dxKwRk/uCxIiQkxKB
sSctRVAge9g1E15EHE6yRUaJecRxcWlukdRIbGFOSZCMWQA/iWauIP3slREHXPyliqBcrrD71Amz Z+rD1Mt2Yr8TZc/UR4/YtFnbinnHi3UrN9vKQ9rPaJf867ZiaqDB+czeKYmd3pNa6fuI75MiC0uXXSR5aEMf7s7a6r/PudVXkjFb/SsrCRfROk0Fx6+H1i9kkTGn/E1vEmt1m089fh+RKdQ5O+xNJPUi
cUIjO0Dm7HwvErEr0YxeibL1StSh37STafE4I7zcBdRq1DiOkdmlTJVnkQTBTS7X1FYyvfO4piaInKbDCDaT2anLudYXCRFsQBgAcIF2/Okwgvz5+Z4tsw118dzruvIvjhTB+HOuWy8UvovEH6beitBKxDyxm9MmISKCWrzB7bSlaqGlsf0FC0gMjzTg6GgAAAAldEVYdGRhdGU6Y3JlYXRlADIwMjMtMDItMTNUMDg6MTk6NTYrMDA6MDCjlq7LAAAAJXRFWHRkYXRlOm1vZGlmeQAyMDIzLTAyLTEzVDA4OjE5
OjU2KzAwOjAw0ssWdwAAACh0RVh0ZGF0ZTp0aW1lc3RhbXAAMjAyMy0wMi0xM1QwODoxOTo1Nisw MDowMIXeN6gAAAAASUVORK5CYII="></image>
                                        </svg>
                                        <p className="number">{cardNumber || '9759 2484 5269 6576'}</p>
                                        <p className="date_8264">{expiryDate || '12/24'}</p>
                                        <p className="name">{cardName || 'NOMBRE APELLIDO'}</p>
                                    </div>
                                    <div className="flip-card-back">
                                        <div className="strip"></div>
                                        <div className="mstrip"></div>
                                        <div className="sstrip">
                                            <p className="code">{cvc || '***'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </IonCol>
                </IonRow>

                {/* Card Input Fields */}
                <IonRow>
                    <IonCol size="12" sizeMd="8" offsetMd="2">
                        <IonCard className="payment-card">
                            <IonCardContent>
                                <div className="security-banner">
                                    <IonIcon icon={lockClosedOutline} className="security-icon" />
                                    <span>Pago seguro con cifrado SSL</span>
                                </div>

                                <div className="form-container spaced-inputs">
                                    <IonRow>
                                        <IonCol>
                                            <IonItem lines="full" className="input-item">
                                                <IonLabel position="floating">Nombre en la tarjeta</IonLabel>
                                                <IonInput
                                                    type="text"
                                                    value={cardName}
                                                    onIonChange={(e) => setCardName(e.detail.value?.toUpperCase() || '')}
                                                    placeholder="NOMBRE APELLIDO"
                                                />
                                            </IonItem>
                                        </IonCol>
                                        <IonCol>
                                            <IonItem lines="full" className="input-item">
                                                <IonLabel position="floating">Número de tarjeta</IonLabel>
                                                <IonInput
                                                    type="text"
                                                    value={cardNumber}
                                                    onIonChange={handleCardNumberChange}
                                                    placeholder="0000 0000 0000 0000"
                                                />
                                            </IonItem>
                                        </IonCol>
                                    </IonRow>

                                    <IonRow>
                                        <IonCol size="6">
                                            <IonItem lines="full" className="input-item">
                                                <IonLabel position="floating">MM/AA</IonLabel>
                                                <IonInput
                                                    type="text"
                                                    value={expiryDate}
                                                    onIonChange={handleExpiryDateChange}
                                                    placeholder="MM/AA"
                                                />
                                            </IonItem>
                                        </IonCol>
                                        <IonCol size="6">
                                            <IonItem lines="full" className="input-item">
                                                <IonLabel position="floating">CVC</IonLabel>
                                                <IonInput
                                                    type="text"
                                                    value={cvc}
                                                    onIonChange={(e) => setCvc(e.detail.value || '')}
                                                    placeholder="123"
                                                    maxlength={3}
                                                />
                                            </IonItem>
                                        </IonCol>
                                    </IonRow>
                                </div>

                                <div className="ui-card-container">
                                    <UIverseCard onClick={handlePayment} />
                                </div>
                            </IonCardContent>
                        </IonCard>
                    </IonCol>
                </IonRow>
            </IonGrid>
        </>
    );
};

// Main Component
const PagoPremium: React.FC = () => {
    return (
        <IonPage>
            {/* Header */}
            <IonHeader>
                <IonToolbar color="primary">
                    <IonButtons slot="start">
                        <IonBackButton defaultHref="/planes" />
                    </IonButtons>
                    <IonTitle>Pago Premium</IonTitle>
                </IonToolbar>
            </IonHeader>

            {/* Content */}
            <IonContent className="ion-padding" color="light">
                <CheckoutForm />
                <div className="page-spacer"></div>
            </IonContent>

            {/* Footer */}
            <IonFooter>
                <div className="footer-container">
                    <div className="price-container">
                        <p className="price-label">Total a pagar:</p>
                        <p className="price-amount">9,99€/mes</p>
                    </div>
                </div>
            </IonFooter>
        </IonPage>
    );
};

export default PagoPremium;