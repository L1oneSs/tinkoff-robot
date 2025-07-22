/**
 * Конфигурация для SVCB (Совкомбанк)
 *
 */

import { BaseInstrumentConfig, DEFAULT_BASE_CONFIG, SignalContext } from '../../base-config.js';

export const SVCB_CONFIG: BaseInstrumentConfig = {
  ...DEFAULT_BASE_CONFIG,
  figi: 'TCS00A0ZZAC4',
  name: 'Совкомбанк',
  ticker: 'SVCB',
  sector: 'Банки',
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
    buySignal: (signals: SignalContext) => 
      
      signals.profit() && signals.sma() && 
      (signals.ema() || signals.macd()) && signals.bollinger(),
    sellSignal: (signals: SignalContext) => signals.profit() || !signals.sma() || (signals.rsi() && !signals.macd()),
    description: 'Консервативная стратегия для Совкомбанка с акцентом на управление рисками'
  }
};
