/**
 * Конфигурация для ММК (MAGN) 
 * Сектор: Металлургия / Сталь
 * Статус: Один из лидеров российской металлургии, интегрированный производитель
 */

import { BaseInstrumentConfig, DEFAULT_BASE_CONFIG, SignalContext } from '../../base-config.js';

export const MAGN_CONFIG: BaseInstrumentConfig = {
  ...DEFAULT_BASE_CONFIG,
  figi: 'BBG004S68507',
  name: 'ММК',
  ticker: 'MAGN',
  sector: 'Металлургия',
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
    // Покупка: тренд + любое подтверждение
    buySignal: (signals: SignalContext) => (signals.sma() || signals.ema()) && (signals.macd() || signals.rsi()),
    
    // Продажа: прибыль или разворот
    sellSignal: (signals: SignalContext) => signals.profit() || (signals.sma() && signals.ema()),
    
    description: 'Магнитогорский МК: упрощенная стратегия для металлургии'
  }
};
