/**
 * Сигнал Williams %R.
 * Осциллятор Williams %R для определения перекупленности/перепроданности.
 * Значения от -100 до 0, где -20 и выше = перекупленность, -80 и ниже = перепроданность.
 */

import { Strategy } from '../../../strategy.js';
import { crossover, crossunder, toSeries, wws } from '../../../utils/indicators.js';
import { Signal, SignalParams, SignalResult } from '../../base.js';

const defaultConfig = {
  /** Период для расчета Williams %R */
  period: 14,
  /** Уровень перекупленности */
  overboughtLevel: -20,
  /** Уровень перепроданности */
  oversoldLevel: -80,
};

export type WilliamsRSignalConfig = typeof defaultConfig;

export class WilliamsRSignal extends Signal<WilliamsRSignalConfig> {
  constructor(protected strategy: Strategy, config: WilliamsRSignalConfig) {
    super(strategy, Object.assign({}, defaultConfig, config));
  }

  get minCandlesCount() {
    return this.config.period + 1;
  }

  calc({ candles, profit }: SignalParams): SignalResult {
    const { period, overboughtLevel, oversoldLevel } = this.config;
    
    const closePrices = this.getPrices(candles, 'close');
    const williamsValues = wws(closePrices, period);
    const overboughtLine = toSeries(overboughtLevel, williamsValues.length);
    const oversoldLine = toSeries(oversoldLevel, williamsValues.length);
    
    this.plot('williams', williamsValues, candles);
    this.plot('overbought', overboughtLine, candles);
    this.plot('oversold', oversoldLine, candles);
    
    // Выход из зоны перепроданности - сигнал на покупку
    if (crossover(williamsValues, oversoldLine)) {
      this.logger.warn(`Williams %R вышел из зоны перепроданности (выше ${oversoldLevel}), покупаем`);
      return 'buy';
    }
    
    // Вход в зону перекупленности - сигнал на продажу
    if (crossunder(williamsValues, overboughtLine) && profit > 0) {
      this.logger.warn(`Williams %R вошел в зону перекупленности (ниже ${overboughtLevel}), продаем`);
      return 'sell';
    }
    
    // Дополнительные сигналы при экстремальных значениях
    const currentWilliams = williamsValues[williamsValues.length - 1];
    
    // Экстремальная перепроданность
    if (currentWilliams <= -95) {
      this.logger.warn(
        `Williams %R показывает экстремальную перепроданность (${currentWilliams.toFixed(1)}), ` +
        `возможен отскок, покупаем`
      );
      return 'buy';
    }
    
    // Экстремальная перекупленность
    if (currentWilliams >= -5 && profit > 0) {
      this.logger.warn(
        `Williams %R показывает экстремальную перекупленность (${currentWilliams.toFixed(1)}), ` +
        `возможна коррекция, продаем`
      );
      return 'sell';
    }
  }
}
