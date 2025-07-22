/**
 * Конфигурация для РусГидро (HYDR)
 * Сектор: Энергетика / Гидроэнергетика
 * Статус: Крупнейшая гидроэнергетическая компания России
 */

import { BaseInstrumentConfig, DEFAULT_BASE_CONFIG, SignalContext } from '../../base-config.js';

export const HYDR_CONFIG: BaseInstrumentConfig = {
  ...DEFAULT_BASE_CONFIG,
  figi: 'BBG00475K2X9',
  name: 'РусГидро',
  ticker: 'HYDR',
  sector: 'Энергетика',
  enabled: true,
  orderLots: 50,
  signals: {
    profit: { takeProfit: 3, stopLoss: 4 },
    sma: { fastLength: 12, slowLength: 26 },
    ema: { fastLength: 16, slowLength: 32 },
    rsi: { period: 16, highLevel: 65, lowLevel: 35 },
    macd: { fastLength: 12, slowLength: 26, signalLength: 9 },
    bollinger: { length: 20, stdDev: 2.0 },
    williams: { period: 14, overboughtLevel: -20, oversoldLevel: -80 }
  },
  triggers: {
    buySignal: (signals: SignalContext) => 
      
      (signals.sma() && signals.ema() && signals.macd()) && 
      (signals.bollinger() || !signals.williams()) && !signals.rsi(),
    sellSignal: (signals: SignalContext) => 
      
      signals.profit() || 
      
        (!signals.sma() || 
      
        !signals.ema()) || 
      
        (signals.rsi() && 
      
        signals.williams()) || 
      
        !signals.macd(),
    description: 'Зеленая энергетика с государственной поддержкой и стабильными тарифами'
  }
};
