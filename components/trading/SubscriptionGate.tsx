"use client";

import { useState, useEffect } from 'react';
import { useAccount, useSendTransaction, useWaitForTransactionReceipt, useWriteContract, useChainId, useSwitchChain } from 'wagmi';
import { parseEther, parseUnits } from 'viem';
import { useMiniKit } from '@coinbase/onchainkit/minikit';
import { subscriptionService } from '@/lib/services/subscriptionService';
import { basedAuthService } from '@/lib/services/basedAuthService';
import { priceService } from '@/lib/services/priceService';
import { Logo } from '@/components/Logo';
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
  const [hasAccess, setHasAccess] = useState(false);
  const [checking, setChecking] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string>('0');
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [selectedToken, setSelectedToken] = useState<PaymentToken>('ETH');
  const [selectedChain, setSelectedChain] = useState<PaymentChain>(base.id);
  
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
      } catch {
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
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-950/30 to-gray-950 flex items-center justify-center p-4">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-cyan-400 border-r-blue-500 mx-auto shadow-lg shadow-cyan-500/50"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-2 border-cyan-400/30 mx-auto"></div>
          </div>
          <p className="text-gray-300 text-lg font-light tracking-wider">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-950/30 to-purple-950/20 text-white p-4 flex items-center justify-center relative overflow-hidden">
        {/* Efectos de fondo futurista */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="max-w-lg w-full space-y-6 relative z-10">
          {/* Logo y Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <Logo />
                <div className="absolute inset-0 bg-cyan-400/20 rounded-full blur-xl animate-pulse"></div>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(34,211,238,0.5)]">
              Trading Bot With Marcano
            </h1>
            <p className="text-gray-300 text-lg font-light tracking-wide">
              Bot de Trading Automático Inteligente
            </p>
          </div>

          <div className="bg-gray-900/60 backdrop-blur-2xl rounded-3xl p-8 border border-cyan-500/20 shadow-2xl shadow-cyan-500/10 relative overflow-hidden">
            {/* Efecto de borde brillante */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-purple-500/0 opacity-50"></div>
            <div className="relative z-10">
            {/* Badge Premium */}
            <div className="flex justify-center mb-6">
              <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-yellow-500/20 border border-yellow-400/40 rounded-full text-yellow-300 text-sm font-semibold shadow-lg shadow-yellow-500/20 backdrop-blur-sm">
                <span className="text-lg animate-pulse">⭐</span>
                Acceso Premium Requerido
              </span>
            </div>

            <h2 className="text-3xl font-bold mb-4 text-center bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 bg-clip-text text-transparent">
              Desbloquea el Potencial
            </h2>
            <p className="text-gray-300 mb-2 text-center text-lg font-light">
              Para usar el bot de trading, necesitas una suscripción premium
            </p>
            <p className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent font-bold text-center mb-8 text-2xl drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]">
              100€ / mes
            </p>

            {/* Features */}
            <div className="grid grid-cols-1 gap-3 mb-8">
              <div className="flex items-center gap-3 bg-gradient-to-r from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-xl p-4 border border-cyan-500/20 hover:border-cyan-400/40 transition-all hover:shadow-lg hover:shadow-cyan-500/10">
                <span className="text-cyan-400 text-xl drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">✓</span>
                <span className="text-gray-200 font-light">Estrategias inteligentes adaptativas</span>
              </div>
              <div className="flex items-center gap-3 bg-gradient-to-r from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-xl p-4 border border-cyan-500/20 hover:border-cyan-400/40 transition-all hover:shadow-lg hover:shadow-cyan-500/10">
                <span className="text-cyan-400 text-xl drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">✓</span>
                <span className="text-gray-200 font-light">50-100+ operaciones diarias</span>
              </div>
              <div className="flex items-center gap-3 bg-gradient-to-r from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-xl p-4 border border-cyan-500/20 hover:border-cyan-400/40 transition-all hover:shadow-lg hover:shadow-cyan-500/10">
                <span className="text-cyan-400 text-xl drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">✓</span>
                <span className="text-gray-200 font-light">Gestión automática de capital</span>
              </div>
              <div className="flex items-center gap-3 bg-gradient-to-r from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-xl p-4 border border-cyan-500/20 hover:border-cyan-400/40 transition-all hover:shadow-lg hover:shadow-cyan-500/10">
                <span className="text-cyan-400 text-xl drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">✓</span>
                <span className="text-gray-200 font-light">Stop Loss y Take Profit dinámicos</span>
              </div>
            </div>

            {!isConnected && (
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-cyan-500/30 rounded-xl backdrop-blur-sm shadow-lg shadow-cyan-500/10">
                <div className="flex items-center gap-3 justify-center">
                  <span className="text-cyan-400 text-xl drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">🔐</span>
                  <p className="text-cyan-300 font-medium">
                    Conecta tu wallet primero para continuar
                  </p>
                </div>
              </div>
            )}

            {isConnected && !showPayment && (
              <button
                onClick={handlePayment}
                className="group relative w-full px-8 py-4 overflow-hidden rounded-xl font-bold text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #8b5cf6 100%)',
                  boxShadow: '0 10px 40px rgba(6, 182, 212, 0.4), 0 0 20px rgba(139, 92, 246, 0.3), inset 0 0 20px rgba(255, 255, 255, 0.1)',
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <span className="relative flex items-center justify-center gap-2 text-white drop-shadow-lg">
                  <span className="text-xl">🚀</span>
                  Suscribirse por 100€
                </span>
              </button>
            )}

            {showPayment && (
              <div className="space-y-4 animate-in fade-in duration-300">
                {loadingPrice ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
                    <p className="text-gray-400">Calculando precio...</p>
                  </div>
                ) : (
                  <>
                    {/* Resumen de Pago */}
                    <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl rounded-2xl p-6 border border-cyan-500/20 shadow-xl shadow-cyan-500/5 space-y-4 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/5 to-purple-500/0"></div>
                      <div className="relative z-10">
                        <div className="text-center pb-4 border-b border-cyan-500/20">
                          <p className="text-sm text-gray-400 mb-2 font-light tracking-wide">Pago requerido</p>
                          <p className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-emerald-400 to-green-400 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]">
                            100€
                          </p>
                          <p className="text-lg text-gray-300 mt-2 font-light">
                            ≈ {paymentAmount} {selectedToken}
                          </p>
                        </div>

                      {/* Selector de Red */}
                      <div>
                        <label className="block text-sm font-semibold mb-3 text-gray-200 flex items-center gap-2">
                          <span className="text-cyan-400">🌐</span>
                          Red Blockchain
                        </label>
                        <select
                          value={selectedChain}
                          onChange={(e) => setSelectedChain(Number(e.target.value) as PaymentChain)}
                          className="w-full bg-gray-800/40 backdrop-blur-sm border border-cyan-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all hover:border-cyan-400/50 shadow-lg shadow-cyan-500/5"
                        >
                          <option value={base.id}>Base</option>
                          <option value={arbitrum.id}>Arbitrum</option>
                          <option value={optimism.id}>Optimism</option>
                        </select>
                      </div>

                      {/* Selector de Token */}
                      <div>
                        <label className="block text-sm font-semibold mb-3 text-gray-200 flex items-center gap-2">
                          <span className="text-cyan-400">💎</span>
                          Token de Pago
                        </label>
                        <select
                          value={selectedToken}
                          onChange={(e) => setSelectedToken(e.target.value as PaymentToken)}
                          className="w-full bg-gray-800/40 backdrop-blur-sm border border-cyan-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all hover:border-cyan-400/50 shadow-lg shadow-cyan-500/5"
                        >
                          <option value="ETH">ETH (Ethereum)</option>
                          <option value="USDC">USDC (USD Coin)</option>
                        </select>
                      </div>

                      {chainId !== selectedChain && (
                        <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border border-yellow-400/40 rounded-xl p-4 flex items-start gap-3 backdrop-blur-sm shadow-lg shadow-yellow-500/10">
                          <span className="text-yellow-400 text-xl drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]">⚠️</span>
                          <div>
                            <p className="text-sm font-semibold text-yellow-300 mb-1">
                              Cambio de Red Requerido
                            </p>
                            <p className="text-xs text-yellow-400/80">
                              Por favor, cambia a {selectedChain === base.id ? 'Base' : selectedChain === arbitrum.id ? 'Arbitrum' : 'Optimism'} en tu wallet para continuar
                            </p>
                          </div>
                        </div>
                      )}
                      </div>
                    </div>

                    {!hash && (
                      <button
                        onClick={executePayment}
                        disabled={(isPending || isPendingUSDC) || !paymentAmount || paymentAmount === '0'}
                        className="group relative w-full px-8 py-4 overflow-hidden rounded-xl font-bold text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        style={{
                          background: (isPending || isPendingUSDC) || !paymentAmount || paymentAmount === '0' 
                            ? 'linear-gradient(135deg, #374151 0%, #1f2937 100%)'
                            : 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
                          boxShadow: (isPending || isPendingUSDC) || !paymentAmount || paymentAmount === '0'
                            ? 'none'
                            : '0 10px 40px rgba(16, 185, 129, 0.4), 0 0 20px rgba(5, 150, 105, 0.3), inset 0 0 20px rgba(255, 255, 255, 0.1)',
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                        {(isPending || isPendingUSDC) ? (
                          <span className="relative flex items-center justify-center gap-2 text-white">
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                            Preparando transacción...
                          </span>
                        ) : (
                          <span className="relative flex items-center justify-center gap-2 text-white drop-shadow-lg">
                            <span className="text-xl">💳</span>
                            Pagar {paymentAmount} {selectedToken}
                          </span>
                        )}
                      </button>
                    )}

                    {hash && (
                      <div className="space-y-3">
                        {isConfirming && (
                          <div className="bg-gradient-to-r from-blue-900/40 to-cyan-900/40 border border-cyan-400/40 rounded-xl p-5 backdrop-blur-sm shadow-lg shadow-cyan-500/10">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="relative">
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-cyan-400/30 border-t-cyan-400"></div>
                                <div className="absolute inset-0 animate-ping rounded-full h-5 w-5 border border-cyan-400/20"></div>
                              </div>
                              <p className="text-sm font-semibold text-cyan-300">
                                Confirmando transacción...
                              </p>
                            </div>
                            <p className="text-xs text-cyan-400/80 break-all font-mono bg-gray-900/50 p-3 rounded-lg mt-2 border border-cyan-500/20">
                              {hash}
                            </p>
                          </div>
                        )}
                        {isConfirmed && (
                          <div className="bg-gradient-to-r from-green-900/40 to-emerald-900/40 border border-emerald-400/40 rounded-xl p-5 backdrop-blur-sm shadow-lg shadow-emerald-500/10">
                            <div className="flex items-center gap-3">
                              <span className="text-emerald-400 text-xl drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]">✓</span>
                              <p className="text-sm font-semibold text-emerald-300">
                                Transacción confirmada. Verificando pago...
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <button
                      onClick={() => setShowPayment(false)}
                      className="w-full px-4 py-3 text-sm text-gray-400 hover:text-cyan-300 hover:bg-gray-800/30 rounded-xl transition-all border border-transparent hover:border-cyan-500/30 backdrop-blur-sm"
                    >
                      ← Volver
                    </button>
                  </>
                )}
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-cyan-500/20">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-300">
                <span className="text-cyan-400">⏱️</span>
                <p>La suscripción es válida por <span className="text-cyan-400 font-semibold drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">30 días</span></p>
              </div>
              <p className="text-xs text-gray-400 text-center mt-2 font-light">
                Renovación automática disponible
              </p>
            </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

