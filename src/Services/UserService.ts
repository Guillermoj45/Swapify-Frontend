import api from "./apiConfig";
import { User } from "../Models/User";
import { LoginFormData } from "../Models/LoginData";

class UserService {
    static async registerUser(user: User) {
        try {
            const response = await api.post("/user/create", user.toPayload(), {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            return response.data;
        } catch (error) {
            console.error("Error registering user:", error);
            throw error;
        }
    }

    static async loginUser(form: LoginFormData) {
        try {
            const response = await api.post("/user/login", form, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.token) {
                sessionStorage.setItem('token', response.data.token);
            }

            return response.data;
        } catch (error) {
            console.error("Error logging in:", error);
            throw error;
        }
    }

    static async sendEmailUser(data: { email: string }): Promise<void> {
        // Change to use params instead of body
        const response = await api.post("/email/forgot-password", null, {
            params: {
                email: data.email
            }
        });
        return response.data;
    }

    static async sendNewPassword(data: { code: string; newPassword: string }): Promise<void> {
         await api.post("/email/reset-password", null, {
            params: {
                code: data.code,
                newPassword: data.newPassword
            }
        });
    }


}

export default UserService;