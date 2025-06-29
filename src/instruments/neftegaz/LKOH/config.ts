/**
 * Конфигурация для ЛУКОЙЛа (LKOH)
 * Сектор: Нефтегаз
 */

import { INSTRUMENTS } from '../../../instruments.js';
import { BaseInstrumentConfig, DEFAULT_BASE_CONFIG } from '../../base-config.js';

export const LKOH_CONFIG: BaseInstrumentConfig = {
  ...DEFAULT_BASE_CONFIG,
  figi: INSTRUMENTS.LKOH.figi,
  orderLots: 1,
  signals: {
    profit: { takeProfit: 10, stopLoss: 5 }, // Консервативно для голубой фишки
    sma: { fastLength: 10, slowLength: 30 },
    rsi: { period: 14, highLevel: 70, lowLevel: 30 },
    macd: { fastLength: 12, slowLength: 26, signalLength: 9 },
    bollinger: { length: 20, stdDev: 2 },
    adx: { period: 14, trendStrengthLevel: 25, strongTrendLevel: 40 }
  },
  triggers: {
    // Покупка: сильный тренд + подтверждение от нескольких индикаторов
    buySignal: 'adx && sma && macd && (rsi || bollinger)',
    // Продажа: риск-менеджмент или ослабление тренда с негативными сигналами
    sellSignal: 'profit || (!adx && (!sma || !macd) && (rsi || bollinger))',
    description: 'ЛУКОЙЛ: консервативная голубая фишка с множественным подтверждением сигналов'
  }
};
