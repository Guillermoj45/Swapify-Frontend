import React, { useEffect, useState } from "react";
import {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonList,
    IonItem,
    IonLabel,
    useIonViewDidEnter,
} from "@ionic/react";
import "./Notification.css";
import { useNotifications } from "../../Services/DatosParaExoportar";
import { NotificationService } from "../../Services/NotificationService";

const Notifications: React.FC = () => {
    const [notifications, setGlobalNotifications] = useNotifications();
    const [darkMode, setDarkMode] = useState(false);

    // Función para aplicar el tema
    const applyTheme = (isDark: boolean) => {
        document.body.classList.remove("dark-theme", "light-theme");
        document.body.classList.add(isDark ? "dark-theme" : "light-theme");
    };

    // Efecto para cargar la preferencia del tema
    useEffect(() => {
        const loadThemePreference = async () => {
            const storedTheme = sessionStorage.getItem("modoOscuroClaro");
            if (storedTheme !== null) {
                const isDarkMode = storedTheme === "true";
                setDarkMode(isDarkMode);
                applyTheme(isDarkMode);
            }
        };

        loadThemePreference();
    }, []);

    // Efecto para cargar notificaciones
    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const backendNotifications = await NotificationService.getNotifications();
                if (backendNotifications) {
                    setGlobalNotifications(backendNotifications);
                }
            } catch (error) {
                console.error('Error al obtener las notificaciones:', error);
            }
        };

        fetchNotifications();
    }, [setGlobalNotifications]);

    // Hook para aplicar tema cuando la vista se activa
    useIonViewDidEnter(() => {
        applyTheme(darkMode);
    });

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar className="header-toolbar">
                    <IonTitle className="notifications-title">
                        Notificaciones ({notifications.length})
                    </IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent className="notifications-content">
                <IonList className="notification-list">
                    {notifications.length === 0 ? (
                        <IonItem>
                            <IonLabel>No hay notificaciones</IonLabel>
                        </IonItem>
                    ) : (
                        notifications.map((notification, index) => (
                            <IonItem key={`${notification.timestamp}-${index}`}>
                                <IonLabel>
                                    <h2>{notification.senderName}</h2>
                                    <p>{notification.content}</p>
                                    <p className="notification-time">
                                        {new Date(notification.timestamp).toLocaleString()}
                                    </p>
                                </IonLabel>
                            </IonItem>
                        ))
                    )}
                </IonList>
            </IonContent>
        </IonPage>
    );
};

export default Notifications;