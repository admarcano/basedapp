"use client";

import { useTradingBot } from '@/lib/hooks/useTradingBot';
import { useAccount } from 'wagmi';
import { useMiniKit } from '@coinbase/onchainkit/minikit';
import { useState, useEffect } from 'react';
import { StrategyForm } from './StrategyForm';
import { BasedAuth } from './BasedAuth';
import { SubscriptionGate } from './SubscriptionGate';
import { basedService } from '@/lib/services/basedService';
import { basedAuthService } from '@/lib/services/basedAuthService';
import { capitalManagement } from '@/lib/services/capitalManagement';
import { Logo } from '@/components/Logo';
import { CapitalConfig } from './CapitalConfig';

export function BotDashboard() {
  const { } = useAccount();
  const { context } = useMiniKit();
  const {
    status,
    strategies,
    orders,
    signals,
    prices,
    startBot,
    stopBot,
    addStrategy,
    updateStrategy,
    removeStrategy,
    createOrderFromSignal,
    closeOrder,
  } = useTradingBot();
  
  const [showStrategyForm, setShowStrategyForm] = useState(false);
  const [isBasedAuthenticated, setIsBasedAuthenticated] = useState(false);
  const [showCapitalConfig, setShowCapitalConfig] = useState(false);
  const [capitalConfigured, setCapitalConfigured] = useState(false);

  const [activeTab, setActiveTab] = useState<'overview' | 'strategies' | 'orders' | 'signals'>('overview');

  useEffect(() => {
    // Verificar si está autenticado con Based
    const isAuth = basedAuthService.isAuthenticated();
    setIsBasedAuthenticated(isAuth);
    
    // Configurar token en basedService
    if (isAuth) {
      const token = basedAuthService.getAccessToken();
      if (token) {
        basedService.setAccessToken(token);
      }
    }

    // Verificar si el capital ya está configurado
    const saved = localStorage.getItem('bot_allocated_capital');
    const isConfigured = !!saved;
    setCapitalConfigured(isConfigured);
    setShowCapitalConfig(!isConfigured && isAuth);
  }, []);

  const activeOrders = orders.filter(o => o.status === 'open');
  const closedOrders = orders.filter(o => o.status === 'closed');

  // Determinar si el usuario tiene acceso gratis
  const isDeveloper = context?.user?.fid === 1 || process.env.NODE_ENV === 'development';
  
  const capitalStats = capitalManagement.getCapitalStats();

  return (
    <SubscriptionGate userRole={isDeveloper ? 'developer' : 'user'}>
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Based Auth Section */}
          {!isBasedAuthenticated && (
            <BasedAuth />
          )}

          {isBasedAuthenticated && (
            <>
              <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-green-400">✓</span>
                  <span className="text-sm">Conectado con Based</span>
                </div>
                <div className="flex items-center gap-3">
                  {!capitalConfigured && (
                    <button
                      onClick={() => setShowCapitalConfig(true)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs transition-colors"
                    >
                      Configurar Capital
                    </button>
                  )}
                  <button
                    onClick={() => {
                      basedAuthService.logout();
                      setIsBasedAuthenticated(false);
                      window.location.reload();
                    }}
                    className="text-xs text-gray-400 hover:text-white"
                  >
                    Desconectar
                  </button>
                </div>
              </div>

              {/* Configuración de Capital */}
              {showCapitalConfig && (
                <CapitalConfig
                  onCapitalSet={(amount) => {
                    setCapitalConfigured(true);
                    setShowCapitalConfig(false);
                    window.location.reload();
                  }}
                />
              )}
            </>
          )}

          {/* Header */}
          <div className="bg-gray-900/60 backdrop-blur-xl rounded-3xl p-6 border border-gray-700/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Logo size="medium" />
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-green-400 bg-clip-text text-transparent">
                  Trading Bot With Marcano
                </h1>
                <p className="text-gray-400 text-sm mt-1">
                  Bot automático para Based • Lateralizaciones • Rupturas • Impulsos
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                status.isRunning 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : 'bg-gray-700/50 text-gray-400 border border-gray-600/30'
              }`}>
                {status.isRunning ? '🟢 Activo' : '⚫ Detenido'}
              </div>
              {status.isRunning ? (
                <button
                  onClick={stopBot}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-xl transition-colors"
                >
                  Detener
                </button>
              ) : (
                <button
                  onClick={startBot}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-xl transition-colors"
                >
                  Iniciar
                </button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30">
              <div className="text-gray-400 text-xs mb-1">Estrategias Activas</div>
              <div className="text-2xl font-bold">{status.activeStrategies}</div>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30">
              <div className="text-gray-400 text-xs mb-1">Posiciones Abiertas</div>
              <div className="text-2xl font-bold">{status.activePositions}</div>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30">
              <div className="text-gray-400 text-xs mb-1">Capital Actual</div>
              <div className={`text-2xl font-bold ${capitalStats.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${capitalStats.currentCapital.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {capitalStats.totalReturn >= 0 ? '+' : ''}{capitalStats.totalReturnPercent.toFixed(2)}%
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30">
              <div className="text-gray-400 text-xs mb-1">Señales Hoy</div>
              <div className="text-2xl font-bold">{signals.length}</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-gray-900/40 rounded-2xl p-2 border border-gray-700/30">
          {(['overview', 'strategies', 'orders', 'signals'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-2 rounded-xl transition-all ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              {tab === 'overview' && '📊 Resumen'}
              {tab === 'strategies' && '⚙️ Estrategias'}
              {tab === 'orders' && '📈 Órdenes'}
              {tab === 'signals' && '🔔 Señales'}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-gray-900/40 backdrop-blur-lg rounded-3xl p-6 border border-gray-700/30">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">Precios en Tiempo Real</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from(prices.entries()).map(([pair, price]) => (
                  <div key={pair} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30">
                    <div className="text-gray-400 text-xs mb-1">{pair}</div>
                    <div className="text-lg font-bold">${price.toFixed(2)}</div>
                  </div>
                ))}
              </div>

              <h2 className="text-xl font-semibold mt-6 mb-4">Órdenes Recientes</h2>
              <div className="space-y-2">
                {orders.slice(-5).reverse().map(order => (
                  <div key={order.id} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{order.pair} {order.side.toUpperCase()}</div>
                      <div className="text-sm text-gray-400">
                        {order.strategy} • ${order.entryPrice.toFixed(2)}
                      </div>
                    </div>
                    <div className={`text-right ${order.pnl && order.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      <div className="font-bold">
                        {order.pnl ? `$${order.pnl.toFixed(2)}` : '-'}
                      </div>
                      <div className="text-sm">
                        {order.pnlPercentage ? `${order.pnlPercentage > 0 ? '+' : ''}${order.pnlPercentage.toFixed(2)}%` : '-'}
                      </div>
                    </div>
                  </div>
                ))}
                {orders.length === 0 && (
                  <div className="text-center text-gray-400 py-8">No hay órdenes aún</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'strategies' && (
            <div className="space-y-4">
              {strategies.map(strategy => (
                <div key={strategy.id} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-semibold">{strategy.name}</div>
                      <div className="text-sm text-gray-400">{strategy.pair} • {strategy.type}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={strategy.enabled}
                          onChange={(e) => {
                            updateStrategy(strategy.id, { enabled: e.target.checked });
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                      <button
                        onClick={() => removeStrategy(strategy.id)}
                        className="px-2 py-1 text-xs bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm mt-3">
                    <div>
                      <div className="text-gray-400">Leverage</div>
                      <div className="font-medium">{strategy.leverage}x</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Stop Loss</div>
                      <div className="font-medium">{strategy.stopLoss}%</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Take Profit</div>
                      <div className="font-medium">{strategy.takeProfit}%</div>
                    </div>
                  </div>
                </div>
              ))}
              {strategies.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  <p>No hay estrategias configuradas</p>
                  <button
                    onClick={() => setShowStrategyForm(true)}
                    className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
                  >
                    Crear Primera Estrategia
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-4">
              <h3 className="font-semibold mb-3">Órdenes Abiertas ({activeOrders.length})</h3>
              {activeOrders.map(order => (
                <div key={order.id} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{order.pair} {order.side.toUpperCase()}</div>
                      <div className="text-sm text-gray-400">
                        Entrada: ${order.entryPrice.toFixed(2)} • Actual: ${order.currentPrice.toFixed(2)}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`text-right ${order.pnl && order.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        <div className="font-bold text-lg">
                          {order.pnl ? `$${order.pnl.toFixed(2)}` : '-'}
                        </div>
                        <div className="text-sm">
                          {order.pnlPercentage ? `${order.pnlPercentage > 0 ? '+' : ''}${order.pnlPercentage.toFixed(2)}%` : '-'}
                        </div>
                      </div>
                      <button
                        onClick={() => closeOrder(order.id)}
                        className="px-3 py-1 text-xs bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg"
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              <h3 className="font-semibold mt-6 mb-3">Historial ({closedOrders.length})</h3>
              {closedOrders.slice(-10).reverse().map(order => (
                <div key={order.id} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30 opacity-70">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{order.pair} {order.side.toUpperCase()}</div>
                      <div className="text-sm text-gray-400">
                        ${order.entryPrice.toFixed(2)} → ${order.currentPrice?.toFixed(2)}
                      </div>
                    </div>
                    <div className={`text-right ${order.pnl && order.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      <div className="font-bold">
                        {order.pnl ? `$${order.pnl.toFixed(2)}` : '-'}
                      </div>
                      <div className="text-sm">
                        {order.pnlPercentage ? `${order.pnlPercentage > 0 ? '+' : ''}${order.pnlPercentage.toFixed(2)}%` : '-'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'signals' && (
            <div className="space-y-3">
              {signals.slice(-20).reverse().map(signal => {
                const matchingStrategy = strategies.find(s => s.type === signal.strategy && s.pair === signal.pair && s.enabled);
                return (
                  <div key={signal.id} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-semibold">
                          {signal.pair} {signal.side.toUpperCase()}
                        </div>
                        <div className="text-sm text-gray-400 mt-1">
                          {signal.reason}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {signal.strategy} • ${signal.price.toFixed(2)}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-sm text-gray-400">Confianza</div>
                          <div className="font-bold text-lg">{signal.confidence.toFixed(0)}%</div>
                        </div>
                        {matchingStrategy && (
                          <button
                            onClick={() => createOrderFromSignal(signal, matchingStrategy)}
                            className="px-3 py-1 text-xs bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg whitespace-nowrap"
                          >
                            Ejecutar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {signals.length === 0 && (
                <div className="text-center text-gray-400 py-8">No hay señales aún</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Botón flotante para nueva estrategia */}
      <button
        onClick={() => setShowStrategyForm(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg flex items-center justify-center text-2xl transition-all z-40"
        title="Nueva Estrategia"
      >
        +
      </button>

      {/* Formulario de estrategia */}
      {showStrategyForm && (
        <StrategyForm
          onSubmit={(strategyData) => {
            addStrategy(strategyData);
            setShowStrategyForm(false);
          }}
          onCancel={() => setShowStrategyForm(false)}
        />
      )}
      </div>
    </SubscriptionGate>
  );
}

