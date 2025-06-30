/**
 * Конфигурация для SVCB (Совкомбанк)
 *
 */

import { INSTRUMENTS } from '../../../instruments.js';
import { BaseInstrumentConfig, DEFAULT_BASE_CONFIG } from '../../base-config.js';

export const SVCB_CONFIG: BaseInstrumentConfig = {
  ...DEFAULT_BASE_CONFIG,
  figi: INSTRUMENTS.SVCB.figi,
  orderLots: 1, 
  
  signals: {
    profit: {
      takeProfit: 3,   
      stopLoss: 4,     
    },
    
    sma: {
      fastLength: 12,
      slowLength: 26,
    },
    
    ema: {
      fastLength: 14,
      slowLength: 28,
    },
    
    rsi: {
      period: 14,
      highLevel: 68,    
      lowLevel: 32,
    },
    
    macd: {
      fastLength: 12,
      slowLength: 26,
      signalLength: 9,
    },
    
    bollinger: {
      length: 20,
      stdDev: 2.0,
    },
    
    adx: {
      period: 14,
      trendStrengthLevel: 25,
      strongTrendLevel: 40
    }
  },
  
  triggers: {
    buySignal: 'profit && sma && (ema || macd) && bollinger',
    sellSignal: 'profit || !sma || (rsi && !macd)',
    description: 'Консервативная стратегия для Совкомбанка с акцентом на управление рисками'
  }
};
