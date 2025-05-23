"use client"

import type React from "react"

import {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonNote,
    useIonViewDidEnter,
} from "@ionic/react"
import {
    timeOutline,
} from "ionicons/icons"
import "./Notification.css"
import { useEffect, useState } from "react"
import {WebSocketService} from "../../Services/websocket";

const Notifications: React.FC = () => {
    const [darkMode, setDarkMode] = useState(false)
    const [notifications, setNotifications] = useState<any[]>([]);

    useEffect(() => {
        const applyTheme = (isDarkMode: boolean) => {
            document.body.classList.remove('light-theme', 'dark-theme');
            document.body.classList.add(isDarkMode ? 'dark-theme' : 'light-theme');
        };

        const loadThemePreference = async () => {
            const storedTheme = sessionStorage.getItem('modoOscuroClaro');
            if (storedTheme !== null) {
                // Si hay un valor en sessionStorage, úsalo
                const isDarkMode = storedTheme === 'true';
                setDarkMode(isDarkMode);
                applyTheme(isDarkMode);
            }
        };

        loadThemePreference();
    }, []);

    useEffect(() => {
        WebSocketService.setNotificationCallback((newNotification) => {
            setNotifications((prev) => [newNotification, ...prev]);
        });
    }, []);



    const applyTheme = (isDark: boolean) => {
        console.log("Aplicando tema:", isDark ? "oscuro" : "claro") // Para depuración

        // Primero eliminar ambas clases para evitar conflictos
        document.body.classList.remove("dark-theme", "light-theme")

        // Luego aplicar la clase correcta
        if (isDark) {
            document.body.classList.add("dark-theme")
        } else {
            document.body.classList.add("light-theme")
        }
    }

    // Asegurar que el tema se aplique cuando la vista se active
    useIonViewDidEnter(() => {
        console.log("Vista activada, aplicando tema") // Para depuración
        applyTheme(darkMode)
    })

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar className="header-toolbar">
                    <IonTitle className="notifications-title">Notificaciones</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent className="notifications-content">
                <IonList className="notification-list">
                    {notifications.length > 0 ? (
                        notifications.map((notification) => (
                            <IonItem key={notification.id} className={notification.unread ? "unread-notification" : ""}>
                                <div className="notification-icon-container">
                                    <IonIcon icon={notification.icon} className="notification-icon" />
                                </div>
                                <div className="notification-content">
                                    <IonLabel className="notification-title">
                                        {notification.title}
                                        {notification.unread && <span className="unread-dot"></span>}
                                    </IonLabel>
                                    <IonNote className="notification-description">{notification.description}</IonNote>
                                    <div className="notification-time">
                                        <IonIcon icon={timeOutline} className="time-icon" />
                                        <span>{notification.time}</span>
                                    </div>
                                </div>
                            </IonItem>
                        ))
                    ) : (
                        <div className="empty-notifications">
                            <p>No tienes notificaciones</p>
                        </div>
                    )}
                </IonList>
            </IonContent>
        </IonPage>
    );
}

export default Notifications
