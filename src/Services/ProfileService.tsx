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

export interface SaveProductDTO {
    productId: string;
    profileId: string;
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
    },

    /**
     * Guarda un producto en el perfil del usuario
     * @param saveProductDTO Datos del producto y perfil a guardar
     * @returns Promise con el resultado de la operación
     */
    saveProductToProfile: async (saveProductDTO: SaveProductDTO): Promise<{ success: boolean, message: string }> => {
        try {
            const response = await API.post('/profile/saveProduct', saveProductDTO);
            return {
                success: response.data.success,
                message: response.data.message
            };
        } catch (error) {
            console.error('Error al guardar el producto en el perfil:', error);
            throw error;
        }
    },

    /**
     * Elimina un producto guardado del perfil del usuario
     * @param saveProductDTO Datos del producto y perfil a eliminar
     * @returns Promise con el resultado de la operación
     */
    deleteProductFromProfile: async (saveProductDTO: SaveProductDTO): Promise<{ success: boolean, message: string }> => {
        try {
            const response = await API.delete('/profile/deleteProduct', {
                data: saveProductDTO
            });
            return {
                success: response.data.success,
                message: response.data.message
            };
        } catch (error) {
            console.error('Error al eliminar el producto del perfil:', error);
            throw error;
        }
    },

    /**
     * Obtiene los productos guardados por el usuario actual
     * @returns Promise con la lista de productos guardados
     */
    getSavedProducts: async (): Promise<ProductDTO[]> => {
        try {
            const response = await API.get('/profile/savedProducts');

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
            console.error('Error al obtener los productos guardados:', error);
            throw error;
        }
    }
};

export default ProfileService;