/**
 * Конфигурация для Fix Price (FIXP)
 * Сектор: Ритейл / Дискаунтеры
 * Статус: Лидер сегмента товаров фиксированной низкой цены
 */

import { BaseInstrumentConfig, DEFAULT_BASE_CONFIG, SignalContext } from '../../base-config.js';

export const FIXP_CONFIG: BaseInstrumentConfig = {
  ...DEFAULT_BASE_CONFIG,
  figi: 'BBG00ZHCX1X2',
  name: 'Fix Price',
  ticker: 'FIXP',
  sector: 'Ритейл',
  enabled: true,
  orderLots: 1,
  signals: {
    profit: { takeProfit: 4, stopLoss: 4 },
    sma: { fastLength: 12, slowLength: 25 },
    ema: { fastLength: 16, slowLength: 32 },
    rsi: { period: 14, highLevel: 70, lowLevel: 30 },
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
    description: 'Дискаунтер с устойчивой бизнес-моделью и защитными свойствами'
  }
};
