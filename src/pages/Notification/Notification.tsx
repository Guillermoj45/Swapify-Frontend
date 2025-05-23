"use client";

import type React from "react";

import {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonList,
    useIonViewDidEnter,
} from "@ionic/react";
import "./Notification.css";
import { useEffect, useState } from "react";
import { WebSocketService } from "../../Services/websocket";
import { useNotifications } from "../../Services/DatosParaExoportar";

const Notifications: React.FC = () => {
    const [notifications] = useNotifications();
    const [darkMode, setDarkMode] = useState(false);
    const [message, setMessage] = useState<string>("");

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

    useEffect(() => {
        console.log("Notificaciones actualizadas:", notifications); // Para depuración
        setMessage(`Notificaciones actualizadas: ${notifications.length}`);
    }, [notifications]);

    const applyTheme = (isDark: boolean) => {
        console.log("Aplicando tema:", isDark ? "oscuro" : "claro"); // Para depuración
        document.body.classList.remove("dark-theme", "light-theme");
        document.body.classList.add(isDark ? "dark-theme" : "light-theme");
    };

    useIonViewDidEnter(() => {
        console.log("Vista activada, aplicando tema"); // Para depuración
        applyTheme(darkMode);
    });

    useEffect(() => {
        WebSocketService.waitForConnection()
            .then(() => {
                WebSocketService.setNotificationCallback((newNotification) => {
                    console.log("Nueva notificación:", newNotification); // Para depuración
                });
            })
            .catch((error) => {
                console.error("Error al conectar con WebSocket:", error);
            });
    }, []);

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar className="header-toolbar">
                    <IonTitle className="notifications-title">Notificaciones</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent className="notifications-content">
                <IonList className="notification-list">
                    <p>{message}</p> {/* Renderizar el mensaje */}
                </IonList>
            </IonContent>
        </IonPage>
    );
};

export default Notifications;