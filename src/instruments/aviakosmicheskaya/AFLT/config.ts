/**
 * Конфигурация для Аэрофлота (AFLT)
 * Сектор: Авиаперевозки
 */

import { INSTRUMENTS } from '../../../instruments.js';
import { BaseInstrumentConfig, DEFAULT_BASE_CONFIG } from '../../base-config.js';

export const AFLT_CONFIG: BaseInstrumentConfig = {
  ...DEFAULT_BASE_CONFIG,
  figi: INSTRUMENTS.AFLT.figi,
  orderLots: 1,
  signals: {
    profit: { takeProfit: 3, stopLoss: 4 }, 
    sma: { fastLength: 10, slowLength: 25 }, 
    rsi: { period: 14, highLevel: 75, lowLevel: 25 }, 
    macd: { fastLength: 12, slowLength: 26, signalLength: 9 }, 
    williams: { period: 14, overboughtLevel: -15, oversoldLevel: -85 },
    bollinger: { length: 20, stdDev: 2.2 }, 
    ema: { fastLength: 12, slowLength: 24 }
  },
  triggers: {
    // Покупка: хотя бы 2 из 3 групп сигналов должны подтверждать покупку
    buySignal: '((sma || ema) && (rsi || williams)) || ((sma || ema) && macd) || (macd && bollinger)',
    
    // Продажа: только четкие сигналы на выход
    sellSignal: 'profit || (sma && ema && macd)',
    
    description: 'Аэрофлот: балансированная стратегия с умеренными условиями входа и строгими условиями выхода'
  }
};
