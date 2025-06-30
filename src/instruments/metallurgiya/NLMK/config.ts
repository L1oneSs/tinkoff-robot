/**
 * Конфигурация для НЛМК (NLMK)
 * Сектор: Металлургия
 */

import { INSTRUMENTS } from '../../../instruments.js';
import { BaseInstrumentConfig, DEFAULT_BASE_CONFIG } from '../../base-config.js';

export const NLMK_CONFIG: BaseInstrumentConfig = {
  ...DEFAULT_BASE_CONFIG,
  figi: INSTRUMENTS.NLMK.figi,
  orderLots: 2, 
  signals: {
    profit: { takeProfit: 4, stopLoss: 4 }, 
    sma: { fastLength: 10, slowLength: 25 }, 
    ema: { fastLength: 12, slowLength: 26 }, 
    rsi: { period: 14, highLevel: 70, lowLevel: 30 }, 
    stochastic: { kLength: 14, kSmoothing: 3, overboughtLevel: 80, oversoldLevel: 20 }, 
    move: { length: 21, threshold: 0, filterLevel: 0.3 }, 
    macd: { fastLength: 12, slowLength: 26, signalLength: 9 },
    bollinger: { length: 20, stdDev: 2.1 }, 
    williams: { period: 14, overboughtLevel: -20, oversoldLevel: -80 }
  },
  triggers: {
    // Покупка: тренд + любой моментум
    buySignal: '(sma || ema) && (rsi || macd || williams)',
    
    // Продажа: прибыль или разворот тренда
    sellSignal: 'profit || (sma && ema)',
    
    description: 'НЛМК: упрощенная стратегия для стального сектора'
  }
};
