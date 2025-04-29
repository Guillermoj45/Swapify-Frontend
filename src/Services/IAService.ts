import API from './api';

// Interfaz para tipificar la respuesta
interface IAChatResponse {
    id: string;
    message: string;
    response: string;
    images?: string[];
    timestamp: Date;
}

export const IAChat = async (
    files: File[],
    message: string,
    chatID?: string,
    productId?: string
): Promise<IAChatResponse> => {
    const formData = new FormData();

    // Agregamos primero el mensaje para asegurarnos que sea procesado
    formData.append('message', message);
    console.log(message)

    // Luego agregamos los archivos, si hay alguno
    if (files && files.length > 0) {
        files.forEach((file) => {
            formData.append('file', file);
        });
    }

    // Agregamos los demás parámetros
    if (chatID) formData.append('chatID', chatID);
    if (productId) formData.append('productId', productId);

    // Obtenemos el token para autorización
    const token = sessionStorage.getItem('token');

    try {
        // Para depuración, podemos ver qué estamos enviando
        console.log('Enviando mensaje:', message);
        console.log('Número de archivos:', files.length);

        const response = await API.post('/ia/producto', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                ...(token && { Authorization: `Bearer ${token}` })
            }
        });

        console.log('Respuesta recibida:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error en petición IAChat:', error);
        throw error;
    }
};