import API from './api';

export interface MensajeRecibeDTO {
    content: string;
    senderName: string;
    token?: string;
    timestamp: string;
    type: string;
    userName: string;
}

export const NotificationService = {
    getNotifications: async (): Promise<MensajeRecibeDTO[]> => {
        try {
            const response = await API.get('/notification/getAllNotifications');
            return response.data;
        } catch (error) {
            console.error('Error al obtener notificaciones:', error);
            throw error;
        }
    },

    deleteNotification: async (notificacion: MensajeRecibeDTO): Promise<void> => {
        try {
            await API.post('/notification/deleteNotification', notificacion);
        } catch (error) {
            console.error('Error al eliminar la notificación:', error);
            throw error;
        }
    }
};