import api from "./apiConfig"
import type { User } from "../Models/User"
import type { LoginFormData } from "../Models/LoginData"

export interface UserProfile {
    id: string
    nickname: string
    avatar: string
    banAt: boolean
    premium: string
    newUser: boolean
    banner: string
    ubicacion: string
}

class UserService {
    static async registerUser(user: User) {
        try {
            const response = await api.post("/user/create", user.toPayload(), {
                headers: {
                    "Content-Type": "application/json",
                },
            })

            return response.data
        } catch (error) {
            console.error("Error registering user:", error)
            throw error
        }
    }

    static async loginUser(form: LoginFormData) {
        try {
            const response = await api.post("/user/login", form, {
                headers: {
                    "Content-Type": "application/json",
                },
            })

            if (response.data.token) {
                sessionStorage.setItem("token", response.data.token)
            }

            return response.data
        } catch (error) {
            console.error("Error logging in:", error)
            throw error
        }
    }

    static async sendEmailUser(data: { email: string }): Promise<void> {
        // Change to use params instead of body
        const response = await api.post("/email/forgot-password", null, {
            params: {
                email: data.email,
            },
        })
        return response.data
    }

    static async sendNewPassword(data: { code: string; newPassword: string }): Promise<void> {
        await api.post("/email/reset-password", null, {
            params: {
                code: data.code,
                newPassword: data.newPassword,
            },
        })
    }

    static async searchUsers(query: string): Promise<UserProfile[]> {
        try {
            const sessionToken = sessionStorage.getItem("token")
            if (!sessionToken) {
                throw new Error("No hay token de autenticación disponible")
            }

            const response = await api.get(`/profile/search`, {
                params: {
                    query: query,
                },
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `${sessionToken}`,
                },
            })

            return response.data
        } catch (error) {
            console.error("Error searching users:", error)
            throw error
        }
    }
}

export default UserService
