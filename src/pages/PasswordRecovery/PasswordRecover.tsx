import {
    IonPage, IonContent, IonGrid, IonRow, IonCol,
    IonCard, IonCardHeader, IonCardContent, IonInput,
    IonItem, IonToast, IonText
} from "@ionic/react";
import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

import UserService from "../../Services/UserService"; // Asegurate que esta ruta sea correcta
import { IonInputPasswordToggle } from "@ionic/react"; // Si estás usando un componente custom

const PasswordRecoveryPage = () => {
    const [isEmailStage, setIsEmailStage] = useState(true);
    const [email, setEmail] = useState("");
    const [codigoEnviado, setCodigoEnviado] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [toastColor, setToastColor] = useState<"success" | "danger" | "warning" | "primary">("primary");

    const goToLogin = () => {
        window.location.href = "/login";
    };

    const handleSubmit = async () => {
        if (isEmailStage) {
            if (!email.trim()) {
                showToastMessage("Por favor, introduce tu email.", "warning");
                return;
            }

            try {
                await UserService.sendEmailUser({ email });
                setIsEmailStage(false);
            } catch (error) {
                console.error("Error enviando email:", error);
                showToastMessage("Error al enviar el email de recuperación. Inténtalo de nuevo.", "danger");
            }
        } else {
            if (!codigoEnviado.trim() || !newPassword.trim() || !confirmPassword.trim()) {
                showToastMessage("Por favor, completa todos los campos.", "warning");
                return;
            }

            if (newPassword !== confirmPassword) {
                showToastMessage("Las contraseñas no coinciden.", "danger");
                return;
            }

            try {
                await UserService.sendNewPassword({
                    code: codigoEnviado,
                    newPassword: newPassword,
                });
                setIsEmailStage(true);
                showToastMessage("Contraseña actualizada correctamente.", "success");
                setTimeout(goToLogin, 2000);
            } catch (error) {
                console.error("Error al actualizar la contraseña:", error);
                showToastMessage("Ocurrió un error al actualizar la contraseña. Inténtalo más tarde.", "danger");
            }
        }
    };

    const showToastMessage = (message: string, color: "success" | "danger" | "warning" | "primary") => {
        setToastMessage(message);
        setToastColor(color);
        setShowToast(true);
    };

    const photos: string[] = [
        "Home.png",
        "NuevaVenta.png",
        "Perfil_En_Venta.png",
        "PlanesSwapify.png"
    ]

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
                                autoplay={{ delay: 3000, disableOnInteraction: false }}
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
                                            <IonItem className="form-item">
                                                <IonInput
                                                    type="email"
                                                    placeholder="Introduce tu email"
                                                    value={email}
                                                    onIonChange={(e) => setEmail(e.detail.value!)}
                                                />
                                            </IonItem>
                                        ) : (
                                            <>
                                                <IonItem className="form-item">
                                                    <IonInput
                                                        type="text"
                                                        placeholder="Código enviado"
                                                        value={codigoEnviado}
                                                        onIonChange={(e) => setCodigoEnviado(e.detail.value!)}
                                                    />
                                                </IonItem>
                                                <IonItem className="form-item">
                                                    <IonInput
                                                        type="password"
                                                        placeholder="Nueva contraseña"
                                                        value={newPassword}
                                                        onIonChange={(e) => setNewPassword(e.detail.value!)}
                                                    >
                                                        <IonInputPasswordToggle slot="end" />
                                                    </IonInput>
                                                </IonItem>
                                                <IonItem className="form-item">
                                                    <IonInput
                                                        type="password"
                                                        placeholder="Confirmar contraseña"
                                                        value={confirmPassword}
                                                        onIonChange={(e) => setConfirmPassword(e.detail.value!)}
                                                    >
                                                        <IonInputPasswordToggle slot="end" />
                                                    </IonInput>
                                                </IonItem>
                                            </>
                                        )}

                                        <br />
                                        <button onClick={handleSubmit} className="register-button">
                                            {isEmailStage ? "Continuar" : "Restablecer contraseña"}
                                        </button>

                                        <IonText className="ion-text-center">
                                            <p className="login-link">
                                                ¿Tienes cuenta?{" "}
                                                <span onClick={goToLogin} className="clickable">
                                                    Ir a Login
                                                </span>
                                            </p>
                                        </IonText>
                                    </IonCardContent>
                                </IonCard>
                            </div>
                        </IonCol>
                    </IonRow>
                </IonGrid>

                <IonToast
                    isOpen={showToast}
                    onDidDismiss={() => setShowToast(false)}
                    message={toastMessage}
                    duration={2000}
                    color={toastColor}
                    buttons={[{ text: "OK", role: "cancel" }]}
                />
            </IonContent>
        </IonPage>
    );
};

export default PasswordRecoveryPage;
