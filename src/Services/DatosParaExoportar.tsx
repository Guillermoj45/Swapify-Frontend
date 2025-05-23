import { useState, useEffect } from "react";
import { MensajeRecibeDTO } from "./websocket";

// Estado global para las notificaciones
let globalNotifications: MensajeRecibeDTO[] = [];
let listeners: Array<(notifications: MensajeRecibeDTO[]) => void> = [];

// Función para notificar a todos los listeners
const notifyListeners = () => {
  listeners.forEach(listener => listener([...globalNotifications]));
};

// Función para agregar una nueva notificación
export const addNotification = (notification: MensajeRecibeDTO) => {
  globalNotifications = [...globalNotifications, notification];
  notifyListeners();
};

// Función para limpiar todas las notificaciones
export const clearNotifications = () => {
  globalNotifications = [];
  notifyListeners();
};

// Hook personalizado que comparte el estado global
export const useNotifications = (): [MensajeRecibeDTO[], (notifications: MensajeRecibeDTO[]) => void] => {
  const [notifications, setNotifications] = useState<MensajeRecibeDTO[]>(globalNotifications);

  useEffect(() => {
    // Agregar el listener
    listeners.push(setNotifications);

    // Cleanup: remover el listener cuando el componente se desmonte
    return () => {
      listeners = listeners.filter(listener => listener !== setNotifications);
    };
  }, []);

  // Función setter que actualiza el estado global
  const setGlobalNotifications = (newNotifications: MensajeRecibeDTO[]) => {
    globalNotifications = newNotifications;
    notifyListeners();
  };

  return [notifications, setGlobalNotifications];
};