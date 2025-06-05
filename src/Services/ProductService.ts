import cloudinaryImage from "./CloudinaryService"
import api from "./api"

export interface Profile {
    id: string
    nickname: string
    avatar: string
    banAt: boolean
    ubicacion: string
    premium: string
    newUser: boolean
}

export interface Category {
    name: string
    description: string
}

export interface Product {
    id: string
    name: string
    description: string
    points: number
    createdAt: string
    updatedAt: string
    imagenes: string[]
    newUser: boolean
    profile: Profile
    categories: Category[]
}

export interface RecommendDTO {
    titles: string[]
    products: Product[][]
}

export class ProductService {
    private static baseUrl = api.getUri()

    // Cache for user products to avoid unnecessary API calls
    private static userProductsCache: Product[] | null = null
    private static cacheTimestamp = 0
    private static readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

    static getBaseUrl(): string {
        return this.baseUrl
    }

    /**
     * Clear the user products cache
     */
    private static clearUserProductsCache(): void {
        this.userProductsCache = null
        this.cacheTimestamp = 0
    }

    /**
     * Check if cache is valid
     */
    private static isCacheValid(): boolean {
        return this.userProductsCache !== null && Date.now() - this.cacheTimestamp < this.CACHE_DURATION
    }

    static async getRecommendedProducts(): Promise<RecommendDTO> {
        try {
            const response = await fetch(`${this.baseUrl}/product/recomend`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${sessionStorage.getItem("token")}`,
                    "Cache-Control": "no-cache", // Prevent caching issues
                },
            })

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`)
            }

            const data = await response.json()
            console.log("Raw data received from backend:", data)

            if (!data.titles || !data.products || !Array.isArray(data.titles) || !Array.isArray(data.products)) {
                console.error("The received data structure is invalid:", data)
                throw new Error("The received data structure is invalid")
            }

            if (data.titles.length !== data.products.length) {
                console.error("The number of titles doesn't match the number of product arrays:", {
                    titlesLength: data.titles.length,
                    productsLength: data.products.length,
                })

                while (data.products.length < data.titles.length) {
                    data.products.push([])
                }
                if (data.products.length > data.titles.length) {
                    data.products = data.products.slice(0, data.titles.length)
                }
            }

            data.products.map((category: Product[]) => {
                category.map((product: Product) => {
                    product.imagenes = product.imagenes.map((image) => cloudinaryImage(image))
                })
            })

            return data
        } catch (error) {
            console.error("Error fetching recommended products:", error)
            throw error
        }
    }

    static async getProductById(productId: string, profileId: string): Promise<Product> {
        try {
            const sessionToken = sessionStorage.getItem("token")
            if (!sessionToken) {
                throw new Error("No hay token de autenticación disponible")
            }

            const response = await fetch(`${this.baseUrl}/product/get?idProduct=${productId}&IdProfileProduct=${profileId}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${sessionToken}`,
                    "Cache-Control": "no-cache",
                },
            })

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`)
            }

            const data = await response.json()
            return data
        } catch (error) {
            console.error(`Error fetching product with ID ${productId}:`, error)
            throw error
        }
    }

    static async activeProduct(productId: string): Promise<boolean> {
        try {
            const sessionToken = sessionStorage.getItem("token")
            if (!sessionToken) {
                throw new Error("No hay token de autenticación disponible")
            }

            const response = await fetch(`${this.baseUrl}/product/activeProduct?idProduct=${productId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${sessionToken}`,
                    "Cache-Control": "no-cache",
                },
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`Error ${response.status}: ${errorText}`)
            }

            const result = await response.json()

            // Clear cache after successful activation
            this.clearUserProductsCache()

            return result === true
        } catch (error) {
            console.error(`Error activating product with ID ${productId}:`, error)
            throw error
        }
    }

    static async deactiveProduct(productId: string): Promise<boolean> {
        try {
            const sessionToken = sessionStorage.getItem("token")
            if (!sessionToken) {
                throw new Error("No hay token de autenticación disponible")
            }

            const response = await fetch(`${this.baseUrl}/product/desactiveProduct?idProduct=${productId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${sessionToken}`,
                    "Cache-Control": "no-cache",
                },
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`Error ${response.status}: ${errorText}`)
            }

            const result = await response.json()

            // Clear cache after successful deactivation
            this.clearUserProductsCache()

            return result === true
        } catch (error) {
            console.error(`Error deactivating product with ID ${productId}:`, error)
            throw error
        }
    }

    static async getRelatedProductsByCategories(
        categories: string[],
        excludeProductId: string,
        limit = 4,
    ): Promise<Product[]> {
        try {
            const sessionToken = sessionStorage.getItem("token")
            if (!sessionToken) {
                throw new Error("No hay token de autenticación disponible")
            }

            const categoryParams = categories.map((cat) => `categories=${encodeURIComponent(cat)}`).join("&")
            const queryParams = `${categoryParams}&exclude=${excludeProductId}&limit=${limit}`

            const response = await fetch(`${this.baseUrl}/product/related?${queryParams}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${sessionToken}`,
                    "Cache-Control": "no-cache",
                },
            })

            if (!response.ok) {
                return this.getRelatedProductsFallback(categories, excludeProductId, limit)
            }

            const data = await response.json()
            const products = Array.isArray(data) ? data : data.products || []
            return products.map((product: Product) => ({
                ...product,
                imagenes: product.imagenes?.map((image) => cloudinaryImage(image)) || [],
            }))
        } catch (error) {
            console.error("Error fetching related products, using fallback:", error)
            return this.getRelatedProductsFallback(categories, excludeProductId, limit)
        }
    }

    private static async getRelatedProductsFallback(
        categories: string[],
        excludeProductId: string,
        limit = 4,
    ): Promise<Product[]> {
        try {
            const recommendData = await this.getRecommendedProducts()
            const allProducts = recommendData.products.flat()
            const seenIds = new Set<string>()
            const uniqueProducts = allProducts.filter((product) => {
                if (seenIds.has(product.id) || product.id === excludeProductId) {
                    return false
                }
                seenIds.add(product.id)
                return true
            })

            const relatedProducts = uniqueProducts
                .filter((product) => product.categories?.some((productCategory) => categories.includes(productCategory.name)))
                .slice(0, limit)

            return relatedProducts.map((product) => ({
                ...product,
            }))
        } catch (error) {
            console.error("Error in fallback method:", error)
            return []
        }
    }

    private static shuffleArray<T>(array: T[]): T[] {
        const shuffled = [...array]
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
        }
        return shuffled
    }

    /**
     * Get user's products with improved caching
     */
    static async getUserProducts(active?: boolean, forceRefresh = false): Promise<Product[]> {
        try {
            // If we have valid cache and not forcing refresh, return cached data
            if (!forceRefresh && this.isCacheValid() && this.userProductsCache) {
                console.log("Returning cached user products")
                return this.userProductsCache
            }

            const sessionToken = sessionStorage.getItem("token")
            if (!sessionToken) {
                throw new Error("No hay token de autenticación disponible")
            }

            let queryParams = ""
            if (active !== undefined) {
                queryParams = `?active=${active}`
            }

            const response = await fetch(`${this.baseUrl}/product/user-products${queryParams}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${sessionToken}`,
                    "Cache-Control": "no-cache",
                },
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`Error ${response.status}: ${errorText}`)
            }

            const data = await response.json()
            const products = Array.isArray(data) ? data : []
            const processedProducts = products.map((product: Product) => ({
                ...product,
                imagenes: product.imagenes?.map((image) => cloudinaryImage(image)) || [],
            }))

            // Update cache
            this.userProductsCache = processedProducts
            this.cacheTimestamp = Date.now()

            console.log("Fetched fresh user products from API")
            return processedProducts
        } catch (error) {
            console.error("Error fetching user products:", error)
            throw error
        }
    }

    /**
     * Improved delete product method with better error handling and cache management
     */
    static async borrarProducto(productId: string): Promise<{ success: boolean; message: string }> {
        try {
            const sessionToken = sessionStorage.getItem("token")
            if (!sessionToken) {
                throw new Error("No hay token de autenticación disponible")
            }

            console.log("Deleting product with ID:", productId)

            const formData = new FormData()
            formData.append("productId", productId)

            const response = await fetch(`${this.baseUrl}/product/borrarProducto`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${sessionToken}`,
                    "Cache-Control": "no-cache",
                },
                body: formData,
            })

            const data = await response.json()

            if (!response.ok) {
                console.error("Delete request failed:", response.status, data)
                throw new Error(data.error || `Error ${response.status}: ${response.statusText}`)
            }

            console.log("Product deleted successfully:", data.message)

            // Clear cache immediately after successful deletion
            this.clearUserProductsCache()

            // Also remove from current cache if it exists
            if (this.userProductsCache) {
                this.userProductsCache = this.userProductsCache.filter((product) => product.id !== productId)
            }

            return {
                success: true,
                message: data.message || "Producto eliminado exitosamente",
            }
        } catch (error) {
            console.error("Error in borrarProducto:", error)
            return {
                success: false,
                message: error instanceof Error ? error.message : "Error desconocido al eliminar el producto",
            }
        }
    }

    // Add this new method to ProductService class
    static async getProductsByProfileId(profileId: string): Promise<Product[]> {
        try {
            const sessionToken = sessionStorage.getItem("token")
            if (!sessionToken) {
                throw new Error("No hay token de autenticación disponible")
            }

            const response = await fetch(`${this.baseUrl}/product/profile-products?profileId=${profileId}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${sessionToken}`,
                    "Cache-Control": "no-cache",
                },
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`Error ${response.status}: ${errorText}`)
            }

            const data = await response.json()
            const products = Array.isArray(data) ? data : []

            return products.map((product: Product) => ({
                ...product,
                imagenes: product.imagenes?.map((image) => cloudinaryImage(image)) || [],
            }))
        } catch (error) {
            console.error(`Error fetching products for profile ID ${profileId}:`, error)
            throw error
        }
    }
}
