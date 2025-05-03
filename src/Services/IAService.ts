import API from './api';

// Interfaz para tipificar la respuesta
export interface IAChatResponse {
    messagesIA: Array<{
        id: string;
        message: string;
        createdAt: string;
        images?: string[];
        user: boolean;
    }>;
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
        files.forEach((file) => {
            // Si el tipo MIME no está definido explícitamente, intentamos asignarlo
            let fileToUpload = file;
            if (!file.type || file.type === '') {
                // Intentar inferir el tipo MIME de la extensión
                const fileExtension = file.name.split('.').pop()?.toLowerCase();
                if (fileExtension === 'jpg' || fileExtension === 'jpeg') {
                    // Crear un nuevo File con el tipo MIME correcto
                    fileToUpload = new File([file], file.name, { type: 'image/jpeg' });
                } else if (fileExtension === 'png') {
                    fileToUpload = new File([file], file.name, { type: 'image/png' });
                }
            }

            formData.append('file', fileToUpload);
        });
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


        // Verificamos si la respuesta tiene la estructura esperada
        if (!response.data.messagesIA || response.data.messagesIA.length === 0) {
            console.warn('La respuesta no contiene mensajes IA');
            return {
                ...response.data,
                messagesIA: [{
                    id: Date.now().toString(),
                    message: 'No se recibió respuesta del servidor',
                    createdAt: new Date().toISOString(),
                    images: [],
                    user: false
                }]
            };
        }

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