/**
 * Конфигурация для Татнефти (TATN)
 * Сектор: Нефтегаз
 */

import { INSTRUMENTS } from '../../../instruments.js';
import { BaseInstrumentConfig, DEFAULT_BASE_CONFIG } from '../../base-config.js';

export const TATN_CONFIG: BaseInstrumentConfig = {
  ...DEFAULT_BASE_CONFIG,
  figi: INSTRUMENTS.TATN.figi,
  orderLots: 1,
  signals: {
    profit: { takeProfit: 12, stopLoss: 6 },
    sma: { fastLength: 8, slowLength: 21 },
    rsi: { period: 14, highLevel: 70, lowLevel: 30 },
    cci: { period: 20, upperLevel: 100, lowerLevel: -100 },
    bollinger: { length: 14, stdDev: 2 }
  },
  triggers: {
    // Покупка: быстрая MA + перепроданность по CCI или RSI
    buySignal: 'sma && (cci || rsi)',
    // Продажа: управление рисками или перекупленность с разворотом тренда
    sellSignal: 'profit || ((cci || rsi) && !sma)',
    description: 'Татнефть: агрессивная стратегия с быстрыми сигналами и осцилляторами'
  }
};
