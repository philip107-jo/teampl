import { apiClient } from './client';

export interface PaymentCard {
  id: number;
  cardCompany: string;
  maskedNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cardHolder: string;
  createdAt: string;
}

export const cardApi = {
  getCards: async (): Promise<PaymentCard[]> => {
    const res = await apiClient.get('/users/cards');
    return res.data;
  },
  registerCard: async (data: {
    cardNumber: string;
    expiryMonth: string;
    expiryYear: string;
    cardHolder: string;
  }): Promise<{ card: PaymentCard; message: string }> => {
    const res = await apiClient.post('/users/cards', data);
    return res.data;
  },
  deleteCard: async (cardId: number): Promise<{ message: string; remainingCards: number }> => {
    const res = await apiClient.delete(`/users/cards/${cardId}`);
    return res.data;
  },
};
