/**
 * Сигнал Move индикатор.
 * Индикатор движения для определения направления и силы тренда.
 * Показывает изменение цены относительно скользящего среднего.
 */

import { Strategy } from "../strategy.js";
import { move, crossover, crossunder, toSeries } from "../utils/indicators.js";
import { Signal, SignalParams, SignalResult } from "./base.js";

const defaultConfig = {
  /** Период для расчета Move */
  length: 14,
  /** Порог для определения сигналов */
  threshold: 0,
  /** Уровень для фильтрации слабых сигналов */
  filterLevel: 0.5,
};

export type MoveSignalConfig = typeof defaultConfig;

export class MoveSignal extends Signal<MoveSignalConfig> {
  constructor(
    protected strategy: Strategy,
    config: MoveSignalConfig,
  ) {
    super(strategy, Object.assign({}, defaultConfig, config));
  }

  get minCandlesCount() {
    return this.config.length + 1;
  }

  // eslint-disable-next-line max-statements, complexity
  calc({ candles, profit }: SignalParams): SignalResult {
    const closePrices = this.getPrices(candles, "close");
    const moveValues = move(closePrices, this.config.length);
    const zeroLine = toSeries(this.config.threshold, moveValues.length);
    const upperFilter = toSeries(this.config.filterLevel, moveValues.length);
    const lowerFilter = toSeries(-this.config.filterLevel, moveValues.length);

    this.plot("move", moveValues, candles);
    this.plot("zeroLine", zeroLine, candles);
    this.plot("upperFilter", upperFilter, candles);
    this.plot("lowerFilter", lowerFilter, candles);

    const currentMove = moveValues[moveValues.length - 1];

    // Пересечение нулевой линии с фильтрацией
    if (
      crossover(moveValues, zeroLine) &&
      currentMove > this.config.filterLevel
    ) {
      this.logger.warn(
        `Move пересек нулевую линию снизу вверх (${currentMove.toFixed(4)}), сильное движение вверх, покупаем`,
      );
      return "buy";
    }
    if (
      crossunder(moveValues, zeroLine) &&
      currentMove < -this.config.filterLevel &&
      profit > 0
    ) {
      this.logger.warn(
        `Move пересек нулевую линию сверху вниз (${currentMove.toFixed(4)}), сильное движение вниз, продаем`,
      );
      return "sell";
    }

    // Пересечение уровней фильтрации
    if (crossover(moveValues, upperFilter)) {
      this.logger.warn(
        `Move пересек верхний уровень фильтрации (${currentMove.toFixed(4)}), сильный восходящий импульс, покупаем`,
      );
      return "buy";
    }
    if (crossunder(moveValues, lowerFilter) && profit > 0) {
      this.logger.warn(
        `Move пересек нижний уровень фильтрации (${currentMove.toFixed(4)}), сильный нисходящий импульс, продаем`,
      );
      return "sell";
    }

    // Дополнительная логика: резкое изменение направления
    if (moveValues.length >= 3) {
      const prev = moveValues[moveValues.length - 2];
      const prevPrev = moveValues[moveValues.length - 3];

      // Разворот от отрицательных к положительным значениям
      if (
        prevPrev < -this.config.filterLevel &&
        prev < 0 &&
        currentMove > this.config.filterLevel
      ) {
        this.logger.warn(
          `Move: резкий разворот от ${prevPrev.toFixed(4)} к ${currentMove.toFixed(4)}, покупаем`,
        );
        return "buy";
      }

      // Разворот от положительных к отрицательным значениям
      if (
        prevPrev > this.config.filterLevel &&
        prev > 0 &&
        currentMove < -this.config.filterLevel &&
        profit > 0
      ) {
        this.logger.warn(
          `Move: резкий разворот от ${prevPrev.toFixed(4)} к ${currentMove.toFixed(4)}, продаем`,
        );
        return "sell";
      }
    }
  }
}
