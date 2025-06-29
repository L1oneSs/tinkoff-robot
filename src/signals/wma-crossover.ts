/**
 * Сигнал WMA-crossover.
 * Рассчитываем быстрое и медленное взвешенное скользящее среднее.
 * Пересечение быстрого и медленного WMA для определения сигналов покупки/продажи.
 */

import { Strategy } from "../strategy.js";
import { wma, crossover, crossunder } from "../utils/indicators.js";
import { Signal, SignalParams, SignalResult } from "./base.js";

const defaultConfig = {
  /** Период быстрого WMA */
  fastLength: 10,
  /** Период медленного WMA */
  slowLength: 21,
};

export type WmaCrossoverSignalConfig = typeof defaultConfig;

export class WmaCrossoverSignal extends Signal<WmaCrossoverSignalConfig> {
  constructor(
    protected strategy: Strategy,
    config: WmaCrossoverSignalConfig,
  ) {
    super(strategy, Object.assign({}, defaultConfig, config));
  }

  get minCandlesCount() {
    return this.config.slowLength + 1;
  }

  calc({ candles, profit }: SignalParams): SignalResult {
    const closePrices = this.getPrices(candles, "close");
    const fastWma = wma(closePrices, this.config.fastLength);
    const slowWma = wma(closePrices, this.config.slowLength);

    this.plot("price", closePrices, candles);
    this.plot("fastWma", fastWma, candles);
    this.plot("slowWma", slowWma, candles);

    if (crossover(fastWma, slowWma)) {
      this.logger.warn(
        `WMA: быстрое пересекло медленное снизу вверх, покупаем`,
      );
      return "buy";
    }
    if (crossunder(fastWma, slowWma) && profit > 0) {
      this.logger.warn(`WMA: быстрое пересекло медленное сверху вниз, продаем`);
      return "sell";
    }
  }
}
