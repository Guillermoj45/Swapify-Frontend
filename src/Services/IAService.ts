import API from './api';

// Interfaz para tipificar la respuesta
export interface IAChatResponse {
    lastMessage: {
        id: string;
        message: string;
        createdAt: string;
        images: string[];
        user: boolean;
    };
    id: string;
    nombre: string;
    createdAt: string;
    product?: {
        id: string;
        name: string;
        description: string;
        points: number;
        createdAt: string;
        // Otros campos del producto
    };
}

export interface ConversationDTO {
    id: string;
    nombre: string;
    createdAt: string;
    lastMessage?: {
        id: string;
        message: string;
        createdAt: string;
        images: string[];
        user: boolean;
    };
}

export interface ConversationMessage {
    id: string;
    message: string;
    createdAt: string;
    images: string[];
    user: boolean;
}

export interface ConversationDetail {
    id: string;
    nombre: string;
    createdAt: string;
    messages: ConversationMessage[];
}

const MAX_FILE_SIZE = 1024 * 1024; // 1MB en bytes

const compressImage = async (file: File, maxSizeInBytes: number): Promise<File> => {
    let quality = 1.0;
    let compressedFile = file;

    while (compressedFile.size > maxSizeInBytes && quality > 0.1) {
        const canvas = document.createElement('canvas');
        const img = await createImageBitmap(file);

        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('No se pudo crear el contexto 2D');

        ctx.drawImage(img, 0, 0);

        const blob = await new Promise<Blob | null>(resolve => {
            canvas.toBlob(blob => resolve(blob), 'image/jpeg', quality);
        });

        if (!blob) throw new Error('Error al comprimir la imagen');

        compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
        });

        quality -= 0.1;
    }

    return compressedFile;
};

const convertImageToPNG = async (file: File): Promise<File> => {
    // Primero verificamos si necesitamos comprimir
    if (file.size > MAX_FILE_SIZE) {
        console.log('Archivo demasiado grande, comprimiendo...');
        try {
            const compressedFile = await compressImage(file, MAX_FILE_SIZE);
            console.log('Archivo comprimido exitosamente');
            return compressedFile;
        } catch (error) {
            console.error('Error al comprimir:', error);
        }
    }

    // Si no necesita compresión o hubo un error, continuamos con la conversión normal
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('No se pudo crear el contexto 2D'));
                return;
            }

            ctx.drawImage(img, 0, 0);

            canvas.toBlob((blob) => {
                if (blob) {
                    const convertedFile = new File([blob], file.name.split('.')[0] + '.png', {
                        type: 'image/png'
                    });
                    resolve(convertedFile);
                } else {
                    reject(new Error('Error al convertir la imagen'));
                }
            }, 'image/png');
        };

        img.onerror = () => reject(new Error('Error al cargar la imagen'));
        img.src = URL.createObjectURL(file);
    });
};

/**
 * Envía un mensaje al asistente IA con imágenes opcionales
 */
export const IAChat = async (
    files: File[],
    message: string,
    chatID?: string,
    productId?: string
): Promise<IAChatResponse> => {
    const formData = new FormData();

    // Agregamos primero el mensaje para asegurarnos que sea procesado
    formData.append('message', message);

    // Luego agregamos los archivos, si hay alguno
    if (files && files.length > 0) {

        // IMPORTANTE: El backend espera una lista con el nombre "file", no "files" o "images"
        for (const file of files) {

            // Si el tipo MIME no está definido explícitamente, intentamos asignarlo
            let fileToUpload = file;

            console.log('Archivo a subir:', file.type);
            // Intentar inferir el tipo MIME de la extensión
            const fileExtension = file.name.split('.').pop()?.toLowerCase();
            if (fileExtension === 'jpg' || fileExtension === 'jpeg') {
                console.log('Tipo jpg no reconocido, intentando convertir a PNG');

                // Crear un nuevo File con el tipo MIME correcto
                fileToUpload = new File([file], file.name, { type: 'image/jpeg' });
            } else if (fileExtension === 'png') {
                console.log('Tipo png no reconocido, intentando convertir a PNG');

                fileToUpload = new File([file], file.name, { type: 'image/png' });
            } else {
                console.log('Tipo MIME no reconocido, intentando convertir a PNG');
                try {
                    // Convertir a PNG si no es jpg/jpeg/png
                    fileToUpload = await convertImageToPNG(file);
                } catch (error) {
                    console.error('Error al convertir la imagen:', error);
                    continue; // Saltamos este archivo y continuamos con el siguiente
                }
            }

            formData.append('file', fileToUpload);
        }
    }

    // Agregamos los demás parámetros
    if (chatID) formData.append('chatID', chatID);
    if (productId) formData.append('productId', productId);


    try {
        // Importante: Para FormData, debemos dejar que Axios establezca el Content-Type automáticamente
        const response = await API.post('/ia/producto', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });


        return response.data;
    } catch (error: any) {
        console.error('Error en petición IAChat:', error);
        console.error('Detalles adicionales:', error.response?.data || 'No hay datos adicionales');
        console.error('Estatus:', error.response?.status);
        console.error('Headers de respuesta:', error.response?.headers);

        // Si hay un error de tiempo de espera o conexión
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            console.error('Tiempo de espera agotado. Podría ser debido al tamaño de los archivos');
        }

        throw error;
    }
};

