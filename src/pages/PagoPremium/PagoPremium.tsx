"use client"

import type React from "react"

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
    IonToast,
} from "@ionic/react"
import {
    lockClosedOutline,
    checkmarkCircleOutline,
    closeCircleOutline,
    homeOutline,
    shieldCheckmarkOutline,
    cardOutline,
    timeOutline,
    starOutline,
} from "ionicons/icons"

import { useState, useEffect } from "react"
import "./PagoPremium.css"
import { useHistory } from "react-router-dom"
import pagoService, { type CreatePaymentIntentRequest } from "../../Services/PagoService"
import useAuthRedirect from "../../Services/useAuthRedirect"

// Define types
type PaymentMethod = "card" | "paypal" | "applepay"
type PaymentStatus = "pending" | "success" | "error"

// Payment Result Component
const PaymentResult: React.FC<{
    status: PaymentStatus
    message: string
    countdown: number
    onRedirect: () => void
}> = ({ status, message, countdown, onRedirect }) => {
    return (
        <div className="payment-result-container">
            <IonGrid>
                <IonRow className="ion-justify-content-center">
                    <IonCol size="12" sizeMd="6" className="ion-text-center">
                        <div className="result-card">
                            <div className={`result-icon-container ${status}`}>
                                <IonIcon
                                    icon={status === "success" ? checkmarkCircleOutline : closeCircleOutline}
                                    className="result-icon"
                                />
                            </div>
                            <h2 className={`result-title ${status}`}>
                                {status === "success" ? "¡Pago Completado!" : "Error en el Pago"}
                            </h2>
                            <p className="result-message">{message}</p>

                            {status === "success" && (
                                <div className="countdown-container">
                                    <p className="countdown-text">
                                        Redirigiendo en <span className="countdown-number">{countdown}</span> segundos
                                    </p>
                                    <div className="progress-bar">
                                        <div className="progress-fill" style={{ width: `${((5 - countdown) / 5) * 100}%` }} />
                                    </div>
                                </div>
                            )}

                            <IonButton expand="block" className="result-button" onClick={onRedirect}>
                                <IonIcon icon={homeOutline} slot="start" />
                                {status === "success" ? "Ir al Menú Principal" : "Volver a Intentar"}
                            </IonButton>
                        </div>
                    </IonCol>
                </IonRow>
            </IonGrid>
        </div>
    )
}

