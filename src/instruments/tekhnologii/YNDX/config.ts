/**
 * Конфигурация для Яндекса (YNDX)
 * Сектор: Технологии
 */

import { CandleInterval } from 'tinkoff-invest-api/dist/generated/marketdata.js';
import { INSTRUMENTS } from '../../../instruments.js';
import { BaseInstrumentConfig, DEFAULT_BASE_CONFIG } from '../../base-config.js';

export const YNDX_CONFIG: BaseInstrumentConfig = {
  ...DEFAULT_BASE_CONFIG,
  figi: INSTRUMENTS.YNDX.figi,
  enabled: false, // Пока отключен из-за высокой волатильности
  orderLots: 1,
  signals: {
    profit: { takeProfit: 25, stopLoss: 12 }, // Очень волатильная бумага
    sma: { fastLength: 5, slowLength: 10 }, // Быстрые сигналы
    rsi: { period: 7, highLevel: 85, lowLevel: 15 }, // Экстремальные уровни
    cci: { period: 14, upperLevel: 150, lowerLevel: -150 }, // Расширенные уровни
    adx: { period: 10, trendStrengthLevel: 30, strongTrendLevel: 50 },
    supertrend: { period: 8, multiplier: 4.0 } // Очень чувствительный
  },
  triggers: {
    // Покупка: исключительно сильные сигналы от всех индикаторов
    buySignal: 'adx && supertrend && sma && (rsi || cci)',
    // Продажа: малейший негатив при такой волатильности
    sellSignal: 'profit || (!adx || !supertrend || !sma || rsi || cci)',
    description: 'Яндекс: экстремально осторожная стратегия для сверхволатильных технологий (ОТКЛЮЧЕНА)'
  }
};
