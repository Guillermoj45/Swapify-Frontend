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
    ubicacion: string;
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

// Enhanced Cache management with better performance
class CacheManager {
    private static cache = new Map<string, { data: any, timestamp: number }>();
    private static CACHE_DURATION = 3 * 60 * 1000; // Reduced to 3 minutes for fresher data

    // Event emitter for cache updates
    private static listeners = new Map<string, Set<Function>>();

    static set(key: string, data: any) {
        this.cache.set(key, { data, timestamp: Date.now() });
        this.notifyListeners(key, data);
    }

    static get(key: string) {
        const cached = this.cache.get(key);
        if (!cached) return null;

        const isExpired = Date.now() - cached.timestamp > this.CACHE_DURATION;
        if (isExpired) {
            this.cache.delete(key);
            return null;
        }

        return cached.data;
    }

    static invalidate(key: string) {
        this.cache.delete(key);
        this.notifyListeners(key, null);
    }

    static invalidatePattern(pattern: string) {
        for (const key of this.cache.keys()) {
            if (key.includes(pattern)) {
                this.cache.delete(key);
                this.notifyListeners(key, null);
            }
        }
    }

    // Subscribe to cache changes
    static subscribe(key: string, callback: Function) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, new Set());
        }
        this.listeners.get(key)!.add(callback);

        // Return unsubscribe function
        return () => {
            const keyListeners = this.listeners.get(key);
            if (keyListeners) {
                keyListeners.delete(callback);
                if (keyListeners.size === 0) {
                    this.listeners.delete(key);
                }
            }
        };
    }

    private static notifyListeners(key: string, data: any) {
        const keyListeners = this.listeners.get(key);
        if (keyListeners) {
            keyListeners.forEach(callback => callback(data));
        }
    }

    // Force refresh a specific key
    static forceRefresh(key: string) {
        this.invalidate(key);
    }

    // Get cache stats for debugging
    static getStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
            listeners: Array.from(this.listeners.keys())
        };
    }
}

