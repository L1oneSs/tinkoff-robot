/**
 * Конфигурация для Магнита (MGNT)
 * Сектор: Ритейл
 */

import { CandleInterval } from 'tinkoff-invest-api/dist/generated/marketdata.js';
import { INSTRUMENTS } from '../../../instruments.js';
import { BaseInstrumentConfig, DEFAULT_BASE_CONFIG } from '../../base-config.js';

export const MGNT_CONFIG: BaseInstrumentConfig = {
  ...DEFAULT_BASE_CONFIG,
  figi: INSTRUMENTS.MGNT.figi,
  enabled: false, // Временно отключен - FIGI не найден в API
  orderLots: 1,
  interval: CandleInterval.CANDLE_INTERVAL_5_MIN,
  signals: {
    profit: { takeProfit: 10, stopLoss: 5 },
    ema: { fastLength: 12, slowLength: 26 },
    rsi: { period: 14, highLevel: 70, lowLevel: 30 },
    stochastic: { kLength: 14, kSmoothing: 3, overboughtLevel: 80, oversoldLevel: 20 },
    macd: { fastLength: 12, slowLength: 26, signalLength: 9 }
  },
  triggers: {
    // Покупка: подтверждение тренда + любой осциллятор в перепроданности
    buySignal: '(ema || macd) && (rsi || stochastic)',
    // Продажа: управление рисками или разворот тренда с перекупленностью
    sellSignal: 'profit || ((!ema || !macd) && (rsi || stochastic))',
    description: 'Магнит: сбалансированная ритейловая стратегия с EMA и классическими осцилляторами'
  }
};
