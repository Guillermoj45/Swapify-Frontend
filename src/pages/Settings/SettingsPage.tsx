"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useHistory } from "react-router-dom"
import {
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonPage,
    IonButtons,
    IonButton,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonToggle,
    IonListHeader,
    IonAlert,
    IonToast,
    IonCard,
    IonCardHeader,
    IonCardContent,
    IonInput,
    IonMenuButton,
    type InputCustomEvent,
} from "@ionic/react"
import {
    informationCircleOutline,
    personOutline,
    shieldCheckmarkOutline,
    logOutOutline,
    trashOutline,
    closeOutline,
    eyeOutline,
    createOutline,
    colorPaletteOutline,
    notificationsOutline,
    menuOutline,
} from "ionicons/icons"
import "./Settings.css"
import { Settings as SettingsService } from "../../Services/SettingsService"
import cloudinaryImage from "../../Services/CloudinaryService"
import type { ProfileSettings } from "../../Models/ProfileSettings"
import Navegacion from "../../components/Navegation"
import useAuthRedirect from "../../Services/useAuthRedirect"

// Types
interface ProfileWithFile extends Omit<ProfileSettings, "avatar"> {
    ubicacion?: string
    avatar?: string | File
}

interface PasswordState {
    currentPassword: string
    newPassword: string
    confirmPassword: string
}

type ActiveSection = "profile" | "security" | null

interface AccountOption {
    label: string
    icon: string
    action: string
}

