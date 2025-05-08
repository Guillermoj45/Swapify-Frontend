import API from './api'; // Asegúrate de que la ruta sea correcta según tu estructura de carpetas
import cloudinaryImage from "./CloudinaryService"; // Importamos la función para procesar imágenes

export interface CategoryDTO {
    name: string;
    description: string;
}

export interface ProfileDTO {
    id: string;
    nickname: string;
    avatar: string;
    banAt: boolean;
    premium: string;
    newUser: boolean;
}

export interface ProductDTO {
    id: string;
    name: string;
    description: string;
    points: number;
    createdAt: string; // ISO string para fechas
    updatedAt: string; // ISO string para fechas
    imagenes: string[];
    profile: ProfileDTO;
    categories: CategoryDTO[];
}

export const ProfileService = {
    /**
     * Obtiene la información del perfil del usuario actual
     * @returns Promise con los datos del perfil
     */
    getProfileInfo: async (): Promise<ProfileDTO> => {
        try {
            const response = await API.get('/profile/getProfileDto');

            // Procesamos la URL del avatar con cloudinary si existe
            if (response.data && response.data.avatar) {
                response.data.avatar = cloudinaryImage(response.data.avatar);
            }

            return response.data;
        } catch (error) {
            console.error('Error al obtener información del perfil:', error);
            throw error;
        }
    },

    /**
     * Obtiene todos los productos subidos por el usuario actual
     * @returns Promise con la lista de productos del usuario
     */
    getUserProducts: async (): Promise<ProductDTO[]> => {
        try {
            const response = await API.get('/profile/myProducts');

            // Procesamos las URLs de las imágenes con cloudinary
            if (response.data && Array.isArray(response.data)) {
                response.data.forEach((product: ProductDTO) => {
                    if (product.imagenes && Array.isArray(product.imagenes)) {
                        product.imagenes = product.imagenes.map(image => cloudinaryImage(image));
                    }
                });
            }

            return response.data;
        } catch (error) {
            console.error('Error al obtener los productos del usuario:', error);
            throw error;
        }
    }
};

export default ProfileService;