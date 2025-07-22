/**
 * Конфигурация для Интер РАО (IRAO)
 * Сектор: Энергетика / Электроэнергетика
 * Статус: Крупнейший экспортер электроэнергии России
 */

import { BaseInstrumentConfig, DEFAULT_BASE_CONFIG, SignalContext } from '../../base-config.js';

export const IRAO_CONFIG: BaseInstrumentConfig = {
  ...DEFAULT_BASE_CONFIG,
  figi: 'BBG004S68473',
  name: 'Интер РАО',
  ticker: 'IRAO',
  sector: 'Энергетика',
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
    buySignal: (signals: SignalContext) => 
      
      (signals.sma() && signals.ema() && signals.macd()) && (signals.adx() || signals.bollinger()) && !signals.rsi(),
    sellSignal: (signals: SignalContext) => 
      
      signals.profit() || (!signals.sma() || !signals.ema()) || 
      (signals.rsi() && !signals.macd()) || (!signals.adx() && !signals.bollinger()),
    description: 'Энергетический экспортер с диверсифицированным портфелем генерации'
  }
};
