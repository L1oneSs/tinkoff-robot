/**
 * Конфигурация для НОВАТЭКа (NVTK)
 * Сектор: Нефтегаз / СПГ
 * Статус: №3 в мире по доказанным запасам газа, лидер СПГ-проектов в Арктике
 */

import { INSTRUMENTS } from '../../../instruments.js';
import { BaseInstrumentConfig, DEFAULT_BASE_CONFIG } from '../../base-config.js';

export const NVTK_CONFIG: BaseInstrumentConfig = {
  ...DEFAULT_BASE_CONFIG,
  figi: INSTRUMENTS.NVTK.figi,
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
    buySignal: '(sma || ema) && (adx || macd)',
    
    // Продажа: прибыль или разворот
    sellSignal: 'profit || (sma && ema)',
    
    description: 'НОВАТЭК: упрощенная стратегия для газового лидера'
  }
};
