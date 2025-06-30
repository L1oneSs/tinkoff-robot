/**
 * Конфигурация для Интер РАО (IRAO)
 * Сектор: Энергетика / Электроэнергетика
 * Статус: Крупнейший экспортер электроэнергии России
 */

import { INSTRUMENTS } from '../../../instruments.js';
import { BaseInstrumentConfig, DEFAULT_BASE_CONFIG } from '../../base-config.js';

export const IRAO_CONFIG: BaseInstrumentConfig = {
  ...DEFAULT_BASE_CONFIG,
  figi: INSTRUMENTS.IRAO.figi,
  enabled: true,
  orderLots: 20,
  signals: {
    profit: { takeProfit: 3, stopLoss: 4 },
    sma: { fastLength: 11, slowLength: 24 },
    ema: { fastLength: 15, slowLength: 30 },
    rsi: { period: 14, highLevel: 68, lowLevel: 32 },
    macd: { fastLength: 12, slowLength: 26, signalLength: 9 },
    bollinger: { length: 20, stdDev: 2.0 },
    adx: { period: 14, trendStrengthLevel: 22, strongTrendLevel: 38 }
  },
  triggers: {
    buySignal: '(sma && ema && macd) && (adx || bollinger) && !rsi',
    sellSignal: 'profit || (!sma || !ema) || (rsi && !macd) || (!adx && !bollinger)',
    description: 'Энергетический экспортер с диверсифицированным портфелем генерации'
  }
};
