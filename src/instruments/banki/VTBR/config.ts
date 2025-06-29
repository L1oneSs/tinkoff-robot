/**
 * Конфигурация для ВТБ (VTBR)
 * Сектор: Банки
 */

import { CandleInterval } from 'tinkoff-invest-api/dist/generated/marketdata.js';
import { INSTRUMENTS } from '../../../instruments.js';
import { BaseInstrumentConfig, DEFAULT_BASE_CONFIG } from '../../base-config.js';

export const VTBR_CONFIG: BaseInstrumentConfig = {
  ...DEFAULT_BASE_CONFIG,
  figi: INSTRUMENTS.VTBR.figi,
  orderLots: 10, // ВТБ дешевле, берем больше лотов
  signals: {
    profit: { takeProfit: 8, stopLoss: 4 },
    sma: { fastLength: 8, slowLength: 24 },
    ao: { threshold: 0, useColorChange: true },
    ac: { threshold: 0, useColorChange: true, confirmBars: 2 },
    rsi: { period: 14, highLevel: 70, lowLevel: 30 }
  },
  triggers: {
    // Покупка: тренд + подтверждение от осцилляторов Bill Williams
    buySignal: 'sma && (ao || ac) && rsi',
    // Продажа: стоп-лосс или разворот с негативными осцилляторами
    sellSignal: 'profit || (!sma && (ao || ac || rsi))',
    description: 'ВТБ: агрессивная стратегия с осцилляторами Williams для дешевых акций'
  }
};
