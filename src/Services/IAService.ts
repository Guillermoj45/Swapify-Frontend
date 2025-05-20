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
