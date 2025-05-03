import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import {
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonPage,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonToggle,
    IonListHeader,
    IonAvatar,
    IonAlert,
    IonToast,
    IonActionSheet,
    IonCard,
    IonCardHeader,
    IonCardContent,
    IonInput
} from '@ionic/react';
import {
    informationCircleOutline,
    personOutline,
    shieldCheckmarkOutline,
    logOutOutline,
    trashOutline,
    camera,
    chevronForward,
    closeOutline,
    eyeOutline,
    createOutline,
    colorPaletteOutline,
    notificationsOutline,
} from 'ionicons/icons';
import './Settings.css';

const Settings: React.FC = () => {

    const [avatarUrl, setAvatarUrl] = useState('');
    const history = useHistory();
    // Settings state
    const [settings, setSettings] = useState({
        notifications: true,
        darkMode: false,
        language: 'español',
        dataSync: true,
        biometricLogin: false,
        dataSaver: false,
        analytics: true
    });

    // UI states
    const [showLogoutAlert, setShowLogoutAlert] = useState(false);
    const [showDeleteAccountAlert, setShowDeleteAccountAlert] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [showActionSheet, setShowActionSheet] = useState(false);
    const [actionSheetTitle] = useState('');
    const [showAboutAlert, setShowAboutAlert] = useState(false);
    const [activeSection, setActiveSection] = useState<string | null>(null);

    // General options
    const accountOptions = [
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

    useEffect(() => {
        // Load saved settings (this could be from localStorage or an API)
        loadSavedSettings();
    }, []);

    const loadSavedSettings = () => {
        // Placeholder for loading settings from storage or API
        console.log('Loading saved settings...');
        // Typically would use localStorage, a state manager or API call here
    };

    const toggleSetting = (setting: string, checked: boolean) => {
        setSettings(prevSettings => ({
            ...prevSettings,
            [setting]: checked
        }));

        // Save setting (could use a service instead)
        console.log(`Setting ${setting} changed to ${checked}`);

        // Show feedback toast for major settings
        if (setting === 'darkMode') {
            document.body.classList.toggle('dark-theme', checked);
            displayToast(`Modo oscuro ${checked ? 'activado' : 'desactivado'}`);
        }

        if (setting === 'biometricLogin') {
            displayToast(`Acceso biométrico ${checked ? 'activado' : 'desactivado'}`);
        }
    };

    const openAccountOption = (action: string) => {
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

    const closeActiveSection = () => {
        setActiveSection(null);
    };

    const displayToast = (message: string) => {
        setToastMessage(message);
        setShowToast(true);
    };

    const logout = () => {
        sessionStorage.removeItem('token');
        history.push('/login');
    };

    // Componente para la sección de Perfil
    const ProfileSection: React.FC<{onClose: () => void}> = ({ onClose }) => {
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
                        <IonItem className="ion-margin-bottom">
                            <IonLabel position="floating">Nombre</IonLabel>
                            <IonInput value="" />
                        </IonItem>

                        <IonItem className="ion-margin-bottom">
                            <IonLabel position="floating">Nickname</IonLabel>
                            <IonInput value="" />
                        </IonItem>

                        <IonItem className="ion-margin-bottom">
                            <IonLabel position="floating">Email</IonLabel>
                            <IonInput value="" type="email" />
                        </IonItem>

                        <IonItem className="ion-margin-bottom">
                            <IonLabel position="floating">Teléfono</IonLabel>
                            <IonInput value="" type="tel" />
                        </IonItem>

                        <IonItem className="ion-margin-bottom">
                            <IonLabel position="floating">Premium</IonLabel>
                            <IonInput value="" readonly/>
                        </IonItem>

                        <div className="ion-padding-top">
                            <IonButton expand="block" color="primary" className="ion-margin-top" onClick={onClose}>
                                Guardar cambios
                            </IonButton>
                        </div>
                    </IonList>
                </IonCardContent>
            </IonCard>
        );
    };

    // Componente para la sección de Seguridad
    const SecuritySection: React.FC<{onClose: () => void}> = ({ onClose }) => {
        const [showCurrentPassword, setShowCurrentPassword] = useState(false);
        const [showNewPassword, setShowNewPassword] = useState(false);
        const [showConfirmPassword, setShowConfirmPassword] = useState(false);

        // Estados para almacenar los valores de las contraseñas
        const [currentPassword, setCurrentPassword] = useState('');
        const [newPassword, setNewPassword] = useState('');
        const [confirmPassword, setConfirmPassword] = useState('');

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
                                value={currentPassword}
                                onIonChange={e => setCurrentPassword(e.detail.value || '')}
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
                                value={newPassword}
                                onIonChange={e => setNewPassword(e.detail.value || '')}
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
                                value={confirmPassword}
                                onIonChange={e => setConfirmPassword(e.detail.value || '')}
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
                            <IonButton expand="block" color="primary" className="ion-margin-top" onClick={onClose}>
                                Guardar cambios
                            </IonButton>
                        </div>
                    </IonList>
                </IonCardContent>
            </IonCard>
        );
    };

    return (
        <IonPage>
            <IonHeader className="ion-no-border">
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonBackButton defaultHref="/home" />
                    </IonButtons>
                    <IonTitle>Ajustes</IonTitle>
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
                        <IonAvatar>
                            <img src={avatarUrl} alt="User profile" />
                        </IonAvatar>
                        <div className="edit-badge">
                            <IonIcon icon={camera} />
                        </div>
                    </div>
                    <input
                        id="fileInput"
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                const reader = new FileReader();
                                reader.onload = () => {
                                    if (reader.result) {
                                        setAvatarUrl(reader.result.toString());
                                        setActiveSection('profile');
                                    }
                                };
                                reader.readAsDataURL(file);
                            }
                        }}
                    />
                    <div className="user-info">
                        <h2>Ana García</h2>
                        <p>ana.garcia@email.com</p>
                        <IonButton
                            fill="clear"
                            color="primary"
                            size="small"
                            onClick={() => setActiveSection('profile')}
                        >
                            Editar perfil
                            <IonIcon icon={chevronForward} slot="end" />
                        </IonButton>
                    </div>
                </div>

                {/* Renderizar secciones activas */}
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
                            checked={settings.notifications}
                            onIonChange={e => toggleSetting('notifications', e.detail.checked)}
                        />
                    </IonItem>

                    <IonItem>
                        <IonIcon icon={colorPaletteOutline} slot="start" className="settings-icon" />
                        <IonLabel>Modo oscuro</IonLabel>
                        <IonToggle
                            checked={settings.darkMode}
                            onIonChange={e => toggleSetting('darkMode', e.detail.checked)}
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
                            <IonIcon icon={logOutOutline} slot="start" onClick={logout} />
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
                            handler: () => {
                                console.log('Cerrando sesión...');
                                logout();
                            }
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
                                console.log('Deleting account...');
                                displayToast('Cuenta eliminada');
                            }
                        }
                    ]}
                />

                <IonAlert
                    isOpen={showAboutAlert}
                    onDidDismiss={() => setShowAboutAlert(false)}
                    header="Acerca de"
                    subHeader="MiApp v1.0.0"
                    message="Desarrollado con React e Ionic.<br>© 2025 MiEmpresa. Todos los derechos reservados."
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
    );
};

export default Settings;