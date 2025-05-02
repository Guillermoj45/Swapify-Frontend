import api from './api';

class PagoService {
    static async createPaymentIntent(amount: number): Promise<PaymentIntentResponse> {
        try {
            const response = await api.post<PaymentIntentResponse>('/api/payment/create-payment-intent', { amount });
            return response.data;
        } catch (error) {
            console.error('Error creating payment intent:', error);
            throw new Error('Failed to create payment intent. Please try again later.');
        }
    }
}

export interface PaymentIntentResponse {
    clientSecret: string;
}

export default PagoService;