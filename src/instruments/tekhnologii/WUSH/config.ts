/**
 * Конфигурация для WUSH (Whoosh)
 *
 */

import { BaseInstrumentConfig, DEFAULT_BASE_CONFIG, SignalContext } from '../../base-config.js';

export const WUSH_CONFIG: BaseInstrumentConfig = {
  ...DEFAULT_BASE_CONFIG,
  figi: 'TCS00A105EX7',
  name: 'Whoosh',
  ticker: 'WUSH',
  sector: 'Технологии',
  enabled: true,
  orderLots: 1,
  
  signals: {
    profit: {
      takeProfit: 3,   
      stopLoss: 4,      
    },
    
    rsi: {
      period: 14,
      highLevel: 72,    
      lowLevel: 28,     
    },
    
    macd: {
      fastLength: 12,
      slowLength: 26,
      signalLength: 9,
    },
    
    ema: {
      fastLength: 12,
      slowLength: 26,
    },
    
    bollinger: {
      length: 20,
      stdDev: 2.0,
    },
    
    adx: {
      period: 14,
      trendStrengthLevel: 25,
      strongTrendLevel: 45
    }
  },
  
  triggers: {
    buySignal: (signals: SignalContext) => signals.profit() && (signals.rsi() || (signals.macd() && signals.ema())) && signals.adx(),
    sellSignal: (signals: SignalContext) => signals.profit() || (signals.rsi() && signals.bollinger()) || !signals.adx(),
    description: 'Стратегия для технологической акции Whoosh с акцентом на рост и управление рисками'
  }
};
