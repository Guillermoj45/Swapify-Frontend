import API from "./api"

// Interfaz para tipificar la respuesta
export interface IAChatResponse {
    lastMessage: {
        id: string
        message: string
        createdAt: string
        images: string[]
        user: boolean
    }
    id: string
    nombre: string
    createdAt: string
    product?: {
        id: string
        name: string
        imagenes: string[]
        description: string
        points: number
        createdAt: string
        categories: {
            name: string
            description: string
        }[]
    }
}

export interface ConversationDTO {
    id: string
    nombre: string
    titulo: string
    createdAt: string
    product: {
        id: string
        name: string
        description: string
        points: number
        createdAt: string
        updatedAt: string
        imagenes: string[]
        profile: {
            id: string
            nickname: string
            avatar: string
            banAt: boolean
            premium: string
            ubicacion: string
            banner: string
            newUser: boolean
        }
        categories: {
            name: string
            description: string
        }[]
    }
    // ✅ CORREGIDO: Campos que realmente devuelve ConversIADTO del backend
    lastMessages?: string // ✅ En lugar de lastMessage (objeto)
    lastMesageDate?: string // ✅ En lugar de lastMessageDate
}

export interface MessageIADTO {
    id: string
    message: string // ✅ El backend usa 'message', no 'text'
    createdAt: string
    images: string[]
    user: boolean // ✅ El backend usa 'user' boolean, no 'sender' string
}

// ✅ INTERFACE PARA ConversIADetailDTO que devuelve el endpoint de detalle
export interface ConversationDetailDTO {
    id: string
    nombre: string
    titulo: string
    createdAt: string
    messages: MessageIADTO[] // ✅ Usa MessageIADTO
    product?: {
        id: string
        name: string
        description: string
        points: number
        createdAt: string
        updatedAt: string
        imagenes: string[]
        profile: {
            id: string
            nickname: string
            avatar: string
            banAt: boolean
            premium: string
            ubicacion: string
            banner: string
            newUser: boolean
        }
        categories: {
            name: string
            description: string
        }[]
    }
}

export interface ConversationMessage {
    id: string
    message: string
    createdAt: string
    images: string[]
    user: boolean
}

export interface ConversationDetail {
    id: string
    nombre: string
    titulo: string
    createdAt: string
    messages: ConversationMessage[]
}

const MAX_FILE_SIZE = 1024 * 1024 // 1MB en bytes

const compressImage = async (file: File, maxSizeInBytes: number): Promise<File> => {
    let quality = 1.0
    let compressedFile = file

    while (compressedFile.size > maxSizeInBytes && quality > 0.1) {
        const canvas = document.createElement("canvas")
        const img = await createImageBitmap(file)

        canvas.width = img.width
        canvas.height = img.height

        const ctx = canvas.getContext("2d")
        if (!ctx) throw new Error("No se pudo crear el contexto 2D")

        ctx.drawImage(img, 0, 0)

        const blob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality)
        })

        if (!blob) throw new Error("Error al comprimir la imagen")

        compressedFile = new File([blob], file.name, {
            type: "image/jpeg",
            lastModified: Date.now(),
        })

        quality -= 0.1
    }

    return compressedFile
}

const convertImageToPNG = async (file: File): Promise<File> => {
    // Primero verificamos si necesitamos comprimir
    if (file.size > MAX_FILE_SIZE) {
        console.log("Archivo demasiado grande, comprimiendo...")
        try {
            const compressedFile = await compressImage(file, MAX_FILE_SIZE)
            console.log("Archivo comprimido exitosamente")
            return compressedFile
        } catch (error) {
            console.error("Error al comprimir:", error)
        }
    }

    // Si no necesita compresión o hubo un error, continuamos con la conversión normal
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
            const canvas = document.createElement("canvas")
            canvas.width = img.width
            canvas.height = img.height

            const ctx = canvas.getContext("2d")
            if (!ctx) {
                reject(new Error("No se pudo crear el contexto 2D"))
                return
            }

            ctx.drawImage(img, 0, 0)

            canvas.toBlob((blob) => {
                if (blob) {
                    const convertedFile = new File([blob], file.name.split(".")[0] + ".png", {
                        type: "image/png",
                    })
                    resolve(convertedFile)
                } else {
                    reject(new Error("Error al convertir la imagen"))
                }
            }, "image/png")
        }

        img.onerror = () => reject(new Error("Error al cargar la imagen"))
        img.src = URL.createObjectURL(file)
    })
}

/**
 * Envía un mensaje al asistente IA con imágenes opcionales
 */
export const IAChat = async (
    files: File[],
    message: string,
    chatID?: string,
    productId?: string,
    titulo?: string,
    guillermo?: boolean,
): Promise<IAChatResponse> => {
    const formData = new FormData()
    formData.append("message", message)

    if (files && files.length > 0) {
        for (const file of files) {
            let fileToUpload = file
            console.log("Archivo a subir:", file.type)
            const fileExtension = file.name.split(".").pop()?.toLowerCase()
            if (fileExtension === "jpg" || fileExtension === "jpeg") {
                fileToUpload = new File([file], file.name, { type: "image/jpeg" })
            } else if (fileExtension === "png") {
                fileToUpload = new File([file], file.name, { type: "image/png" })
            } else {
                try {
                    fileToUpload = await convertImageToPNG(file)
                } catch (error) {
                    console.error("Error al convertir la imagen:", error)
                    continue
                }
            }
            formData.append("file", fileToUpload)
        }
    }

    if (chatID) formData.append("chatID", chatID)
    if (productId) formData.append("productId", productId)
    if (titulo) formData.append("titulo", titulo)
    if (guillermo !== undefined) formData.append("guillermo", guillermo.toString())

    try {
        const response = await API.post("/ia/producto", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        })
        return response.data
    } catch (error: any) {
        console.error("Error en petición IAChat:", error)

        // ✅ MEJORADO: Preservar el mensaje de error específico del backend
        if (error.response?.status === 400 && error.response?.data) {
            // Crear un error personalizado que preserve el mensaje del backend
            const customError = new Error(error.response.data.message || error.response.data)
            customError.name = 'BackendError'
            // Preservar la respuesta original para acceso en el componente
            ;(customError as any).response = error.response
            throw customError
        }

        if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
            console.error("Tiempo de espera agotado.")
        }

        throw error
    }
}

