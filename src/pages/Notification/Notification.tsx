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
    useIonViewDidEnter, IonIcon,
} from "@ionic/react";
import "./Notification.css";
import { useNotifications } from "../../Services/DatosParaExoportar";
import { NotificationService } from "../../Services/NotificationService";
import {trashOutline} from "ionicons/icons";
import {MensajeRecibeDTO} from "../../Services/websocket";

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
        NotificationService.getNotifications()
            .then(notifications => {
                // Ordenar las notificaciones de más antigua a más nueva
                const sortedNotifications = notifications.sort((a, b) => {
                    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
                });
                setGlobalNotifications(sortedNotifications);
            })
            .catch(error => {
                console.error("Error al cargar las notificaciones:", error);
            });
    }, []);

    // Hook para aplicar tema cuando la vista se activa
    useIonViewDidEnter(() => {
        applyTheme(darkMode);
    });

    const deleteNotification = async (notification: MensajeRecibeDTO) => {
        try {
            await NotificationService.deleteNotification(notification);

            // Actualizar el estado global después de eliminar
            const updatedNotifications = await NotificationService.getNotifications();
            const sortedNotifications = updatedNotifications.sort((a, b) => {
                return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
            });
            setGlobalNotifications(sortedNotifications);

        } catch (error) {
            console.error('Error al eliminar la notificación:', error);
        }
    };

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
                                <IonIcon
                                    icon={trashOutline}
                                    slot="end"
                                    className="delete-icon-circle"
                                    onClick={() => deleteNotification(notification)}
                                />
                            </IonItem>
                        ))
                    )}
                </IonList>
            </IonContent>
        </IonPage>
    );
};

export default Notifications;