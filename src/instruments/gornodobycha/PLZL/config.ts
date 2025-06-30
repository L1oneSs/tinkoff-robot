/**
 * Конфигурация для Полюса (PLZL)
 * Сектор: Горнодобыча / Золото
 * Статус: Крупнейший золотодобытчик России, топ-10 в мире
 */

import { INSTRUMENTS } from '../../../instruments.js';
import { BaseInstrumentConfig, DEFAULT_BASE_CONFIG } from '../../base-config.js';

export const PLZL_CONFIG: BaseInstrumentConfig = {
  ...DEFAULT_BASE_CONFIG,
  figi: INSTRUMENTS.PLZL.figi,
  enabled: true,
  orderLots: 1,
  signals: {
    profit: { takeProfit: 3, stopLoss: 4 },
    sma: { fastLength: 9, slowLength: 21 },
    ema: { fastLength: 12, slowLength: 26 },
    rsi: { period: 14, highLevel: 70, lowLevel: 30 },
    macd: { fastLength: 12, slowLength: 26, signalLength: 9 },
    bollinger: { length: 20, stdDev: 2.0 },
    adx: { period: 14, trendStrengthLevel: 25, strongTrendLevel: 40 },
    stochastic: { kLength: 14, kSmoothing: 3, overboughtLevel: 80, oversoldLevel: 20 }
  },
  triggers: {
    buySignal: '(sma && ema && adx) && (macd || bollinger) && (!rsi || !stochastic)',
    sellSignal: 'profit || (!sma || !ema) || (rsi && stochastic) || (!macd && !adx)',
    description: 'Золотой лидер с защитными свойствами драгметаллов'
  }
};
