import API from './api';
import cloudinaryImage from "./CloudinaryService";

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
    banner: string;
}

export interface ProductDTO {
    id: string;
    name: string;
    description: string;
    points: number;
    createdAt: string;
    updatedAt: string;
    imagenes: string[];
    profile: ProfileDTO;
    categories: CategoryDTO[];
}

export interface SaveProductDTO {
    productId: string;
    profileId: string;
}

export const ProfileService = {
    getProfileInfo: async (): Promise<ProfileDTO> => {
        try {
            const response = await API.get('/profile/getProfileDto');
            if (response.data && response.data.avatar) {
                response.data.avatar = cloudinaryImage(response.data.avatar);
            }
            if (response.data && response.data.banner) {
                response.data.banner = cloudinaryImage(response.data.banner);
            }
            return response.data;
        } catch (error) {
            console.error('Error al obtener información del perfil:', error);
            throw error;
        }
    },

    getUserProducts: async (): Promise<ProductDTO[]> => {
        try {
            const response = await API.get('/profile/myProducts');
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

    getSavedProducts: async (): Promise<ProductDTO[]> => {
        try {
            const response = await API.get('/profile/savedProducts');
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
    },

    updateBanner: async (imageFile: File): Promise<{ success: boolean, imageUrl: string }> => {
        try {
            const formData = new FormData();
            formData.append('banner', imageFile);

            const response = await API.put('/profile/updateBanner', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `${sessionStorage.getItem('token')}`
                }
            });

            return {
                success: response.data.success,
                imageUrl: imageFile ? URL.createObjectURL(imageFile) : ''
            };
        } catch (error) {
            console.error('Error al actualizar la imagen de banner:', error);
            throw error;
        }
    },

    isPremium: async (): Promise<boolean> => {
        try {
            const response = await API.get('/profile/isPremium');
            return response.data; // Asegúrate de que el backend devuelva esta propiedad
        } catch (error) {
            console.error('Error al verificar el estado premium:', error);
            return false; // En caso de error, retorna false
        }
    }
};

export default ProfileService;