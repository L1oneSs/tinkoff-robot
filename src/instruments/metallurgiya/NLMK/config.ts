/**
 * Конфигурация для НЛМК (NLMK)
 * Сектор: Металлургия
 */

import { CandleInterval } from 'tinkoff-invest-api/dist/generated/marketdata.js';
import { INSTRUMENTS } from '../../../instruments.js';
import { BaseInstrumentConfig, DEFAULT_BASE_CONFIG } from '../../base-config.js';

export const NLMK_CONFIG: BaseInstrumentConfig = {
  ...DEFAULT_BASE_CONFIG,
  figi: INSTRUMENTS.NLMK.figi,
  orderLots: 1,
  signals: {
    profit: { takeProfit: 15, stopLoss: 8 },
    ema: { fastLength: 9, slowLength: 21 },
    stochastic: { kLength: 21, kSmoothing: 3, overboughtLevel: 75, oversoldLevel: 25 },
    move: { length: 14, threshold: 0, filterLevel: 0.5 },
    macd: { fastLength: 12, slowLength: 26, signalLength: 9 }
  },
  triggers: {
    // Покупка: трендовый импульс + стохастик в перепроданности + MOVE подтверждает
    buySignal: '(ema || macd) && stochastic && move',
    // Продажа: фиксация прибыли или разворот тренда с негативными осцилляторами
    sellSignal: 'profit || ((!ema || !macd) && (stochastic || move))',
    description: 'НЛМК: умеренно агрессивная металлургическая стратегия с EMA и стохастиком'
  }
};
