"use client"
import React, { useState } from "react"
import { Swiper, SwiperSlide } from "swiper/react"
import { Autoplay, Pagination } from "swiper/modules"
import "swiper/css"
import "swiper/css/pagination"
import "swiper/css/navigation"
import "swiper/css/effect-cube"

import {
    IonPage,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardContent,
    IonText,
    IonGrid,
    IonRow,
    IonCol,
    IonInput, IonInputPasswordToggle, IonItem,
} from "@ionic/react"

import "../Register/RegisterPage.css"

const PasswordRecover: React.FC = () => {
    const photos: string[] = [
        "https://picsum.photos/1000/1000?random=4",
        "https://picsum.photos/1000/1000?random=5",
        "https://picsum.photos/1000/1000?random=6",
    ]

    const [isEmailStage, setIsEmailStage] = useState(true)
    const [email, setEmail] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")

    const goToRegister = () => {
        window.location.href = "/login"
    }

    const continuar = () => {
        if (isEmailStage) {
            if (!email.trim()) {
                //TODO  mostrar un error o alerta
                return
            }
            // Avanzar a la pantalla de contraseñas
            setIsEmailStage(false)
        } else {
            // Validar contraseñas y enviar formulario
            if (newPassword !== confirmPassword) {
                // Mostrar error de que no coinciden
                return
            }
            // Procesar cambio de contraseña (llamada a API)
            console.log("Cambio de contraseña para:", email)
            // Redirigir a login o mostrar mensaje de éxito
        }
    }

    return (
        <IonPage className="register-page">
            <IonContent fullscreen>
                <IonGrid className="full-height-grid">
                    <IonRow className="full-height-row">
                        <IonCol size="12" sizeMd="6" className="carousel-container ion-hide-md-down">
                            <Swiper
                                modules={[Autoplay, Pagination]}
                                spaceBetween={50}
                                slidesPerView={1}
                                loop
                                autoplay={{
                                    delay: 3000,
                                    disableOnInteraction: false,
                                }}
                                pagination={{ clickable: true }}
                                className="carousel-swiper"
                            >
                                {photos.map((photo, index) => (
                                    <SwiperSlide key={index} className="carousel-slide">
                                        <div className="image-container">
                                            <img src={photo} alt={`Slide ${index + 1}`} className="carousel-image" />
                                        </div>
                                    </SwiperSlide>
                                ))}
                            </Swiper>
                        </IonCol>

                        <IonCol size="12" sizeMd="6" className="form-container">
                            <div className="form-wrapper">
                                <IonCard className="register-card">
                                    <IonCardHeader>
                                        <div className="logo-container">
                                            <img src="/Logo2.png" alt="Logo" className="logo" />
                                        </div>
                                        <h2 className="register-title">Recuperar contraseña</h2>
                                    </IonCardHeader>

                                    <IonCardContent>
                                        {isEmailStage ? (
                                            <>
                                                <IonItem className="form-item">
                                                    <IonInput
                                                        className="form-item"
                                                        placeholder="Email"
                                                        value={email}
                                                        onIonChange={(e) => setEmail(e.detail.value!)}
                                                    />
                                                </IonItem>

                                            </>
                                        ) : (
                                            <>
                                                <IonItem className="form-item">
                                                <IonInput
                                                    type="password"
                                                    label="Nueva contraseña"
                                                    className="form-item"
                                                    value={newPassword}
                                                    onIonChange={(e) => setNewPassword(e.detail.value!)}
                                                >
                                                    <IonInputPasswordToggle slot="end">

                                                    </IonInputPasswordToggle>
                                                </IonInput>
                                                </IonItem>
                                                <br />
                                                <IonItem className="form-item">
                                                <IonInput
                                                    type="password"
                                                    label="Confirmar contraseña"
                                                    className="form-item"
                                                    value={confirmPassword}
                                                    onIonChange={(e) => setConfirmPassword(e.detail.value!)}
                                                >
                                                    <IonInputPasswordToggle slot="end">

                                                    </IonInputPasswordToggle>
                                                </IonInput>
                                                </IonItem>
                                            </>
                                        )}
                                        <br />
                                        <button onClick={continuar} className="register-button">
                                            {isEmailStage ? "Continuar" : "Restablecer contraseña"}
                                        </button>
                                        <br/>

                                    </IonCardContent>
                                    <IonText className="ion-text-center">
                                        <p className="login-link">
                                            ¿Tienes cuenta?{" "}
                                            <span onClick={goToRegister} className="clickable">
                                                    Ir a Login
                                                </span>
                                        </p>
                                    </IonText>
                                </IonCard>
                            </div>
                        </IonCol>
                    </IonRow>
                </IonGrid>
            </IonContent>
        </IonPage>
    )
}

export default PasswordRecover