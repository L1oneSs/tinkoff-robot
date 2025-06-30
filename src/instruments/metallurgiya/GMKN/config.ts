/**
 * Конфигурация для ГМК Норильский никель (GMKN)
 * Сектор: Металлургия
 */

import { INSTRUMENTS } from '../../../instruments.js';
import { BaseInstrumentConfig, DEFAULT_BASE_CONFIG } from '../../base-config.js';

export const GMKN_CONFIG: BaseInstrumentConfig = {
  ...DEFAULT_BASE_CONFIG,
  figi: INSTRUMENTS.GMKN.figi,
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
    // Покупка: множественное подтверждение тренда + сырьевой momentum + техническое подтверждение
    buySignal: '(sma || ema) && adx && macd && (rsi || williams || stochastic) && bollinger',
    
    // Продажа: быстрая фиксация прибыли + защита от волатильности
    sellSignal: 'profit || ((!sma && !ema) || (!adx && !macd) || (rsi && williams && stochastic))',
    
    description: 'Норникель: сбалансированная стратегия для сырьевого цикла с учетом корпоративных рисков и отсутствия дивидендов'
  }
};
