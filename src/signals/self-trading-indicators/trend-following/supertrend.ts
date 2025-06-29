/**
 * Сигнал SuperTrend.
 * Индикатор тренда, который показывает направление и точки входа/выхода.
 * Сигналы генерируются при пересечении цены с линией SuperTrend.
 */

import { quotationToNumber } from '../../../helpers/num-helpers.js';
import { Strategy } from '../../../strategy.js';
import { superTrend } from '../../../utils/indicators.js';
import { Signal, SignalParams, SignalResult } from '../../base.js';
import { HistoricCandle } from 'tinkoff-invest-api/dist/generated/marketdata.js';

const defaultConfig = {
  /** Период для ATR */
  period: 10,
  /** Множитель для ATR */
  multiplier: 3,
};

export type SuperTrendSignalConfig = typeof defaultConfig;

export class SuperTrendSignal extends Signal<SuperTrendSignalConfig> {
  constructor(protected strategy: Strategy, config: SuperTrendSignalConfig) {
    super(strategy, Object.assign({}, defaultConfig, config));
  }

  get minCandlesCount() {
    return this.config.period + 1;
  }

  // eslint-disable-next-line max-statements, complexity
  calc({ candles, profit }: SignalParams): SignalResult {
    const { period, multiplier } = this.config;
    
    // Преобразуем HistoricCandle в OHLC с числовыми значениями
    const ohlcCandles = candles.map((candle: HistoricCandle) => ({
      open: quotationToNumber(candle.open),
      high: quotationToNumber(candle.high),
      low: quotationToNumber(candle.low),
      close: quotationToNumber(candle.close),
      volume: candle.volume ? Number(candle.volume) : undefined,
    }));
    
    const superTrendData = superTrend(ohlcCandles, period, multiplier);
    
    // Фильтруем undefined значения
    const validSuperTrendData = superTrendData.filter((d) => d !== undefined);
    
    if (validSuperTrendData.length < 2) return;
    
    const current = validSuperTrendData[validSuperTrendData.length - 1];
    const previous = validSuperTrendData[validSuperTrendData.length - 2];
    
    // Проверяем, что у нас есть валидные данные
    if (!current || !previous || current.superTrend === undefined || previous.superTrend === undefined) {
      return;
    }
    
    const currentPrice = ohlcCandles[ohlcCandles.length - 1].close;
    
    // Построение графиков
    const superTrendValues = validSuperTrendData.map((d: any) => d.superTrend);
    const directionValues = validSuperTrendData.map((d: any) => d.direction ? 1 : -1);
    
    this.plot('supertrend', superTrendValues, candles);
    this.plot('direction', directionValues, candles);
    
    // Смена направления тренда с нисходящего на восходящий
    if (!previous.direction && current.direction) {
      this.logger.warn(
        `SuperTrend сменил направление на восходящий тренд при цене ${currentPrice.toFixed(2)}, необходима покупка`
      );
      return 'buy';
    }
    
    // Смена направления тренда с восходящего на нисходящий
    if (previous.direction && !current.direction && profit > 0) {
      this.logger.warn(
        `SuperTrend сменил направление на нисходящий тренд при цене ${currentPrice.toFixed(2)}, необходима продажа`
      );
      return 'sell';
    }
    
    // Дополнительная проверка: цена пересекает линию SuperTrend
    const prevPrice = ohlcCandles[ohlcCandles.length - 2].close;
    
    // Цена пробивает SuperTrend снизу вверх
    if (prevPrice <= previous.superTrend && currentPrice > current.superTrend && current.direction) {
      this.logger.warn(
        `Цена пробила SuperTrend снизу вверх (${currentPrice.toFixed(2)} > ${current.superTrend.toFixed(2)}), ` +
          `необходима покупка`,
      );
      return 'buy';
    }
    
    // Цена пробивает SuperTrend сверху вниз
    if (prevPrice >= previous.superTrend && currentPrice < current.superTrend && !current.direction && profit > 0) {
      this.logger.warn(
        `Цена пробила SuperTrend сверху вниз (${currentPrice.toFixed(2)} < ${current.superTrend.toFixed(2)}), ` +
          `необходима продажа`,
      );
      return 'sell';
    }
  }
}
