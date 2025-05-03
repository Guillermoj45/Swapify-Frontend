// src/Services/ProductService.ts

export interface Product {
    id: string;
    name: string;
    description: string;
    points: number;
    createdAt: string;
    updatedAt: string;
}

export interface RecommendDTO {
    titles: string[];
    products: Product[][]; // Array de arrays de productos, donde cada array interno corresponde a una categoría
}

export class ProductService {
    private static baseUrl = 'http://localhost:8080'; // Ajusta esto a la URL de tu backend

    /**
     * Obtiene los productos recomendados desde el backend
     */
    static async getRecommendedProducts(): Promise<RecommendDTO> {
        try {
            const response = await fetch(`${this.baseUrl}/product/recomend`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}` // Incluye el token de autenticación
                }
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }

            // Obtener la respuesta y loguear para depurar
            const data = await response.json();
            console.log("Datos crudos recibidos del backend:", data);

            // Verificar que la estructura sea la esperada
            if (!data.titles || !data.products || !Array.isArray(data.titles) || !Array.isArray(data.products)) {
                console.error("La estructura de datos recibida no es válida:", data);
                throw new Error("La estructura de datos recibida no es válida");
            }

            // Verificar que cada categoría tenga su array de productos correspondiente
            if (data.titles.length !== data.products.length) {
                console.error("El número de títulos no coincide con el número de arrays de productos:",
                    { titlesLength: data.titles.length, productsLength: data.products.length });

                // Rellenar con arrays vacíos si faltan productos
                while (data.products.length < data.titles.length) {
                    data.products.push([]);
                }
                // O recortar si hay más arrays de productos que títulos
                if (data.products.length > data.titles.length) {
                    data.products = data.products.slice(0, data.titles.length);
                }
            }

            return data;
        } catch (error) {
            console.error('Error fetching recommended products:', error);
            throw error;
        }
    }
}