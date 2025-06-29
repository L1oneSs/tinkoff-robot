/**
 * Сигнал ROC (Rate of Change).
 * Индикатор скорости изменения цены.
 * Сигналы при пересечении нулевой линии и экстремальных значений.
 */

import { Strategy } from '../../../strategy.js';
import { crossover, crossunder, roc, toSeries } from '../../../utils/indicators.js';
import { Signal, SignalParams, SignalResult } from '../../base.js';

const defaultConfig = {
  /** Период для расчета ROC */
  period: 12,
  /** Верхний уровень для фильтрации */
  upperThreshold: 5,
  /** Нижний уровень для фильтрации */
  lowerThreshold: -5,
};

export type RocSignalConfig = typeof defaultConfig;

export class RocSignal extends Signal<RocSignalConfig> {
  constructor(protected strategy: Strategy, config: RocSignalConfig) {
    super(strategy, Object.assign({}, defaultConfig, config));
  }

  get minCandlesCount() {
    return this.config.period + 1;
  }

  calc({ candles, profit }: SignalParams): SignalResult {
    const { period, upperThreshold, lowerThreshold } = this.config;
    
    const closePrices = this.getPrices(candles, 'close');
    const rocValues = roc(closePrices, period);
    const zeroLine = toSeries(0, rocValues.length);
    const upperLine = toSeries(upperThreshold, rocValues.length);
    const lowerLine = toSeries(lowerThreshold, rocValues.length);
    
    this.plot('roc', rocValues, candles);
    this.plot('zeroLine', zeroLine, candles);
    this.plot('upperThreshold', upperLine, candles);
    this.plot('lowerThreshold', lowerLine, candles);
    
    // Пересечение нулевой линии снизу вверх - сигнал на покупку
    if (crossover(rocValues, zeroLine)) {
      this.logger.warn('ROC пересек нулевую линию снизу вверх, начало роста, необходима покупка');
      return 'buy';
    }
    
    // Пересечение нулевой линии сверху вниз - сигнал на продажу
    if (crossunder(rocValues, zeroLine) && profit > 0) {
      this.logger.warn('ROC пересек нулевую линию сверху вниз, начало падения, необходима продажа');
      return 'sell';
    }
    
    // Дополнительные сигналы при экстремальных значениях
    const currentRoc = rocValues[rocValues.length - 1];
    
    if (currentRoc < lowerThreshold) {
      this.logger.warn(
        `ROC достиг экстремально низкого уровня ${currentRoc.toFixed(2)}%, ` +
          `возможен отскок, необходима покупка`,
      );
      return 'buy';
    }
    
    if (currentRoc > upperThreshold && profit > 0) {
      this.logger.warn(
        `ROC достиг экстремально высокого уровня ${currentRoc.toFixed(2)}%, ` +
          `возможна коррекция, необходима продажа`,
      );
      return 'sell';
    }
  }
}
