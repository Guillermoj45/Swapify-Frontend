import API from './api';

export const IAChat = async (
    files: File[],
    message: string,
    chatID?: string,
    productId?: string
) => {
    const formData = new FormData();

    files.forEach((file) => {
        formData.append('file', file);
    });

    formData.append('message', message);
    if (chatID) formData.append('chatID', chatID);
    if (productId) formData.append('productId', productId);

    const token = sessionStorage.getItem('token');

    const response = await API.post('/ia/producto', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
            ...(token && { Authorization: `Bearer ${token}` })
        }
    });

    return response.data;
};
