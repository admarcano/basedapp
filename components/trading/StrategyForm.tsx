"use client";

import { useState } from 'react';
import { TradingPair, StrategyType } from '@/lib/types/trading';

interface StrategyFormProps {
  onSubmit: (strategy: {
    name: string;
    type: StrategyType;
    pair: TradingPair;
    leverage: number;
    stopLoss: number;
    takeProfit: number;
    minConfidence: number;
    maxPositions: number;
  }) => void;
  onCancel: () => void;
}

export function StrategyForm({ onSubmit, onCancel }: StrategyFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'momentum' as StrategyType,
    pair: 'BTC/USD' as TradingPair,
    leverage: 5,
    stopLoss: 5,
    takeProfit: 10,
    minConfidence: 70,
    maxPositions: 3,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Por favor, ingresa un nombre para la estrategia');
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-800 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Nueva Estrategia
          </h2>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-300">
              Nombre de la Estrategia
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Estrategia BTC Momentum"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-300">
                Tipo de Estrategia
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as StrategyType })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="momentum">📈 Momentum</option>
                <option value="rsi">📊 RSI</option>
                <option value="mean_reversion">🔄 Mean Reversion</option>
                <option value="breakout">🚀 Breakout</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-slate-300">
                Par de Trading
              </label>
              <select
                value={formData.pair}
                onChange={(e) => setFormData({ ...formData, pair: e.target.value as TradingPair })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="BTC/USD">₿ BTC/USD</option>
                <option value="ETH/USD">Ξ ETH/USD</option>
                <option value="SOL/USD">◎ SOL/USD</option>
                <option value="XRP/USD">✕ XRP/USD</option>
                <option value="HYPE/USD">⚡ HYPE/USD</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-300">
                Leverage Base
              </label>
              <span className="text-lg font-bold text-blue-400">{formData.leverage}x</span>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              El leverage se ajustará automáticamente según el análisis del mercado
            </p>
            <input
              type="range"
              min="1"
              max="20"
              value={formData.leverage}
              onChange={(e) => setFormData({ ...formData, leverage: parseInt(e.target.value) })}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>1x</span>
              <span>10x</span>
              <span>20x</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-300">
                  Stop Loss
                </label>
                <span className="text-lg font-bold text-red-400">{formData.stopLoss}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                value={formData.stopLoss}
                onChange={(e) => setFormData({ ...formData, stopLoss: parseInt(e.target.value) })}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-600"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-300">
                  Take Profit
                </label>
                <span className="text-lg font-bold text-emerald-400">{formData.takeProfit}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                value={formData.takeProfit}
                onChange={(e) => setFormData({ ...formData, takeProfit: parseInt(e.target.value) })}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-300">
                Confianza Mínima
              </label>
              <span className="text-lg font-bold text-yellow-400">{formData.minConfidence}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              value={formData.minConfidence}
              onChange={(e) => setFormData({ ...formData, minConfidence: parseInt(e.target.value) })}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-600"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>50%</span>
              <span>70%</span>
              <span>95%</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-300">
              Máximo de Posiciones Simultáneas
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={formData.maxPositions}
              onChange={(e) => setFormData({ ...formData, maxPositions: parseInt(e.target.value) || 1 })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <p className="text-xs text-slate-400 mt-1">
              Número máximo de órdenes abiertas al mismo tiempo para esta estrategia
            </p>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium shadow-lg shadow-blue-600/20"
            >
              Crear Estrategia
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
