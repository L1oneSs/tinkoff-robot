/**
 * Сигнал WEMA-crossover.
 * Рассчитываем быстрое и медленное взвешенное экспоненциальное скользящее среднее.
 * Пересечение быстрого и медленного WEMA для определения сигналов покупки/продажи.
 */

import { Strategy } from "../strategy.js";
import { wema, crossover, crossunder } from "../utils/indicators.js";
import { Signal, SignalParams, SignalResult } from "./base.js";

const defaultConfig = {
  /** Период быстрого WEMA */
  fastLength: 12,
  /** Период медленного WEMA */
  slowLength: 26,
};

export type WemaCrossoverSignalConfig = typeof defaultConfig;

export class WemaCrossoverSignal extends Signal<WemaCrossoverSignalConfig> {
  constructor(
    protected strategy: Strategy,
    config: WemaCrossoverSignalConfig,
  ) {
    super(strategy, Object.assign({}, defaultConfig, config));
  }

  get minCandlesCount() {
    return this.config.slowLength + 1;
  }

  calc({ candles, profit }: SignalParams): SignalResult {
    const closePrices = this.getPrices(candles, "close");
    const fastWema = wema(closePrices, this.config.fastLength);
    const slowWema = wema(closePrices, this.config.slowLength);

    this.plot("price", closePrices, candles);
    this.plot("fastWema", fastWema, candles);
    this.plot("slowWema", slowWema, candles);

    if (crossover(fastWema, slowWema)) {
      this.logger.warn(
        `WEMA: быстрое пересекло медленное снизу вверх, покупаем`,
      );
      return "buy";
    }
    if (crossunder(fastWema, slowWema) && profit > 0) {
      this.logger.warn(
        `WEMA: быстрое пересекло медленное сверху вниз, продаем`,
      );
      return "sell";
    }
  }
}
