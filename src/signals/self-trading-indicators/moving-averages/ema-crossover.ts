/**
 * Сигнал ema-crossover.
 * Пересечение быстрой и медленной экспоненциальных скользящих средних.
 */

import { Strategy } from "../../../strategy.js";
import { crossover, crossunder, ema } from "../../../utils/indicators.js";
import { Signal, SignalParams, SignalResult } from "../../base.js";

const defaultConfig = {
  fastLength: 12,
  slowLength: 26,
};

export type EmaCrossoverSignalConfig = typeof defaultConfig;

export class EmaCrossoverSignal extends Signal<EmaCrossoverSignalConfig> {
  constructor(
    protected strategy: Strategy,
    config: EmaCrossoverSignalConfig,
  ) {
    super(strategy, Object.assign({}, defaultConfig, config));
  }

  get minCandlesCount() {
    return this.config.slowLength + 1;
  }

  calc({ candles, profit }: SignalParams): SignalResult {
    const closePrices = this.getPrices(candles, "close");
    const fastEma = ema(closePrices, this.config.fastLength);
    const slowEma = ema(closePrices, this.config.slowLength);

    this.plot("price", closePrices, candles);
    this.plot("fastEma", fastEma, candles);
    this.plot("slowEma", slowEma, candles);

    if (crossover(fastEma, slowEma)) {
      this.logger.warn(
        `EMA: быстрая пересекла медленную снизу вверх, необходима покупка`,
      );
      return "buy";
    }
    if (crossunder(fastEma, slowEma) && profit > 0) {
      this.logger.warn(`EMA: быстрая пересекла медленную сверху вниз, необходима продажа`);
      return "sell";
    }
  }
}
