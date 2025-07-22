/**
 * Конфигурация для ПИК (PIKK)
 * Сектор: Недвижимость / Девелопмент
 * Статус: Крупнейший девелопер России по объемам строительства
 */

import { BaseInstrumentConfig, DEFAULT_BASE_CONFIG, SignalContext } from '../../base-config.js';

export const PIKK_CONFIG: BaseInstrumentConfig = {
  ...DEFAULT_BASE_CONFIG,
  figi: 'BBG004S68BH6',
  name: 'ПИК',
  ticker: 'PIKK',
  sector: 'Недвижимость',
  enabled: true,
  orderLots: 2,
  signals: {
    profit: { takeProfit: 4, stopLoss: 4 },
    sma: { fastLength: 9, slowLength: 21 },
    ema: { fastLength: 12, slowLength: 26 },
    rsi: { period: 14, highLevel: 70, lowLevel: 30 },
    macd: { fastLength: 12, slowLength: 26, signalLength: 9 },
    bollinger: { length: 20, stdDev: 2.0 },
    adx: { period: 14, trendStrengthLevel: 25, strongTrendLevel: 40 },
    stochastic: { kLength: 14, kSmoothing: 3, overboughtLevel: 80, oversoldLevel: 20 }
  },
  triggers: {
    buySignal: (signals: SignalContext) => (signals.sma() && signals.ema() && signals.adx()) && (signals.macd() || signals.bollinger()) && (!signals.rsi() || !signals.stochastic()),
    sellSignal: (signals: SignalContext) => signals.profit() || (!signals.sma() || !signals.ema()) || (signals.rsi() && signals.stochastic()) || (!signals.macd() && !signals.adx()),
    description: 'Девелоперский лидер с циклическим ростом от ипотечных программ'
  }
};
