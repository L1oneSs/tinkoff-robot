/**
 * Сигнал Awesome Oscillator (AO).
 * Осциллятор для определения смены импульса на основе разности скользящих средних.
 * Использует пересечение нулевой линии и смену цвета столбцов.
 */

import { quotationToNumber } from "../../../helpers/num-helpers.js";
import { Strategy } from "../../../strategy.js";
import { ao, crossover, crossunder, toSeries } from "../../../utils/indicators.js";
import { Signal, SignalParams, SignalResult } from "../../base.js";

const defaultConfig = {
  /** Порог для определения сигналов (обычно 0) */
  threshold: 0,
  /** Использовать ли сигналы смены цвета столбцов */
  useColorChange: true,
};

export type AoSignalConfig = typeof defaultConfig;

export class AoSignal extends Signal<AoSignalConfig> {
  constructor(
    protected strategy: Strategy,
    config: AoSignalConfig,
  ) {
    super(strategy, Object.assign({}, defaultConfig, config));
  }

  get minCandlesCount() {
    return 34; // AO использует SMA(5) и SMA(34)
  }

  calc({ candles, profit }: SignalParams): SignalResult {
    // Преобразуем HistoricCandle в OHLC с числовыми значениями
    const ohlcCandles = candles.map((candle) => ({
      open: quotationToNumber(candle.open),
      high: quotationToNumber(candle.high),
      low: quotationToNumber(candle.low),
      close: quotationToNumber(candle.close),
      volume: candle.volume ? Number(candle.volume) : undefined,
    }));

    const aoValues = ao(ohlcCandles);
    const zeroLine = toSeries(this.config.threshold, aoValues.length);

    this.plot("ao", aoValues, candles);
    this.plot("zeroLine", zeroLine, candles);

    // Пересечение нулевой линии
    if (crossover(aoValues, zeroLine)) {
      this.logger.warn(`AO пересек нулевую линию снизу вверх, покупаем`);
      return "buy";
    }
    if (crossunder(aoValues, zeroLine) && profit > 0) {
      this.logger.warn(`AO пересек нулевую линию сверху вниз, продаем`);
      return "sell";
    }

    // Сигналы смены цвета (дополнительная логика)
    if (this.config.useColorChange && aoValues.length >= 3) {
      const current = aoValues[aoValues.length - 1];
      const prev = aoValues[aoValues.length - 2];
      const prevPrev = aoValues[aoValues.length - 3];

      // Смена с красного на зеленый (восходящий импульс)
      if (current > prev && prev <= prevPrev && current > 0) {
        this.logger.warn(`AO: смена цвета на зеленый выше нуля, покупаем`);
        return "buy";
      }

      // Смена с зеленого на красный (нисходящий импульс)
      if (current < prev && prev >= prevPrev && current < 0 && profit > 0) {
        this.logger.warn(`AO: смена цвета на красный ниже нуля, продаем`);
        return "sell";
      }
    }
  }

}
