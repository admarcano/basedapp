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
      if (basedService.isAuthenticated()) {
        const userBalance = await basedService.getBalance();
        setBalance(userBalance);
        
        // Si no hay capital guardado, usar el 100% del balance
        const saved = localStorage.getItem('bot_allocated_capital');
        if (!saved) {
          setAllocatedCapital(userBalance);
          setAllocationPercent(100);
        }
      } else {
        // En desarrollo, usar balance simulado
        setBalance(10000);
        setAllocatedCapital(10000);
        setAllocationPercent(100);
      }
    } catch (error) {
      console.error('Error cargando balance:', error);
      // En caso de error, usar valores por defecto
      setBalance(1000);
      setAllocatedCapital(1000);
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
    setSaving(true);
    try {
      // Guardar en localStorage
      localStorage.setItem('bot_allocated_capital', allocatedCapital.toString());
      localStorage.setItem('bot_allocation_percent', allocationPercent.toString());
      
      // Configurar el capital en el sistema
      capitalManagement.setInitialCapital(allocatedCapital);
      
      // Notificar al componente padre
      onCapitalSet(allocatedCapital);
      
      // Mostrar confirmación
      alert(`Capital configurado: $${allocatedCapital.toFixed(2)} (${allocationPercent.toFixed(1)}% del balance)`);
    } catch (error) {
      console.error('Error guardando configuración:', error);
      alert('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-900/60 backdrop-blur-xl rounded-3xl p-6 border border-gray-700/50">
        <div className="text-center text-gray-400">Cargando balance...</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/60 backdrop-blur-xl rounded-3xl p-6 border border-gray-700/50">
      <h2 className="text-2xl font-bold mb-4">Configuración de Capital</h2>
      <p className="text-gray-400 text-sm mb-6">
        Elige cuánto capital de tu cuenta de Based quieres usar para el bot
      </p>

      {balance !== null && (
        <div className="space-y-4">
          {/* Balance Total */}
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30">
            <div className="text-gray-400 text-xs mb-1">Balance Total en Based</div>
            <div className="text-2xl font-bold text-green-400">
              ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          {/* Porcentaje */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Porcentaje a usar: {allocationPercent.toFixed(1)}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={allocationPercent}
              onChange={(e) => handlePercentChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Cantidad */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Capital a usar (USD)
            </label>
            <input
              type="number"
              min="0"
              max={balance}
              step="0.01"
              value={allocatedCapital}
              onChange={(e) => handleAmountChange(parseFloat(e.target.value) || 0)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-lg font-bold"
            />
            <div className="text-xs text-gray-500 mt-1">
              Máximo disponible: ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          {/* Botones de acción rápida */}
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => handlePercentChange(25)}
              className="px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
            >
              25%
            </button>
            <button
              onClick={() => handlePercentChange(50)}
              className="px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
            >
              50%
            </button>
            <button
              onClick={() => handlePercentChange(75)}
              className="px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
            >
              75%
            </button>
            <button
              onClick={() => handlePercentChange(100)}
              className="px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
            >
              100%
            </button>
          </div>

          {/* Botón Guardar */}
          <button
            onClick={handleSave}
            disabled={saving || allocatedCapital <= 0}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl transition-colors font-medium"
          >
            {saving ? 'Guardando...' : `Usar $${allocatedCapital.toFixed(2)} para el bot`}
          </button>
        </div>
      )}
    </div>
  );
}

