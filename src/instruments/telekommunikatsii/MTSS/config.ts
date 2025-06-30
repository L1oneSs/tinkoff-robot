/**
 * Конфигурация для МТС (MTSS)
 * Сектор: Телекоммуникации / Цифровая экосистема
 * Статус: Лидер телеком-рынка с диверсификацией в IT и финтех
 */

import { INSTRUMENTS } from '../../../instruments.js';
import { BaseInstrumentConfig, DEFAULT_BASE_CONFIG } from '../../base-config.js';

export const MTSS_CONFIG: BaseInstrumentConfig = {
  ...DEFAULT_BASE_CONFIG,
  figi: INSTRUMENTS.MTSS.figi,
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
    buySignal: '(sma || ema) && (macd || rsi)',
    
    // Продажа: прибыль или разворот тренда
    sellSignal: 'profit || (sma && ema)',
    
    description: 'МТС: упрощенная стратегия для телеком-лидера'
  }
};
