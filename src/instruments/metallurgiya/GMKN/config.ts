/**
 * Конфигурация для ГМК Норильский никель (GMKN)
 * Сектор: Металлургия
 */

import { BaseInstrumentConfig, DEFAULT_BASE_CONFIG, SignalContext } from '../../base-config.js';

export const GMKN_CONFIG: BaseInstrumentConfig = {
  ...DEFAULT_BASE_CONFIG,
  figi: 'BBG004731489',
  name: 'ГМК Норильский никель',
  ticker: 'GMKN',
  sector: 'Металлургия',
  orderLots: 1,
  signals: {
    profit: { takeProfit: 4, stopLoss: 4 }, 
    sma: { fastLength: 9, slowLength: 21 }, 
    ema: { fastLength: 12, slowLength: 26 }, 
    rsi: { period: 14, highLevel: 70, lowLevel: 30 }, 
    adx: { period: 14, trendStrengthLevel: 25, strongTrendLevel: 40 }, 
    bollinger: { length: 20, stdDev: 2.2 }, 
    macd: { fastLength: 12, slowLength: 26, signalLength: 9 }, 
    williams: { period: 14, overboughtLevel: -20, oversoldLevel: -80 }, 
    stochastic: { kLength: 14, kSmoothing: 3, overboughtLevel: 80, oversoldLevel: 20 }
  },
  triggers: {
    // Покупка: базовый тренд + подтверждение силы
    buySignal: (signals: SignalContext) => (signals.sma() || signals.ema()) && (signals.adx() || signals.macd()) && (signals.rsi() || signals.williams()),
    
    // Продажа: прибыль или разворот
    sellSignal: (signals: SignalContext) => signals.profit() || (signals.sma() && signals.ema()),
    
    description: 'Норникель: упрощенная стратегия для сырьевого актива'
  }
};
