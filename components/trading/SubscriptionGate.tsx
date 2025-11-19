"use client";

import { useState, useEffect } from 'react';
import { useAccount, useSendTransaction, useWaitForTransactionReceipt, useWriteContract, useChainId, useSwitchChain } from 'wagmi';
import { parseEther, parseUnits } from 'viem';
import { useMiniKit } from '@coinbase/onchainkit/minikit';
import { subscriptionService } from '@/lib/services/subscriptionService';
import { basedAuthService } from '@/lib/services/basedAuthService';
import { priceService } from '@/lib/services/priceService';
import { base, arbitrum, optimism } from 'wagmi/chains';

interface SubscriptionGateProps {
  children: React.ReactNode;
  userRole?: 'developer' | 'user';
}

// Dirección de wallet para recibir pagos (DEBES CAMBIAR ESTA DIRECCIÓN)
const PAYMENT_WALLET = process.env.NEXT_PUBLIC_PAYMENT_WALLET || '0x0000000000000000000000000000000000000000';

// Direcciones de contratos USDC en cada red
const USDC_CONTRACTS = {
  [base.id]: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  [arbitrum.id]: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
  [optimism.id]: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
} as const;

// ABI para transferir USDC (ERC20 transfer)
const ERC20_ABI = [
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

type PaymentToken = 'ETH' | 'USDC';
type PaymentChain = typeof base.id | typeof arbitrum.id | typeof optimism.id;

export function SubscriptionGate({ children, userRole = 'user' }: SubscriptionGateProps) {
  const { address, isConnected } = useAccount();
  const { context } = useMiniKit();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { sendTransaction, data: hashETH, isPending: isPendingETH } = useSendTransaction();
  const { writeContract: writeUSDC, data: hashUSDC, isPending: isPendingUSDC } = useWriteContract();
  
  // Usar el hash correspondiente según el token
  const hash = selectedToken === 'ETH' ? hashETH : hashUSDC;
  const isPending = selectedToken === 'ETH' ? isPendingETH : isPendingUSDC;
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ 
    hash: hash as `0x${string}` | undefined,
    query: {
      enabled: !!hash,
    },
  });
  const [hasAccess, setHasAccess] = useState(false);
  const [checking, setChecking] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string>('0');
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [selectedToken, setSelectedToken] = useState<PaymentToken>('ETH');
  const [selectedChain, setSelectedChain] = useState<PaymentChain>(base.id);

  useEffect(() => {
    checkAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, userRole]);

  const checkAccess = async () => {
    setChecking(true);
    
    // Obtener usuario de Based
    const basedUser = basedAuthService.getCurrentUser();
    
    if (!basedUser) {
      setHasAccess(false);
      setChecking(false);
      return;
    }

    // Verificar si es usuario gratis (albertodiazmarcano@gmail.com)
    if (basedAuthService.isFreeUser(basedUser.email)) {
      setHasAccess(true);
      setChecking(false);
      return;
    }

    // Desarrolladores tienen acceso gratis
    if (userRole === 'developer') {
      setHasAccess(true);
      setChecking(false);
      return;
    }

    // Verificar suscripción del usuario
    const userId = basedUser.id || address || context?.user?.fid?.toString() || '';
    
    // Por ahora, verificar en localStorage
    const subscriptionData = localStorage.getItem(`subscription_${userId}`);
    if (subscriptionData) {
      const subscription = JSON.parse(subscriptionData);
      const user = { 
        role: 'user' as const, 
        email: basedUser.email,
        subscription 
      };
      setHasAccess(subscriptionService.hasActiveAccess(user));
    } else {
      setHasAccess(false);
    }

    setChecking(false);
  };

  // Calcular precio según token seleccionado
  useEffect(() => {
    const calculatePrice = async () => {
      if (!showPayment) return;
      
      setLoadingPrice(true);
      try {
        const priceInEUR = subscriptionService.getSubscriptionPrice('EUR');
        // Convertir 100€ a USD (aproximación: 1 EUR ≈ 1.1 USD)
        const priceInUSD = priceInEUR * 1.1;
        
        if (selectedToken === 'USDC') {
          // USDC es 1:1 con USD
          setPaymentAmount(priceInUSD.toFixed(2));
        } else {
          // ETH: obtener precio y calcular
          const ethPriceUSD = await priceService.getPrice('ETH/USD');
          const ethAmount = priceInUSD / ethPriceUSD;
          setPaymentAmount(ethAmount.toFixed(6));
        }
      } catch (error) {
        console.error('Error calculando precio:', error);
        // Fallback: usar precio aproximado
        if (selectedToken === 'USDC') {
          setPaymentAmount('110'); // ~100€ en USDC (aproximado)
        } else {
          setPaymentAmount('0.03'); // ~100€ en ETH (aproximado)
        }
      } finally {
        setLoadingPrice(false);
      }
    };

    calculatePrice();
  }, [showPayment, selectedToken]);

  const handlePayment = async () => {
    if (!isConnected || !address) {
      alert('Por favor, conecta tu wallet primero');
      return;
    }

    setShowPayment(true);
  };

  const executePayment = async () => {
    if (!address || !isConnected) {
      alert('Por favor, conecta tu wallet primero');
      return;
    }

    // Verificar que estemos en la red correcta
    if (chainId !== selectedChain) {
      try {
        await switchChain({ chainId: selectedChain });
        // Esperar un momento para que cambie la red
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (_error) {
        alert('Por favor, cambia a la red correcta en tu wallet');
        return;
      }
    }

    try {
      if (selectedToken === 'ETH') {
        // Enviar ETH directamente a la wallet de pago
        sendTransaction({
          to: PAYMENT_WALLET as `0x${string}`,
          value: parseEther(paymentAmount),
        });
      } else {
        // Transferir USDC usando el contrato ERC20
        const usdcContract = USDC_CONTRACTS[selectedChain];
        if (!usdcContract) {
          alert('Red no soportada para USDC');
          return;
        }
        
        // USDC tiene 6 decimales
        writeUSDC({
          address: usdcContract as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'transfer',
          args: [
            PAYMENT_WALLET as `0x${string}`,
            parseUnits(paymentAmount, 6), // USDC tiene 6 decimales
          ],
        });
      }
    } catch (error) {
      console.error('Error ejecutando pago:', error);
      alert('Error al ejecutar el pago. Por favor, intenta de nuevo.');
    }
  };

  // Verificar pago cuando la transacción se confirma
  useEffect(() => {
    if (isConfirmed && hash) {
      verifyPayment(hash, selectedChain, selectedToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfirmed, hash, selectedChain, selectedToken]);

  const verifyPayment = async (transactionHash: string, chain: PaymentChain, token: PaymentToken) => {
    try {
      const userId = address || context?.user?.fid?.toString() || '';
      
      const response = await fetch('/api/subscription/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          transactionHash,
          currency: 'EUR',
          paymentMethod: 'crypto',
          chainId: chain,
          token: token,
        }),
      });

      const data = await response.json();
      
      if (data.success && data.subscription) {
        // Guardar suscripción en localStorage
        localStorage.setItem(`subscription_${userId}`, JSON.stringify(data.subscription));
        
        // Recargar acceso
        await checkAccess();
        
        alert('¡Pago confirmado! Tu suscripción está activa.');
        setShowPayment(false);
      } else {
        alert('Error verificando el pago. Por favor, contacta con soporte.');
      }
    } catch (error) {
      console.error('Error verificando pago:', error);
      alert('Error verificando el pago. Por favor, contacta con soporte.');
    }
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400">Verificando acceso...</div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white p-4 flex items-center justify-center">
        <div className="max-w-md w-full space-y-6">
          <div className="bg-gray-900/60 backdrop-blur-xl rounded-3xl p-8 border border-gray-700/50 text-center">
            <h2 className="text-3xl font-bold mb-4">Acceso Premium Requerido</h2>
            <p className="text-gray-400 mb-6">
              Para usar el bot de trading, necesitas una suscripción premium de 100€
            </p>

            {!isConnected && (
              <div className="mb-6">
                <p className="text-sm text-gray-400 mb-4">
                  Conecta tu wallet primero
                </p>
              </div>
            )}

            {isConnected && !showPayment && (
              <button
                onClick={handlePayment}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl font-semibold transition-all"
              >
                Suscribirse por 100€
              </button>
            )}

            {showPayment && (
              <div className="space-y-4">
                {loadingPrice ? (
                  <p className="text-sm text-gray-400">Calculando precio...</p>
                ) : (
                  <>
                    <div className="bg-gray-800/50 rounded-xl p-4 space-y-4">
                      <div>
                        <p className="text-sm text-gray-400 mb-2">Pago requerido:</p>
                        <p className="text-2xl font-bold">100€ (EUR)</p>
                        <p className="text-sm text-gray-500 mt-1">
                          ≈ {paymentAmount} {selectedToken}
                        </p>
                      </div>

                      {/* Selector de Red */}
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-300">
                          Red:
                        </label>
                        <select
                          value={selectedChain}
                          onChange={(e) => setSelectedChain(Number(e.target.value) as PaymentChain)}
                          className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-2 text-white"
                        >
                          <option value={base.id}>Base</option>
                          <option value={arbitrum.id}>Arbitrum</option>
                          <option value={optimism.id}>Optimism</option>
                        </select>
                      </div>

                      {/* Selector de Token */}
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-300">
                          Token:
                        </label>
                        <select
                          value={selectedToken}
                          onChange={(e) => setSelectedToken(e.target.value as PaymentToken)}
                          className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-2 text-white"
                        >
                          <option value="ETH">ETH</option>
                          <option value="USDC">USDC</option>
                        </select>
                      </div>

                      {chainId !== selectedChain && (
                        <div className="bg-yellow-900/30 border border-yellow-700 rounded-xl p-3">
                          <p className="text-xs text-yellow-300">
                            ⚠️ Cambia a {selectedChain === base.id ? 'Base' : selectedChain === arbitrum.id ? 'Arbitrum' : 'Optimism'} en tu wallet
                          </p>
                        </div>
                      )}
                    </div>

                    {!hash && (
                      <button
                        onClick={executePayment}
                        disabled={(isPending || isPendingUSDC) || !paymentAmount || paymentAmount === '0'}
                        className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {(isPending || isPendingUSDC) ? 'Preparando transacción...' : `Pagar ${paymentAmount} ${selectedToken}`}
                      </button>
                    )}

                    {hash && (
                      <div className="space-y-2">
                        {isConfirming && (
                          <div className="bg-blue-900/30 border border-blue-700 rounded-xl p-4">
                            <p className="text-sm text-blue-300">
                              Confirmando transacción...
                            </p>
                            <p className="text-xs text-blue-400 mt-1 break-all">
                              Hash: {hash}
                            </p>
                          </div>
                        )}
                        {isConfirmed && (
                          <div className="bg-green-900/30 border border-green-700 rounded-xl p-4">
                            <p className="text-sm text-green-300">
                              ✓ Transacción confirmada. Verificando pago...
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    <button
                      onClick={() => setShowPayment(false)}
                      className="w-full px-4 py-2 text-sm text-gray-400 hover:text-gray-300"
                    >
                      Cancelar
                    </button>
                  </>
                )}
              </div>
            )}

            <div className="mt-6 text-xs text-gray-500">
              <p>La suscripción es válida por 30 días</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

