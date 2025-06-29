/**
 * Сигнал Bollinger Bands.
 * Покупка при касании нижней полосы, продажа при касании верхней.
 */

import { Strategy } from "../strategy.js";
import { bollingerBands } from "../utils/indicators.js";
import { Signal, SignalParams, SignalResult } from "./base.js";

const defaultConfig = {
  length: 20,
  stdDev: 2,
};

export type BollingerBandsSignalConfig = typeof defaultConfig;

export class BollingerBandsSignal extends Signal<BollingerBandsSignalConfig> {
  constructor(
    protected strategy: Strategy,
    config: BollingerBandsSignalConfig,
  ) {
    super(strategy, Object.assign({}, defaultConfig, config));
  }

  get minCandlesCount() {
    return this.config.length + 1;
  }

  calc({ candles, profit }: SignalParams): SignalResult {
    const closePrices = this.getPrices(candles, "close");
    const bbValues = bollingerBands(
      closePrices,
      this.config.length,
      this.config.stdDev,
    );

    const upperBand = bbValues.map((v) => v.upper);
    const lowerBand = bbValues.map((v) => v.lower);
    const currentPrice = closePrices[closePrices.length - 1];
    const currentUpper = upperBand[upperBand.length - 1];
    const currentLower = lowerBand[lowerBand.length - 1];

    this.plot("price", closePrices, candles);
    this.plot("upperBand", upperBand, candles);
    this.plot("lowerBand", lowerBand, candles);

    if (currentPrice <= currentLower) {
      this.logger.warn(`Цена касается нижней полосы Боллинджера, покупаем`);
      return "buy";
    }
    if (currentPrice >= currentUpper && profit > 0) {
      this.logger.warn(`Цена касается верхней полосы Боллинджера, продаем`);
      return "sell";
    }
  }
}
