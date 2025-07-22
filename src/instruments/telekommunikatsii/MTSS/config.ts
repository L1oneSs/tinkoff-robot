/**
 * Конфигурация для МТС (MTSS)
 * Сектор: Телекоммуникации / Цифровая экосистема
 * Статус: Лидер телеком-рынка с диверсификацией в IT и финтех
 */

import { BaseInstrumentConfig, DEFAULT_BASE_CONFIG, SignalContext } from '../../base-config.js';

export const MTSS_CONFIG: BaseInstrumentConfig = {
  ...DEFAULT_BASE_CONFIG,
  figi: 'BBG004S681W1',
  name: 'МТС',
  ticker: 'MTSS',
  sector: 'Телекоммуникации',
  orderLots: 2,
  signals: {
    profit: { takeProfit: 3, stopLoss: 4 },
    sma: { fastLength: 10, slowLength: 25 },
    ema: { fastLength: 15, slowLength: 30 },
    rsi: { period: 18, highLevel: 70, lowLevel: 30 },
    macd: { fastLength: 12, slowLength: 26, signalLength: 9 },
    bollinger: { length: 20, stdDev: 2.0 },
    adx: { period: 14, trendStrengthLevel: 20, strongTrendLevel: 35 },
    williams: { period: 14, overboughtLevel: -20, oversoldLevel: -80 }
  },
  triggers: {
    // Покупка: тренд + любое подтверждение
    buySignal: (signals: SignalContext) => (signals.sma() || signals.ema()) && (signals.macd() || signals.rsi()),
    
    // Продажа: прибыль или разворот тренда
    sellSignal: (signals: SignalContext) => signals.profit() || (signals.sma() && signals.ema()),
    
    description: 'МТС: упрощенная стратегия для телеком-лидера'
  }
};
