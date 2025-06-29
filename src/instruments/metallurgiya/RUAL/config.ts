/**
 * Конфигурация для РУСАЛа (RUAL)
 * Сектор: Металлургия
 */

import { CandleInterval } from 'tinkoff-invest-api/dist/generated/marketdata.js';
import { INSTRUMENTS } from '../../../instruments.js';
import { BaseInstrumentConfig, DEFAULT_BASE_CONFIG } from '../../base-config.js';

export const RUAL_CONFIG: BaseInstrumentConfig = {
  ...DEFAULT_BASE_CONFIG,
  figi: INSTRUMENTS.RUAL.figi,
  orderLots: 2,
  signals: {
    profit: { takeProfit: 20, stopLoss: 10 }, // Металлургия очень волатильна
    sma: { fastLength: 5, slowLength: 15 }, // Быстрые сигналы
    rsi: { period: 10, highLevel: 80, lowLevel: 20 },
    supertrend: { period: 10, multiplier: 3.0 },
    roc: { period: 12, upperThreshold: 10, lowerThreshold: -10 },
    cci: { period: 14, upperLevel: 150, lowerLevel: -150 }
  },
  triggers: {
    // Покупка: сильный импульс + суперртренд + экстремальная перепроданность
    buySignal: 'supertrend && (sma || roc) && (rsi || cci)',
    // Продажа: тейк-профит/стоп-лосс или сильная перекупленность с разворотом тренда
    sellSignal: 'profit || (!supertrend && (rsi || cci || roc))',
    description: 'РУСАЛ: высокорисковая стратегия для волатильной металлургии с суперртрендом'
  }
};
