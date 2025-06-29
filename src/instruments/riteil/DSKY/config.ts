/**
 * Конфигурация для Детского мира (DSKY)
 * Сектор: Ритейл
 */

import { CandleInterval } from 'tinkoff-invest-api/dist/generated/marketdata.js';
import { INSTRUMENTS } from '../../../instruments.js';
import { BaseInstrumentConfig, DEFAULT_BASE_CONFIG } from '../../base-config.js';

export const DSKY_CONFIG: BaseInstrumentConfig = {
  ...DEFAULT_BASE_CONFIG,
  figi: INSTRUMENTS.DSKY.figi,
  enabled: false, // Временно отключен - FIGI не найден в API
  orderLots: 1,
  interval: CandleInterval.CANDLE_INTERVAL_1_MIN, // Быстрая торговля для ритейла
  signals: {
    profit: { takeProfit: 12, stopLoss: 6 },
    sma: { fastLength: 7, slowLength: 14 }, // Быстрые пересечения
    rsi: { period: 9, highLevel: 75, lowLevel: 25 },
    bollinger: { length: 14, stdDev: 1.8 }, // Более чувствительные полосы
    cci: { period: 14, upperLevel: 100, lowerLevel: -100 }
  },
  triggers: {
    // Покупка: быстрый тренд + любой осциллятор в перепроданности
    buySignal: 'sma && (rsi || bollinger || cci)',
    // Продажа: управление рисками или разворот тренда с перекупленностью
    sellSignal: 'profit || (!sma && (rsi || bollinger || cci))',
    description: 'Детский мир: агрессивная скальпинговая стратегия для ритейла с 1-минутными свечами'
  }
};
