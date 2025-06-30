/**
 * Конфигурация для Роснефти (ROSN)
 * Сектор: Нефтегаз
 * 
 */

import { INSTRUMENTS } from '../../../instruments.js';
import { BaseInstrumentConfig, DEFAULT_BASE_CONFIG } from '../../base-config.js';

export const ROSN_CONFIG: BaseInstrumentConfig = {
  ...DEFAULT_BASE_CONFIG,
  figi: INSTRUMENTS.ROSN.figi,
  orderLots: 2, 
  signals: {
    profit: { takeProfit: 4, stopLoss: 4 },
    sma: { fastLength: 5, slowLength: 15 },
    ema: { fastLength: 8, slowLength: 21 },
    rsi: { period: 14, highLevel: 75, lowLevel: 25 },
    macd: { fastLength: 12, slowLength: 26, signalLength: 9 },
    bollinger: { length: 20, stdDev: 2 },
    adx: { period: 14, trendStrengthLevel: 22, strongTrendLevel: 35 },
    stochastic: { kLength: 14, kSmoothing: 3, overboughtLevel: 80, oversoldLevel: 20 },
    psar: { step: 0.02, maxStep: 0.2 },
    williams: { period: 14, overboughtLevel: -15, oversoldLevel: -85 },
    roc: { period: 10, upperThreshold: 3, lowerThreshold: -3 },
    cci: { period: 20, upperLevel: 100, lowerLevel: -100 },
    move: { length: 7, threshold: 1.2, filterLevel: 0.3 }
  },
  triggers: {
    // АГРЕССИВНАЯ покупка: подтверждение тренда + momentum
    buySignal: `
      adx && (sma || ema) && macd && 
      (rsi || stochastic || williams) && 
      (bollinger || psar) && move
    `,
    
    // АКТИВНАЯ продажа: profit-taking или ослабление тренда
    sellSignal: `
      profit || 
      (!adx && (!sma || !ema) && (!macd || !psar) && 
       (rsi || stochastic || williams))
    `,
    
    description: `
      РОСНЕФТЬ: Агрессивная ростовая стратегия
      • Лидер по прибыльности российского рынка
      • Максимальная диверсификация и инвестиции
      • Быстрая реакция на рыночные сигналы
      • Высокий потенциал роста в нефтегазовом секторе
    `
  }
};
