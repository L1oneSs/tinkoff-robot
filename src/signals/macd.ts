/**
 * Сигнал MACD.
 * Использует схождение и расхождение скользящих средних для генерации сигналов.
 */

import { Strategy } from "../strategy.js";
import { crossover, crossunder, macd } from "../utils/indicators.js";
import { Signal, SignalParams, SignalResult } from "./base.js";

const defaultConfig = {
  fastLength: 12,
  slowLength: 26,
  signalLength: 9,
};

export type MacdSignalConfig = typeof defaultConfig;

export class MacdSignal extends Signal<MacdSignalConfig> {
  constructor(
    protected strategy: Strategy,
    config: MacdSignalConfig,
  ) {
    super(strategy, Object.assign({}, defaultConfig, config));
  }

  get minCandlesCount() {
    return this.config.slowLength + this.config.signalLength;
  }

  calc({ candles, profit }: SignalParams): SignalResult {
    const closePrices = this.getPrices(candles, "close");
    const macdValues = macd(
      closePrices,
      this.config.fastLength,
      this.config.slowLength,
      this.config.signalLength,
    );

    const macdLine = macdValues.map((v) => v.macd);
    const signalLine = macdValues.map((v) => v.signal);

    this.plot("macd", macdLine, candles);
    this.plot("signal", signalLine, candles);

    if (crossover(macdLine, signalLine)) {
      this.logger.warn(`MACD пересек сигнальную линию снизу вверх, покупаем`);
      return "buy";
    }
    if (crossunder(macdLine, signalLine) && profit > 0) {
      this.logger.warn(`MACD пересек сигнальную линию сверху вниз, продаем`);
      return "sell";
    }
  }
}