export const ProfileService = {
    getProfileInfo: async (): Promise<ProfileDTO> => {
        const cacheKey = 'profile-info';
        const cached = CacheManager.get(cacheKey);
        if (cached) return cached;

        try {
            const response = await API.get('/profile/getProfileDto');
            if (response.data && response.data.avatar) {
                response.data.avatar = cloudinaryImage(response.data.avatar);
            }
            if (response.data && response.data.banner) {
                response.data.banner = cloudinaryImage(response.data.banner);
            }

            CacheManager.set(cacheKey, response.data);
            return response.data;
        } catch (error) {
            console.error('Error al obtener información del perfil:', error);
            throw error;
        }
    },

    getProfileById: async (profileId: string): Promise<ProfileDTO> => {
        const cacheKey = `profile-${profileId}`;
        const cached = CacheManager.get(cacheKey);
        if (cached) return cached;

        try {
            const response = await API.get(`/profile/${profileId}`);
            if (response.data && response.data.avatar) {
                response.data.avatar = cloudinaryImage(response.data.avatar);
            }
            if (response.data && response.data.banner) {
                response.data.banner = cloudinaryImage(response.data.banner);
            }

            CacheManager.set(cacheKey, response.data);
            return response.data;
        } catch (error) {
            console.error('Error al obtener información del perfil por ID:', error);
            throw error;
        }
    },

    getUserProducts: async (): Promise<ProductDTO[]> => {
        const cacheKey = 'user-products';
        const cached = CacheManager.get(cacheKey);
        if (cached) return cached;

        try {
            const response = await API.get('/profile/myProducts');
            if (response.data && Array.isArray(response.data)) {
                response.data.forEach((product: ProductDTO) => {
                    if (product.imagenes && Array.isArray(product.imagenes)) {
                        product.imagenes = product.imagenes.map(image => cloudinaryImage(image));
                    }
                });
            }

            CacheManager.set(cacheKey, response.data);
            return response.data;
        } catch (error) {
            console.error('Error al obtener los productos del usuario:', error);
            throw error;
        }
    },

    saveProductToProfile: async (saveProductDTO: SaveProductDTO): Promise<{ success: boolean, message: string }> => {
        try {
            const response = await API.post('/profile/saveProduct', saveProductDTO);

            // Immediately invalidate and refresh saved products cache
            if (response.data.success) {
                CacheManager.forceRefresh('saved-products');

                // Trigger a background refresh to get updated data
                setTimeout(() => {
                    ProfileService.getSavedProducts(true);
                }, 100);
            }

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

            // Immediately invalidate and refresh saved products cache
            if (response.data.success) {
                CacheManager.forceRefresh('saved-products');

                // Trigger a background refresh to get updated data
                setTimeout(() => {
                    ProfileService.getSavedProducts(true);
                }, 100);
            }

            return {
                success: response.data.success,
                message: response.data.message
            };
        } catch (error) {
            console.error('Error al eliminar el producto del perfil:', error);
            throw error;
        }
    },

    getSavedProducts: async (forceRefresh: boolean = false): Promise<ProductDTO[]> => {
        const cacheKey = 'saved-products';

        if (!forceRefresh) {
            const cached = CacheManager.get(cacheKey);
            if (cached) return cached;
        }

        try {
            const response = await API.get('/profile/savedProducts');
            if (response.data && Array.isArray(response.data)) {
                response.data.forEach((product: ProductDTO) => {
                    if (product.imagenes && Array.isArray(product.imagenes)) {
                        product.imagenes = product.imagenes.map(image => cloudinaryImage(image));
                    }
                });
            }

            CacheManager.set(cacheKey, response.data);
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

            // Invalidate profile cache when banner is updated
            if (response.data.success) {
                CacheManager.invalidatePattern('profile');
            }

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
        const cacheKey = 'is-premium';
        const cached = CacheManager.get(cacheKey);
        if (cached !== null) return cached;

        try {
            const response = await API.get('/profile/isPremium');
            CacheManager.set(cacheKey, response.data);
            return response.data;
        } catch (error) {
            console.error('Error al verificar el estado premium:', error);
            return false;
        }
    },

    getProfileByIdAlternative: async (profileId: string): Promise<ProfileDTO> => {
        const cacheKey = `profile-alt-${profileId}`;
        const cached = CacheManager.get(cacheKey);
        if (cached) return cached;

        try {
            const params = new URLSearchParams({ profileId });
            const response = await API.get(`/profile?${profileId}`, { params });
            if (response.data && response.data.avatar) {
                response.data.avatar = cloudinaryImage(response.data.avatar);
            }
            if (response.data && response.data.banner) {
                response.data.banner = cloudinaryImage(response.data.banner);
            }

            CacheManager.set(cacheKey, response.data);
            return response.data;
        } catch (error) {
            console.error('Error al obtener información del perfil por ID:', error);
            throw error;
        }
    },

    getTutorialHecho: async (): Promise<boolean> => {
        const cacheKey = 'tutorial-done';
        const cached = CacheManager.get(cacheKey);
        if (cached !== null) return cached;

        try {
            const response = await API.get('/profile/tutorial', {
                headers: {
                    'Authorization': `${sessionStorage.getItem('token')}`
                }
            });

            CacheManager.set(cacheKey, response.data);
            return response.data;
        } catch (error) {
            console.error('Error al verificar si el tutorial fue hecho:', error);
            return false;
        }
    },

    setTutorialHecho: async (): Promise<boolean> => {
        try {
            await API.put('/profile/updateTutorial', {}, {
                headers: {
                    'Authorization': `${sessionStorage.getItem('token')}`
                }
            });

            // Update cache
            CacheManager.set('tutorial-done', true);
            return true;
        } catch (error) {
            console.error('Error al establecer que el tutorial fue hecho:', error);
            return false;
        }
    },

    // Enhanced cache management methods
    refreshCache: () => {
        CacheManager.invalidatePattern('');
    },

    refreshSavedProductsCache: () => {
        CacheManager.forceRefresh('saved-products');
    },

    // Subscribe to saved products changes
    subscribeSavedProducts: (callback: Function) => {
        return CacheManager.subscribe('saved-products', callback);
    },

    // Get fresh saved products count
    getSavedProductsCount: async (): Promise<number> => {
        try {
            const products = await ProfileService.getSavedProducts(true);
            return products.length;
        } catch (error) {
            console.error('Error getting saved products count:', error);
            return 0;
        }
    },

    // Preload saved products in background
    preloadSavedProducts: () => {
        ProfileService.getSavedProducts(true).catch(console.error);
    },

    // Debug methods
    getCacheStats: () => {
        return CacheManager.getStats();
    }
};

export default ProfileService;