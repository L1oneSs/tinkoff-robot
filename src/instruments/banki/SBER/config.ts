/**
 * Конфигурация для Сбербанка (SBER)
 * Сектор: Банки
 */

import { CandleInterval } from 'tinkoff-invest-api/dist/generated/marketdata.js';
import { INSTRUMENTS } from '../../../instruments.js';
import { BaseInstrumentConfig, DEFAULT_BASE_CONFIG } from '../../base-config.js';

export const SBER_CONFIG: BaseInstrumentConfig = {
  ...DEFAULT_BASE_CONFIG,
  figi: INSTRUMENTS.SBER.figi,
  orderLots: 1,
//   interval: CandleInterval.CANDLE_INTERVAL_15_MIN, // Более длинный интервал для банков
  signals: {
    profit: { takeProfit: 6, stopLoss: 3 }, // Банки менее волатильны
    sma: { fastLength: 10, slowLength: 30 },
    rsi: { period: 21, highLevel: 65, lowLevel: 35 }, // Более широкий диапазон
    macd: { fastLength: 12, slowLength: 26, signalLength: 9 },
    williams: { period: 14, overboughtLevel: -20, oversoldLevel: -80 },
    bollinger: { length: 20, stdDev: 2 }
  },
  triggers: {
    // Покупка: банковский сектор требует подтверждения от трендовых и осцилляторов
    buySignal: 'sma && macd && (rsi || williams || bollinger)',
    // Продажа: риск-менеджмент в приоритете, либо разворот тренда с негативными осцилляторами
    sellSignal: 'profit || ((!sma || !macd) && (rsi || williams || bollinger))',
    description: 'Сбербанк: консервативная банковская стратегия с акцентом на стабильность'
  }
};