const Settings: React.FC = () => {
    useAuthRedirect()
    const history = useHistory()

    // UI States
    const [activeSection, setActiveSection] = useState<ActiveSection>(null)
    const [isDesktop, setIsDesktop] = useState<boolean>(window.innerWidth >= 768)
    const [isLoading, setIsLoading] = useState<boolean>(false)

    // Alert States
    const [showLogoutAlert, setShowLogoutAlert] = useState<boolean>(false)
    const [showDeleteAccountAlert, setShowDeleteAccountAlert] = useState<boolean>(false)
    const [showAboutAlert, setShowAboutAlert] = useState<boolean>(false)

    // Toast States
    const [showToast, setShowToast] = useState<boolean>(false)
    const [toastMessage, setToastMessage] = useState<string>("")

    // Profile State
    const [profile, setProfile] = useState<ProfileWithFile>({
        nickname: "",
        email: "",
        avatar: "",
        premium: "",
        ubicacion: "",
        preferencias: {
            notificaciones: true,
            modo_oscuro: false,
        },
    })

    // Password State
    const [passwordData, setPasswordData] = useState<PasswordState>({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    })

    // Password Visibility State
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false,
    })

    // Theme Management
    const applyTheme = useCallback((isDark: boolean): void => {
        const body = document.body
        const root = document.documentElement

        body.classList.remove("dark-theme", "light-theme")
        body.classList.add(isDark ? "dark-theme" : "light-theme")
        root.setAttribute("data-theme", isDark ? "dark" : "light")
        sessionStorage.setItem("modoOscuroClaro", isDark.toString())
    }, [])

    // Settings Management
    const loadSettings = useCallback(async (): Promise<void> => {
        if (!sessionStorage.getItem("token")) {
            history.push("/login")
            return
        }

        setIsLoading(true)
        try {
            const profileSettings = await SettingsService.getProfileSettings()
            const avatarUrl = profileSettings.avatar ? cloudinaryImage(profileSettings.avatar) : ""

            setProfile({
                nickname: profileSettings.nickname || "",
                email: profileSettings.email || "",
                avatar: avatarUrl,
                premium: profileSettings.premium || "",
                ubicacion: profileSettings.ubicacion || "",
                preferencias: {
                    notificaciones: profileSettings.preferencias?.notificaciones ?? true,
                    modo_oscuro: profileSettings.preferencias?.modo_oscuro ?? false,
                },
            })
        } catch (error) {
            console.error("Error loading settings:", error)
            displayToast("Error al cargar configuraciones")
        } finally {
            setIsLoading(false)
        }
    }, [history])

    // Initialize Component
    useEffect(() => {
        const initialize = async () => {
            try {
                const savedDarkMode = sessionStorage.getItem("modoOscuroClaro")
                const initialDarkMode = savedDarkMode === "true"
                applyTheme(initialDarkMode)

                setProfile((prev) => ({
                    ...prev,
                    preferencias: {
                        ...prev.preferencias,
                        modo_oscuro: initialDarkMode,
                    },
                }))

                await loadSettings()
            } catch (error) {
                console.error("Error initializing:", error)
                displayToast("Error al cargar configuraciones")
                applyTheme(false)
            }
        }

        initialize()
    }, [applyTheme, loadSettings])

    // Handle Window Resize
    useEffect(() => {
        const handleResize = () => setIsDesktop(window.innerWidth >= 768)
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    // Utility Functions
    const displayToast = (message: string): void => {
        setToastMessage(message)
        setShowToast(true)
    }

    const getAvatarUrl = (avatar: string | File | undefined): string => {
        if (!avatar) return "/placeholder.svg?height=100&width=100"
        if (avatar instanceof File) return URL.createObjectURL(avatar)
        return avatar as string
    }

    // Navigation
    const accountOptions: AccountOption[] = [
        { label: "Perfil", icon: personOutline, action: "profile" },
        { label: "Seguridad", icon: shieldCheckmarkOutline, action: "security" },
    ]

    const handleSectionOpen = (action: string): void => {
        setActiveSection(action as ActiveSection)
    }

    const handleSectionClose = (): void => {
        setActiveSection(null)
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
        setShowPasswords({ current: false, new: false, confirm: false })
    }

    const logout = (): void => {
        sessionStorage.removeItem("token")
        history.push("/login")
    }

    // Profile Handlers
    const handleInputChange = (e: InputCustomEvent, field: string): void => {
        const value = e.detail.value || ""
        setProfile((prev) => ({ ...prev, [field]: value }))
    }

    const handleProfileSave = async (): Promise<void> => {
        setIsLoading(true)
        try {
            const profileData = { ...profile, ubicacion: profile.ubicacion || "" }
            await SettingsService.updateProfileSettings(profileData)
            await loadSettings()
            handleSectionClose()
            displayToast("Perfil actualizado correctamente")
        } catch (error) {
            console.error("Error updating profile:", error)
            displayToast("Error al actualizar el perfil")
        } finally {
            setIsLoading(false)
        }
    }

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
        const file = e.target.files?.[0]
        if (!file) return

        setProfile((prev) => ({ ...prev, avatar: file }))

        try {
            const profileData = { ...profile, avatar: file, ubicacion: profile.ubicacion || "" }
            await SettingsService.updateProfileSettings(profileData)
            await loadSettings()
            displayToast("Imagen actualizada correctamente")
        } catch (error) {
            console.error("Error updating avatar:", error)
            displayToast("Error al actualizar la imagen")
        }
    }

    // Security Handlers
    const validatePasswords = (): boolean => {
        if (!passwordData.currentPassword || !passwordData.newPassword) {
            displayToast("Todos los campos son obligatorios")
            return false
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            displayToast("Las contraseñas nuevas no coinciden")
            return false
        }

        if (passwordData.newPassword.length < 6) {
            displayToast("La nueva contraseña debe tener al menos 6 caracteres")
            return false
        }

        return true
    }

    const handlePasswordChange = async (): Promise<void> => {
        if (!validatePasswords()) return

        setIsLoading(true)
        try {
            await SettingsService.updatePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
            })
            displayToast("Contraseña actualizada correctamente")
            handleSectionClose()
        } catch (error) {
            console.error("Error updating password:", error)
            displayToast("Error al actualizar la contraseña")
        } finally {
            setIsLoading(false)
        }
    }

    const togglePasswordVisibility = (field: "current" | "new" | "confirm"): void => {
        setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }))
    }

    // Preference Handlers
    const handlePreferenceChange = async (e: CustomEvent, key: "modo_oscuro" | "notificaciones"): Promise<void> => {
        const newValue = e.detail.checked
        const previousValue = profile.preferencias?.[key]

        // Optimistic update
        setProfile((prev) => ({
            ...prev,
            preferencias: { ...prev.preferencias, [key]: newValue },
        }))

        if (key === "modo_oscuro") {
            applyTheme(newValue)
        }

        try {
            await SettingsService.updatePreference({ key, value: newValue })
        } catch (error) {
            console.error("Error updating preference:", error)
            displayToast("Error al actualizar la preferencia")

            // Revert changes
            setProfile((prev) => ({
                ...prev,
                preferencias: { ...prev.preferencias, [key]: previousValue },
            }))

            if (key === "modo_oscuro") {
                applyTheme(previousValue ?? false)
            }
        }
    }

    // Account Management
    const handleDeleteAccount = async (): Promise<void> => {
        setIsLoading(true)
        try {
            await SettingsService.deleteAccount()
            displayToast("Cuenta eliminada")
        } catch (error) {
            console.error("Error deleting account:", error)
            displayToast("Error al eliminar la cuenta")
        } finally {
            setIsLoading(false)
        }
    }

    // Profile Section Component
    const ProfileSection: React.FC = () => (
        <IonCard className="profile-section-card">
            <IonCardHeader>
                <IonToolbar>
                    <IonTitle>Editar Perfil</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={handleSectionClose} disabled={isLoading}>
                            <IonIcon icon={closeOutline} />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonCardHeader>
            <IonCardContent className="profile-form-content">
                <IonList className="profile-form-list">
                    <IonItem className="ion-margin-bottom editable-field">
                        <IonLabel style={{ marginBottom: "15px" }} position="floating">
                            Nickname
                        </IonLabel>
                        <IonInput
                            value={profile.nickname}
                            onIonChange={(e) => handleInputChange(e, "nickname")}
                            disabled={isLoading}
                        />
                    </IonItem>

                    <IonItem className="ion-margin-bottom editable-field">
                        <IonLabel style={{ marginBottom: "15px" }} position="floating">
                            Ubicación
                        </IonLabel>
                        <IonInput
                            value={profile.ubicacion}
                            onIonChange={(e) => handleInputChange(e, "ubicacion")}
                            disabled={isLoading}
                        />
                    </IonItem>

                    <IonItem className="ion-margin-bottom readonly-field">
                        <IonLabel style={{ marginBottom: "15px" }} position="floating">
                            Email
                        </IonLabel>
                        <IonInput value={profile.email} readonly type="email" />
                    </IonItem>

                    <IonItem className="ion-margin-bottom readonly-field">
                        <IonLabel style={{ marginBottom: "15px" }} position="floating">
                            Premium
                        </IonLabel>
                        <IonInput value={profile.premium} readonly />
                    </IonItem>

                    <div className="ion-padding-top">
                        <IonButton
                            expand="block"
                            color="primary"
                            className="ion-margin-top"
                            onClick={handleProfileSave}
                            disabled={isLoading}
                        >
                            {isLoading ? "Guardando..." : "Guardar cambios"}
                        </IonButton>
                    </div>
                </IonList>
            </IonCardContent>
        </IonCard>
    )

    // Security Section Component
    const SecuritySection: React.FC = () => (
        <IonCard className="profile-section-card">
            <IonCardHeader>
                <IonToolbar>
                    <IonTitle>Editar Contraseñas</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={handleSectionClose} disabled={isLoading}>
                            <IonIcon icon={closeOutline} />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonCardHeader>
            <IonCardContent className="profile-form-content">
                <IonList className="profile-form-list">
                    <IonItem className="ion-margin-bottom">
                        <IonLabel position="floating">Contraseña Actual</IonLabel>
                        <IonInput
                            type={showPasswords.current ? "text" : "password"}
                            value={passwordData.currentPassword}
                            onIonChange={(e) =>
                                setPasswordData((prev) => ({
                                    ...prev,
                                    currentPassword: e.detail.value || "",
                                }))
                            }
                            disabled={isLoading}
                        />
                        <IonButton slot="end" fill="clear" onClick={() => togglePasswordVisibility("current")} disabled={isLoading}>
                            <IonIcon icon={showPasswords.current ? eyeOutline : createOutline} />
                        </IonButton>
                    </IonItem>

                    <IonItem className="ion-margin-bottom">
                        <IonLabel position="floating">Nueva Contraseña</IonLabel>
                        <IonInput
                            type={showPasswords.new ? "text" : "password"}
                            value={passwordData.newPassword}
                            onIonChange={(e) =>
                                setPasswordData((prev) => ({
                                    ...prev,
                                    newPassword: e.detail.value || "",
                                }))
                            }
                            disabled={isLoading}
                        />
                        <IonButton slot="end" fill="clear" onClick={() => togglePasswordVisibility("new")} disabled={isLoading}>
                            <IonIcon icon={showPasswords.new ? eyeOutline : createOutline} />
                        </IonButton>
                    </IonItem>

                    <IonItem className="ion-margin-bottom">
                        <IonLabel position="floating">Confirmar Contraseña</IonLabel>
                        <IonInput
                            type={showPasswords.confirm ? "text" : "password"}
                            value={passwordData.confirmPassword}
                            onIonChange={(e) =>
                                setPasswordData((prev) => ({
                                    ...prev,
                                    confirmPassword: e.detail.value || "",
                                }))
                            }
                            disabled={isLoading}
                        />
                        <IonButton slot="end" fill="clear" onClick={() => togglePasswordVisibility("confirm")} disabled={isLoading}>
                            <IonIcon icon={showPasswords.confirm ? eyeOutline : createOutline} />
                        </IonButton>
                    </IonItem>

                    <div className="ion-padding-top">
                        <IonButton
                            expand="block"
                            color="primary"
                            className="ion-margin-top"
                            onClick={handlePasswordChange}
                            disabled={isLoading}
                        >
                            {isLoading ? "Guardando..." : "Guardar cambios"}
                        </IonButton>
                    </div>
                </IonList>
            </IonCardContent>
        </IonCard>
    )

    return (
        <>
            <Navegacion isDesktop={isDesktop} />

            <IonPage id="main-content" className={profile.preferencias?.modo_oscuro ? "dark-theme" : "light-theme"}>
                <IonHeader className="ion-no-border">
                    <IonToolbar className="main-toolbar" style={{ "--background": "4a80e4" }}>
                        <IonButtons slot="start">
                            <IonMenuButton>
                                <IonIcon
                                    icon={menuOutline}
                                    className="menu-icon"
                                />
                            </IonMenuButton>
                        </IonButtons>
                        <IonTitle className="toolbar-title">
                            <span className="title-text-settings">Ajustes</span>
                        </IonTitle>
                        <IonButtons slot="end">
                            <IonButton onClick={() => setShowAboutAlert(true)}>
                                <IonIcon slot="icon-only" icon={informationCircleOutline} />
                            </IonButton>
                        </IonButtons>
                    </IonToolbar>
                </IonHeader>

                <IonContent className="settings-content">
                    {/* User Profile Header */}
                    <div className="user-profile-section">
                        <div className="user-avatar" onClick={() => document.getElementById("fileInput")?.click()}>
                            <input type="file" id="fileInput" hidden accept="image/*" onChange={handleAvatarChange} />
                            <img src={getAvatarUrl(profile.avatar) || "/placeholder.svg"} alt="User profile" />

                        </div>
                        <div className="user-info">
                            <h2>{profile.nickname}</h2>
                            <p style={{ color: "black" }}>{profile.email}</p>
                        </div>
                    </div>

                    {/* Active Sections */}
                    {activeSection === "profile" && <ProfileSection />}
                    {activeSection === "security" && <SecuritySection />}

                    {/* Account Settings */}
                    <IonListHeader className="section-header">
                        <IonLabel>Cuenta</IonLabel>
                    </IonListHeader>
                    <IonList className="settings-list" lines="full">
                        {accountOptions.map((option, index) => (
                            <IonItem key={index} button detail onClick={() => handleSectionOpen(option.action)} disabled={isLoading}>
                                <IonIcon icon={option.icon} slot="start" className="settings-icon" />
                                <IonLabel>{option.label}</IonLabel>
                            </IonItem>
                        ))}
                    </IonList>

                    {/* Preferences */}
                    <IonListHeader className="section-header">
                        <IonLabel>Preferencias</IonLabel>
                    </IonListHeader>
                    <IonList className="settings-list" lines="full">
                        <IonItem>
                            <IonIcon icon={notificationsOutline} slot="start" className="settings-icon" />
                            <IonLabel>Notificaciones</IonLabel>
                            <IonToggle
                                checked={profile.preferencias?.notificaciones}
                                onIonChange={(e) => handlePreferenceChange(e, "notificaciones")}
                                disabled={isLoading}
                            />
                        </IonItem>

                        <IonItem>
                            <IonIcon icon={colorPaletteOutline} slot="start" className="settings-icon" />
                            <IonLabel>Modo oscuro</IonLabel>
                            <IonToggle
                                checked={profile.preferencias?.modo_oscuro}
                                onIonChange={(e) => handlePreferenceChange(e, "modo_oscuro")}
                                disabled={isLoading}
                            />
                        </IonItem>
                    </IonList>

                    {/* Danger Zone */}
                    <IonCard className="danger-zone">
                        <IonCardHeader>
                            <IonLabel className="danger-zone-title">Zona peligrosa</IonLabel>
                        </IonCardHeader>
                        <IonCardContent>
                            <IonButton
                                expand="block"
                                color="light"
                                className="logout-button"
                                onClick={() => setShowLogoutAlert(true)}
                                disabled={isLoading}
                            >
                                <IonIcon icon={logOutOutline} slot="start" />
                                Cerrar sesión
                            </IonButton>

                            <IonButton
                                expand="block"
                                color="danger"
                                className="delete-account-button"
                                onClick={() => setShowDeleteAccountAlert(true)}
                                disabled={isLoading}
                            >
                                <IonIcon icon={trashOutline} slot="start" />
                                Eliminar cuenta
                            </IonButton>
                        </IonCardContent>
                    </IonCard>

                    <div className="app-version">
                        <p>MiApp v1.0.0</p>
                    </div>

                    {/* Alerts */}
                    <IonAlert
                        isOpen={showLogoutAlert}
                        onDidDismiss={() => setShowLogoutAlert(false)}
                        header="Cerrar sesión"
                        message="¿Estás seguro de que deseas cerrar la sesión?"
                        buttons={[
                            { text: "Cancelar", role: "cancel" },
                            { text: "Sí, cerrar sesión", handler: logout },
                        ]}
                    />

                    <IonAlert
                        isOpen={showDeleteAccountAlert}
                        onDidDismiss={() => setShowDeleteAccountAlert(false)}
                        header="¡Advertencia!"
                        message="¿Realmente deseas eliminar tu cuenta? Esta acción no se puede deshacer."
                        buttons={[
                            { text: "Cancelar", role: "cancel" },
                            {
                                text: "Eliminar cuenta",
                                cssClass: "danger-button",
                                handler: handleDeleteAccount,
                            },
                        ]}
                    />

                    <IonAlert
                        isOpen={showAboutAlert}
                        onDidDismiss={() => setShowAboutAlert(false)}
                        header="Swapify App"
                        subHeader="Hecho con React e Ionic"
                        message="Desarrollado por Guille, Rafa y Javi 2025©."
                        buttons={["OK"]}
                    />

                    <IonToast
                        isOpen={showToast}
                        onDidDismiss={() => setShowToast(false)}
                        message={toastMessage}
                        duration={2000}
                        position="bottom"
                        color="dark"
                        buttons={[{ icon: closeOutline, role: "cancel" }]}
                    />
                </IonContent>
            </IonPage>
        </>
    )
}

export default Settings
