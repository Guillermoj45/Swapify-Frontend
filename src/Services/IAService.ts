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
        // Log para verificar los archivos antes de enviarlos
        console.log('Archivos a enviar:', files.map(f => ({
            name: f.name,
            type: f.type,
            size: f.size,
            lastModified: new Date(f.lastModified).toISOString()
        })));

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

            console.log(`Añadiendo archivo: ${fileToUpload.name} (${fileToUpload.type})`);
            formData.append('file', fileToUpload);
        });
    }

    // Agregamos los demás parámetros
    if (chatID) formData.append('chatID', chatID);
    if (productId) formData.append('productId', productId);

    // Log para depuración
    console.log('Enviando IA Chat:');
    console.log('- Mensaje:', message);
    console.log('- ChatID:', chatID || 'nuevo chat');
    console.log('- ProductID:', productId || 'N/A');
    console.log('- Archivos:', files.length);

    // Para depuración: Mostrar el contenido del FormData (esto es solo para logging)
    console.log('Contenido del FormData:');
    for (const pair of (formData as any).entries()) {
        if (pair[1] instanceof File) {
            console.log(pair[0], ':', pair[1].name, '(', pair[1].type, '-', Math.round(pair[1].size / 1024), 'KB )');
        } else {
            console.log(pair[0], ':', pair[1]);
        }
    }

    try {
        // Verificar que haya un token de autorización en las headers predeterminadas de API
        // Este es un punto crítico que debe comprobarse
        console.log('Headers de API predeterminadas:', API.defaults.headers);

        // Importante: Para FormData, debemos dejar que Axios establezca el Content-Type automáticamente
        const response = await API.post('/ia/producto', formData, {
            headers: {
                // No establecer Content-Type aquí - Axios lo hará automáticamente para FormData
                // 'Content-Type': 'multipart/form-data', // Esto lo maneja Axios automáticamente
            },
            // Añadir timeout más largo para permitir subida de archivos grandes
            timeout: 60000
        });

        console.log('Respuesta recibida del servidor:', response.data);

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