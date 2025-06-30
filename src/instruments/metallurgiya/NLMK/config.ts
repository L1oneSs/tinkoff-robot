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
    // Покупка: ждем множественного подтверждения разворота от всех индикаторов
    buySignal: '(sma && ema) && macd && (rsi && williams && stochastic) && (move || bollinger)',
    
    // Продажа: быстрая фиксация любой прибыли + защита от продолжения падения
    sellSignal: 'profit || ((!sma || !ema) && (!macd || (!rsi && !williams)))',
    
    description: 'НЛМК: стратегия разворота для недооцененной бумаги в медвежьем тренде, ожидание появления энергии роста'
  }
};
