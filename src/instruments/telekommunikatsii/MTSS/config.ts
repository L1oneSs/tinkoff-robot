/**
 * Конфигурация для МТС (MTSS)
 * Сектор: Телекоммуникации
 */

import { INSTRUMENTS } from '../../../instruments.js';
import { BaseInstrumentConfig, DEFAULT_BASE_CONFIG } from '../../base-config.js';

export const MTSS_CONFIG: BaseInstrumentConfig = {
  ...DEFAULT_BASE_CONFIG,
  figi: INSTRUMENTS.MTSS.figi,
  orderLots: 1,
//   interval: CandleInterval.CANDLE_INTERVAL_15_MIN, // Телеком менее волатилен
  signals: {
    profit: { takeProfit: 8, stopLoss: 4 },
    sma: { fastLength: 12, slowLength: 30 },
    rsi: { period: 21, highLevel: 65, lowLevel: 35 }, // Широкий диапазон для стабильного сектора
    macd: { fastLength: 12, slowLength: 26, signalLength: 9 },
    bollinger: { length: 20, stdDev: 2 }
  },
  triggers: {
    // Покупка: устойчивый тренд + подтверждение от осцилляторов
    buySignal: 'sma && macd && (rsi || bollinger)',
    // Продажа: стоп-лосс или разворот с негативными сигналами
    sellSignal: 'profit || ((!sma || !macd) && (rsi || bollinger))',
    description: 'МТС: консервативная телекоммуникационная стратегия для стабильного сектора'
  }
};
