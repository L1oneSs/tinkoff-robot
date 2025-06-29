/**
 * Сигнал Stochastic Oscillator.
 * Стохастический осциллятор для определения перекупленности/перепроданности.
 * Классический сигнал при пересечении уровней 20 и 80.
 */

import { quotationToNumber } from '../../../helpers/num-helpers.js';
import { Strategy } from '../../../strategy.js';
import { crossover, crossunder, stochastic, toSeries } from '../../../utils/indicators.js';
import { Signal, SignalParams, SignalResult } from '../../base.js';
import { HistoricCandle } from 'tinkoff-invest-api/dist/generated/marketdata.js';

const defaultConfig = {
  /** Период для %K */
  kLength: 14,
  /** Сглаживание для %K */
  kSmoothing: 1,
  /** Верхний уровень (перекупленность) */
  overboughtLevel: 80,
  /** Нижний уровень (перепроданность) */
  oversoldLevel: 20,
};

export type StochasticSignalConfig = typeof defaultConfig;

export class StochasticSignal extends Signal<StochasticSignalConfig> {
  constructor(protected strategy: Strategy, config: StochasticSignalConfig) {
    super(strategy, Object.assign({}, defaultConfig, config));
  }

  get minCandlesCount() {
    return this.config.kLength + 1;
  }

  calc({ candles, profit }: SignalParams): SignalResult {
    const { kLength, kSmoothing, overboughtLevel, oversoldLevel } = this.config;
    
    // Преобразуем HistoricCandle в OHLC с числовыми значениями
    const ohlcCandles = candles.map((candle: HistoricCandle) => ({
      open: quotationToNumber(candle.open),
      high: quotationToNumber(candle.high),
      low: quotationToNumber(candle.low),
      close: quotationToNumber(candle.close),
      volume: candle.volume ? Number(candle.volume) : undefined,
    }));
    
    const stochValues = stochastic(ohlcCandles, kLength, kSmoothing);
    const overboughtLine = toSeries(overboughtLevel, stochValues.length);
    const oversoldLine = toSeries(oversoldLevel, stochValues.length);
    
    this.plot('stochastic', stochValues, candles);
    this.plot('overbought', overboughtLine, candles);
    this.plot('oversold', oversoldLine, candles);
    
    // Пересечение снизу уровня перепроданности - сигнал на покупку
    if (crossover(stochValues, oversoldLine)) {
      this.logger.warn(`Stochastic пересек уровень ${oversoldLevel} снизу вверх, актив перепродан, необходима покупка`);
      return 'buy';
    }
    
    // Пересечение сверху уровня перекупленности - сигнал на продажу
    if (crossunder(stochValues, overboughtLine) && profit > 0) {
      this.logger.warn(`Stochastic пересек уровень ${overboughtLevel} сверху вниз, актив перекуплен, необходима продажа`);
      return 'sell';
    }
  }
}
