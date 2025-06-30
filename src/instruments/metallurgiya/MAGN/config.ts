/**
 * Конфигурация для ММК (MAGN) 
 * Сектор: Металлургия / Сталь
 * Статус: Один из лидеров российской металлургии, интегрированный производитель
 */

import { INSTRUMENTS } from '../../../instruments.js';
import { BaseInstrumentConfig, DEFAULT_BASE_CONFIG } from '../../base-config.js';

export const MAGN_CONFIG: BaseInstrumentConfig = {
  ...DEFAULT_BASE_CONFIG,
  figi: INSTRUMENTS.MAGN.figi,
  enabled: true,
  orderLots: 5,
  signals: {
    profit: { takeProfit: 4, stopLoss: 4 },
    sma: { fastLength: 10, slowLength: 22 },
    ema: { fastLength: 13, slowLength: 27 },
    rsi: { period: 14, highLevel: 70, lowLevel: 30 },
    macd: { fastLength: 12, slowLength: 26, signalLength: 9 },
    bollinger: { length: 20, stdDev: 2.0 },
    williams: { period: 14, overboughtLevel: -20, oversoldLevel: -80 }
  },
  triggers: {
    buySignal: '(sma && ema && macd) && (bollinger || !williams) && !rsi',
    sellSignal: 'profit || (!sma || !ema) || (rsi && williams) || !macd',
    description: 'Интегрированный металлургический комплекс с полным циклом производства'
  }
};
