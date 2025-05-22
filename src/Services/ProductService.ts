import cloudinaryImage from "./CloudinaryService";
import api from "./api";
import API from "./api";

export interface Profile {
    id: string;
    nickname: string;
    avatar: string;
    banAt: boolean;
    premium: string;
    newUser: boolean;
}

export interface Category {
    name: string;
    description: string;
}

export interface Product {
    id: string;
    name: string;
    description: string;
    points: number;
    createdAt: string;
    updatedAt: string;
    imagenes: string[]; // Array of image URLs
    profile: Profile;
    categories: Category[];
}

export interface RecommendDTO {
    titles: string[];
    products: Product[][]; // Array of arrays of products, where each array corresponds to a category
}

export class ProductService {
    private static baseUrl = api.getUri(); // Adjust this to your backend URL

    /**
     * Get the base URL for API requests
     */
    static getBaseUrl(): string {
        return this.baseUrl;
    }

    /**
     * Get recommended products from the backend
     */
    static async getRecommendedProducts(): Promise<RecommendDTO> {
        try {
            const response = await fetch(`${this.baseUrl}/product/recomend`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}` // Include auth token
                }
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }

            // Get response and log for debugging
            const data = await response.json();
            console.log("Raw data received from backend:", data);

            // Verify the expected structure
            if (!data.titles || !data.products || !Array.isArray(data.titles) || !Array.isArray(data.products)) {
                console.error("The received data structure is invalid:", data);
                throw new Error("The received data structure is invalid");
            }

            // Verify that each category has its corresponding product array
            if (data.titles.length !== data.products.length) {
                console.error("The number of titles doesn't match the number of product arrays:",
                    { titlesLength: data.titles.length, productsLength: data.products.length });

                // Fill with empty arrays if products are missing
                while (data.products.length < data.titles.length) {
                    data.products.push([]);
                }
                // Or trim if there are more product arrays than titles
                if (data.products.length > data.titles.length) {
                    data.products = data.products.slice(0, data.titles.length);
                }
            }
            data.products.map((category: Product[]) => {
                category.map((product: Product) => {
                    product.imagenes = product.imagenes.map((image => cloudinaryImage(image)));
                });
            })
            return data;
        } catch (error) {
            console.error('Error fetching recommended products:', error);
            throw error;
        }
    }

    /**
     * Get a specific product by ID
     */
    static async getProductById(productId: string, profileId: string): Promise<Product> {
        try {
            const sessionToken = sessionStorage.getItem('token');
            if (!sessionToken) {
                throw new Error('No hay token de autenticación disponible');
            }

            const response = await fetch(`${this.baseUrl}/product/get?idProduct=${productId}&IdProfileProduct=${profileId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionToken}`
                }
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`Error fetching product with ID ${productId}:`, error);
            throw error;
        }
    }

    /**
     * Get related products by categories
     * @param categories Array of category names to search for
     * @param excludeProductId Product ID to exclude from results (usually the current product)
     * @param limit Maximum number of products to return
     */
    static async getRelatedProductsByCategories(
        categories: string[],
        excludeProductId: string,
        limit: number = 4
    ): Promise<Product[]> {
        try {
            const sessionToken = sessionStorage.getItem('token');
            if (!sessionToken) {
                throw new Error('No hay token de autenticación disponible');
            }

            // Construir los parámetros de consulta
            const categoryParams = categories.map(cat => `categories=${encodeURIComponent(cat)}`).join('&');
            const queryParams = `${categoryParams}&exclude=${excludeProductId}&limit=${limit}`;

            const response = await fetch(`${this.baseUrl}/product/related?${queryParams}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionToken}`
                }
            });

            if (!response.ok) {
                // Si no hay endpoint específico, usar el método de fallback
                return this.getRelatedProductsFallback(categories, excludeProductId, limit);
            }

            const data = await response.json();

            // Procesar las imágenes con Cloudinary
            const products = Array.isArray(data) ? data : data.products || [];
            return products.map((product: Product) => ({
                ...product,
                imagenes: product.imagenes?.map(image => cloudinaryImage(image)) || []
            }));

        } catch (error) {
            console.error('Error fetching related products, using fallback:', error);
            // Usar método de fallback si falla la llamada principal
            return this.getRelatedProductsFallback(categories, excludeProductId, limit);
        }
    }

    /**
     * Fallback method to get related products using the existing recommend endpoint
     * and filtering by categories on the frontend
     */
    private static async getRelatedProductsFallback(
        categories: string[],
        excludeProductId: string,
        limit: number = 4
    ): Promise<Product[]> {
        try {
            // Usar el endpoint de recomendaciones existente
            const recommendData = await this.getRecommendedProducts();

            // Flatten all products from all categories and remove duplicates
            const allProducts = recommendData.products.flat();
            const seenIds = new Set<string>();
            const uniqueProducts = allProducts.filter(product => {
                // Si ya vimos este ID o es el producto a excluir, filtrar
                if (seenIds.has(product.id) || product.id === excludeProductId) {
                    return false;
                }
                seenIds.add(product.id);
                return true;
            });

            // Filtrar productos que comparten al menos una categoría
            const relatedProducts = uniqueProducts.filter(product =>
                product.categories?.some(productCategory =>
                    categories.includes(productCategory.name)
                )
            ).slice(0, limit);

            // Procesar las imágenes con Cloudinary
            return relatedProducts.map(product => ({
                ...product,
            }));
        } catch (error) {
            console.error('Error in fallback method:', error);
            return [];
        }
    }

    /**
     * Utility method to shuffle an array
     */
    private static shuffleArray<T>(array: T[]): T[] {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
}

