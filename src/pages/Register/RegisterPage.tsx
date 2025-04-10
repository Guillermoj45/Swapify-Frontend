"use client"

import type React from "react"
import { useState } from "react"
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
    IonInput,
    IonText,
    IonItem,
    IonGrid,
    IonRow,
    IonCol,
} from "@ionic/react"
import { FaGoogle, FaGithub, FaDiscord } from "react-icons/fa"
import "./RegisterPage.css"

interface FormData {
    nickname: string
    name: string
    email: string
    birthdate: string
    password: string
}

const RegisterPage: React.FC = () => {
    const photos: string[] = [
        "https://picsum.photos/1000/1000?random=1",
        "https://picsum.photos/1000/1000?random=2",
        "https://picsum.photos/1000/1000?random=3",
    ]

    const [form, setForm] = useState<FormData>({
        nickname: "",
        name: "",
        email: "",
        birthdate: "",
        password: "",
    })

    const handleChange = (field: keyof FormData, value: string) => {
        setForm({ ...form, [field]: value })
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        console.log("Datos enviados:", form)
    }

    const goToLogin = () => {
        console.log("Navigating to login page...")
        // Navigation logic here
    }

    return (
        <IonPage className="register-page">
            <IonContent fullscreen>
                <IonGrid className="full-height-grid">
                    <IonRow className="full-height-row">
                        {/* Left column: Carousel (desktop only) */}
                        <IonCol size="12" sizeMd="6" className="carousel-container ion-hide-md-down">
                            <Swiper
                                modules={[Autoplay, Pagination]}
                                spaceBetween={50}
                                slidesPerView={1}
                                loop={true}
                                autoplay={{
                                    delay: 3000,
                                    disableOnInteraction: false,
                                }}
                                pagination={{
                                    clickable: true,
                                }}
                                className="carousel-swiper"
                            >
                                {photos.map((photo, index) => (
                                    <SwiperSlide key={index} className="carousel-slide">
                                        <div className="image-container">
                                            <img src={photo || "/placeholder.svg"} alt={`Slide ${index + 1}`} className="carousel-image" />
                                        </div>
                                    </SwiperSlide>
                                ))}
                            </Swiper>
                        </IonCol>

                        {/* Right column: Form */}
                        <IonCol size="12" sizeMd="6" className="form-container">
                            <div className="form-wrapper">


                                <IonCard className="register-card">
                                    <IonCardHeader>
                                        <div className="logo-container">
                                            <img src="/Logo2.png" alt="Logo" className="logo" />
                                        </div>
                                        <h2 className="register-title">Registrarse</h2>
                                    </IonCardHeader>

                                    <IonCardContent>

                                        <div className="social-icons">
                                            <div className="icon black">
                                                <FaDiscord />
                                            </div>
                                            <div className="icon red">
                                                <FaGoogle />
                                            </div>
                                            <div className="icon blue">
                                                <FaGithub />
                                            </div>
                                        </div>

                                        <div className="divider">
                                            <span>O</span>
                                        </div>


                                        <form onSubmit={handleSubmit}>
                                            <IonItem className="form-item">
                                                <IonInput
                                                    placeholder="Nickname"
                                                    value={form.nickname}
                                                    onIonChange={(e) => handleChange("nickname", e.detail.value!)}
                                                />
                                            </IonItem>

                                            <IonItem className="form-item">
                                                <IonInput
                                                    placeholder="Nombre"
                                                    value={form.name}
                                                    onIonChange={(e) => handleChange("name", e.detail.value!)}
                                                />
                                            </IonItem>

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
                                                    type="date"
                                                    placeholder="Fecha de Nacimiento"
                                                    value={form.birthdate}
                                                    onIonChange={(e) => handleChange("birthdate", e.detail.value!)}
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


                                            <button type="submit" className="register-button">
                                                Registrarse
                                            </button>
                                        </form>
                                          <br/>
                                        <IonText className="ion-text-center">
                                            <p className="login-link">
                                                ¿Tienes cuenta?{" "}
                                                <span onClick={goToLogin} className="clickable">
                          Pincha aquí
                        </span>
                                            </p>
                                        </IonText>
                                    </IonCardContent>
                                </IonCard>
                            </div>
                        </IonCol>
                    </IonRow>
                </IonGrid>
            </IonContent>
        </IonPage>
    )
}

export default RegisterPage
