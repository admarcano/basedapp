"use client";

import { useState, useEffect } from 'react';
import { basedService } from '@/lib/services/basedService';
import { capitalManagement } from '@/lib/services/capitalManagement';

interface CapitalConfigProps {
  onCapitalSet: (amount: number) => void;
}

export function CapitalConfig({ onCapitalSet }: CapitalConfigProps) {
  const [balance, setBalance] = useState<number | null>(null);
  const [allocatedCapital, setAllocatedCapital] = useState<number>(0);
  const [allocationPercent, setAllocationPercent] = useState<number>(100);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadBalance();
    loadSavedAllocation();
  }, []);

  const loadBalance = async () => {
    try {
      const userBalance = await basedService.getBalance();
      setBalance(userBalance);
      
      const saved = localStorage.getItem('bot_allocated_capital');
      if (!saved) {
        setAllocatedCapital(userBalance);
        setAllocationPercent(100);
      }
    } catch (error) {
      console.warn('Error cargando balance, usando valores por defecto:', error);
      setBalance(10000);
      setAllocatedCapital(10000);
      setAllocationPercent(100);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedAllocation = () => {
    const saved = localStorage.getItem('bot_allocated_capital');
    const savedPercent = localStorage.getItem('bot_allocation_percent');
    if (saved) {
      setAllocatedCapital(parseFloat(saved));
    }
    if (savedPercent) {
      setAllocationPercent(parseFloat(savedPercent));
    }
  };

  const handlePercentChange = (percent: number) => {
    if (!balance) return;
    const newPercent = Math.max(0, Math.min(100, percent));
    setAllocationPercent(newPercent);
    const newCapital = (balance * newPercent) / 100;
    setAllocatedCapital(newCapital);
  };

  const handleAmountChange = (amount: number) => {
    if (!balance) return;
    const newAmount = Math.max(0, Math.min(balance, amount));
    setAllocatedCapital(newAmount);
    const newPercent = (newAmount / balance) * 100;
    setAllocationPercent(newPercent);
  };

  const handleSave = async () => {
    if (allocatedCapital <= 0) {
      alert('Por favor, selecciona un capital mayor a $0');
      return;
    }

    setSaving(true);
    try {
      localStorage.setItem('bot_allocated_capital', allocatedCapital.toString());
      localStorage.setItem('bot_allocation_percent', allocationPercent.toString());
      capitalManagement.setInitialCapital(allocatedCapital);
      onCapitalSet(allocatedCapital);
    } catch (error) {
      console.error('Error guardando configuración:', error);
      alert('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
        <p className="text-slate-400">Cargando balance...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
          Configuración de Capital
        </h2>
        <p className="text-sm text-slate-400">
          Elige cuánto capital de tu cuenta de Based quieres usar para el bot
        </p>
      </div>

      {balance !== null && (
        <div className="space-y-5">
          {/* Balance Total */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl p-5 border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Balance Total en Based</span>
              <span className="text-2xl">💰</span>
            </div>
            <div className="text-3xl font-bold text-emerald-400">
              ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          {/* Porcentaje */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-slate-300">
                Porcentaje a usar
              </label>
              <span className="text-xl font-bold text-blue-400">{allocationPercent.toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={allocationPercent}
              onChange={(e) => handlePercentChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-2">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Cantidad */}
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-300">
              Capital a usar (USD)
            </label>
            <input
              type="number"
              min="0"
              max={balance}
              step="0.01"
              value={allocatedCapital}
              onChange={(e) => handleAmountChange(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <div className="text-xs text-slate-500 mt-1">
              Máximo disponible: ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          {/* Botones de acción rápida */}
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-300">
              Selección Rápida
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[25, 50, 75, 100].map(percent => (
                <button
                  key={percent}
                  onClick={() => handlePercentChange(percent)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    allocationPercent === percent
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {percent}%
                </button>
              ))}
            </div>
          </div>

          {/* Botón Guardar */}
          <button
            onClick={handleSave}
            disabled={saving || allocatedCapital <= 0}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg transition-colors font-medium shadow-lg shadow-blue-600/20 disabled:shadow-none"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Guardando...
              </span>
            ) : (
              `Usar $${allocatedCapital.toFixed(2)} para el bot`
            )}
          </button>
        </div>
      )}
    </div>
  );
}
