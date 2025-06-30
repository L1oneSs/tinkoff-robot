/**
 * Конфигурация для Газпрома (GAZP)
 * Сектор: Нефтегаз
 */

import { INSTRUMENTS } from '../../../instruments.js';
import { BaseInstrumentConfig, DEFAULT_BASE_CONFIG } from '../../base-config.js';

export const GAZP_CONFIG: BaseInstrumentConfig = {
  ...DEFAULT_BASE_CONFIG,
  figi: INSTRUMENTS.GAZP.figi,
  orderLots: 2, 
  signals: {
    profit: { takeProfit: 4, stopLoss: 4 }, 
    sma: { fastLength: 10, slowLength: 25 }, 
    ema: { fastLength: 12, slowLength: 26 }, 
    rsi: { period: 14, highLevel: 70, lowLevel: 30 }, 
    stochastic: { kLength: 14, kSmoothing: 3, overboughtLevel: 75, oversoldLevel: 25 }, 
    psar: { step: 0.02, maxStep: 0.15 }, 
    macd: { fastLength: 12, slowLength: 26, signalLength: 9 }, 
    bollinger: { length: 20, stdDev: 2.0 }, 
    adx: { period: 14, trendStrengthLevel: 25, strongTrendLevel: 40 },
    move: { length: 21, threshold: 0, filterLevel: 0.4 }
  },
  triggers: {
    // Покупка: базовые условия для Газпрома
    buySignal: '(sma || ema) && (rsi || stochastic)',
    
    // Продажа: фиксация прибыли или сильный разворот
    sellSignal: 'profit || (sma && ema && psar)',
    
    description: 'Газпром: крайне осторожная стратегия для компании в структурном кризисе, ' +
      'ожидание пробоя 132₽ с объемом'
  }
};
