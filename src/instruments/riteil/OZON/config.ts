/**
 * Конфигурация для Озона (OZON)
 * Сектор: Ритейл / E-commerce
 * Статус: Лидер российского e-commerce, быстрорастущая экосистема
 */

import { INSTRUMENTS } from '../../../instruments.js';
import { BaseInstrumentConfig, DEFAULT_BASE_CONFIG } from '../../base-config.js';

export const OZON_CONFIG: BaseInstrumentConfig = {
  ...DEFAULT_BASE_CONFIG,
  figi: INSTRUMENTS.OZON.figi,
  enabled: true,
  orderLots: 1,
  signals: {
    profit: { takeProfit: 3, stopLoss: 4 },
    sma: { fastLength: 8, slowLength: 20 },
    ema: { fastLength: 12, slowLength: 26 },
    rsi: { period: 14, highLevel: 75, lowLevel: 25 },
    macd: { fastLength: 12, slowLength: 26, signalLength: 9 },
    bollinger: { length: 20, stdDev: 2.0 },
    adx: { period: 14, trendStrengthLevel: 25, strongTrendLevel: 45 },
    supertrend: { period: 10, multiplier: 3.0 }
  },
  triggers: {
    // Покупка: базовый тренд + любой подтверждающий сигнал
    buySignal: '(sma || ema) && (macd || rsi)',
    
    // Продажа: прибыль или два против
    sellSignal: 'profit || (sma && ema)',
    
    description: 'OZON: упрощенная стратегия для высоковолатильной бумаги'
  }
};
