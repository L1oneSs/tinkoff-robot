/**
 * Сигнал CCI (Commodity Channel Index).
 * Индекс товарного канала для определения циклических поворотов.
 * Сигналы при пересечении уровней +100 и -100.
 */

import { quotationToNumber } from '../../../helpers/num-helpers.js';
import { Strategy } from '../../../strategy.js';
import { cci, crossover, crossunder, toSeries } from '../../../utils/indicators.js';
import { Signal, SignalParams, SignalResult } from '../../base.js';
import { HistoricCandle } from 'tinkoff-invest-api/dist/generated/marketdata.js';

const defaultConfig = {
  /** Период для расчета CCI */
  period: 20,
  /** Верхний уровень */
  upperLevel: 100,
  /** Нижний уровень */
  lowerLevel: -100,
};

export type CciSignalConfig = typeof defaultConfig;

export class CciSignal extends Signal<CciSignalConfig> {
  constructor(protected strategy: Strategy, config: CciSignalConfig) {
    super(strategy, Object.assign({}, defaultConfig, config));
  }

  get minCandlesCount() {
    return this.config.period + 1;
  }

  calc({ candles, profit }: SignalParams): SignalResult {
    const { period, upperLevel, lowerLevel } = this.config;
    
    // Преобразуем HistoricCandle в OHLC с числовыми значениями
    const ohlcCandles = candles.map((candle: HistoricCandle) => ({
      open: quotationToNumber(candle.open),
      high: quotationToNumber(candle.high),
      low: quotationToNumber(candle.low),
      close: quotationToNumber(candle.close),
      volume: candle.volume ? Number(candle.volume) : undefined,
    }));
    
    const cciValues = cci(ohlcCandles, period);
    const upperLine = toSeries(upperLevel, cciValues.length);
    const lowerLine = toSeries(lowerLevel, cciValues.length);
    
    this.plot('cci', cciValues, candles);
    this.plot('upperLevel', upperLine, candles);
    this.plot('lowerLevel', lowerLine, candles);
    
    // Пересечение снизу нижнего уровня - сигнал на покупку
    if (crossover(cciValues, lowerLine)) {
      this.logger.warn(`CCI пересек уровень ${lowerLevel} снизу вверх, разворот вверх, покупаем`);
      return 'buy';
    }
    
    // Пересечение сверху верхнего уровня - сигнал на продажу
    if (crossunder(cciValues, upperLine) && profit > 0) {
      this.logger.warn(`CCI пересек уровень ${upperLevel} сверху вниз, разворот вниз, продаем`);
      return 'sell';
    }
  }
}
