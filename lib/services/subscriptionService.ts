// Servicio para gestionar suscripciones y pagos

import { User, Subscription } from '../types/user';

const SUBSCRIPTION_PRICE_EUR = 100;
const SUBSCRIPTION_PRICE_USD = 110; // Aproximado

export class SubscriptionService {
  /**
   * Verifica si un usuario tiene acceso activo
   */
  hasActiveAccess(user: User): boolean {
    // Desarrolladores y usuarios con email específico tienen acceso gratis
    if (user.role === 'developer') {
      return true;
    }

    // Usuario específico con acceso gratis
    if (user.email && user.email.toLowerCase() === 'albertodiazmarcano@gmail.com') {
      return true;
    }

    // Verificar suscripción
    if (!user.subscription) {
      return false;
    }

    if (user.subscription.status !== 'active') {
      return false;
    }

    // Verificar fecha de expiración
    if (user.subscription.endDate && user.subscription.endDate < Date.now()) {
      return false;
    }

    return true;
  }

  /**
   * Crea una nueva suscripción
   */
  createSubscription(
    userId: string,
    currency: 'EUR' | 'USD' = 'EUR',
    paymentMethod: 'card' | 'crypto' = 'crypto',
    transactionHash?: string
  ): Subscription {
    const price = currency === 'EUR' ? SUBSCRIPTION_PRICE_EUR : SUBSCRIPTION_PRICE_USD;
    const duration = 30 * 24 * 60 * 60 * 1000; // 30 días en ms

    return {
      id: `sub-${Date.now()}`,
      userId,
      status: 'active',
      plan: 'premium',
      price,
      currency,
      startDate: Date.now(),
      endDate: Date.now() + duration,
      paymentMethod,
      transactionHash,
    };
  }

  /**
   * Verifica el pago de una suscripción
   */
  async verifyPayment(
    _transactionHash: string,
    _chainId?: number,
    _token?: 'ETH' | 'USDC'
  ): Promise<boolean> {
    try {
      // TODO: Verificar transacción on-chain usando viem o ethers
      // Puedes verificar:
      // - Que la transacción existe en la red especificada (chainId)
      // - Que el monto es correcto (100€ en ETH o USDC)
      // - Que el destinatario es la wallet correcta
      // - Que el token es el correcto (ETH nativo o USDC ERC20)
      
      // Por ahora simulamos la verificación
      if (process.env.NODE_ENV === 'development') {
        return true; // En desarrollo, siempre válido
      }

      // En producción, verificar la transacción en la red correspondiente
      // Ejemplo con viem:
      // const publicClient = createPublicClient({
      //   chain: getChainById(chainId),
      //   transport: http()
      // });
      // const receipt = await publicClient.getTransactionReceipt({ hash: transactionHash });
      // Verificar que receipt.to === PAYMENT_WALLET y receipt.status === 'success'
      
      return true;
    } catch (error) {
      console.error('Error verificando pago:', error);
      return false;
    }
  }

  /**
   * Cancela una suscripción
   */
  cancelSubscription(subscription: Subscription): Subscription {
    return {
      ...subscription,
      status: 'cancelled',
    };
  }

  /**
   * Obtiene el precio de suscripción
   */
  getSubscriptionPrice(currency: 'EUR' | 'USD' = 'EUR'): number {
    return currency === 'EUR' ? SUBSCRIPTION_PRICE_EUR : SUBSCRIPTION_PRICE_USD;
  }
}

export const subscriptionService = new SubscriptionService();

