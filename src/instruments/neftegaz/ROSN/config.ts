/**
 * Конфигурация для Роснефти (ROSN)
 * Сектор: Нефтегаз
 */

import { CandleInterval } from 'tinkoff-invest-api/dist/generated/marketdata.js';
import { INSTRUMENTS } from '../../../instruments.js';
import { BaseInstrumentConfig, DEFAULT_BASE_CONFIG } from '../../base-config.js';

export const ROSN_CONFIG: BaseInstrumentConfig = {
  ...DEFAULT_BASE_CONFIG,
  figi: INSTRUMENTS.ROSN.figi,
  orderLots: 1,
  signals: {
    profit: { takeProfit: 8, stopLoss: 4 }, // Консервативно для нефтянки
    sma: { fastLength: 12, slowLength: 26 },
    rsi: { period: 14, highLevel: 75, lowLevel: 25 },
    bollinger: { length: 20, stdDev: 2 },
    adx: { period: 14, trendStrengthLevel: 25, strongTrendLevel: 40 },
    macd: { fastLength: 12, slowLength: 26, signalLength: 9 }
  },
  triggers: {
    // Покупка: обязательно сильный тренд + подтверждение от осцилляторов
    buySignal: 'adx && (sma || macd) && (rsi || bollinger)',
    // Продажа: риск-менеджмент в приоритете, либо слабость тренда с негативными осцилляторами  
    sellSignal: 'profit || (!adx && (macd || sma) && (rsi || bollinger))',
    description: 'Нефтегаз: консервативная стратегия с упором на трендовые сигналы и управление рисками'
  }
};
