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
                localStorage.setItem('authToken', response.data.token);
            }

            return response.data;
        } catch (error) {
            console.error("Error logging in:", error);
            throw error;
        }
    }
}

export default UserService;