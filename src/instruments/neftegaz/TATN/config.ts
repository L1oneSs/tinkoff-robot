/**
 * Конфигурация для Татнефти (TATN)
 * Сектор: Нефтегаз
 */

import { BaseInstrumentConfig, DEFAULT_BASE_CONFIG, SignalContext } from '../../base-config.js';

export const TATN_CONFIG: BaseInstrumentConfig = {
  ...DEFAULT_BASE_CONFIG,
  figi: 'BBG004S68829',
  name: 'Татнефть',
  ticker: 'TATN',
  sector: 'Нефтегаз',
  orderLots: 2, 
  signals: {
    profit: { takeProfit: 4, stopLoss: 4 },
    sma: { fastLength: 9, slowLength: 21 },
    ema: { fastLength: 8, slowLength: 18 },
    rsi: { period: 12, highLevel: 72, lowLevel: 28 },
    macd: { fastLength: 10, slowLength: 24, signalLength: 9 },
    bollinger: { length: 16, stdDev: 2.1 },
    williams: { period: 12, overboughtLevel: -20, oversoldLevel: -80 },
    adx: { period: 14, trendStrengthLevel: 22, strongTrendLevel: 30 },
    cci: { period: 18, upperLevel: 110, lowerLevel: -110 }
  },
  triggers: {
    // Покупка: тренд + любой осциллятор
    buySignal: (signals: SignalContext) => (signals.sma() || signals.ema()) && (signals.rsi() || signals.williams() || signals.adx()),
    
    // Продажа: прибыль или разворот тренда
    sellSignal: (signals: SignalContext) => signals.profit() || (signals.sma() && signals.ema()),
    
    description: 'Татнефть: упрощенная стратегия для дивидендной нефтянки'
  }
};