// Checkout Form Component
const CheckoutForm: React.FC = () => {
    useAuthRedirect()

    const history = useHistory()

    // Form state
    const [paymentMethod] = useState<PaymentMethod>("card")
    const [cardNumber, setCardNumber] = useState("")
    const [cardName, setCardName] = useState("")
    const [expiryDate, setExpiryDate] = useState("")
    const [cvc, setCvc] = useState("")

    // UI state
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState("")
    const [isSuccess, setIsSuccess] = useState(false)
    const [showToast, setShowToast] = useState(false)
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("pending")
    const [countdown, setCountdown] = useState(5)

    // Handle countdown for success redirect
    useEffect(() => {
        let timer: NodeJS.Timeout

        if (paymentStatus === "success" && countdown > 0) {
            timer = setTimeout(() => {
                setCountdown(countdown - 1)
            }, 1000)

            if (countdown === 1) {
                handleRedirect()
            }
        }

        return () => {
            if (timer) clearTimeout(timer)
        }
    }, [paymentStatus, countdown])

    const handleRedirect = () => {
        if (paymentStatus === "success") {
            history.push("/products")
        } else {
            setPaymentStatus("pending")
        }
    }

    const createPaymentInBackend = async (): Promise<boolean> => {
        try {
            const paymentData: CreatePaymentIntentRequest = {
                priceId: "price_1RKFLoQBTir074R6yJjLZDKf",
                quantity: 1,
            }

            const response = await pagoService.createPaymentIntent(paymentData)

            if (response.success) {
                return true
            } else {
                setMessage(response.error || "Error al procesar el pago con el servidor")
                return false
            }
        } catch (error) {
            console.error("Error al crear intent de pago:", error)
            if (error instanceof Error) {
                setMessage(error.message)
            } else {
                setMessage("Error inesperado al procesar el pago")
            }
            return false
        }
    }

    const handlePayment = async (): Promise<void> => {
        setLoading(true)

        try {
            const validation = validateForm()
            if (!validation.isValid) {
                setMessage(validation.errorMessage)
                setIsSuccess(false)
                setShowToast(true)
                setLoading(false)
                return
            }

            await new Promise((resolve) => setTimeout(resolve, 1000))

            if (paymentMethod === "card") {
                const paymentSuccessful = await createPaymentInBackend()

                if (paymentSuccessful) {
                    setPaymentStatus("success")
                    setMessage("¡Pago completado con éxito! Tu cuenta premium está activa.")
                    setIsSuccess(true)
                } else {
                    setPaymentStatus("error")
                    setIsSuccess(false)
                }
            }
        } catch (error) {
            console.error("Payment error:", error)
            setPaymentStatus("error")
            setMessage(error instanceof Error ? error.message : "Error al procesar el pago. Inténtalo de nuevo.")
            setIsSuccess(false)
            setShowToast(true)
        } finally {
            setLoading(false)
        }
    }

    // Format card number with spaces
    const formatCardNumber = (value: string): string => {
        const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
        const matches = v.match(/\d{4,16}/g)
        const match = (matches && matches[0]) || ""
        const parts = []

        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4))
        }

        if (parts.length) {
            return parts.join(" ")
        } else {
            return value
        }
    }

    // Format expiry date
    const formatExpiryDate = (value: string): string => {
        const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")

        if (v.length >= 2) {
            return `${v.substring(0, 2)}/${v.substring(2, 4)}`
        }

        return value
    }

    // Handle card number input
    const handleCardNumberChange = (event: CustomEvent): void => {
        const input = event.detail.value
        if (input && input.length <= 19) {
            setCardNumber(formatCardNumber(input))
        }
    }

    // Handle expiry date input
    const handleExpiryDateChange = (event: CustomEvent): void => {
        const input = event.detail.value?.replace("/", "")
        if (input && input.length <= 4) {
            setExpiryDate(formatExpiryDate(input))
        }
    }

    // Validate form inputs
    const validateForm = (): { isValid: boolean; errorMessage: string } => {
        if (!cardName || cardName.trim() === "") {
            return {
                isValid: false,
                errorMessage: "Por favor, introduce el nombre que aparece en tu tarjeta",
            }
        }

        if (!cardNumber) {
            return {
                isValid: false,
                errorMessage: "Por favor, introduce el número de tarjeta",
            }
        }

        if (cardNumber.replace(/\s/g, "").length !== 16) {
            return {
                isValid: false,
                errorMessage: "El número de tarjeta debe tener 16 dígitos",
            }
        }

        if (!expiryDate) {
            return {
                isValid: false,
                errorMessage: "Por favor, introduce la fecha de caducidad",
            }
        }

        if (!expiryDate.match(/^\d{2}\/\d{2}$/)) {
            return {
                isValid: false,
                errorMessage: "La fecha de caducidad debe tener el formato MM/AA",
            }
        }

        if (!cvc) {
            return {
                isValid: false,
                errorMessage: "Por favor, introduce el código CVC",
            }
        }

        if (!cvc.match(/^\d{3}$/)) {
            return {
                isValid: false,
                errorMessage: "El CVC debe ser un número de 3 dígitos",
            }
        }

        const expParts = expiryDate.split("/")
        const month = Number.parseInt(expParts[0])
        if (month < 1 || month > 12) {
            return {
                isValid: false,
                errorMessage: "El mes debe estar entre 01 y 12",
            }
        }

        return { isValid: true, errorMessage: "" }
    }

    // If payment status is not pending, show result screen
    if (paymentStatus !== "pending") {
        return <PaymentResult status={paymentStatus} message={message} countdown={countdown} onRedirect={handleRedirect} />
    }

    return (
        <>
            <IonLoading isOpen={loading} message={"Procesando pago..."} />

            <IonToast
                isOpen={showToast}
                onDidDismiss={() => setShowToast(false)}
                message={message}
                duration={5000}
                color={isSuccess ? "success" : "danger"}
                buttons={[
                    {
                        text: "Cerrar",
                        role: "cancel",
                    },
                ]}
            />

            <div className="payment-container">
                {/* Hero Section */}
                <div className="hero-section">
                    <div className="hero-content">
                        <div className="hero-icon">
                            <IonIcon icon={starOutline} />
                        </div>
                        <h1 className="hero-title">Activa tu Plan Premium</h1>
                        <p className="hero-subtitle">
                            Desbloquea todas las funciones avanzadas y lleva tu experiencia al siguiente nivel
                        </p>
                    </div>
                </div>

                {/* Benefits Section */}
                <div className="benefits-section">
                    <div className="benefits-grid">
                        <div className="benefit-item">
                            <IonIcon icon={shieldCheckmarkOutline} className="benefit-icon" />
                            <span>Seguridad garantizada</span>
                        </div>
                        <div className="benefit-item">
                            <IonIcon icon={timeOutline} className="benefit-icon" />
                            <span>Acceso inmediato</span>
                        </div>
                        <div className="benefit-item">
                            <IonIcon icon={cardOutline} className="benefit-icon" />
                            <span>Pago seguro SSL</span>
                        </div>
                    </div>
                </div>

                {/* Payment Form */}
                <IonGrid>
                    <IonRow className="ion-justify-content-center">
                        <IonCol size="12" sizeMd="8" sizeLg="6">
                            <IonCard className="payment-card">
                                <IonCardContent>
                                    {/* Security Banner */}
                                    <div className="security-banner">
                                        <IonIcon icon={lockClosedOutline} className="security-icon" />
                                        <div className="security-text">
                                            <span className="security-title">Pago 100% Seguro</span>
                                            <span className="security-subtitle">Protegido con cifrado SSL de 256 bits</span>
                                        </div>
                                    </div>

                                    {/* Credit Card Preview */}
                                    <div className="card-preview-container">
                                        <div className="flip-card">
                                            <div className="flip-card-inner">
                                                <div className="flip-card-front">
                                                    <p className="heading_8264">MASTERCARD</p>
                                                    <svg
                                                        className="logo"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        x="0px"
                                                        y="0px"
                                                        width="36"
                                                        height="36"
                                                        viewBox="0 0 48 48"
                                                    >
                                                        <path fill="#ff9800" d="M32 10A14 14 0 1 0 32 38A14 14 0 1 0 32 10Z"></path>
                                                        <path fill="#d50000" d="M16 10A14 14 0 1 0 16 38A14 14 0 1 0 16 10Z"></path>
                                                        <path
                                                            fill="#ff3d00"
                                                            d="M18,24c0,4.755,2.376,8.95,6,11.48c3.624-2.53,6-6.725,6-11.48s-2.376-8.95-6-11.48 C20.376,15.05,18,19.245,18,24z"
                                                        ></path>
                                                    </svg>

                                                    <svg
                                                        version="1.1"
                                                        className="contactless"
                                                        id="Layer_1"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        xmlnsXlink="http://www.w3.org/1999/xlink"
                                                        x="0px"
                                                        y="0px"
                                                        width="20px"
                                                        height="20px"
                                                        viewBox="0 0 50 50"
                                                        xmlSpace="preserve"
                                                    >
                                                        <image
                                                            id="image0"
                                                            width="50"
                                                            height="50"
                                                            x="0"
                                                            y="0"
                                                            href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAQAAAC0NkA6AAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAAmJLR0QA/4ePzL8AAAAJcEhZcwAACxMAAAsTAQCanBgAAAAHdElNRQfnAg0IEzgIwaKTAAADDklEQVRYw+1XS0iUURQ+f5qPyjQflGRFEEFK76koKGxRbWyVVLSOgsCgwjZBJJYuKogSIoOonUK4q3U0WVBWFPZYiIE6kuArG3VGzK/FfPeMM/MLt99/NuHdfPd888/57jn3nvsQWWj/VcMlvMMd5KRTogqx9iCdIjUUmcGR9ImUYowyP3xNGQJoRLVaZ2DaZf8kyjEJALhI28ELioyiwC+Rc3QZwRYyO/DH51hQgWm6DMIh10KmD4u9O16K49it1oPOAmcGAWWOepXIRScAoJZ2Frro8oN+EyTT6lWkkg6msZfMSR35QTJmjU0g15tIGSJ08ZZMJkJkHpNZgSkyXosS13TkJpZ62mPIJvOSzC1bp8vRhhCakEk7G9/o4gmZdbpsTcKu0m63FbnBP9Qrc15z
bkbemfgNDtEOI8NO5L5O9VYyRYgmJayZ9nPaxZrSjW4+F6Uw9yQqIiIZwhp2huQTf6OIvCZyGM6gDJBZbyXifJXr7FZjGXsdxADxI7HUJFB6iWvsIhFpkoiIiGTJfjJfiCuJg2ZEspq9EHGVpYgzKqwJqSAOEwuJQ/pxPvE3cYltJCLdxBLiSKKIE5HxJKcTRNeadxfhDiuYw44zVs1dxKwRk/uCxIiQkxKBsSctRVAge9g1E15EHE6yRUaJecRxcWlukdRIbGFOSZCMWQA/iWauIP3slREHXPyliqBcrrD71Amz Z+rD1Mt2Yr8TZc/UR4/YtFnbinnHi3UrN9vKQ9rPaJf867ZiaqDB+czeKYmd3pNa6fuI75MiC0uXXSR5aEMf7s7a6r/PudVXkjFb/SsrCRfROk0Fx6+H1i9kkTGn/E1vEmt1m089fh+RKdQ5O+xNJPUi
cUIjO0Dm7HwvErEr0YxeibL1StSh37STafE4I7zcBdRq1DiOkdmlTJVnkQTBTS7X1FYyvfO4piaInKbDCDaT2anLudYXCRFsQBgAcIF2/Okwgvz5+Z4tsw118dzruvIvjhTB+HOuWy8UvovEH6beitBKxDyxm9MmISKCWrzB7bSlaqGlsf0FC0gMjzTg6GgAAAAldEVYdGRhdGU6Y3JlYXRlADIwMjMtMDItMTNUMDg6MTk6NTYrMDA6MDCjlq7LAAAAJXRFWHRkYXRlOm1vZGlmeQAyMDIzLTAyLTEzVDA4OjE5
OjU2KzAwOjAw0ssWdwAAACh0RVh0ZGF0ZTp0aW1lc3RhbXAAMjAyMy0wMi0xM1QwODoxOTo1Nisw MDowMIXeN6gAAAAASUVORK5CYII="
                                                        ></image>
                                                    </svg>
                                                    <p className="number">{cardNumber || "9759 2484 5269 6576"}</p>
                                                    <p className="date_8264">{expiryDate || "12/24"}</p>
                                                    <p className="name">{cardName || "NOMBRE APELLIDO"}</p>
                                                </div>
                                                <div className="flip-card-back">
                                                    <div className="strip"></div>
                                                    <div className="mstrip"></div>
                                                    <div className="sstrip">
                                                        <p className="code">{cvc || "***"}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Form Fields */}
                                    <div className="form-section">
                                        <div className="form-row">
                                            <div className="form-field">
                                                <IonItem className="modern-input" lines="none">
                                                    <IonLabel position="floating">Nombre del titular</IonLabel>
                                                    <IonInput
                                                        type="text"
                                                        value={cardName}
                                                        onIonChange={(e) => setCardName(e.detail.value?.toUpperCase() || "")}
                                                        placeholder="NOMBRE APELLIDO"
                                                    />
                                                </IonItem>
                                            </div>
                                        </div>

                                        <div className="form-row">
                                            <div className="form-field">
                                                <IonItem className="modern-input" lines="none">
                                                    <IonLabel position="floating">Número de tarjeta</IonLabel>
                                                    <IonInput
                                                        type="text"
                                                        value={cardNumber}
                                                        onIonChange={handleCardNumberChange}
                                                        placeholder="0000 0000 0000 0000"
                                                    />
                                                </IonItem>
                                            </div>
                                        </div>

                                        <div className="form-row form-row-split">
                                            <div className="form-field">
                                                <IonItem className="modern-input" lines="none">
                                                    <IonLabel position="floating">Fecha de caducidad</IonLabel>
                                                    <IonInput
                                                        type="text"
                                                        value={expiryDate}
                                                        onIonChange={handleExpiryDateChange}
                                                        placeholder="MM/AA"
                                                    />
                                                </IonItem>
                                            </div>
                                            <div className="form-field">
                                                <IonItem className="modern-input" lines="none">
                                                    <IonLabel position="floating">CVC</IonLabel>
                                                    <IonInput
                                                        type="text"
                                                        value={cvc}
                                                        onIonChange={(e) => setCvc(e.detail.value || "")}
                                                        placeholder="123"
                                                        maxlength={3}
                                                    />
                                                </IonItem>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Payment Button */}
                                    <IonButton expand="block" className="payment-button" onClick={handlePayment} disabled={loading}>
                                        <IonIcon icon={lockClosedOutline} slot="start" />
                                        Pagar 9,99€/mes
                                    </IonButton>

                                    {/* Trust Indicators */}
                                    <div className="trust-indicators">
                                        <span>🔒 Pago seguro</span>
                                        <span>✅ Sin compromisos</span>
                                        <span>🚀 Activación inmediata</span>
                                    </div>
                                </IonCardContent>
                            </IonCard>
                        </IonCol>
                    </IonRow>
                </IonGrid>
            </div>
        </>
    )
}

// Main Component
const PagoPremium: React.FC = () => {
    return (
        <IonPage className="premium-payment-page">
            {/* Header */}
            <IonHeader className="modern-header">
                <IonToolbar className="modern-toolbar">
                    <IonButtons slot="start">
                        <IonBackButton defaultHref="/planes" className="modern-back-button" />
                    </IonButtons>
                    <IonTitle className="modern-title">Premium</IonTitle>
                </IonToolbar>
            </IonHeader>

            {/* Content */}
            <IonContent className="premium-content">
                <CheckoutForm />
            </IonContent>

            {/* Footer */}
            <IonFooter className="modern-footer">
                <div className="footer-content">
                    <div className="price-info">
                        <span className="price-label">Total a pagar</span>
                        <span className="price-amount">9,99€/mes</span>
                    </div>
                    <div className="footer-note">Cancela cuando quieras • Sin permanencia</div>
                </div>
            </IonFooter>
        </IonPage>
    )
}

export default PagoPremium
