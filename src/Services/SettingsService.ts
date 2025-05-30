import api from "./apiConfig";
import { ProfileSettings } from "../Models/ProfileSettings";

interface ProfileWithFile extends Omit<ProfileSettings, 'avatar'> {
    ubicacion: string;
    avatar?: string | File;
}

interface PasswordUpdate {
    currentPassword: string;
    newPassword: string;
}

interface PreferenceUpdate {
    key: 'modo_oscuro' | 'notificaciones';
    value: boolean;
}

export class Settings {
    static async getProfileSettings(): Promise<ProfileSettings> {
        try {
            const response = await api.post(
                "/profile/recoverProfileSettings",
                {},
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `${sessionStorage.getItem('token')}`
                    }
                }
            );

            return response.data as ProfileSettings;
        } catch (error) {
            console.error("Error recuperando configuraciones de perfil:", error);
            throw error;
        }
    }

    static async updateProfileSettings(profile: ProfileWithFile): Promise<void> {
        try {
            const formData = new FormData();
            const token = sessionStorage.getItem('token');

            const headers = {
                'Authorization': token ?? ''
            };

            formData.append('nickname', profile.nickname || '');
            formData.append('email', profile.email || '');
            formData.append('ubicacion', profile.ubicacion || '');

            if (profile.avatar) {
                if (profile.avatar instanceof File) {
                    formData.append('avatar', profile.avatar);
                } else if (typeof profile.avatar === 'string' && profile.avatar.startsWith('http')) {
                    const response = await fetch(profile.avatar);
                    const blob = await response.blob();
                    const fileName = profile.avatar.split('/').pop() || 'avatar.jpg';
                    const file = new File([blob], fileName, {type: blob.type || 'image/jpeg'});
                    formData.append('avatar', file);
                }
            }

            const response = await api.put("/profile/updateProfileSettings", formData, {headers});

            if (!response.data.success) {
                throw new Error(response.data.message || 'Error desconocido en la respuesta del servidor');
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error("Error actualizando configuraciones de perfil:", error.message);
                throw error;
            }
            throw new Error('Error desconocido al actualizar configuraciones de perfil');
        }
    }

    static async updatePassword(passwordData: PasswordUpdate): Promise<void> {
        try {
            const response = await api.put(
                "/profile/updatePassword",
                passwordData,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `${sessionStorage.getItem('token')}`
                    }
                }
            );

            if (!response.data.success) {
                throw new Error(response.data.message || 'Error desconocido en la respuesta del servidor');
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error("Error actualizando la contraseña:", error.message);
                throw error;
            }
            throw new Error('Error desconocido al actualizar la contraseña');
        }
    }

    static async updatePreference(preferenceUpdate: PreferenceUpdate): Promise<void> {
        try {
            const response = await api.put(
                "/profile/updatePreference",
                preferenceUpdate,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `${sessionStorage.getItem('token')}`
                    }
                }
            );

            if (!response.data.success) {
                throw new Error(response.data.message || 'Error al actualizar la preferencia');
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error("Error actualizando preferencia:", error.message);
                throw error;
            }
            throw new Error('Error desconocido al actualizar la preferencia');
        }
    }

    static async deleteAccount(): Promise<void> {
        try {
            const response = await api.delete(
                "/user/delete",
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `${sessionStorage.getItem('token')}`
                    }
                }
            );

            if (!response.data.success) {
                throw new Error(response.data.message || 'Error al eliminar la cuenta');
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error("Error eliminando la cuenta:", error.message);
                throw error;
            }
            throw new Error('Error desconocido al eliminar la cuenta');
        }
    }

    static async getModoOcuro(): Promise<boolean> {
        try {
            const response = await api.get("/profile/getModoOscuroClaro", {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `${sessionStorage.getItem('token')}`
                }
            });

            return response.data.body === 'true';
        } catch (error) {
            console.error("Error recuperando el modo oscuro:", error);
            throw error;
        }
    }
}