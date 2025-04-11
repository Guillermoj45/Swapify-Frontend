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
    IonButton
} from "@ionic/react"
import { FaGoogle, FaGithub, FaDiscord } from "react-icons/fa"
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
    const photos: string[] = [
        "https://picsum.photos/1000/1000?random=1",
        "https://picsum.photos/1000/1000?random=2",
        "https://picsum.photos/1000/1000?random=3",
    ]

    const [form, setForm] = useState<FormData>({
        nickname: "",
        name: "",
        email: "",
        rol: "USER",
        bornDate: "",
        password: "",
    })

    const [showImageInput, setShowImageInput] = useState(false)
    const [selectedImage, setSelectedImage] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string>("")

    const handleChange = (field: keyof FormData, value: string) => {
        setForm({ ...form, [field]: value })
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setShowImageInput(true)
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
        try {
            const user = User.fromFormData(form);

            if (selectedImage) {
                // Convert image to base64
                const base64Image = await User.fileToBase64(selectedImage);
                user.profileImage = base64Image;
            }

            const response = await UserService.registerUser(user);
            console.log("User registered successfully:", response);
        } catch (error) {
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
                                        <div className="logo-container">
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
                                                        />
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

                                                <button
                                                    className="register-button"
                                                    style={{ fontSize: "24px", padding: "12px 24px", marginTop: "16px" }}
                                                    onClick={handleRegister}
                                                >
                                                    Registrarse
                                                </button>
                                            </>
                                        )}
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