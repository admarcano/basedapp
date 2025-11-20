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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/40 to-slate-950 text-white relative overflow-hidden">
        {/* Background Effects */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
        </div>

        {/* Header */}
        <header className="sticky top-0 z-50 bg-slate-900/70 backdrop-blur-2xl border-b border-slate-800/60 shadow-xl shadow-black/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Logo size="small" />
                  <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse"></div>
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                    Trading Bot With Based
                  </h1>
                  <p className="text-xs text-slate-400 font-medium">Intelligent Automated Trading</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {!capitalConfigured && (
                  <button
                    onClick={() => setShowCapitalConfig(true)}
                    className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
                  >
                    Configure Capital
                  </button>
                )}
                <div className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 ${
                  status.isRunning 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-lg shadow-emerald-500/10' 
                    : 'bg-slate-800/60 text-slate-400 border border-slate-700/60'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${status.isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></div>
                  {status.isRunning ? 'Active' : 'Stopped'}
                </div>
                {status.isRunning ? (
                  <button
                    onClick={stopBot}
                    className="px-6 py-2.5 text-sm font-semibold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 rounded-xl transition-all shadow-lg shadow-red-500/20 hover:shadow-red-500/40"
                  >
                    Stop Bot
                  </button>
                ) : (
                  <button
                    onClick={startBot}
                    className="px-6 py-2.5 text-sm font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40"
                  >
                    Start Bot
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Capital Config Modal */}
          {showCapitalConfig && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 max-w-md w-full border border-slate-700/60 shadow-2xl">
                <CapitalConfig
                  onCapitalSet={(_amount) => {
                    setCapitalConfigured(true);
                    setShowCapitalConfig(false);
                    window.location.reload();
                  }}
                />
                <button
                  onClick={() => setShowCapitalConfig(false)}
                  className="mt-6 w-full px-4 py-3 text-sm font-semibold bg-slate-800/60 hover:bg-slate-700/60 rounded-xl transition-all border border-slate-700/60"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="group relative bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 shadow-xl hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-slate-400 text-sm font-medium uppercase tracking-wide">Capital</span>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center border border-blue-500/30">
                    <span className="text-2xl">💰</span>
                  </div>
                </div>
                <div className={`text-3xl font-bold mb-1 ${capitalStats.totalReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  ${capitalStats.currentCapital.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className={`text-sm font-semibold ${capitalStats.totalReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {capitalStats.totalReturn >= 0 ? '+' : ''}{capitalStats.totalReturnPercent.toFixed(2)}%
                </div>
              </div>
            </div>

            <div className="group relative bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 shadow-xl hover:border-indigo-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-indigo-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-slate-400 text-sm font-medium uppercase tracking-wide">P&L Total</span>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-indigo-500/30">
                    <span className="text-2xl">📊</span>
                  </div>
                </div>
                <div className={`text-3xl font-bold mb-1 ${totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  ${totalPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-sm text-slate-400 font-medium">{orders.length} orders</div>
              </div>
            </div>

            <div className="group relative bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 shadow-xl hover:border-purple-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-slate-400 text-sm font-medium uppercase tracking-wide">Strategies</span>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/30">
                    <span className="text-2xl">⚙️</span>
                  </div>
                </div>
                <div className="text-3xl font-bold mb-1">{status.activeStrategies}</div>
                <div className="text-sm text-slate-400 font-medium">{strategies.length} total</div>
              </div>
            </div>

            <div className="group relative bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 shadow-xl hover:border-cyan-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/10">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-cyan-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-slate-400 text-sm font-medium uppercase tracking-wide">Positions</span>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-cyan-500/30">
                    <span className="text-2xl">📈</span>
                  </div>
                </div>
                <div className="text-3xl font-bold mb-1">{status.activePositions}</div>
                <div className="text-sm text-slate-400 font-medium">{activeOrders.length} open</div>
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="mb-8">
            <div className="flex gap-3 bg-slate-900/60 backdrop-blur-xl rounded-2xl p-2 border border-slate-800/60 shadow-xl">
              {(['overview', 'strategies', 'orders', 'signals'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    activeTab === tab
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-105'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  {tab === 'overview' && '📊 Overview'}
                  {tab === 'strategies' && '⚙️ Strategies'}
                  {tab === 'orders' && '📈 Orders'}
                  {tab === 'signals' && '🔔 Signals'}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/50 shadow-2xl">
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Real-time Prices */}
                <div>
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center border border-blue-500/30">
                      <span className="text-xl">💹</span>
                    </div>
                    Real-time Prices
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {Array.from(prices.entries()).map(([pair, price]) => (
                      <div key={pair} className="group bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-xl p-4 border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
                        <div className="text-slate-400 text-xs font-medium mb-2 uppercase tracking-wide">{pair}</div>
                        <div className="text-xl font-bold text-white">${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Orders */}
                <div>
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-indigo-500/30">
                      <span className="text-xl">📋</span>
                    </div>
                    Recent Orders
                  </h2>
                  <div className="space-y-3">
                    {orders.slice(-5).reverse().map(order => (
                      <div key={order.id} className="group bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-xl p-5 border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-bold text-lg">{order.pair}</span>
                            <span className={`px-3 py-1 text-xs font-semibold rounded-lg ${
                              order.side === 'long' 
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                                : 'bg-red-500/20 text-red-300 border border-red-500/40'
                            }`}>
                              {order.side.toUpperCase()}
                            </span>
                          </div>
                          <div className="text-sm text-slate-400">
                            {order.strategy} • Entry: ${order.entryPrice.toFixed(2)}
                          </div>
                        </div>
                        <div className={`text-right font-bold text-xl ${order.pnl && order.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {order.pnl ? `$${order.pnl.toFixed(2)}` : '-'}
                        </div>
                      </div>
                    ))}
                    {orders.length === 0 && (
                      <div className="text-center py-16 bg-gradient-to-br from-slate-800/30 to-slate-900/30 rounded-xl border border-slate-700/30">
                        <div className="text-5xl mb-4">📭</div>
                        <p className="text-slate-400 font-medium mb-2">No orders yet</p>
                        <p className="text-sm text-slate-500">The bot will create orders automatically when signals are detected</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'strategies' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/30">
                      <span className="text-xl">⚙️</span>
                    </div>
                    Trading Strategies
                  </h2>
                  <button
                    onClick={() => setShowStrategyForm(true)}
                    className="px-6 py-3 text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 flex items-center gap-2"
                  >
                    <span className="text-lg">+</span>
                    New Strategy
                  </button>
                </div>

                {strategies.length === 0 ? (
                  <div className="text-center py-16 bg-gradient-to-br from-slate-800/30 to-slate-900/30 rounded-xl border border-slate-700/30">
                    <div className="text-5xl mb-4">🎯</div>
                    <p className="text-slate-400 font-medium mb-2">No strategies configured</p>
                    <p className="text-sm text-slate-500 mb-6">Create your first strategy to start trading</p>
                    <button
                      onClick={() => setShowStrategyForm(true)}
                      className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
                    >
                      Create First Strategy
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {strategies.map(strategy => (
                      <div key={strategy.id} className="group bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-xl p-6 border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
                        <div className="flex items-start justify-between mb-5">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="text-lg font-bold">{strategy.name}</h3>
                              <span className={`px-3 py-1 text-xs font-semibold rounded-lg ${
                                strategy.enabled 
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                                  : 'bg-slate-700/60 text-slate-400 border border-slate-600/60'
                              }`}>
                                {strategy.enabled ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <div className="text-sm text-slate-400 font-medium">
                              {strategy.pair} • {strategy.type}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={strategy.enabled}
                                onChange={(e) => updateStrategy(strategy.id, { enabled: e.target.checked })}
                                className="sr-only peer"
                              />
                              <div className="w-12 h-6 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-emerald-600 peer-checked:to-teal-600"></div>
                            </label>
                            <button
                              onClick={() => removeStrategy(strategy.id)}
                              className="px-4 py-2 text-xs font-semibold bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-all border border-red-500/30"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-4 pt-5 border-t border-slate-700/50">
                          <div>
                            <div className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">Leverage</div>
                            <div className="font-bold text-lg">{strategy.leverage}x</div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">Stop Loss</div>
                            <div className="font-bold text-lg">{strategy.stopLoss}%</div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">Take Profit</div>
                            <div className="font-bold text-lg">{strategy.takeProfit}%</div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">Min Confidence</div>
                            <div className="font-bold text-lg">{strategy.minConfidence}%</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-cyan-500/30">
                      <span className="text-xl">📈</span>
                    </div>
                    Open Orders ({activeOrders.length})
                  </h2>
                  {activeOrders.length === 0 ? (
                    <div className="text-center py-16 bg-gradient-to-br from-slate-800/30 to-slate-900/30 rounded-xl border border-slate-700/30">
                      <div className="text-5xl mb-4">📭</div>
                      <p className="text-slate-400 font-medium">No open orders</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activeOrders.map(order => (
                        <div key={order.id} className="group bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-xl p-6 border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <span className="font-bold text-xl">{order.pair}</span>
                                <span className={`px-3 py-1 text-xs font-semibold rounded-lg ${
                                  order.side === 'long' 
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                                    : 'bg-red-500/20 text-red-300 border border-red-500/40'
                                }`}>
                                  {order.side.toUpperCase()}
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                  <div className="text-slate-400 mb-1">Entry</div>
                                  <div className="font-semibold text-white">${order.entryPrice.toFixed(2)}</div>
                                </div>
                                <div>
                                  <div className="text-slate-400 mb-1">Current</div>
                                  <div className="font-semibold text-white">${order.currentPrice.toFixed(2)}</div>
                                </div>
                                <div>
                                  <div className="text-slate-400 mb-1">Leverage</div>
                                  <div className="font-semibold text-white">{order.leverage}x</div>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-4 ml-6">
                              <div className={`text-right ${order.pnl && order.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                <div className="text-3xl font-bold">
                                  {order.pnl ? `$${order.pnl.toFixed(2)}` : '-'}
                                </div>
                                <div className="text-sm font-semibold">
                                  {order.pnlPercentage ? `${order.pnlPercentage > 0 ? '+' : ''}${order.pnlPercentage.toFixed(2)}%` : '-'}
                                </div>
                              </div>
                              <button
                                onClick={() => closeOrder(order.id)}
                                className="px-6 py-2.5 text-sm font-semibold bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-xl transition-all border border-red-500/30"
                              >
                                Close
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
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700/20 to-slate-800/20 flex items-center justify-center border border-slate-600/30">
                        <span className="text-xl">📜</span>
                      </div>
                      History ({closedOrders.length})
                    </h2>
                    <div className="space-y-3">
                      {closedOrders.slice(-10).reverse().map(order => (
                        <div key={order.id} className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 rounded-xl p-4 border border-slate-700/30 opacity-75">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold mb-1">{order.pair} {order.side.toUpperCase()}</div>
                              <div className="text-sm text-slate-400">
                                ${order.entryPrice.toFixed(2)} → ${order.currentPrice?.toFixed(2)}
                              </div>
                            </div>
                            <div className={`text-right font-bold text-lg ${order.pnl && order.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
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
                <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center border border-yellow-500/30">
                    <span className="text-xl">🔔</span>
                  </div>
                  Trading Signals ({signals.length})
                </h2>
                {signals.length === 0 ? (
                  <div className="text-center py-16 bg-gradient-to-br from-slate-800/30 to-slate-900/30 rounded-xl border border-slate-700/30">
                    <div className="text-5xl mb-4">🔕</div>
                    <p className="text-slate-400 font-medium mb-2">No signals yet</p>
                    <p className="text-sm text-slate-500">Signals will appear when the bot is active</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {signals.slice(-20).reverse().map(signal => {
                      const matchingStrategy = strategies.find(s => s.type === signal.strategy && s.pair === signal.pair && s.enabled);
                      return (
                        <div key={signal.id} className="group bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-xl p-5 border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <span className="font-bold text-lg">{signal.pair}</span>
                                <span className={`px-3 py-1 text-xs font-semibold rounded-lg ${
                                  signal.side === 'long' 
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                                    : 'bg-red-500/20 text-red-300 border border-red-500/40'
                                }`}>
                                  {signal.side.toUpperCase()}
                                </span>
                                <span className="text-sm text-slate-400 font-medium">${signal.price.toFixed(2)}</span>
                              </div>
                              <div className="text-sm text-slate-400 mb-1">{signal.reason}</div>
                              <div className="text-xs text-slate-500 font-medium">{signal.strategy}</div>
                            </div>
                            <div className="flex items-center gap-4 ml-6">
                              <div className="text-right">
                                <div className="text-xs text-slate-400 mb-1 font-medium uppercase tracking-wide">Confidence</div>
                                <div className="text-2xl font-bold">{signal.confidence.toFixed(0)}%</div>
                              </div>
                              {matchingStrategy && (
                                <button
                                  onClick={() => createOrderFromSignal(signal, matchingStrategy)}
                                  className="px-6 py-2.5 text-sm font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-xl transition-all border border-emerald-500/30"
                                >
                                  Execute
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

        {/* Floating Action Button */}
        {!showStrategyForm && (
          <button
            onClick={() => setShowStrategyForm(true)}
            className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-2xl shadow-2xl shadow-blue-500/40 flex items-center justify-center text-3xl font-bold transition-all z-40 hover:scale-110 active:scale-95"
            title="New Strategy"
          >
            +
          </button>
        )}

        {/* Strategy Form */}
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
