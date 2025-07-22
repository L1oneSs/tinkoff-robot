/**
 * Конфигурация для РУСАЛа (RUAL)
 * Сектор: Металлургия
 */

import { BaseInstrumentConfig, DEFAULT_BASE_CONFIG, SignalContext } from '../../base-config.js';

export const RUAL_CONFIG: BaseInstrumentConfig = {
  ...DEFAULT_BASE_CONFIG,
  figi: 'BBG008F2T3T2',
  name: 'РУСАЛ',
  ticker: 'RUAL',
  sector: 'Металлургия',
  orderLots: 3, 
  signals: {
    profit: { takeProfit: 4, stopLoss: 4 }, 
    sma: { fastLength: 8, slowLength: 21 }, 
    ema: { fastLength: 12, slowLength: 26 }, 
    rsi: { period: 14, highLevel: 75, lowLevel: 25 }, 
    supertrend: { period: 12, multiplier: 2.5 }, 
    macd: { fastLength: 12, slowLength: 26, signalLength: 9 }, 
    roc: { period: 14, upperThreshold: 8, lowerThreshold: -8 }, 
    cci: { period: 20, upperLevel: 120, lowerLevel: -120 }, 
    bollinger: { length: 20, stdDev: 2.2 },
    williams: { period: 14, overboughtLevel: -15, oversoldLevel: -85 }
  },
  triggers: {
    // Покупка: тренд + подтверждение
    buySignal: (signals: SignalContext) => (signals.sma() || signals.ema()) && (signals.supertrend() || signals.macd()) && (signals.rsi() || signals.williams()),
    
    // Продажа: прибыль или разворот тренда
    sellSignal: (signals: SignalContext) => signals.profit() || (signals.sma() && signals.ema()),
    
    description: 'РУСАЛ: упрощенная стратегия для алюминиевого гиганта'
  }
};
