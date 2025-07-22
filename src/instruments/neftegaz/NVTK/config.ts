/**
 * Конфигурация для НОВАТЭКа (NVTK)
 * Сектор: Нефтегаз / СПГ
 * Статус: №3 в мире по доказанным запасам газа, лидер СПГ-проектов в Арктике
 */

import { BaseInstrumentConfig, DEFAULT_BASE_CONFIG, SignalContext } from '../../base-config.js';

export const NVTK_CONFIG: BaseInstrumentConfig = {
  ...DEFAULT_BASE_CONFIG,
  figi: 'BBG00475KKY8',
  name: 'НОВАТЭК',
  ticker: 'NVTK',
  sector: 'Нефтегаз',
  enabled: true,
  orderLots: 1,
  signals: {
    profit: { takeProfit: 4, stopLoss: 4 },
    sma: { fastLength: 12, slowLength: 26 },
    ema: { fastLength: 16, slowLength: 32 },
    rsi: { period: 14, highLevel: 70, lowLevel: 30 },
    macd: { fastLength: 12, slowLength: 26, signalLength: 9 },
    bollinger: { length: 20, stdDev: 2.0 },
    adx: { period: 14, trendStrengthLevel: 25, strongTrendLevel: 40 },
    supertrend: { period: 10, multiplier: 3.0 }
  },
  triggers: {
    // Покупка: тренд + подтверждение
    buySignal: (signals: SignalContext) => (signals.sma() || signals.ema()) && (signals.adx() || signals.macd()),
    
    // Продажа: прибыль или разворот
    sellSignal: (signals: SignalContext) => signals.profit() || (signals.sma() && signals.ema()),
    
    description: 'НОВАТЭК: упрощенная стратегия для газового лидера'
  }
};
