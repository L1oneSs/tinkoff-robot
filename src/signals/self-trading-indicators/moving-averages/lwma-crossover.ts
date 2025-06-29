/**
 * Сигнал LWMA-crossover.
 * Рассчитываем быстрое и медленное линейно взвешенное скользящее среднее.
 * Пересечение быстрого и медленного LWMA для определения сигналов покупки/продажи.
 */

import { Strategy } from "../../../strategy.js";
import { lwma, crossover, crossunder } from "../../../utils/indicators.js";
import { Signal, SignalParams, SignalResult } from "../../base.js";

const defaultConfig = {
  /** Период быстрого LWMA */
  fastLength: 8,
  /** Период медленного LWMA */
  slowLength: 21,
};

export type LwmaCrossoverSignalConfig = typeof defaultConfig;

export class LwmaCrossoverSignal extends Signal<LwmaCrossoverSignalConfig> {
  constructor(
    protected strategy: Strategy,
    config: LwmaCrossoverSignalConfig,
  ) {
    super(strategy, Object.assign({}, defaultConfig, config));
  }

  get minCandlesCount() {
    return this.config.slowLength + 1;
  }

  calc({ candles, profit }: SignalParams): SignalResult {
    const closePrices = this.getPrices(candles, "close");
    const fastLwma = lwma(closePrices, this.config.fastLength);
    const slowLwma = lwma(closePrices, this.config.slowLength);

    this.plot("price", closePrices, candles);
    this.plot("fastLwma", fastLwma, candles);
    this.plot("slowLwma", slowLwma, candles);

    if (crossover(fastLwma, slowLwma)) {
      this.logger.warn(
        `LWMA: быстрое пересекло медленное снизу вверх, необходима покупка`,
      );
      return "buy";
    }
    if (crossunder(fastLwma, slowLwma) && profit > 0) {
      this.logger.warn(
        `LWMA: быстрое пересекло медленное сверху вниз, необходима продажа`,
      );
      return "sell";
    }
  }
}
