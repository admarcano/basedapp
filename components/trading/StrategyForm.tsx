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
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-3xl p-6 border border-gray-700/50 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">Nueva Estrategia</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nombre</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tipo de Estrategia</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as StrategyType })}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2"
            >
              <option value="momentum">Momentum</option>
              <option value="rsi">RSI</option>
              <option value="mean_reversion">Mean Reversion</option>
              <option value="breakout">Breakout</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Par de Trading</label>
            <select
              value={formData.pair}
              onChange={(e) => setFormData({ ...formData, pair: e.target.value as TradingPair })}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2"
            >
              <option value="BTC/USD">BTC/USD - Bitcoin</option>
              <option value="ETH/USD">ETH/USD - Ethereum</option>
              <option value="SOL/USD">SOL/USD - Solana</option>
              <option value="XRP/USD">XRP/USD - Ripple</option>
              <option value="HYPE/USD">HYPE/USD - Hyperliquid</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Leverage Base: {formData.leverage}x
            </label>
            <p className="text-xs text-gray-400 mb-2">
              El leverage se ajustará automáticamente según el análisis del mercado
            </p>
            <input
              type="range"
              min="1"
              max="20"
              value={formData.leverage}
              onChange={(e) => setFormData({ ...formData, leverage: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Stop Loss: {formData.stopLoss}%
            </label>
            <input
              type="range"
              min="1"
              max="20"
              value={formData.stopLoss}
              onChange={(e) => setFormData({ ...formData, stopLoss: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Take Profit: {formData.takeProfit}%
            </label>
            <input
              type="range"
              min="1"
              max="50"
              value={formData.takeProfit}
              onChange={(e) => setFormData({ ...formData, takeProfit: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Confianza Mínima: {formData.minConfidence}%
            </label>
            <input
              type="range"
              min="50"
              max="95"
              value={formData.minConfidence}
              onChange={(e) => setFormData({ ...formData, minConfidence: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Máximo de Posiciones</label>
            <input
              type="number"
              min="1"
              max="10"
              value={formData.maxPositions}
              onChange={(e) => setFormData({ ...formData, maxPositions: parseInt(e.target.value) })}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
            >
              Crear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

