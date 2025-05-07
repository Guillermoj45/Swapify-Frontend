import api from "./apiConfig";
import { ProfileSettings } from "../Models/ProfileSettings";

interface ProfileWithFile extends Omit<ProfileSettings, 'avatar'> {
    avatar?: string | File;
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

    static async updateProfileSettings(profile: ProfileWithFile) {
        try {
            const formData = new FormData();
            const token = sessionStorage.getItem('token');

            const headers = {
                'Authorization': token
            };

            formData.append('nickname', profile.nickname || '');
            formData.append('email', profile.email || '');

            // Procesamos el avatar
            if (profile.avatar) {
                if (profile.avatar instanceof File) {
                    formData.append('avatar', profile.avatar);
                } else if (typeof profile.avatar === 'string' && profile.avatar.startsWith('http')) {
                    const response = await fetch(profile.avatar);
                    const blob = await response.blob();
                    const fileName = profile.avatar.split('/').pop() || 'avatar.jpg';
                    const file = new File([blob], fileName, { type: 'image/jpeg' });
                    formData.append('avatar', file);
                }
            }

            const response = await api.put(
                "/profile/updateProfileSettings",
                formData,
                { headers }
            );

            return response.data;

        } catch (error) {
            console.error("Error actualizando configuraciones de perfil:", error);
            throw error;
        }
    }
}