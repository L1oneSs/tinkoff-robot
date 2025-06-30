/**
 * Конфигурация для Татнефти (TATN)
 * Сектор: Нефтегаз
 */

import { INSTRUMENTS } from '../../../instruments.js';
import { BaseInstrumentConfig, DEFAULT_BASE_CONFIG } from '../../base-config.js';

export const TATN_CONFIG: BaseInstrumentConfig = {
  ...DEFAULT_BASE_CONFIG,
  figi: INSTRUMENTS.TATN.figi,
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
    buySignal: '(sma || ema) && (rsi || williams || adx)',
    
    // Продажа: прибыль или разворот тренда
    sellSignal: 'profit || (sma && ema)',
    
    description: 'Татнефть: упрощенная стратегия для дивидендной нефтянки'
  }
};
