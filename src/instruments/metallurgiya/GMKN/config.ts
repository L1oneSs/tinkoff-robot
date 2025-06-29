/**
 * Конфигурация для ГМК Норильский никель (GMKN)
 * Сектор: Металлургия
 */

import { INSTRUMENTS } from '../../../instruments.js';
import { BaseInstrumentConfig, DEFAULT_BASE_CONFIG } from '../../base-config.js';

export const GMKN_CONFIG: BaseInstrumentConfig = {
  ...DEFAULT_BASE_CONFIG,
  figi: INSTRUMENTS.GMKN.figi,
  orderLots: 1,
  signals: {
    profit: { takeProfit: 25, stopLoss: 12 }, // Норникель сверхволатилен
    sma: { fastLength: 7, slowLength: 21 },
    rsi: { period: 14, highLevel: 75, lowLevel: 25 },
    adx: { period: 14, trendStrengthLevel: 30, strongTrendLevel: 50 },
    bollinger: { length: 20, stdDev: 2.5 }, // Расширенные полосы
    williams: { period: 14, overboughtLevel: -15, oversoldLevel: -85 }
  },
  triggers: {
    // Покупка: очень сильный тренд + множественное подтверждение от осцилляторов
    buySignal: 'adx && sma && (rsi || williams) && bollinger',
    // Продажа: тейк-профит/стоп-лосс или ослабление тренда с негативными сигналами
    sellSignal: 'profit || (!adx && (!sma || (rsi || williams || bollinger)))',
    description: 'Норникель: экстремально осторожная стратегия для сверхволатильной бумаги'
  }
};
