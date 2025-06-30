/**
 * Конфигурация для VKCO (VK Company)
 * 
 *
 */

import { INSTRUMENTS } from '../../../instruments.js';
import { BaseInstrumentConfig, DEFAULT_BASE_CONFIG } from '../../base-config.js';

export const VKCO_CONFIG: BaseInstrumentConfig = {
  ...DEFAULT_BASE_CONFIG,
  figi: INSTRUMENTS.VKCO.figi,
  enabled: true,
  orderLots: 1,
  
  signals: {
    profit: {
      takeProfit: 3,   
      stopLoss: 4,    
    },
    
    sma: {
      fastLength: 10,
      slowLength: 25,
    },
    
    ema: {
      fastLength: 12,
      slowLength: 26,
    },
    
    rsi: {
      period: 14,
      highLevel: 70,    
      lowLevel: 30,
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
    buySignal: 'profit && (sma && ema) && (macd || bollinger) && adx',
    sellSignal: 'profit || (!sma || !ema) || (rsi && !adx)',
    description: 'Стратегия для VK Company с учетом экосистемного потенциала и долговых рисков'
  }
};
