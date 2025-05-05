import api from "./apiConfig";
import { ProfileSettings } from "../Models/ProfileSettings";

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
}