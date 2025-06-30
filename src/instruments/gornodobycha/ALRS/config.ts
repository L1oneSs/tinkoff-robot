/**
 * Конфигурация для АЛРОСА (ALRS)
 * Сектор: Горнодобыча / Алмазы
 * Статус: Мировой лидер алмазодобычи, монополист российского рынка
 */

import { INSTRUMENTS } from '../../../instruments.js';
import { BaseInstrumentConfig, DEFAULT_BASE_CONFIG } from '../../base-config.js';

export const ALRS_CONFIG: BaseInstrumentConfig = {
  ...DEFAULT_BASE_CONFIG,
  figi: INSTRUMENTS.ALRS.figi,
  enabled: true,
  orderLots: 3,
  signals: {
    profit: { takeProfit: 3, stopLoss: 4 },
    sma: { fastLength: 10, slowLength: 21 },
    ema: { fastLength: 14, slowLength: 28 },
    rsi: { period: 14, highLevel: 75, lowLevel: 25 },
    macd: { fastLength: 12, slowLength: 26, signalLength: 9 },
    bollinger: { length: 20, stdDev: 2.0 },
    williams: { period: 14, overboughtLevel: -20, oversoldLevel: -80 }
  },
  triggers: {
    buySignal: '(sma && ema && macd) && (bollinger || !williams) && !rsi',
    sellSignal: 'profit || (!sma || !ema) || (rsi && williams) || !macd',
    description: 'Алмазный монополист с премиальным позиционированием'
  }
};