export class ConversationService {
    /**
     * Obtiene la lista de conversaciones del usuario con paginación
     */
    static async getConversations(page: number = 0): Promise<ConversationDTO[]> {
        try {
            const response = await API.get('/ia/conversations', {
                params: { page }
            });
            return response.data;
        } catch (error) {
            console.error('Error al obtener conversaciones:', error);
            throw error;
        }
    }

    /**
     * Obtiene los detalles completos de una conversación específica
     * Esta función asume que existe un endpoint para obtener mensajes de una conversación
     * Si no existe, tendrás que crearlo en el backend
     */
    static async getConversationDetail(conversationId: string): Promise<ConversationDetail> {
        try {
            // Este endpoint tendría que ser implementado en el backend
            const response = await API.get(`/ia/conversations/${conversationId}`);
            return response.data;
        } catch (error) {
            console.error('Error al obtener detalles de conversación:', error);
            throw error;
        }
    }

    /**
     * Elimina una conversación
     * Esta función asume que existe un endpoint para eliminar conversaciones
     */
    static async deleteConversation(conversationId: string): Promise<boolean> {
        try {
            await API.delete(`/ia/conversations/${conversationId}`);
            return true;
        } catch (error) {
            console.error('Error al eliminar conversación:', error);
            return false;
        }
    }

    /**
     * Actualiza el nombre de una conversación
     * Esta función asume que existe un endpoint para actualizar el nombre
     */
    static async updateConversationName(conversationId: string, newName: string): Promise<boolean> {
        try {
            await API.put(`/ia/conversations/${conversationId}`, {
                nombre: newName
            });
            return true;
        } catch (error) {
            console.error('Error al actualizar nombre de conversación:', error);
            return false;
        }
    }

    /**
     * Convierte las conversaciones del backend al formato que usa el frontend
     */
    static convertToFrontendFormat(conversations: ConversationDTO[]): any[] {
        return conversations.map(conv => ({
            id: conv.id,
            title: conv.nombre,
            lastMessage: conv.lastMessage?.message || 'Nueva conversación',
            timestamp: new Date(conv.createdAt),
            messages: conv.lastMessage ? [{
                id: conv.lastMessage.id,
                text: conv.lastMessage.message,
                sender: conv.lastMessage.user ? 'user' : 'ai',
                timestamp: new Date(conv.lastMessage.createdAt),
                images: conv.lastMessage.images?.length > 0 ? conv.lastMessage.images : undefined
            }] : [],
            unread: 0 // Puedes implementar lógica de no leídos si es necesario
        }));
    }

    /**
     * Convierte los mensajes del formato backend al formato frontend
     */
    static convertMessagesToFrontendFormat(messages: ConversationMessage[]): any[] {
        return messages.map(msg => ({
            id: msg.id,
            text: msg.message,
            sender: msg.user ? 'user' : 'ai',
            timestamp: new Date(msg.createdAt),
            images: msg.images?.length > 0 ? msg.images : undefined
        }));
    }
}