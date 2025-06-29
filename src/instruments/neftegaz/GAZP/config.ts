/**
 * Конфигурация для Газпрома (GAZP)
 * Сектор: Нефтегаз
 */

import { CandleInterval } from 'tinkoff-invest-api/dist/generated/marketdata.js';
import { INSTRUMENTS } from '../../../instruments.js';
import { BaseInstrumentConfig, DEFAULT_BASE_CONFIG } from '../../base-config.js';

export const GAZP_CONFIG: BaseInstrumentConfig = {
  ...DEFAULT_BASE_CONFIG,
  figi: INSTRUMENTS.GAZP.figi,
  orderLots: 2,
  signals: {
    profit: { takeProfit: 15, stopLoss: 7 }, // Газпром волатильнее
    ema: { fastLength: 12, slowLength: 26 },
    stochastic: { kLength: 14, kSmoothing: 3, overboughtLevel: 80, oversoldLevel: 20 },
    psar: { step: 0.02, maxStep: 0.2 },
    rsi: { period: 14, highLevel: 75, lowLevel: 25 }
  },
  triggers: {
    // Покупка: восходящий тренд (EMA, PSAR) + перепроданность (Stochastic, RSI)
    buySignal: '(ema || psar) && (stochastic || rsi)',
    // Продажа: риск-менеджмент или нисходящий тренд с перекупленностью
    sellSignal: 'profit || ((!ema || !psar) && (stochastic || rsi))',
    description: 'Газпром: трендовая стратегия с использованием EMA и PSAR, подтверждение осцилляторами'
  }
};
