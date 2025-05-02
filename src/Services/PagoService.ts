import api from './api';

class PagoService {
    static async createPaymentIntent(data: CreatePaymentIntentRequest): Promise<CreatePaymentIntentResponse> {
        const token = sessionStorage.getItem('token');
        if (!token) {
            throw new Error('No se encontró un token de sesión. Por favor, inicia sesión nuevamente.');
        }

        try {
            const config = {
                headers: {
                    token: token,
                },
            };

            const response = await api.post<CreatePaymentIntentResponse>(
                '/api/payment/create-payment-intent',
                data,
                config
            );

            return response.data;
        } catch (error: unknown) {
            console.error('Error al crear el intent de pago:', error);

            // Verificamos primero el tipo de error
            if (error && typeof error === 'object') {
                // Para errores de axios
                const axiosError = error as {
                    response?: { data?: { error?: string } },
                    message?: string
                };

                if (axiosError.response?.data?.error) {
                    throw new Error(axiosError.response.data.error);
                }

                if (axiosError.message) {
                    throw new Error(axiosError.message);
                }
            }

            // Mensaje genérico si no podemos extraer detalles específicos
            throw new Error('No se pudo crear el intent de pago. Por favor, inténtalo de nuevo más tarde.');
        }
    }
}

export interface CreatePaymentIntentRequest {
    priceId: string;
    quantity: number;
}

export interface CreatePaymentIntentResponse {
    success: boolean;
    url?: string;
    error?: string;
}

export default PagoService;