export class ConversationService {
    /**
     * Obtiene la lista de conversaciones del usuario con paginación
     */
    static async getConversations(page = 0): Promise<ConversationDTO[]> {
        try {
            const response = await API.get("/ia/conversations", {
                params: { page },
            })
            return response.data
        } catch (error) {
            console.error("Error al obtener conversaciones:", error)
            throw error
        }
    }

    /**
     * Obtiene los detalles completos de una conversación específica
     */
    static async getConversationDetail(conversationId: string): Promise<ConversationDetailDTO> {
        try {
            const response = await API.get(`/ia/conversations/${conversationId}`)
            return response.data
        } catch (error) {
            console.error("Error al obtener detalles de conversación:", error)
            throw error
        }
    }

    /**
     * Elimina una conversación
     */
    static async deleteConversation(conversationId: string): Promise<boolean> {
        try {
            await API.delete(`/ia/conversations/${conversationId}`)
            return true
        } catch (error) {
            console.error("Error al eliminar conversación:", error)
            return false
        }
    }

    /**
     * Actualiza el titulo de una conversación
     */
    static async updateConversationTitle(conversationId: string, newName: string): Promise<boolean> {
        try {
            await API.put(`/ia/conversations/${conversationId}`, {
                titulo: newName,
            })
            return true
        } catch (error) {
            console.error("Error al actualizar nombre de conversación:", error)
            return false
        }
    }

    /**
     * Obtiene los mensajes de una conversación con paginación
     */
    static async getConversationMessages(conversationId: string, page = 0, size = 20): Promise<ConversationMessage[]> {
        try {
            const response = await API.get(`/ia/conversations/${conversationId}/messages`, {
                params: { page, size },
            })
            return response.data
        } catch (error) {
            console.error("Error al obtener mensajes de conversación:", error)
            throw error
        }
    }

    /**
     * ✅ CORREGIDO: Método para procesar URLs de imágenes sin usar process.env
     */
    static processImageUrl(imageUrl: string): string {
        if (!imageUrl) return "/placeholder.svg"

        // Si ya es una URL completa, devolverla tal como está
        if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
            return imageUrl
        }

        // Si es una ruta de Cloudinary, construir la URL
        if (imageUrl.includes("cloudinary") || imageUrl.startsWith("v1_")) {
            // Aquí puedes configurar tu cloud name de Cloudinary
            return `https://res.cloudinary.com/your-cloud-name/image/upload/${imageUrl}`
        }

        // Si es una ruta relativa que empieza con /, devolverla tal como está
        if (imageUrl.startsWith("/")) {
            return imageUrl
        }

        // Si es solo el nombre del archivo, asumir que está en la carpeta uploads
        // Nota: Esto dependerá de cómo esté configurado tu servidor
        return `/uploads/${imageUrl}`
    }

    /**
     * Versión síncrona más simple para casos donde no necesitas todos los mensajes
     */
    static convertToFrontendFormatSimple(conversations: ConversationDTO[]): any[] {
        return conversations.map((conv) => ({
            id: conv.id,
            title: conv.titulo || conv.nombre || "Nueva conversación", // ✅ CORREGIDO: usar titulo primero
            lastMessage: conv.lastMessages || "Nueva conversación", // ✅ CORREGIDO: usar lastMessages
            timestamp: conv.lastMesageDate ? new Date(conv.lastMesageDate) : new Date(conv.createdAt), // ✅ CORREGIDO: usar lastMesageDate
            messages: [], // Se cargarán cuando se seleccione la conversación
            unread: 0,
        }))
    }

    /**
     * ✅ CORREGIDO: Convierte los mensajes del formato backend al formato frontend con mejor manejo de imágenes
     */
    static convertMessagesToFrontendFormat(messages: MessageIADTO[]): any[] {
        return messages.map((msg) => ({
            id: msg.id,
            text: msg.message, // ✅ CORREGIDO: el backend usa 'message'
            sender: msg.user ? "user" : "ai", // ✅ CORREGIDO: el backend usa 'user' boolean
            timestamp: new Date(msg.createdAt),
            // ✅ CORREGIDO: Procesar correctamente las URLs de imágenes
            images:
                msg.images && msg.images.length > 0 ? msg.images.map((imageUrl) => this.processImageUrl(imageUrl)) : undefined,
        }))
    }

    /**
     * ✅ MEJORADO: Carga una conversación completa con todos sus mensajes y mejor manejo de productos
     */
    static async loadFullConversation(conversationId: string): Promise<any> {
        try {
            const conversationDetail: ConversationDetailDTO = await this.getConversationDetail(conversationId)

            return {
                id: conversationDetail.id,
                title: conversationDetail.titulo || conversationDetail.nombre || "Conversación", // ✅ CORREGIDO: usar titulo primero
                timestamp: new Date(conversationDetail.createdAt),
                messages: this.convertMessagesToFrontendFormat(conversationDetail.messages),
                unread: 0,
                // ✅ NUEVO: Incluir información del producto si existe
                product: conversationDetail.product,
            }
        } catch (error) {
            console.error("Error al cargar conversación completa:", error)
            throw error
        }
    }
}
