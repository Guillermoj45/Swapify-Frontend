"use client"
import React, { useState } from "react"
import { Swiper, SwiperSlide } from "swiper/react"
import { Autoplay, Pagination } from "swiper/modules"
import "swiper/css"
import "swiper/css/pagination"
import "swiper/css/navigation"
import "swiper/css/effect-cube"

import UserService from "../../Services/UserService"
import { LoginFormData } from "../../Models/LoginData"

import {
    IonPage,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardContent,
    IonInput,
    IonText,
    IonItem,
    IonGrid,
    IonRow,
    IonCol,
    IonToast,
} from "@ionic/react"

import { FaGoogle, FaGithub, FaDiscord } from "react-icons/fa"
import "../Register/RegisterPage.css"

const LoginPage: React.FC = () => {
    const photos: string[] = [
        "https://picsum.photos/1000/1000?random=4",
        "https://picsum.photos/1000/1000?random=5",
        "https://picsum.photos/1000/1000?random=6",
    ]

    const [form, setForm] = useState<LoginFormData>({
        email: "",
        password: "",
    })

    const [showToast, setShowToast] = useState(false)
    const [toastMessage, setToastMessage] = useState("")
    const [toastColor, setToastColor] = useState<"success" | "danger" | "warning">("danger")

    const handleChange = (field: keyof LoginFormData, value: string) => {
        setForm({ ...form, [field]: value })
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
    }

    const showToastMessage = (message: string, color: "success" | "danger" | "warning" = "danger") => {
        setToastMessage(message)
        setToastColor(color)
        setShowToast(true)
    }

    const goToRegister = () => {
        // Aquí pondrías lógica real con router, como useNavigate() si usas React Router
        window.location.href = "/register"
    }

    const goToPasswordRecover = () => {
        window.location.href = "/passwordRecover"
    }

    const handleLogin = async () => {
        const { email, password } = form;

        if (!email || !password) {
            showToastMessage("Por favor, completa todos los campos.", "warning");
            return;
        }

        try {
            const response = await UserService.loginUser(form);
            console.log("Login successful:", response);

            if (response && response.token) {
                showToastMessage("Inicio de sesión exitoso", "success");
                setTimeout(() => {
                    window.location.href = "/profile";
                }, 1000);
            } else {
                showToastMessage(response.mensaje || "Inicio de sesión incorrecto. No se recibió un token válido.", "danger");
            }
        } catch (error: unknown) {
            console.error("Login failed:", error);

            if (error && typeof error === "object" && "response" in error) {
                const axiosError = error as { response?: { status: number, data?: { mensaje?: string } } };
                const status = axiosError.response?.status;
                const mensaje = axiosError.response?.data?.mensaje;

                switch (status) {
                    case 401:
                        showToastMessage(mensaje || "Usuario o contraseña incorrectos", "danger");
                        break;
                    case 404:
                        showToastMessage(mensaje || "Usuario no encontrado", "danger");
                        break;
                    default:
                        showToastMessage(mensaje || "Error al iniciar sesión. Inténtalo de nuevo más tarde.", "danger");
                        break;
                }
            } else {
                showToastMessage("Error al iniciar sesión. Inténtalo de nuevo más tarde.", "danger");
            }
        }
    };

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
                                        <h2 className="register-title">Iniciar Sesión</h2>
                                    </IonCardHeader>

                                    <IonCardContent>
                                        <div className="social-icons">
                                            <div className="icon black"><FaDiscord /></div>
                                            <div className="icon red"><FaGoogle /></div>
                                            <div className="icon blue"><FaGithub /></div>
                                        </div>

                                        <div className="divider"><span>O</span></div>

                                        <form onSubmit={handleSubmit}>
                                            <IonItem className="form-item">
                                                <IonInput
                                                    type="email"
                                                    placeholder="Email"
                                                    value={form.email}
                                                    onIonChange={(e) => handleChange("email", e.detail.value!)}
                                                />
                                            </IonItem>

                                            <IonItem className="form-item">
                                                <IonInput
                                                    type="password"
                                                    placeholder="Contraseña"
                                                    value={form.password}
                                                    onIonChange={(e) => handleChange("password", e.detail.value!)}
                                                />
                                            </IonItem>

                                            <button onClick={handleLogin} type="submit" className="register-button">
                                                Iniciar Sesión
                                            </button>
                                        </form>

                                        <br />
                                        <IonText className="ion-text-center">
                                            <p className="login-link">
                                                ¿No tienes cuenta?{" "}
                                                <span onClick={goToRegister} className="clickable">
                                                    Regístrate aquí
                                                </span>
                                            </p>
                                        </IonText>
                                        <br/>
                                        <IonText className="ion-text-center">
                                            <p className="login-link">
                                                ¿Olvidaste la contraseña?{" "}
                                                <span onClick={goToPasswordRecover} className="clickable">
                                                    Recuperar Contraseña
                                                </span>
                                            </p>
                                        </IonText>
                                    </IonCardContent>
                                </IonCard>
                            </div>
                        </IonCol>
                    </IonRow>
                </IonGrid>

                {/* Toast de feedback */}
                <IonToast
                    isOpen={showToast}
                    onDidDismiss={() => setShowToast(false)}
                    message={toastMessage}
                    duration={2000}
                    color={toastColor}
                />
            </IonContent>
        </IonPage>
    )
}

export default LoginPage
