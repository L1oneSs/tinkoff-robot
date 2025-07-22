/**
 * Конфигурация для Магнита (MGNT)
 * Сектор: Ритейл
 */

import { CandleInterval } from 'tinkoff-invest-api/dist/generated/marketdata.js';
import { BaseInstrumentConfig, DEFAULT_BASE_CONFIG, SignalContext } from '../../base-config.js';

export const MGNT_CONFIG: BaseInstrumentConfig = {
  ...DEFAULT_BASE_CONFIG,
  figi: 'BBG004RVFCY3',
  name: 'Магнит',
  ticker: 'MGNT',
  sector: 'Ритейл',
  orderLots: 3,
  interval: CandleInterval.CANDLE_INTERVAL_5_MIN,
  signals: {
    profit: { takeProfit: 3, stopLoss: 4 },
    sma: { fastLength: 10, slowLength: 25 },
    ema: { fastLength: 12, slowLength: 26 },
    rsi: { period: 14, highLevel: 75, lowLevel: 25 },
    stochastic: { kLength: 14, kSmoothing: 3, overboughtLevel: 85, oversoldLevel: 15 },
    macd: { fastLength: 12, slowLength: 26, signalLength: 9 },
    bollinger: { length: 20, stdDev: 2.2 }
  },
  triggers: {
    // Покупка: тренд + моментум
    buySignal: (signals: SignalContext) => (signals.sma() || signals.ema()) && (signals.rsi() || signals.macd()),
    
    // Продажа: прибыль или разворот тренда
    sellSignal: (signals: SignalContext) => signals.profit() || (signals.sma() && signals.ema()),
    
    description: 'Магнит: упрощенная стратегия для ритейла'
  }
};
