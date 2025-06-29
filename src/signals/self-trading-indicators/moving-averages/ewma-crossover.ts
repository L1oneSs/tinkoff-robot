/**
 * Сигнал EWMA-crossover.
 * Рассчитываем быстрое и медленное экспоненциально взвешенное скользящее среднее.
 * Пересечение быстрого и медленного EWMA для определения сигналов покупки/продажи.
 */

import { Strategy } from "../../../strategy.js";
import { ewma, crossover, crossunder } from "../../../utils/indicators.js";
import { Signal, SignalParams, SignalResult } from "../../base.js";

const defaultConfig = {
  /** Период быстрого EWMA */
  fastLength: 9,
  /** Период медленного EWMA */
  slowLength: 21,
};

export type EwmaCrossoverSignalConfig = typeof defaultConfig;

export class EwmaCrossoverSignal extends Signal<EwmaCrossoverSignalConfig> {
  constructor(
    protected strategy: Strategy,
    config: EwmaCrossoverSignalConfig,
  ) {
    super(strategy, Object.assign({}, defaultConfig, config));
  }

  get minCandlesCount() {
    return this.config.slowLength + 1;
  }

  calc({ candles, profit }: SignalParams): SignalResult {
    const closePrices = this.getPrices(candles, "close");
    const fastEwma = ewma(closePrices, this.config.fastLength);
    const slowEwma = ewma(closePrices, this.config.slowLength);

    this.plot("price", closePrices, candles);
    this.plot("fastEwma", fastEwma, candles);
    this.plot("slowEwma", slowEwma, candles);

    if (crossover(fastEwma, slowEwma)) {
      this.logger.warn(
        `EWMA: быстрое пересекло медленное снизу вверх, необходима покупка`,
      );
      return "buy";
    }
    if (crossunder(fastEwma, slowEwma) && profit > 0) {
      this.logger.warn(
        `EWMA: быстрое пересекло медленное сверху вниз, необходима продажа`,
      );
      return "sell";
    }
  }
}
