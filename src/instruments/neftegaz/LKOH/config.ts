/**
 * Конфигурация для ЛУКОЙЛа (LKOH)
 * Сектор: Нефтегаз
 *
 */

import { INSTRUMENTS } from '../../../instruments.js';
import { BaseInstrumentConfig, DEFAULT_BASE_CONFIG } from '../../base-config.js';

export const LKOH_CONFIG: BaseInstrumentConfig = {
  ...DEFAULT_BASE_CONFIG,
  figi: INSTRUMENTS.LKOH.figi,
  orderLots: 1, 
  signals: {
    profit: { takeProfit: 3, stopLoss: 4 },
    sma: { fastLength: 8, slowLength: 21 },
    ema: { fastLength: 12, slowLength: 26 },
    rsi: { period: 14, highLevel: 65, lowLevel: 35 },
    macd: { fastLength: 12, slowLength: 26, signalLength: 9 },
    bollinger: { length: 20, stdDev: 2.2 },
    adx: { period: 14, trendStrengthLevel: 28, strongTrendLevel: 45 },
    stochastic: { kLength: 14, kSmoothing: 3, overboughtLevel: 75, oversoldLevel: 25 },
    psar: { step: 0.02, maxStep: 0.2 },
    williams: { period: 14, overboughtLevel: -20, oversoldLevel: -80 },
    roc: { period: 10, upperThreshold: 2, lowerThreshold: -2 },
    cci: { period: 20, upperLevel: 150, lowerLevel: -150 },
    move: { length: 7, threshold: 1.5, filterLevel: 0.5 }
  },
  triggers: {
    buySignal: `
      adx && sma && ema && macd && psar && 
      (rsi && stochastic && williams) && 
      bollinger && roc && move
    `,
    
    sellSignal: `
      profit || 
      (!adx && (!sma || !ema || !psar) && 
       (!rsi || !stochastic || !williams || !bollinger))
    `,
    
    description: `
      ЛУКОЙЛ: Консервативная дивидендная стратегия
      • Высокая цена требует осторожности
      • Санкционные и кибер-риски
      • Множественное подтверждение сигналов
      • Приоритет защиты капитала над доходностью
    `
  }
};
