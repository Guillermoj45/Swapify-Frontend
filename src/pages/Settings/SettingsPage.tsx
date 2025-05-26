import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
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
    IonActionSheet,
    IonCard,
    IonCardHeader,
    IonCardContent,
    IonInput,
    IonMenuButton,
    InputCustomEvent
} from '@ionic/react';
import {
    informationCircleOutline,
    personOutline,
    shieldCheckmarkOutline,
    logOutOutline,
    trashOutline,
    camera,
    closeOutline,
    eyeOutline,
    createOutline,
    colorPaletteOutline,
    notificationsOutline,
    menuOutline,
} from 'ionicons/icons';
import './Settings2.css';
import { Settings as SettingsService } from '../../Services/SettingsService';
import cloudinaryImage from "../../Services/CloudinaryService";
import { ProfileSettings } from '../../Models/ProfileSettings';
import Navegacion from "../../components/Navegation";
import useAuthRedirect from "../../Services/useAuthRedirect";

// Definimos una interfaz para nuestro estado de perfil
interface ProfileState {
    nickname: string;
    email: string;
    avatar: string;
    premium: string;
    preferencias: {
        notifications: boolean;
        darkMode: boolean;
    };
}

interface PasswordState {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

// Definimos el tipo para nuestras secciones activas
type ActiveSection = 'profile' | 'security' | 'privacy' | null;

// Definimos la interfaz para las opciones de cuenta
interface AccountOption {
    label: string;
    icon: string;
    action: string;
}

// Interfaz para las props de las secciones de perfil y seguridad
interface SectionProps {
    onClose: () => void;
}

interface ProfileWithFile extends Omit<ProfileSettings, 'avatar'> {
    avatar?: string | File;
}

const Settings: React.FC = () => {

    useAuthRedirect()

    const history = useHistory();

    // UI states
    const [activeSection, setActiveSection] = useState<ActiveSection>(null);
    const [showToast, setShowToast] = useState<boolean>(false);
    const [toastMessage, setToastMessage] = useState<string>('');

    // Estado para detectar si es escritorio
    const [isDesktop, setIsDesktop] = useState<boolean>(window.innerWidth >= 768);

    // Alert states
    const [showLogoutAlert, setShowLogoutAlert] = useState<boolean>(false);
    const [showDeleteAccountAlert, setShowDeleteAccountAlert] = useState<boolean>(false);
    const [showAboutAlert, setShowAboutAlert] = useState<boolean>(false);

    // Action sheet state
    const [showActionSheet, setShowActionSheet] = useState<boolean>(false);
    const [actionSheetTitle] = useState<string>('');

    // Profile state
    const [profile, setProfile] = useState<ProfileWithFile>({
        nickname: '',
        email: '',
        avatar: '',
        premium: '',
        preferencias: {
            notificaciones: true,
            modo_oscuro: false,
        },
    });

    useEffect(() => {
        const initializeTheme = async () => {
            if (!sessionStorage.getItem('token')) {
                history.push('/login');
                return;
            }

            try {
                // 1. Primero obtenemos y aplicamos el tema del sessionStorage
                const savedDarkMode = sessionStorage.getItem('modoOscuroClaro');
                const initialDarkMode = savedDarkMode === 'true';

                // 2. Aplicamos el tema inmediatamente
                const body = document.body;
                const root = document.documentElement;

                body.classList.remove('dark-theme', 'light-theme');
                body.classList.add(initialDarkMode ? 'dark-theme' : 'light-theme');
                root.setAttribute('data-theme', initialDarkMode ? 'dark' : 'light');

                // 3. Actualizamos el estado del switch
                setProfile(prev => ({
                    ...prev,
                    preferencias: {
                        ...prev.preferencias,
                        modo_oscuro: initialDarkMode
                    }
                }));

                // 4. Luego cargamos el resto de configuraciones
                const profileSettings = await SettingsService.getProfileSettings();
                const avatarUrl = profileSettings.avatar
                    ? cloudinaryImage(profileSettings.avatar)
                    : '';

                setProfile(prev => ({
                    ...prev,
                    nickname: profileSettings.nickname || '',
                    email: profileSettings.email || '',
                    avatar: avatarUrl,
                    premium: profileSettings.premium || '',
                    preferencias: {
                        notificaciones: profileSettings.preferencias?.notificaciones ?? true,
                        modo_oscuro: initialDarkMode, // Mantenemos el valor del sessionStorage
                    },
                }));

            } catch (error) {
                console.error('Error loading settings:', error);
                displayToast('Error al cargar configuraciones');

                // En caso de error, aseguramos el tema claro por defecto
                document.body.classList.remove('dark-theme');
                document.body.classList.add('light-theme');
                document.documentElement.setAttribute('data-theme', 'light');
            }
        };

        initializeTheme();
    }, []);

    // Detectar cambios en el tamaño de la pantalla
    useEffect(() => {
        const handleResize = () => {
            setIsDesktop(window.innerWidth >= 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Navigation options
    const accountOptions: AccountOption[] = [
        {
            label: 'Perfil',
            icon: personOutline,
            action: 'openProfile'
        },
        {
            label: 'Seguridad',
            icon: shieldCheckmarkOutline,
            action: 'openSecurity'
        },
    ];

    const openAccountOption = (action: string): void => {
        console.log(`Opening ${action}`);

        switch (action) {
            case 'openProfile':
                setActiveSection('profile');
                break;
            case 'openSecurity':
                setActiveSection('security');
                break;
            case 'openPrivacy':
                setActiveSection('privacy');
                break;
            default:
                setActiveSection(null);
        }
    };

    const closeActiveSection = (): void => {
        setActiveSection(null);
    };

    const displayToast = (message: string): void => {
        setToastMessage(message);
        setShowToast(true);
    };

    const logout = (): void => {
        sessionStorage.removeItem('token');
        history.push('/login');
    };

    const getAvatarUrl = (avatar: string | File | undefined): string => {
        if (!avatar) return '';
        if (avatar instanceof File) {
            return URL.createObjectURL(avatar);
        }
        return avatar as string;
    };

    const loadSettings = async (): Promise<void> => {
        try {
            const profileSettings = await SettingsService.getProfileSettings();

            const avatarUrl = profileSettings.avatar
                ? cloudinaryImage(profileSettings.avatar)
                : '';

            setProfile({
                nickname: profileSettings.nickname || '',
                email: profileSettings.email || '',
                avatar: avatarUrl,
                premium: profileSettings.premium || '',
                preferencias: {
                    notificaciones: profileSettings.preferencias?.notificaciones ?? true,
                    modo_oscuro: profileSettings.preferencias?.modo_oscuro ?? false,
                },
            });

            // Aplicar el modo oscuro inicial
            applyTheme(profileSettings.preferencias?.modo_oscuro ?? false);
        } catch (error) {
            console.error('Error loading settings:', error);
            displayToast('Error al cargar configuraciones');
        }
    };

    // Función para aplicar el tema de forma consistente
    const applyTheme = (isDark: boolean): void => {
        const body = document.body;
        const root = document.documentElement;

        body.classList.remove('dark-theme', 'light-theme');

        if (isDark) {
            body.classList.add('dark-theme');
            body.classList.remove('light-theme');
            root.setAttribute('data-theme', 'dark');
        } else {
            body.classList.add('light-theme');
            body.classList.remove('dark-theme');
            root.setAttribute('data-theme', 'light');
        }

        // Forzar re-renderización al cambiar el tema
        setProfile(prevProfile => ({
            ...prevProfile,
            preferencias: {
                ...prevProfile.preferencias,
                modo_oscuro: isDark
            }
        }));

        // Guardar preferencia en sessionStorage
        sessionStorage.setItem('modoOscuroClaro', isDark.toString());
    };

    const handlePreferenceChange = async (e: CustomEvent, key: 'modo_oscuro' | 'notificaciones') => {
        const newValue = e.detail.checked;

        try {
            // Actualizamos el estado local primero
            setProfile(prevProfile => ({
                ...prevProfile,
                preferencias: {
                    ...prevProfile.preferencias,
                    [key]: newValue
                }
            }));

            // Si es el modo oscuro, aplicamos el tema usando nuestra función
            if (key === 'modo_oscuro') {
                applyTheme(newValue);
            }

            // Enviamos el cambio al backend
            await SettingsService.updatePreference({
                key: key,
                value: newValue
            });

        } catch (error) {
            console.error('Error actualizando preferencia:', error);
            displayToast('Error al actualizar la preferencia');

            // Revertimos el cambio en caso de error
            setProfile(prevProfile => ({
                ...prevProfile,
                preferencias: {
                    ...prevProfile.preferencias,
                    [key]: !newValue
                }
            }));

            // Revertimos también el tema
            if (key === 'modo_oscuro') {
                applyTheme(!newValue);
            }
        }
    };



    const ProfileSection: React.FC<SectionProps> = ({ onClose }) => {
        const handleInputChange = (e: InputCustomEvent, field: keyof ProfileState): void => {
            const value = e.detail.value || '';
            setProfile(prevProfile => ({
                ...prevProfile,
                [field]: value
            }));
        };

        const handleSave = async (): Promise<void> => {
            try {
                await SettingsService.updateProfileSettings(profile);
                await loadSettings();
                onClose();
                displayToast('Perfil actualizado correctamente');
            } catch (error) {
                console.error('Error al guardar:', error);
                displayToast('Error al actualizar el perfil');
            }
        };

        return (
            <IonCard className="profile-section-card">
                <IonCardHeader>
                    <IonToolbar>
                        <IonTitle>Editar Perfil</IonTitle>
                        <IonButtons slot="end">
                            <IonButton onClick={onClose}>
                                <IonIcon icon={closeOutline} />
                            </IonButton>
                        </IonButtons>
                    </IonToolbar>
                </IonCardHeader>
                <IonCardContent className="profile-form-content">
                    <IonList className="profile-form-list">
                        <IonItem className="ion-margin-bottom editable-field">
                            <IonLabel position="floating">Nickname</IonLabel>
                            <IonInput
                                value={profile.nickname}
                                onIonChange={(e) => handleInputChange(e, 'nickname')}
                            />
                        </IonItem>

                        <IonItem className="ion-margin-bottom readonly-field">
                            <IonLabel position="floating">Email</IonLabel>
                            <IonInput
                                value={profile.email}
                                readonly
                                type="email"
                            />
                        </IonItem>

                        <IonItem className="ion-margin-bottom readonly-field">
                            <IonLabel position="floating">Premium</IonLabel>
                            <IonInput
                                value={profile.premium}
                                readonly
                            />
                        </IonItem>

                        <div className="ion-padding-top">
                            <IonButton
                                expand="block"
                                color="primary"
                                className="ion-margin-top"
                                onClick={handleSave}
                            >
                                Guardar cambios
                            </IonButton>
                        </div>
                    </IonList>
                </IonCardContent>
            </IonCard>
        );
    };

    const SecuritySection: React.FC<SectionProps> = ({ onClose }) => {
        const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
        const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
        const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
        const [passwordData, setPasswordData] = useState<PasswordState>({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });

        const handlePasswordChange = async (): Promise<void> => {
            try {
                if (passwordData.newPassword !== passwordData.confirmPassword) {
                    displayToast('Las contraseñas nuevas no coinciden');
                    return;
                }

                if (!passwordData.currentPassword || !passwordData.newPassword) {
                    displayToast('Todos los campos son obligatorios');
                    return;
                }

                await SettingsService.updatePassword({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                });

                displayToast('Contraseña actualizada correctamente');
                onClose();
            } catch (error) {
                console.error('Error al cambiar la contraseña:', error);
                displayToast('Error al actualizar la contraseña');
            }
        };

        return (
            <IonCard className="profile-section-card">
                <IonCardHeader>
                    <IonToolbar>
                        <IonTitle>Editar Contraseñas</IonTitle>
                        <IonButtons slot="end">
                            <IonButton onClick={onClose}>
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
                                type={showCurrentPassword ? "text" : "password"}
                                value={passwordData.currentPassword}
                                onIonChange={e => setPasswordData({
                                    ...passwordData,
                                    currentPassword: e.detail.value || ''
                                })}
                            />
                            <IonButton
                                slot="end"
                                fill="clear"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            >
                                <IonIcon icon={showCurrentPassword ? eyeOutline : createOutline} />
                            </IonButton>
                        </IonItem>

                        <IonItem className="ion-margin-bottom">
                            <IonLabel position="floating">Nueva Contraseña</IonLabel>
                            <IonInput
                                type={showNewPassword ? "text" : "password"}
                                value={passwordData.newPassword}
                                onIonChange={e => setPasswordData({
                                    ...passwordData,
                                    newPassword: e.detail.value || ''
                                })}
                            />
                            <IonButton
                                slot="end"
                                fill="clear"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                            >
                                <IonIcon icon={showNewPassword ? eyeOutline : createOutline} />
                            </IonButton>
                        </IonItem>

                        <IonItem className="ion-margin-bottom">
                            <IonLabel position="floating">Confirmar Contraseña</IonLabel>
                            <IonInput
                                type={showConfirmPassword ? "text" : "password"}
                                value={passwordData.confirmPassword}
                                onIonChange={e => setPasswordData({
                                    ...passwordData,
                                    confirmPassword: e.detail.value || ''
                                })}
                            />
                            <IonButton
                                slot="end"
                                fill="clear"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                <IonIcon icon={showConfirmPassword ? eyeOutline : createOutline} />
                            </IonButton>
                        </IonItem>

                        <div className="ion-padding-top">
                            <IonButton
                                expand="block"
                                color="primary"
                                className="ion-margin-top"
                                onClick={handlePasswordChange}
                            >
                                Guardar cambios
                            </IonButton>
                        </div>
                    </IonList>
                </IonCardContent>
            </IonCard>
        );
    };

    return (
        <>
            <Navegacion isDesktop={isDesktop} />

            <IonPage id="main-content" className={profile.preferencias?.modo_oscuro ? 'dark-theme' : 'light-theme'}>
                <IonHeader className="ion-no-border">
                    <IonToolbar className="main-toolbar" style={{ '--background': '4a80e4' }}>
                        <IonButtons slot="start">
                            <IonMenuButton>
                                <IonIcon
                                    icon={menuOutline}
                                    style={{
                                        color: profile.preferencias?.modo_oscuro ? 'white' : 'black',
                                        fontSize: '24px'
                                    }}
                                />
                            </IonMenuButton>
                        </IonButtons>
                        <IonTitle className="toolbar-title">
                            <span className="title-text">Ajustes</span>
                        </IonTitle>
                        <IonButtons slot="end">
                            <IonButton onClick={() => setShowAboutAlert(true)}>
                                <IonIcon slot="icon-only" icon={informationCircleOutline} />
                            </IonButton>
                        </IonButtons>
                    </IonToolbar>
                </IonHeader>

                <IonContent className="settings-content">
                    <div className="user-profile-section">
                        <div className="user-avatar" onClick={() => document.getElementById('fileInput')?.click()}>
                            <input
                                type="file"
                                id="fileInput"
                                hidden
                                accept="image/*"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        setProfile(prev => ({
                                            ...prev,
                                            avatar: file
                                        }));

                                        try {
                                            await SettingsService.updateProfileSettings({
                                                ...profile,
                                                avatar: file
                                            });
                                            await loadSettings();
                                            displayToast('Imagen actualizada correctamente');
                                        } catch (error) {
                                            console.error('Error al actualizar la imagen:', error);
                                            displayToast('Error al actualizar la imagen');
                                        }
                                    }
                                }}
                            />

                            <img src={getAvatarUrl(profile.avatar)} alt="User profile" />

                            <div className={`edit-badge ${profile.preferencias?.modo_oscuro ? '' : 'light-mode-icon'}`}>
                                <IonIcon icon={camera} />
                            </div>
                        </div>

                        <div className="user-info">
                            <h2>{profile.nickname}</h2>
                            <p style={{color: "black"}}>{profile.email}</p>
                        </div>
                    </div>

                    {/* Secciones activas */}
                    {activeSection === 'profile' && <ProfileSection onClose={closeActiveSection} />}
                    {activeSection === 'security' && <SecuritySection onClose={closeActiveSection} />}

                    {/* Account Settings */}
                    <IonListHeader className="section-header">
                        <IonLabel>Cuenta</IonLabel>
                    </IonListHeader>
                    <IonList className="settings-list" lines="full">
                        {accountOptions.map((option, index) => (
                            <IonItem key={index} button detail onClick={() => openAccountOption(option.action)}>
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
                                onIonChange={(e) => handlePreferenceChange(e, 'notificaciones')}
                            />
                        </IonItem>

                        <IonItem>
                            <IonIcon icon={colorPaletteOutline} slot="start" className="settings-icon" />
                            <IonLabel>Modo oscuro</IonLabel>
                            <IonToggle
                                checked={profile.preferencias?.modo_oscuro}
                                onIonChange={(e) => handlePreferenceChange(e, 'modo_oscuro')}
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
                            >
                                <IonIcon icon={logOutOutline} slot="start" />
                                Cerrar sesión
                            </IonButton>

                            <IonButton
                                expand="block"
                                color="danger"
                                className="delete-account-button"
                                onClick={() => setShowDeleteAccountAlert(true)}
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
                            {
                                text: 'Cancelar',
                                role: 'cancel'
                            },
                            {
                                text: 'Sí, cerrar sesión',
                                handler: logout
                            }
                        ]}
                    />

                    <IonAlert
                        isOpen={showDeleteAccountAlert}
                        onDidDismiss={() => setShowDeleteAccountAlert(false)}
                        header="¡Advertencia!"
                        message="¿Realmente deseas eliminar tu cuenta? Esta acción no se puede deshacer."
                        buttons={[
                            {
                                text: 'Cancelar',
                                role: 'cancel'
                            },
                            {
                                text: 'Eliminar cuenta',
                                cssClass: 'danger-button',
                                handler: () => {
                                    SettingsService.deleteAccount();
                                    displayToast('Cuenta eliminada');
                                    history.push('/login');
                                }
                            }
                        ]}
                    />

                    <IonAlert
                        isOpen={showAboutAlert}
                        onDidDismiss={() => setShowAboutAlert(false)}
                        header="Swapify App"
                        subHeader="Hecho con React e Ionic"
                        message="Desarrollado por Guille, Rafa y Javi 2025©."
                        buttons={['OK']}
                    />

                    <IonToast
                        isOpen={showToast}
                        onDidDismiss={() => setShowToast(false)}
                        message={toastMessage}
                        duration={2000}
                        position="bottom"
                        color="dark"
                        buttons={[
                            {
                                icon: closeOutline,
                                role: 'cancel'
                            }
                        ]}
                    />

                    <IonActionSheet
                        isOpen={showActionSheet}
                        onDidDismiss={() => setShowActionSheet(false)}
                        header={`Opciones de ${actionSheetTitle}`}
                        buttons={[
                            {
                                text: `Ver ${actionSheetTitle}`,
                                icon: eyeOutline,
                                handler: () => {
                                    console.log(`View ${actionSheetTitle}`);
                                }
                            },
                            {
                                text: `Editar ${actionSheetTitle}`,
                                icon: createOutline,
                                handler: () => {
                                    console.log(`Edit ${actionSheetTitle}`);
                                }
                            },
                            {
                                text: 'Cancelar',
                                icon: closeOutline,
                                role: 'cancel'
                            }
                        ]}
                    />
                </IonContent>
            </IonPage>
        </>
    );
};

export default Settings;