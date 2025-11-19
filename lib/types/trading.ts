// Tipos para el sistema de trading

export type TradingPair = 'BTC/USD' | 'ETH/USD' | 'SOL/USD' | 'XRP/USD' | 'HYPE/USD';

export type OrderSide = 'long' | 'short';

export type OrderStatus = 'pending' | 'open' | 'filled' | 'cancelled' | 'closed';

export type StrategyType = 'momentum' | 'mean_reversion' | 'breakout' | 'rsi' | 'macd';

export interface PriceData {
  symbol: TradingPair;
  price: number;
  timestamp: number;
  volume24h?: number;
  change24h?: number;
}

export interface TradingSignal {
  id: string;
  pair: TradingPair;
  side: OrderSide;
  price: number;
  timestamp: number;
  strategy: StrategyType;
  confidence: number; // 0-100
  reason: string;
}

export interface TradingOrder {
  id: string;
  pair: TradingPair;
  side: OrderSide;
  entryPrice: number;
  currentPrice: number;
  quantity: number;
  leverage: number;
  status: OrderStatus;
  strategy: StrategyType;
  createdAt: number;
  closedAt?: number;
  pnl?: number; // Profit/Loss
  pnlPercentage?: number;
  stopLoss?: number;
  takeProfit?: number;
}

export interface TradingStrategy {
  id: string;
  name: string;
  type: StrategyType;
  enabled: boolean;
  pair: TradingPair;
  leverage: number;
  stopLoss: number; // porcentaje
  takeProfit: number; // porcentaje
  minConfidence: number; // 0-100
  maxPositions: number;
  createdAt: number;
  lastSignalAt?: number;
  totalTrades?: number;
  winRate?: number;
  totalPnl?: number;
}

export interface BotStatus {
  isRunning: boolean;
  activeStrategies: number;
  activePositions: number;
  totalPnl: number;
  totalPnlPercentage: number;
  lastUpdate: number;
}

