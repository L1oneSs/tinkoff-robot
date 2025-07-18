/**
 * Конфигурация для ВТБ (VTBR)
 * Сектор: Банки
 */

import { INSTRUMENTS } from '../../../instruments.js';
import { BaseInstrumentConfig, DEFAULT_BASE_CONFIG } from '../../base-config.js';

export const VTBR_CONFIG: BaseInstrumentConfig = {
  ...DEFAULT_BASE_CONFIG,
  figi: INSTRUMENTS.VTBR.figi,
  orderLots: 10, 
  signals: {
    profit: { takeProfit: 3, stopLoss: 4 }, 
    sma: { fastLength: 5, slowLength: 15 }, 
    ema: { fastLength: 8, slowLength: 21 }, 
    ao: { threshold: 0, useColorChange: true },
    ac: { threshold: 0, useColorChange: true, confirmBars: 1 }, 
    rsi: { period: 14, highLevel: 75, lowLevel: 25 }, 
    macd: { fastLength: 12, slowLength: 26, signalLength: 9 }, 
    bollinger: { length: 20, stdDev: 2.2 } 
  },
  triggers: {
    // Покупка: любой тренд + любой осциллятор
    buySignal: '(sma || ema) && (ao || ac || rsi)',
    
    // Продажа: прибыль или два индикатора против
    sellSignal: 'profit || (sma && ema)',
    
    description: 'ВТБ: агрессивная стратегия с быстрыми сигналами, ориентация на краткосрочные движения ' +
      'и защита от отката'
  }
};
