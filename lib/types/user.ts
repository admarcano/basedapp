// Tipos para usuarios y suscripciones

export type UserRole = 'developer' | 'user';

export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'trial';

export interface User {
  id: string;
  fid?: number; // Farcaster ID
  address?: string; // Wallet address
  email?: string;
  role: UserRole;
  subscription?: Subscription;
  createdAt: number;
  lastLoginAt?: number;
}

export interface Subscription {
  id: string;
  userId: string;
  status: SubscriptionStatus;
  plan: 'premium'; // Por ahora solo un plan
  price: number; // 200€
  currency: 'EUR' | 'USD';
  startDate: number;
  endDate?: number;
  paymentMethod?: 'card' | 'crypto';
  transactionHash?: string; // Para pagos en crypto
}

export interface BasedCredentials {
  apiKey: string;
  apiSecret: string;
  userId: string;
}

