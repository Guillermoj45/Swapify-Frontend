import type React from "react";
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
import { useEffect, useState } from "react";
import { useNotifications } from "../../Services/DatosParaExoportar";

const Notifications: React.FC = () => {
    const [notifications] = useNotifications();
    const [darkMode, setDarkMode] = useState(false);

    useEffect(() => {
        const applyTheme = (isDarkMode: boolean) => {
            document.body.classList.remove("light-theme", "dark-theme");
            document.body.classList.add(isDarkMode ? "dark-theme" : "light-theme");
        };

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

    const applyTheme = (isDark: boolean) => {
        document.body.classList.remove("dark-theme", "light-theme");
        document.body.classList.add(isDark ? "dark-theme" : "light-theme");
    };

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