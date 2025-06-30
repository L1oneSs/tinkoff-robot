/**
 * Конфигурация для РУСАЛа (RUAL)
 * Сектор: Металлургия
 */

import { INSTRUMENTS } from '../../../instruments.js';
import { BaseInstrumentConfig, DEFAULT_BASE_CONFIG } from '../../base-config.js';

export const RUAL_CONFIG: BaseInstrumentConfig = {
  ...DEFAULT_BASE_CONFIG,
  figi: INSTRUMENTS.RUAL.figi,
  orderLots: 3, 
  signals: {
    profit: { takeProfit: 4, stopLoss: 4 }, 
    sma: { fastLength: 8, slowLength: 21 }, 
    ema: { fastLength: 12, slowLength: 26 }, 
    rsi: { period: 14, highLevel: 75, lowLevel: 25 }, 
    supertrend: { period: 12, multiplier: 2.5 }, 
    macd: { fastLength: 12, slowLength: 26, signalLength: 9 }, 
    roc: { period: 14, upperThreshold: 8, lowerThreshold: -8 }, 
    cci: { period: 20, upperLevel: 120, lowerLevel: -120 }, 
    bollinger: { length: 20, stdDev: 2.2 },
    williams: { period: 14, overboughtLevel: -15, oversoldLevel: -85 }
  },
  triggers: {
    // Покупка: ждем сильного подтверждения разворота от множественных индикаторов
    buySignal: 'supertrend && (sma || ema) && macd && (rsi || williams || cci) && (roc || bollinger)',
    
    // Продажа: быстрая фиксация прибыли + защита от санкционных/операционных рисков
    sellSignal: 'profit || (!supertrend || (!sma && !ema) || (!macd && (rsi && cci)))',
    
    description: 'РУСАЛ: сбалансированная стратегия для санкционной бумаги с учетом геополитических рисков и потенциала разворота'
  }
};
