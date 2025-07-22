/**
 * Конфигурация для АЛРОСА (ALRS)
 * Сектор: Горнодобыча / Алмазы
 * Статус: Мировой лидер алмазодобычи, монополист российского рынка
 */

import { BaseInstrumentConfig, DEFAULT_BASE_CONFIG, SignalContext } from '../../base-config.js';

export const ALRS_CONFIG: BaseInstrumentConfig = {
  ...DEFAULT_BASE_CONFIG,
  figi: 'BBG004S68B31',
  name: 'АЛРОСА',
  ticker: 'ALRS',
  sector: 'Горнодобыча',
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
    buySignal: (signals: SignalContext) => (signals.sma() && signals.ema() && signals.macd()) && (signals.bollinger() || !signals.williams()) && !signals.rsi(),
    sellSignal: (signals: SignalContext) => signals.profit() || (!signals.sma() || !signals.ema()) || (signals.rsi() && signals.williams()) || !signals.macd(),
    description: 'Алмазный монополист с премиальным позиционированием'
  }
};
