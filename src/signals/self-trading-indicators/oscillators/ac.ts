/**
 * Сигнал Accelerator Oscillator (AC).
 * Осциллятор ускорения для раннего определения смены тренда.
 * Показывает ускорение или замедление текущего импульса.
 */

import { quotationToNumber } from '../../../helpers/num-helpers.js';
import { Strategy } from '../../../strategy.js';
import { ac, crossover, crossunder, toSeries } from '../../../utils/indicators.js';
import { Signal, SignalParams, SignalResult } from '../../base.js';

const defaultConfig = {
  /** Порог для определения сигналов (обычно 0) */
  threshold: 0,
  /** Использовать ли сигналы смены цвета столбцов */
  useColorChange: true,
  /** Минимальное количество столбцов одного цвета для подтверждения */
  confirmBars: 2,
};

export type AcSignalConfig = typeof defaultConfig;

export class AcSignal extends Signal<AcSignalConfig> {
  constructor(
    protected strategy: Strategy,
    config: AcSignalConfig,
  ) {
    super(strategy, Object.assign({}, defaultConfig, config));
  }

  get minCandlesCount() {
    return 34; // AC использует AO, который использует SMA(5) и SMA(34)
  }

  // eslint-disable-next-line max-statements
  calc({ candles, profit }: SignalParams): SignalResult {
    // Преобразуем HistoricCandle в OHLC с числовыми значениями
    const ohlcCandles = candles.map((candle) => ({
      open: quotationToNumber(candle.open),
      high: quotationToNumber(candle.high),
      low: quotationToNumber(candle.low),
      close: quotationToNumber(candle.close),
      volume: candle.volume ? Number(candle.volume) : undefined,
    }));

    const acValues = ac(ohlcCandles);
    const zeroLine = toSeries(this.config.threshold, acValues.length);

    this.plot("ac", acValues, candles);
    this.plot("zeroLine", zeroLine, candles);

    // Пересечение нулевой линии
    if (crossover(acValues, zeroLine)) {
      this.logger.warn(
        `AC пересек нулевую линию снизу вверх, ускорение вверх, покупаем`,
      );
      return "buy";
    }
    if (crossunder(acValues, zeroLine) && profit > 0) {
      this.logger.warn(
        `AC пересек нулевую линию сверху вниз, ускорение вниз, продаем`,
      );
      return "sell";
    }

    // Сигналы смены цвета (дополнительная логика)
    if (
      this.config.useColorChange &&
      acValues.length >= this.config.confirmBars + 1
    ) {
      const current = acValues[acValues.length - 1];
      const prev = acValues[acValues.length - 2];

      // Проверяем последовательность столбцов одного цвета
      let greenBars = 0;
      let redBars = 0;

      for (
        let i = acValues.length - this.config.confirmBars;
        i < acValues.length;
        i++
      ) {
        if (i > 0) {
          if (acValues[i] > acValues[i - 1]) {
            greenBars++;
          } else if (acValues[i] < acValues[i - 1]) {
            redBars++;
          }
        }
      }

      // Смена с красного на зеленый (начало ускорения вверх)
      if (current > prev && redBars >= this.config.confirmBars - 1) {
        this.logger.warn(
          `AC: смена на зеленый после ${redBars} красных столбцов, ускорение вверх, покупаем`,
        );
        return "buy";
      }

      // Смена с зеленого на красный (начало ускорения вниз)
      if (
        current < prev &&
        greenBars >= this.config.confirmBars - 1 &&
        profit > 0
      ) {
        this.logger.warn(
          `AC: смена на красный после ${greenBars} зеленых столбцов, ускорение вниз, продаем`,
        );
        return "sell";
      }
    }
  }
}
