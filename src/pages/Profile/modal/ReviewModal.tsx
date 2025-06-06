"use client"

import React, {useEffect} from "react"
import { useState } from "react"
import {
    IonButton,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonModal,
    IonTextarea,
    IonTitle,
    IonToolbar,
    IonToast,
    IonLoading,
} from "@ionic/react"
import { star, starOutline, close, chatbubbleOutline } from "ionicons/icons"
import ReviewsService from "../../../Services/ReviewsService"

interface ReviewModalProps {
    isOpen: boolean
    onClose: () => void
    profileId: string
    profileName: string
    onReviewCreated: () => void
}

const ReviewModal: React.FC<ReviewModalProps> = ({ isOpen, onClose, profileId, profileName, onReviewCreated }) => {
    const [rating, setRating] = useState(0)
    const [description, setDescription] = useState("")
    const [loading, setLoading] = useState(false)
    const [showToast, setShowToast] = useState(false)
    const [toastMessage, setToastMessage] = useState("")
    const [toastColor, setToastColor] = useState<"success" | "danger">("success")

    const [isDarkMode, setIsDarkMode] = useState(() => {
        // Leer desde sessionStorage
        const modoOscuroClaro = sessionStorage.getItem('modoOscuroClaro');
        return modoOscuroClaro === 'true';
    });

    useEffect(() => {
        const checkDarkMode = () => {
            const modoOscuroClaro = sessionStorage.getItem('modoOscuroClaro');
            setIsDarkMode(modoOscuroClaro === 'true');
        };

        // Escuchar cambios en sessionStorage
        const handleStorageChange = (e) => {
            if (e.key === 'modoOscuroClaro') {
                setIsDarkMode(e.newValue === 'true');
            }
        };

        window.addEventListener('storage', handleStorageChange);

        // También verificar periódicamente por si se cambia desde la misma pestaña
        const interval = setInterval(checkDarkMode, 100);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(interval);
        };
    }, []);

    const handleSubmit = async () => {
        if (rating === 0) {
            setToastMessage("Por favor, selecciona una calificación")
            setToastColor("danger")
            setShowToast(true)
            return
        }

        if (description.trim().length < 10) {
            setToastMessage("La reseña debe tener al menos 10 caracteres")
            setToastColor("danger")
            setShowToast(true)
            return
        }

        setLoading(true)
        try {
            await ReviewsService.createReview({
                idProfile: profileId,
                description: description.trim(),
                stars: rating,
            })

            setToastMessage("Reseña creada exitosamente")
            setToastColor("success")
            setShowToast(true)

            // Reset form
            setRating(0)
            setDescription("")

            // Notify parent component
            onReviewCreated()

            // Close modal after a short delay
            setTimeout(() => {
                onClose()
            }, 1500)
        } catch (error: any) {
            setToastMessage(error.message || "Error al crear la reseña")
            setToastColor("danger")
            setShowToast(true)
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        setRating(0)
        setDescription("")
        onClose()
    }

    const renderStars = () => {
        return Array.from({ length: 5 }, (_, i) => (
            <IonIcon
                key={i}
                icon={i < rating ? star : starOutline}
                className={`modern-star ${i < rating ? "filled" : "empty"}`}
                onClick={() => setRating(i + 1)}
            />
        ))
    }

    const getCharacterCountColor = () => {
        const length = description.length
        if (length > 450) return "danger"
        if (length > 400) return "warning"
        return ""
    }

    return (
        <>
            <IonModal isOpen={isOpen} onDidDismiss={handleClose} className="modern-review-modal">
                <IonHeader>
                    <IonToolbar className="modern-review-header">
                        <IonTitle className="modern-review-title">
                            <IonIcon icon={chatbubbleOutline} style={{ marginRight: "8px" }} />
                            Reseña para {profileName}
                        </IonTitle>
                        <IonButton slot="end" fill="clear" className="modern-close-btn" onClick={handleClose}>
                            <IonIcon icon={close} />
                        </IonButton>
                    </IonToolbar>
                </IonHeader>

                <IonContent className="modern-review-content">
                    {/* Sección de calificación */}
                    <div className="rating-section">
                        <h3 className="rating-title">Calificación</h3>
                        <div className="modern-stars-container">{renderStars()}</div>
                        {rating > 0 && (
                            <p
                                style={{
                                    color: isDarkMode ? "white" : "black",
                                    fontSize: "14px",
                                    margin: "8px 0 0",
                                    fontWeight: "var(--font-weight-medium)",
                                }}
                            >
                                {rating === 1 && "😞 Muy malo"}
                                {rating === 2 && "😐 Malo"}
                                {rating === 3 && "🙂 Regular"}
                                {rating === 4 && "😊 Bueno"}
                                {rating === 5 && "🤩 Excelente"}
                            </p>
                        )}
                    </div>

                    {/* Campo de texto */}
                    <div className="modern-textarea-container">
                        <IonItem lines="none" style={{"--background": "transparent"}}>
                            <div style={{width: "100%"}}>
                                <IonLabel className="modern-textarea-label">Escribe tu reseña</IonLabel>
                                <IonTextarea
                                    className="modern-textarea"
                                    value={description}
                                    onIonInput={(e) => setDescription(e.detail.value!)}
                                    placeholder="Comparte tu experiencia con este usuario. ¿Cómo fue la comunicación? ¿El producto estaba como se describía? ¿Recomendarías hacer negocios con esta persona?"
                                    rows={6}
                                    maxlength={500}
                                />
                                <div className={`character-counter ${getCharacterCountColor()}`}>
                                    {description.length}/500 caracteres
                                </div>
                            </div>
                        </IonItem>
                    </div>

                    {/* Botones */}
                    <div className="modal-buttons-container">
                        <IonButton expand="block" fill="outline" className="modern-cancel-btn" onClick={handleClose}>
                            Cancelar
                        </IonButton>
                        <IonButton
                            expand="block"
                            className="modern-submit-btn"
                            onClick={handleSubmit}
                            disabled={loading || rating === 0 || description.trim().length < 10}
                        >
                            {loading ? "Publicando..." : "Publicar reseña"}
                        </IonButton>
                    </div>
                </IonContent>
            </IonModal>

            <IonLoading isOpen={loading} message="Creando reseña..." className="modern-loading" />

            <IonToast
                isOpen={showToast}
                onDidDismiss={() => setShowToast(false)}
                message={toastMessage}
                duration={3000}
                color={toastColor}
                position="top"
                className={`modern-toast toast-${toastColor}`}
            />
        </>
    )
}

export default ReviewModal
