import api from "./apiConfig";
import { User } from "../Models/User";

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
}

export default UserService;