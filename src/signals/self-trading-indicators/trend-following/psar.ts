/**
 * Сигнал Parabolic SAR.
 * Индикатор остановки и разворота для определения точек входа и выхода.
 * Сигналы генерируются при пересечении цены с линией SAR.
 */

import { quotationToNumber } from '../../../helpers/num-helpers.js';
import { Strategy } from '../../../strategy.js';
import { psar } from '../../../utils/indicators.js';
import { Signal, SignalParams, SignalResult } from '../../base.js';
import { HistoricCandle } from 'tinkoff-invest-api/dist/generated/marketdata.js';

const defaultConfig = {
  /** Начальный шаг ускорения */
  step: 0.02,
  /** Максимальный шаг ускорения */
  maxStep: 0.2,
};

export type PSARSignalConfig = typeof defaultConfig;

export class PSARSignal extends Signal<PSARSignalConfig> {
  constructor(protected strategy: Strategy, config: PSARSignalConfig) {
    super(strategy, Object.assign({}, defaultConfig, config));
  }

  get minCandlesCount() {
    return 10; // PSAR требует минимум данных для инициализации
  }

  calc({ candles, profit }: SignalParams): SignalResult {
    const { step, maxStep } = this.config;
    
    // Преобразуем HistoricCandle в OHLC с числовыми значениями
    const ohlcCandles = candles.map((candle: HistoricCandle) => ({
      open: quotationToNumber(candle.open),
      high: quotationToNumber(candle.high),
      low: quotationToNumber(candle.low),
      close: quotationToNumber(candle.close),
      volume: candle.volume ? Number(candle.volume) : undefined,
    }));
    
    const psarValues = psar(ohlcCandles, step, maxStep);
    
    if (psarValues.length < 2) return;
    
    const currentPsar = psarValues[psarValues.length - 1];
    const previousPsar = psarValues[psarValues.length - 2];
    const currentPrice = ohlcCandles[ohlcCandles.length - 1].close;
    const prevPrice = ohlcCandles[ohlcCandles.length - 2].close;
    
    // Построение графиков
    this.plot('psar', psarValues, candles);
    
    // Определяем направление тренда по положению цены относительно PSAR
    const currentTrendUp = currentPrice > currentPsar;
    const previousTrendUp = prevPrice > previousPsar;
    
    // Смена направления с нисходящего на восходящий
    if (!previousTrendUp && currentTrendUp) {
      this.logger.warn(`PSAR сменил направление на восходящий тренд при цене ${currentPrice.toFixed(2)}, необходима покупка`);
      return 'buy';
    }
    
    // Смена направления с восходящего на нисходящий
    if (previousTrendUp && !currentTrendUp && profit > 0) {
      this.logger.warn(`PSAR сменил направление на нисходящий тренд при цене ${currentPrice.toFixed(2)}, необходима продажа`);
      return 'sell';
    }
    
    // Пересечение цены с линией PSAR
    // Цена пробивает PSAR снизу вверх
    if (prevPrice <= previousPsar && currentPrice > currentPsar) {
      this.logger.warn(
        `Цена пробила PSAR снизу вверх (${currentPrice.toFixed(2)} > ${currentPsar.toFixed(2)}), ` +
        `начало восходящего тренда, необходима покупка`
      );
      return 'buy';
    }
    
    // Цена пробивает PSAR сверху вниз
    if (prevPrice >= previousPsar && currentPrice < currentPsar && profit > 0) {
      this.logger.warn(
        `Цена пробила PSAR сверху вниз (${currentPrice.toFixed(2)} < ${currentPsar.toFixed(2)}), ` +
        `начало нисходящего тренда, необходима продажа`
      );
      return 'sell';
    }
  }
}
