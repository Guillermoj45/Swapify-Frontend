import React, { useState } from "react"
import { Swiper, SwiperSlide } from "swiper/react"
import { Autoplay, Pagination } from "swiper/modules"
import UserService from "../../Services/UserService";
import { User } from "../../Models/User";


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
    IonItem,
    IonGrid,
    IonRow,
    IonCol,
    IonButton, IonToast, IonInputPasswordToggle, IonText
} from "@ionic/react"
import { FaGoogle, FaGithub, FaDiscord ,FaArrowLeft} from "react-icons/fa"
import { CgProfile } from "react-icons/cg";
import "./RegisterPage.css"

interface FormData {
    nickname: string
    name: string
    rol: string,
    email: string
    bornDate: string
    password: string,
}

const RegisterPage: React.FC = () => {

    //Fotos que salen en el registro a la izq
    const photos: string[] = [
        "Home.png",
        "NuevaVenta.png",
        "Perfil_En_Venta.png",
        "PlanesSwapify.png"
    ]

    //Formulario reactivo con el que se construye el objeto
    const [form, setForm] = useState<FormData>({
        nickname: "",
        name: "",
        email: "",
        rol: "USER",
        bornDate: "",
        password: "",
    })

    // Constantes reactivas para controlar para cuando sale la foto de perfil
    const [showImageInput, setShowImageInput] = useState(false)
    const [selectedImage, setSelectedImage] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string>("")

    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");

    const handleChange = (field: keyof FormData, value: string) => {
        setForm({ ...form, [field]: value })
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setShowImageInput(true)
    }

    const goToLogin = () => {
        window.location.href = "/login"
    }

    const uploadPhoto = () => {
        const fileInput = document.getElementById("fileInput") as HTMLInputElement;
        if (fileInput) {
            fileInput.click();
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedImage(file);
            const preview = URL.createObjectURL(file);
            setPreviewUrl(preview);
        }
    };

    const handleRegister = async () => {
        const { nickname, name, email, bornDate, password } = form;

        if (!nickname || !name || !email || !bornDate || !password) {
            setToastMessage("Por favor, completa todos los campos.");
            setShowToast(true);
            return;
        }

        try {
            const user = User.fromFormData(form);

            if (selectedImage) {
                const base64Image = await User.fileToBase64(selectedImage);
                user.profileImage = base64Image;
            }

            const response = await UserService.registerUser(user);
            console.log("User registered successfully:", response);
            goToLogin()
        } catch (error) {
            setToastMessage("Error al registrar usuario. Inténtalo de nuevo.");
            setShowToast(true);
            console.error("Failed to register user:", error);
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

                        <IonCol size="12" sizeMd="6" className="form-container">
                            <div className="form-wrapper">
                                <IonCard className="register-card">
                                    <IonCardHeader>
                                        <div className="logo-container" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            {showImageInput && (
                                                <button
                                                    className="register-button-back"
                                                    style={{ marginRight: "30px" }}
                                                    onClick={() => setShowImageInput(false)}
                                                >
                                                    <FaArrowLeft />
                                                </button>
                                            )}
                                            <img src="/Logo2.png" alt="Logo" className="logo" />
                                        </div>
                                        { !showImageInput
                                            ? (<h2 className="register-title">Registrarse</h2>)
                                            : (<h2 className="register-title">
                                                { selectedImage ? "Confirmar imagen de perfil" : "Añade una imagen de perfil" }
                                            </h2>)
                                        }
                                    </IonCardHeader>

                                    <IonCardContent>
                                        { !showImageInput ? (
                                            <>
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
                                                            value={form.bornDate}
                                                            onIonChange={(e) => handleChange("bornDate", e.detail.value!)}
                                                        />

                                                    </IonItem>

                                                    <IonItem className="form-item">
                                                        <IonInput
                                                            type="password"
                                                            placeholder="Contraseña"
                                                            value={form.password}
                                                            onIonChange={(e) => handleChange("password", e.detail.value!)}
                                                        >
                                                            <IonInputPasswordToggle slot="end" />
                                                        </IonInput>
                                                    </IonItem>

                                                    <button type="submit" className="register-button">
                                                        Continuar
                                                    </button>
                                                </form>
                                            </>
                                        ) : (
                                            <>
                                                <input
                                                    id="fileInput"
                                                    type="file"
                                                    accept="image/*"
                                                    style={{ display: "none" }}
                                                    onChange={handleFileChange}
                                                />
                                                <div className="image-preview-container">
                                                    <IonButton
                                                        className="form-button"
                                                        style={{
                                                            width: "150px",
                                                            height: "150px",
                                                            padding: 0,
                                                            borderRadius: "50%",
                                                            overflow: "hidden" // Ensures content doesn't overflow the circular shape
                                                        }}
                                                        onClick={uploadPhoto}
                                                    >
                                                        {previewUrl ? (
                                                            <img
                                                                src={previewUrl}
                                                                alt="Preview"
                                                                style={{
                                                                    width: "100%",
                                                                    height: "100%",
                                                                    objectFit: "cover",
                                                                    borderRadius: "50%"
                                                                }}
                                                            />
                                                        ) : (
                                                            <CgProfile style={{ fontSize: "100px" }} />
                                                        )}
                                                    </IonButton>
                                                </div>

                                                {previewUrl && (
                                                    <button className="register-button" onClick={uploadPhoto}>
                                                        Cambiar imagen
                                                    </button>
                                                )}

                                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                    <button
                                                        className="register-button"
                                                        style={{ fontSize: "24px", padding: "12px 24px", marginTop: "16px" }}
                                                        onClick={handleRegister}
                                                    >
                                                        Registrarse
                                                    </button>
                                                </div>


                                            </>
                                        )}
                                        <br/>
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
                    color="danger"
                />

            </IonContent>
        </IonPage>
    )
}

export default RegisterPage