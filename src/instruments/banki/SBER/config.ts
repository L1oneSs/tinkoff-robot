/**
 * Конфигурация для Сбербанка (SBER)
 * Сектор: Банки
 */

import { BaseInstrumentConfig, DEFAULT_BASE_CONFIG, SignalContext } from '../../base-config.js';

export const SBER_CONFIG: BaseInstrumentConfig = {
  ...DEFAULT_BASE_CONFIG,
  figi: 'BBG004730N88',
  name: 'Сбербанк',
  ticker: 'SBER',
  sector: 'Банки',
  orderLots: 1,
  signals: {
    profit: { takeProfit: 2, stopLoss: 2 }, 
    sma: { fastLength: 8, slowLength: 21 }, 
    rsi: { period: 14, highLevel: 70, lowLevel: 30 }, 
    macd: { fastLength: 12, slowLength: 26, signalLength: 9 }, 
    williams: { period: 14, overboughtLevel: -20, oversoldLevel: -80 },
    bollinger: { length: 20, stdDev: 2.1 }, 
    ema: { fastLength: 9, slowLength: 21 },
  },
  triggers: {
    // Покупка: один трендовый + один моментум индикатор
    buySignal: (signals: SignalContext) => (signals.sma() || signals.ema()) && (signals.rsi() || signals.macd()),
    
    // Продажа: прибыль или два трендовых против
    sellSignal: (signals: SignalContext) => signals.profit() || (signals.sma() && signals.ema()),
    
    description: 'Сбербанк: упрощенная стратегия для частых сигналов'
  }
};
