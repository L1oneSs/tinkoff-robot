/**
 * Конфигурация для ФосАгро (PHOR)
 * Сектор: Удобрения / Химическая промышленность  
 * Статус: Лидер производства фосфорных удобрений, экспортоориентированный
 */

import { INSTRUMENTS } from '../../../instruments.js';
import { BaseInstrumentConfig, DEFAULT_BASE_CONFIG } from '../../base-config.js';

export const PHOR_CONFIG: BaseInstrumentConfig = {
  ...DEFAULT_BASE_CONFIG,
  figi: INSTRUMENTS.PHOR.figi,
  enabled: true,
  orderLots: 1,
  signals: {
    profit: { takeProfit: 3, stopLoss: 4 },
    sma: { fastLength: 10, slowLength: 23 },
    ema: { fastLength: 14, slowLength: 28 },
    rsi: { period: 14, highLevel: 70, lowLevel: 30 },
    macd: { fastLength: 12, slowLength: 26, signalLength: 9 },
    bollinger: { length: 20, stdDev: 2.0 },
    adx: { period: 14, trendStrengthLevel: 25, strongTrendLevel: 40 }
  },
  triggers: {
    // Покупка: любой из трендовых + осциллятор
    buySignal: '(sma || ema || macd) && (rsi || bollinger)',
    
    // Продажа: прибыль или все трендовые против
    sellSignal: 'profit || (sma && ema && macd)',
    
    description: 'ФосАгро: реалистичные условия для агросектора'
  }
};
