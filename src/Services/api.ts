import axios from 'axios';

const API = axios.create({
    // Usar una URL completa en lugar del proxy para pruebas
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // Agregamos un timeout para evitar esperas indefinidas
});

// Interceptor para añadir token automáticamente si lo tienes en localStorage
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
        config.headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    }
    return config;
});

// Interceptor para logging que te ayudará a depurar
API.interceptors.request.use(request => {
    console.log('Solicitud saliente:', request.method?.toUpperCase(), request.url);
    return request;
});

API.interceptors.response.use(
    response => {
        console.log('Respuesta recibida:', response.status, response.config.url);
        return response;
    },
    error => {
        console.error('Error API:',
            error.response?.status || 'Sin respuesta',
            error.config?.url || 'URL desconocida',
            error.message);
        return Promise.reject(error);
    }
);

export default API;