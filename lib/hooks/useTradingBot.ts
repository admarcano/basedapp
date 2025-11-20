// Hook personalizado para el bot de trading

import { useState, useEffect, useCallback, useRef } from 'react';
import { TradingSignal, TradingOrder, TradingStrategy, BotStatus, TradingPair, OrderStatus } from '../types/trading';
import { priceService } from '../services/priceService';
import { signalService } from '../services/signalService';
import { adaptiveStrategy } from '../services/adaptiveStrategy';
import { basedService } from '../services/basedService';
import { capitalManagement } from '../services/capitalManagement';
import { dynamicStopLoss } from '../services/dynamicStopLoss';
import { historicalAnalysis } from '../services/historicalAnalysis';
import { aggressiveStrategy, AggressiveSignal } from '../services/aggressiveStrategy';
import { feeCalculator } from '../services/feeCalculator';
import { smartTradingStrategy, SmartSignal } from '../services/smartTradingStrategy';

const UPDATE_INTERVAL = 5000; // 5 segundos

export function useTradingBot() {
  const [status, setStatus] = useState<BotStatus>({
    isRunning: false,
    activeStrategies: 0,
    activePositions: 0,
    totalPnl: 0,
    totalPnlPercentage: 0,
    lastUpdate: Date.now(),
  });

  const [strategies, setStrategies] = useState<TradingStrategy[]>([]);
  const [orders, setOrders] = useState<TradingOrder[]>([]);
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [prices, setPrices] = useState<Map<TradingPair, number>>(new Map());

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Inicializar capital management desde localStorage o Based
  useEffect(() => {
    const loadCapital = async () => {
      try {
        // Intentar cargar capital guardado
        const saved = localStorage.getItem('bot_allocated_capital');
        if (saved) {
          const savedCapital = parseFloat(saved);
          if (savedCapital > 0) {
            capitalManagement.setInitialCapital(savedCapital);
            return;
          }
        }

        // Si no hay capital guardado, intentar obtener balance de Based
        if (basedService.isAuthenticated()) {
          try {
            const balance = await basedService.getBalance();
            if (balance > 0) {
              // Usar 100% del balance por defecto
              capitalManagement.setInitialCapital(balance);
              localStorage.setItem('bot_allocated_capital', balance.toString());
            }
          } catch (error) {
            console.error('Error obteniendo balance de Based:', error);
            // En caso de error, usar valor por defecto
            capitalManagement.setInitialCapital(1000);
          }
        } else {
          // Si no está autenticado, usar valor por defecto
          capitalManagement.setInitialCapital(1000);
        }
      } catch (error) {
        console.error('Error inicializando capital:', error);
        capitalManagement.setInitialCapital(1000);
      }
    };

    loadCapital();
  }, []);

  // Cargar estrategias desde localStorage
  useEffect(() => {
    const saved = localStorage.getItem('trading_strategies');
    if (saved) {
      try {
        setStrategies(JSON.parse(saved));
      } catch (e) {
        console.error('Error cargando estrategias:', e);
      }
    }
  }, []);

  // Guardar estrategias en localStorage
  useEffect(() => {
    if (strategies.length > 0) {
      localStorage.setItem('trading_strategies', JSON.stringify(strategies));
    }
  }, [strategies]);

  // Cargar órdenes desde localStorage
  useEffect(() => {
    const saved = localStorage.getItem('trading_orders');
    if (saved) {
      try {
        setOrders(JSON.parse(saved));
      } catch (e) {
        console.error('Error cargando órdenes:', e);
      }
    }
  }, []);

  // Guardar órdenes en localStorage
  useEffect(() => {
    if (orders.length > 0) {
      localStorage.setItem('trading_orders', JSON.stringify(orders));
    }
  }, [orders]);

  // Actualizar precios
  const updatePrices = useCallback(async () => {
    if (!status.isRunning) return;

    try {
      const pairs: TradingPair[] = ['BTC/USD', 'ETH/USD', 'SOL/USD', 'XRP/USD', 'HYPE/USD'];
      const newPrices = await priceService.getPrices(pairs);
      setPrices(newPrices);

      // Actualizar historial de precios para señales
      for (const [pair, price] of newPrices.entries()) {
        signalService.addPriceData({
          symbol: pair,
          price,
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      console.error('Error actualizando precios:', error);
    }
  }, [status.isRunning]);

  // Generar señales (estrategia inteligente adaptativa)
  const generateSignals = useCallback(async () => {
    if (!status.isRunning) return;

    const activeStrategies = strategies.filter(s => s.enabled);
    if (activeStrategies.length === 0) return;

    const allSignals: TradingSignal[] = [];

    for (const strategy of activeStrategies) {
      try {
        const priceHistory = signalService.getPriceHistory(strategy.pair);
        
        // ESTRATEGIA PRINCIPAL: Detección inteligente de régimen de mercado
        const smartSignals = await smartTradingStrategy.generateSmartSignals(
          strategy.pair,
          priceHistory
        );

        // ESTRATEGIA SECUNDARIA: Agresiva para más oportunidades
        const aggressiveSignals = await aggressiveStrategy.generateAggressiveSignals(
          strategy.pair,
          priceHistory
        );

        // ESTRATEGIA TERCERIA: Tradicionales como respaldo
        const baseSignals = await signalService.generateSignals(
          strategy.pair,
          [strategy.type]
        );

        // Combinar todas las señales
        const combinedSignals: (SmartSignal | AggressiveSignal | TradingSignal)[] = [
          ...smartSignals.filter(s => s.confidence >= strategy.minConfidence),
          ...aggressiveSignals.filter(s => s.confidence >= strategy.minConfidence),
          ...baseSignals.filter(s => s.confidence >= strategy.minConfidence),
        ];

        // Type guard para señales con expectedProfit
        const hasExpectedProfit = (signal: SmartSignal | AggressiveSignal | TradingSignal): signal is SmartSignal | AggressiveSignal => {
          return 'expectedProfit' in signal;
        };

        // Verificar rentabilidad después de fees
        const profitableSignals = combinedSignals.filter(signal => {
          // Señales inteligentes y agresivas ya tienen expectedProfit
          if (hasExpectedProfit(signal) && signal.expectedProfit > 0) {
            return true;
          }

          // Para señales tradicionales, verificar rentabilidad
          const marketAnalysis = adaptiveStrategy.analyzeMarket(strategy.pair, priceHistory);
          const leverage = adaptiveStrategy.calculateOptimalLeverage(signal, marketAnalysis);
          const tradeSize = capitalManagement.calculateTradeSize(
            signal,
            marketAnalysis,
            signal.price,
            leverage
          );

          const exitPrice = signal.side === 'long'
            ? signal.price * 1.01
            : signal.price * 0.99;

          return feeCalculator.isProfitable(
            signal.price,
            exitPrice,
            tradeSize.quantity,
            leverage,
            signal.side
          );
        });

        allSignals.push(...profitableSignals);
      } catch (error) {
        console.error(`Error generando señales para ${strategy.name}:`, error);
      }
    }

    setSignals(prev => {
      // Mantener las últimas 150 señales (más para estrategia inteligente)
      const combined = [...prev, ...allSignals];
      return combined.slice(-150);
    });
  }, [status.isRunning, strategies]);

  // Actualizar PnL de órdenes abiertas con stop loss/take profit dinámicos
  const updateOrdersPnl = useCallback(() => {
    setOrders(prev => prev.map(order => {
      if (order.status !== 'open') return order;

      const currentPrice = prices.get(order.pair);
      if (!currentPrice) return order;

      const priceHistory = signalService.getPriceHistory(order.pair);
      const marketAnalysis = adaptiveStrategy.analyzeMarket(order.pair, priceHistory);

      // Recalcular niveles dinámicos
      const levels = dynamicStopLoss.updateOrderLevels(
        order,
        currentPrice,
        marketAnalysis,
        priceHistory
      );

      const priceDiff = order.side === 'long' 
        ? currentPrice - order.entryPrice
        : order.entryPrice - currentPrice;

      const pnl = priceDiff * order.quantity * order.leverage;
      const pnlPercentage = (priceDiff / order.entryPrice) * 100 * order.leverage;

      // Verificar stop loss y take profit dinámicos
      const shouldClose = dynamicStopLoss.shouldCloseOrder(order, currentPrice, levels);
      
      let newStatus: OrderStatus = order.status;
      if (shouldClose.shouldClose) {
        newStatus = 'closed';
        // Actualizar capital (después de descontar fees)
        const hoursOpen = order.closedAt && order.createdAt
          ? (order.closedAt - order.createdAt) / (1000 * 60 * 60)
          : 0;
        
        const fees = feeCalculator.calculateFees(
          order.entryPrice,
          currentPrice,
          order.quantity,
          order.leverage,
          order.side,
          false,
          hoursOpen
        );
        
        capitalManagement.updateCapital(fees.netPnl); // Usar PnL neto
      }

      return {
        ...order,
        currentPrice,
        pnl,
        pnlPercentage,
        status: newStatus,
        closedAt: newStatus === 'closed' ? Date.now() : order.closedAt,
        stopLoss: levels.stopLossPercent,
        takeProfit: levels.takeProfitPercent,
      };
    }));
  }, [prices]);

  // Loop principal del bot
  useEffect(() => {
    if (!status.isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const runBot = async () => {
      await updatePrices();
      await generateSignals();
      updateOrdersPnl();

      // Actualizar estado
      const activePositions = orders.filter(o => o.status === 'open').length;
      const totalPnl = orders.reduce((sum, o) => sum + (o.pnl || 0), 0);
      const totalPnlPercentage = orders.length > 0
        ? orders.reduce((sum, o) => sum + (o.pnlPercentage || 0), 0) / orders.length
        : 0;

      setStatus(prev => ({
        ...prev,
        activeStrategies: strategies.filter(s => s.enabled).length,
        activePositions,
        totalPnl,
        totalPnlPercentage,
        lastUpdate: Date.now(),
      }));
    };

    // Ejecutar inmediatamente
    runBot();

    // Luego cada intervalo
    intervalRef.current = setInterval(runBot, UPDATE_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [status.isRunning, strategies, orders, updatePrices, generateSignals, updateOrdersPnl]);

  // Iniciar/detener bot
  const startBot = useCallback(() => {
    setStatus(prev => ({ ...prev, isRunning: true }));
  }, []);

  const stopBot = useCallback(() => {
    setStatus(prev => ({ ...prev, isRunning: false }));
  }, []);

  // Agregar estrategia
  const addStrategy = useCallback((strategy: Omit<TradingStrategy, 'id' | 'createdAt'>) => {
    const newStrategy: TradingStrategy = {
      ...strategy,
      id: `strategy-${Date.now()}`,
      createdAt: Date.now(),
      totalTrades: 0,
      winRate: 0,
      totalPnl: 0,
    };
    setStrategies(prev => [...prev, newStrategy]);
  }, []);

  // Actualizar estrategia
  const updateStrategy = useCallback((id: string, updates: Partial<TradingStrategy>) => {
    setStrategies(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  }, []);

  // Eliminar estrategia
  const removeStrategy = useCallback((id: string) => {
    setStrategies(prev => prev.filter(s => s.id !== id));
  }, []);

  // Crear orden desde señal (con estrategia adaptativa y gestión de capital)
  const createOrderFromSignal = useCallback(async (signal: TradingSignal, strategy: TradingStrategy) => {
    try {
      // Verificar si es buen momento según análisis histórico
      const priceHistory = signalService.getPriceHistory(signal.pair);
      const timeCheck = historicalAnalysis.isGoodTimeToTrade(signal.pair);
      
      if (!timeCheck.isGood && timeCheck.confidence < 0.4) {
        console.log('Momento no favorable según análisis histórico:', timeCheck.reason);
        // No crear orden si el momento no es favorable
        return null;
      }

      // Analizar mercado
      const marketAnalysis = adaptiveStrategy.analyzeMarket(signal.pair, priceHistory);
      
      // Calcular leverage óptimo
      // Si la señal tiene leverage óptimo pre-calculado (señales inteligentes), usarlo
      // Type guard para señales con optimalLeverage y optimalSize
      const hasOptimalValues = (signal: SmartSignal | AggressiveSignal | TradingSignal): signal is SmartSignal => {
        return 'optimalLeverage' in signal && 'optimalSize' in signal;
      };

      let optimalLeverage: number;
      if (hasOptimalValues(signal) && signal.optimalLeverage) {
        optimalLeverage = signal.optimalLeverage;
      } else {
        optimalLeverage = adaptiveStrategy.calculateOptimalLeverage(signal, marketAnalysis);
      }

      // Calcular tamaño de operación
      // Si la señal tiene tamaño óptimo pre-calculado (señales inteligentes), usarlo
      let tradeSize;
      if (hasOptimalValues(signal) && signal.optimalSize) {
        tradeSize = {
          quantity: signal.optimalSize,
          capitalAllocated: signal.optimalSize * signal.price / optimalLeverage,
          riskAmount: signal.optimalSize * signal.price * 0.01, // Estimado
        };
      } else {
        // Calcular tamaño basado en gestión de capital
        tradeSize = capitalManagement.calculateTradeSize(
          signal,
          marketAnalysis,
          signal.price,
          optimalLeverage
        );
      }

      // Calcular stop loss y take profit dinámicos
      const levels = dynamicStopLoss.calculateDynamicLevels(
        {
          id: 'temp',
          pair: signal.pair,
          side: signal.side,
          entryPrice: signal.price,
          currentPrice: signal.price,
          quantity: tradeSize.quantity,
          leverage: optimalLeverage,
          status: 'open',
          strategy: signal.strategy,
          createdAt: Date.now(),
        },
        signal.price,
        marketAnalysis,
        priceHistory
      );

      // Si Based está autenticado, crear orden real
      if (basedService.isAuthenticated()) {
        try {
          const basedOrder = await basedService.createOrder(
            signal.pair,
            signal.side,
            tradeSize.quantity,
            optimalLeverage,
            undefined,
            signal.strategy
          );
          
          // Añadir niveles dinámicos
          const orderWithLevels: TradingOrder = {
            ...basedOrder,
            stopLoss: levels.stopLossPercent,
            takeProfit: levels.takeProfitPercent,
          };
          
          setOrders(prev => [...prev, orderWithLevels]);
          updateStrategy(strategy.id, {
            lastSignalAt: Date.now(),
            totalTrades: (strategy.totalTrades || 0) + 1,
          });
          return orderWithLevels;
        } catch (error) {
          console.error('Error creando orden en Based:', error);
          // Fallback a orden local
        }
      }

      // Orden local (demo)
      const order: TradingOrder = {
        id: `order-${Date.now()}`,
        pair: signal.pair,
        side: signal.side,
        entryPrice: signal.price,
        currentPrice: signal.price,
        quantity: tradeSize.quantity,
        leverage: optimalLeverage,
        status: 'open',
        strategy: signal.strategy,
        createdAt: Date.now(),
        stopLoss: levels.stopLossPercent,
        takeProfit: levels.takeProfitPercent,
      };

      setOrders(prev => [...prev, order]);

      // Actualizar estadísticas de la estrategia
      updateStrategy(strategy.id, {
        lastSignalAt: Date.now(),
        totalTrades: (strategy.totalTrades || 0) + 1,
      });

      return order;
    } catch (error) {
      console.error('Error creando orden:', error);
      throw error;
    }
  }, [updateStrategy]);

  // Cerrar orden
  const closeOrder = useCallback((orderId: string) => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId && order.status === 'open') {
        const pnl = order.pnl || 0;
        const pnlPercentage = order.pnlPercentage || 0;
        
        return {
          ...order,
          status: 'closed',
          closedAt: Date.now(),
          pnl,
          pnlPercentage,
        };
      }
      return order;
    }));
  }, []);

  return {
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
  };
}

