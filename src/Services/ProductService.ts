// src/Services/ProductService.ts

import cloudinaryImage from "./CloudinaryService";
import api from "./api";

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
            const response = await fetch(`${this.baseUrl}/product/get?idProduct=${productId}&IdProfileProduct=${profileId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}`
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
}