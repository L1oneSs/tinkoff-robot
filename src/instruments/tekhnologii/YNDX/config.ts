/**
 * Конфигурация для Nebius Group (YNDX)
 * Сектор: Технологии / AI-инфраструктура
 * Статус: Трансформация в лидера AI-облачных решений
 */

import { INSTRUMENTS } from '../../../instruments.js';
import { BaseInstrumentConfig, DEFAULT_BASE_CONFIG } from '../../base-config.js';

export const YNDX_CONFIG: BaseInstrumentConfig = {
  ...DEFAULT_BASE_CONFIG,
  figi: INSTRUMENTS.YNDX.figi,
  orderLots: 1,
  signals: {
    profit: { takeProfit: 3, stopLoss: 4 },
    sma: { fastLength: 8, slowLength: 21 },
    ema: { fastLength: 12, slowLength: 26 },
    rsi: { period: 14, highLevel: 75, lowLevel: 25 },
    macd: { fastLength: 12, slowLength: 26, signalLength: 9 },
    bollinger: { length: 20, stdDev: 2.0 },
    adx: { period: 14, trendStrengthLevel: 25, strongTrendLevel: 45 },
    supertrend: { period: 10, multiplier: 3.0 },
    stochastic: { kLength: 14, kSmoothing: 3, overboughtLevel: 80, oversoldLevel: 20 }
  },
  triggers: {
    // Покупка: простой тренд + подтверждение
    buySignal: '(sma || ema) && (rsi || macd)',
    
    // Продажа: прибыль или разворот тренда  
    sellSignal: 'profit || (sma && ema)',
    
    description: 'Яндекс: упрощенная стратегия для волатильной IT-бумаги'
  }
};
