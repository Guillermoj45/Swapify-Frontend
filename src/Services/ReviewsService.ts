import API from "./api"
import cloudinaryImage from "./CloudinaryService"

export interface ReviewDTO {
    id?: string
    idProfile: string
    idProfileWriter?: string
    description: string
    datetime?: string
    stars: number
    profileNickname?: string
    writerNickname?: string
    writerAvatar?: string
}

export interface ApiResponse {
    success: boolean
    message: string
}

class ReviewsService {
    // Crear una nueva reseña
    static async createReview(reviewData: {
        idProfile: string
        description: string
        stars: number
    }): Promise<ApiResponse> {
        try {
            const response = await API.post("/reviews/create", reviewData)
            return response.data
        } catch (error: any) {
            console.error("Error creating review:", error)
            throw new Error(error.response?.data?.message || "Error al crear la reseña")
        }
    }

    // Obtener reseñas de un perfil específico
    static async getReviewsByProfileId(profileId: string): Promise<ReviewDTO[]> {
        try {
            const response = await API.get(`/reviews/profile/${profileId}`)
            return response.data
        } catch (error: any) {
            console.error("Error fetching reviews:", error)
            throw new Error(error.response?.data?.message || "Error al obtener las reseñas")
        }
    }

    // Obtener reseñas escritas por el usuario autenticado
    static async getMyWrittenReviews(): Promise<ReviewDTO[]> {
        try {
            const response = await API.get("/reviews/written")
            return response.data
        } catch (error: any) {
            console.error("Error fetching written reviews:", error)
            throw new Error(error.response?.data?.message || "Error al obtener las reseñas escritas")
        }
    }

    // Obtener reseñas recibidas por el usuario autenticado
    static async getMyReceivedReviews(): Promise<ReviewDTO[]> {
        try {
            const response = await API.get("/reviews/received")
            return response.data
        } catch (error: any) {
            console.error("Error fetching received reviews:", error)
            throw new Error(error.response?.data?.message || "Error al obtener las reseñas recibidas")
        }
    }

    // Eliminar una reseña
    static async deleteReview(reviewId: string): Promise<ApiResponse> {
        try {
            const response = await API.delete(`/reviews/delete/${reviewId}`)
            return response.data
        } catch (error: any) {
            console.error("Error deleting review:", error)
            throw new Error(error.response?.data?.message || "Error al eliminar la reseña")
        }
    }

    // Procesar avatar con Cloudinary
    static processAvatar(avatar: string): string {
        if (!avatar) return "/placeholder.svg?height=40&width=40"
        return cloudinaryImage(avatar)
    }

    // Formatear fecha
    static formatDate(dateString: string): string {
        const date = new Date(dateString)
        const now = new Date()
        const diffTime = Math.abs(now.getTime() - date.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays === 1) return "Hace 1 día"
        if (diffDays < 7) return `Hace ${diffDays} días`
        if (diffDays < 30) return `Hace ${Math.ceil(diffDays / 7)} semana${Math.ceil(diffDays / 7) > 1 ? "s" : ""}`
        return date.toLocaleDateString()
    }
}

export default ReviewsService
