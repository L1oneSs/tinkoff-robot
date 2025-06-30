/**
 * Конфигурация для Северстали (CHMF)
 * Сектор: Металлургия / Сталь
 * Статус: Крупнейший производитель стали в России, экспортоориентированный
 */

import { INSTRUMENTS } from '../../../instruments.js';
import { BaseInstrumentConfig, DEFAULT_BASE_CONFIG } from '../../base-config.js';

export const CHMF_CONFIG: BaseInstrumentConfig = {
  ...DEFAULT_BASE_CONFIG,
  figi: INSTRUMENTS.CHMF.figi,
  enabled: true,
  orderLots: 1,
  signals: {
    profit: { takeProfit: 4, stopLoss: 4 },
    sma: { fastLength: 11, slowLength: 24 },
    ema: { fastLength: 15, slowLength: 30 },
    rsi: { period: 14, highLevel: 70, lowLevel: 30 },
    macd: { fastLength: 12, slowLength: 26, signalLength: 9 },
    bollinger: { length: 20, stdDev: 2.0 },
    adx: { period: 14, trendStrengthLevel: 25, strongTrendLevel: 40 }
  },
  triggers: {
    buySignal: '(sma && ema && macd) && (adx || bollinger) && !rsi',
    sellSignal: 'profit || (!sma || !ema) || (rsi && !macd) || (!adx && !bollinger)',
    description: 'Стальной гигант с циклическим ростом от инфраструктурных проектов'
  }
};
