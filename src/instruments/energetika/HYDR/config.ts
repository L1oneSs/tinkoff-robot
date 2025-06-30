/**
 * Конфигурация для РусГидро (HYDR)
 * Сектор: Энергетика / Гидроэнергетика
 * Статус: Крупнейшая гидроэнергетическая компания России
 */

import { INSTRUMENTS } from '../../../instruments.js';
import { BaseInstrumentConfig, DEFAULT_BASE_CONFIG } from '../../base-config.js';

export const HYDR_CONFIG: BaseInstrumentConfig = {
  ...DEFAULT_BASE_CONFIG,
  figi: INSTRUMENTS.HYDR.figi,
  enabled: true,
  orderLots: 50,
  signals: {
    profit: { takeProfit: 3, stopLoss: 4 },
    sma: { fastLength: 12, slowLength: 26 },
    ema: { fastLength: 16, slowLength: 32 },
    rsi: { period: 16, highLevel: 65, lowLevel: 35 },
    macd: { fastLength: 12, slowLength: 26, signalLength: 9 },
    bollinger: { length: 20, stdDev: 2.0 },
    williams: { period: 14, overboughtLevel: -20, oversoldLevel: -80 }
  },
  triggers: {
    buySignal: '(sma && ema && macd) && (bollinger || !williams) && !rsi',
    sellSignal: 'profit || (!sma || !ema) || (rsi && williams) || !macd',
    description: 'Зеленая энергетика с государственной поддержкой и стабильными тарифами'
  }
};
