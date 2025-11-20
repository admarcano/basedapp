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
    const isAuth = basedAuthService.isAuthenticated();
    setIsBasedAuthenticated(isAuth);
    
    if (isAuth) {
      const token = basedAuthService.getAccessToken();
      if (token) {
        basedService.setAccessToken(token);
      }
    }

    const saved = localStorage.getItem('bot_allocated_capital');
    const isConfigured = !!saved;
    setCapitalConfigured(isConfigured);
    setShowCapitalConfig(!isConfigured && isAuth);
  }, []);

  const activeOrders = orders.filter(o => o.status === 'open');
  const closedOrders = orders.filter(o => o.status === 'closed');
  const isDeveloper = context?.user?.fid === 1 || process.env.NODE_ENV === 'development';
  const capitalStats = capitalManagement.getCapitalStats();
  const totalPnl = orders.reduce((sum, o) => sum + (o.pnl || 0), 0);

  // Si no está autenticado, mostrar login
  if (!isBasedAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/30 to-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <BasedAuth />
        </div>
      </div>
    );
  }

  return (
    <SubscriptionGate userRole={isDeveloper ? 'developer' : 'user'}>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/20 to-slate-950 text-white">
        {/* Header fijo superior */}
        <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <Logo size="small" />
                <div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    Trading Bot With Based
                  </h1>
                  <p className="text-xs text-slate-400">Bot automático inteligente</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {!capitalConfigured && (
                  <button
                    onClick={() => setShowCapitalConfig(true)}
                    className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    Configurar Capital
                  </button>
                )}
                <div className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                  status.isRunning 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}>
                  {status.isRunning ? '🟢 Activo' : '⚫ Detenido'}
                </div>
                {status.isRunning ? (
                  <button
                    onClick={stopBot}
                    className="px-4 py-1.5 text-sm font-medium bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                  >
                    Detener
                  </button>
                ) : (
                  <button
                    onClick={startBot}
                    className="px-4 py-1.5 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                  >
                    Iniciar Bot
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Contenido principal */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Configuración de Capital Modal */}
          {showCapitalConfig && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <div className="bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-800">
                <CapitalConfig
                  onCapitalSet={(_amount) => {
                    setCapitalConfigured(true);
                    setShowCapitalConfig(false);
                    window.location.reload();
                  }}
                />
                <button
                  onClick={() => setShowCapitalConfig(false)}
                  className="mt-4 w-full px-4 py-2 text-sm bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}

          {/* Stats principales */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl p-6 border border-slate-700/50 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Capital</span>
                <span className="text-2xl">💰</span>
              </div>
              <div className={`text-2xl font-bold ${capitalStats.totalReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                ${capitalStats.currentCapital.toFixed(2)}
              </div>
              <div className={`text-xs mt-1 ${capitalStats.totalReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {capitalStats.totalReturn >= 0 ? '+' : ''}{capitalStats.totalReturnPercent.toFixed(2)}%
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl p-6 border border-slate-700/50 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">P&L Total</span>
                <span className="text-2xl">📊</span>
              </div>
              <div className={`text-2xl font-bold ${totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                ${totalPnl.toFixed(2)}
              </div>
              <div className="text-xs text-slate-400 mt-1">{orders.length} órdenes</div>
            </div>

            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl p-6 border border-slate-700/50 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Estrategias</span>
                <span className="text-2xl">⚙️</span>
              </div>
              <div className="text-2xl font-bold">{status.activeStrategies}</div>
              <div className="text-xs text-slate-400 mt-1">{strategies.length} total</div>
            </div>

            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl p-6 border border-slate-700/50 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Posiciones</span>
                <span className="text-2xl">📈</span>
              </div>
              <div className="text-2xl font-bold">{status.activePositions}</div>
              <div className="text-xs text-slate-400 mt-1">{activeOrders.length} abiertas</div>
            </div>
          </div>

          {/* Navegación por tabs */}
          <div className="mb-6">
            <div className="flex gap-2 bg-slate-900/50 rounded-xl p-1 border border-slate-800/50">
              {(['overview', 'strategies', 'orders', 'signals'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  {tab === 'overview' && '📊 Resumen'}
                  {tab === 'strategies' && '⚙️ Estrategias'}
                  {tab === 'orders' && '📈 Órdenes'}
                  {tab === 'signals' && '🔔 Señales'}
                </button>
              ))}
            </div>
          </div>

          {/* Contenido de tabs */}
          <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800/50 backdrop-blur-sm">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Precios en tiempo real */}
                <div>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span>💹</span>
                    Precios en Tiempo Real
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {Array.from(prices.entries()).map(([pair, price]) => (
                      <div key={pair} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 hover:border-blue-500/50 transition-colors">
                        <div className="text-slate-400 text-xs mb-1">{pair}</div>
                        <div className="text-lg font-bold">${price.toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Órdenes recientes */}
                <div>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span>📋</span>
                    Órdenes Recientes
                  </h2>
                  <div className="space-y-2">
                    {orders.slice(-5).reverse().map(order => (
                      <div key={order.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 flex items-center justify-between hover:border-blue-500/50 transition-colors">
                        <div>
                          <div className="font-medium">{order.pair} {order.side.toUpperCase()}</div>
                          <div className="text-sm text-slate-400">
                            {order.strategy} • ${order.entryPrice.toFixed(2)}
                          </div>
                        </div>
                        <div className={`text-right font-bold ${order.pnl && order.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {order.pnl ? `$${order.pnl.toFixed(2)}` : '-'}
                        </div>
                      </div>
                    ))}
                    {orders.length === 0 && (
                      <div className="text-center text-slate-400 py-12">
                        <div className="text-4xl mb-2">📭</div>
                        <p>No hay órdenes aún</p>
                        <p className="text-sm mt-1">El bot creará órdenes automáticamente cuando detecte señales</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'strategies' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <span>⚙️</span>
                    Estrategias de Trading
                  </h2>
                  <button
                    onClick={() => setShowStrategyForm(true)}
                    className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <span>+</span>
                    Nueva Estrategia
                  </button>
                </div>

                {strategies.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">🎯</div>
                    <p className="text-slate-400 mb-2">No hay estrategias configuradas</p>
                    <p className="text-sm text-slate-500 mb-4">Crea tu primera estrategia para comenzar a operar</p>
                    <button
                      onClick={() => setShowStrategyForm(true)}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
                    >
                      Crear Primera Estrategia
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {strategies.map(strategy => (
                      <div key={strategy.id} className="bg-slate-800/50 rounded-lg p-5 border border-slate-700/50 hover:border-blue-500/50 transition-colors">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold">{strategy.name}</h3>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                strategy.enabled 
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                  : 'bg-slate-700 text-slate-400 border border-slate-600'
                              }`}>
                                {strategy.enabled ? 'Activa' : 'Inactiva'}
                              </span>
                            </div>
                            <div className="text-sm text-slate-400">
                              {strategy.pair} • {strategy.type}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={strategy.enabled}
                                onChange={(e) => updateStrategy(strategy.id, { enabled: e.target.checked })}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                            <button
                              onClick={() => removeStrategy(strategy.id)}
                              className="px-3 py-1.5 text-xs bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-4 pt-4 border-t border-slate-700/50">
                          <div>
                            <div className="text-xs text-slate-400 mb-1">Leverage</div>
                            <div className="font-semibold">{strategy.leverage}x</div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-400 mb-1">Stop Loss</div>
                            <div className="font-semibold">{strategy.stopLoss}%</div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-400 mb-1">Take Profit</div>
                            <div className="font-semibold">{strategy.takeProfit}%</div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-400 mb-1">Confianza Mín</div>
                            <div className="font-semibold">{strategy.minConfidence}%</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span>📈</span>
                    Órdenes Abiertas ({activeOrders.length})
                  </h2>
                  {activeOrders.length === 0 ? (
                    <div className="text-center py-12 bg-slate-800/30 rounded-lg border border-slate-700/50">
                      <div className="text-4xl mb-2">📭</div>
                      <p className="text-slate-400">No hay órdenes abiertas</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeOrders.map(order => (
                        <div key={order.id} className="bg-slate-800/50 rounded-lg p-5 border border-slate-700/50 hover:border-blue-500/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="font-semibold text-lg">{order.pair}</span>
                                <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                  order.side === 'long' 
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                }`}>
                                  {order.side.toUpperCase()}
                                </span>
                              </div>
                              <div className="text-sm text-slate-400 space-y-1">
                                <div>Entrada: <span className="text-white">${order.entryPrice.toFixed(2)}</span></div>
                                <div>Actual: <span className="text-white">${order.currentPrice.toFixed(2)}</span></div>
                                <div>Leverage: <span className="text-white">{order.leverage}x</span></div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className={`text-right ${order.pnl && order.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                <div className="text-2xl font-bold">
                                  {order.pnl ? `$${order.pnl.toFixed(2)}` : '-'}
                                </div>
                                <div className="text-sm">
                                  {order.pnlPercentage ? `${order.pnlPercentage > 0 ? '+' : ''}${order.pnlPercentage.toFixed(2)}%` : '-'}
                                </div>
                              </div>
                              <button
                                onClick={() => closeOrder(order.id)}
                                className="px-4 py-2 text-sm font-medium bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors border border-red-500/30"
                              >
                                Cerrar
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {closedOrders.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <span>📜</span>
                      Historial ({closedOrders.length})
                    </h2>
                    <div className="space-y-2">
                      {closedOrders.slice(-10).reverse().map(order => (
                        <div key={order.id} className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/30 opacity-75">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{order.pair} {order.side.toUpperCase()}</div>
                              <div className="text-sm text-slate-400">
                                ${order.entryPrice.toFixed(2)} → ${order.currentPrice?.toFixed(2)}
                              </div>
                            </div>
                            <div className={`text-right font-bold ${order.pnl && order.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {order.pnl ? `$${order.pnl.toFixed(2)}` : '-'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'signals' && (
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span>🔔</span>
                  Señales de Trading ({signals.length})
                </h2>
                {signals.length === 0 ? (
                  <div className="text-center py-12 bg-slate-800/30 rounded-lg border border-slate-700/50">
                    <div className="text-4xl mb-2">🔕</div>
                    <p className="text-slate-400">No hay señales aún</p>
                    <p className="text-sm text-slate-500 mt-1">Las señales aparecerán cuando el bot esté activo</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {signals.slice(-20).reverse().map(signal => {
                      const matchingStrategy = strategies.find(s => s.type === signal.strategy && s.pair === signal.pair && s.enabled);
                      return (
                        <div key={signal.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 hover:border-blue-500/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="font-semibold">{signal.pair}</span>
                                <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                  signal.side === 'long' 
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                }`}>
                                  {signal.side.toUpperCase()}
                                </span>
                                <span className="text-xs text-slate-400">${signal.price.toFixed(2)}</span>
                              </div>
                              <div className="text-sm text-slate-400 mb-1">{signal.reason}</div>
                              <div className="text-xs text-slate-500">{signal.strategy}</div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="text-xs text-slate-400 mb-1">Confianza</div>
                                <div className="text-xl font-bold">{signal.confidence.toFixed(0)}%</div>
                              </div>
                              {matchingStrategy && (
                                <button
                                  onClick={() => createOrderFromSignal(signal, matchingStrategy)}
                                  className="px-4 py-2 text-sm font-medium bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-lg transition-colors border border-emerald-500/30"
                                >
                                  Ejecutar
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        {/* Botón flotante para nueva estrategia */}
        {!showStrategyForm && (
          <button
            onClick={() => setShowStrategyForm(true)}
            className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 rounded-full shadow-2xl flex items-center justify-center text-2xl transition-all z-40 hover:scale-110 active:scale-95"
            title="Nueva Estrategia"
          >
            +
          </button>
        )}

        {/* Formulario de estrategia */}
        {showStrategyForm && (
          <StrategyForm
            onSubmit={(strategyData) => {
              addStrategy({
                ...strategyData,
                enabled: true,
              });
              setShowStrategyForm(false);
            }}
            onCancel={() => setShowStrategyForm(false)}
          />
        )}
      </div>
    </SubscriptionGate>
  );
}
