/**
 * Сигнал ADX (Average Directional Index).
 * Индикатор силы тренда и его направления.
 * Сигналы основаны на силе тренда и изменении направления.
 */

import { quotationToNumber } from '../../../helpers/num-helpers.js';
import { Strategy } from '../../../strategy.js';
import { adx, toSeries } from '../../../utils/indicators.js';
import { Signal, SignalParams, SignalResult } from '../../base.js';
import { HistoricCandle } from 'tinkoff-invest-api/dist/generated/marketdata.js';

const defaultConfig = {
  /** Период для расчета ADX */
  period: 14,
  /** Минимальный уровень ADX для сильного тренда */
  trendStrengthLevel: 25,
  /** Уровень ADX для очень сильного тренда */
  strongTrendLevel: 40,
};

export type AdxSignalConfig = typeof defaultConfig;

export class AdxSignal extends Signal<AdxSignalConfig> {
  constructor(protected strategy: Strategy, config: AdxSignalConfig) {
    super(strategy, Object.assign({}, defaultConfig, config));
  }

  get minCandlesCount() {
    return this.config.period * 2; // ADX требует больше данных
  }

  // eslint-disable-next-line max-statements
  calc({ candles, profit }: SignalParams): SignalResult {
    const { period, trendStrengthLevel, strongTrendLevel } = this.config;
    
    // Преобразуем HistoricCandle в OHLC с числовыми значениями
    const ohlcCandles = candles.map((candle: HistoricCandle) => ({
      open: quotationToNumber(candle.open),
      high: quotationToNumber(candle.high),
      low: quotationToNumber(candle.low),
      close: quotationToNumber(candle.close),
      volume: candle.volume ? Number(candle.volume) : undefined,
    }));
    
    const adxData = adx(ohlcCandles, period);
    
    // Фильтруем undefined значения
    const validAdxData = adxData.filter((d) => d !== undefined);
    
    if (validAdxData.length < 3) return;
    
    const adxValues = validAdxData.map((d: any) => d.adx);
    const pdiValues = validAdxData.map((d: any) => d.pdi);
    const mdiValues = validAdxData.map((d: any) => d.mdi);
    
    // Проверяем валидность данных
    if (adxValues.some(v => v === undefined) || 
        pdiValues.some(v => v === undefined) || 
        mdiValues.some(v => v === undefined)) {
      return;
    }
    
    const trendLine = toSeries(trendStrengthLevel, adxValues.length);
    const strongTrendLine = toSeries(strongTrendLevel, adxValues.length);
    
    this.plot('adx', adxValues, candles);
    this.plot('pdi', pdiValues, candles);
    this.plot('mdi', mdiValues, candles);
    this.plot('trendLevel', trendLine, candles);
    this.plot('strongTrendLevel', strongTrendLine, candles);
    
    const currentAdx = adxValues[adxValues.length - 1];
    const prevAdx = adxValues[adxValues.length - 2];
    const currentPdi = pdiValues[pdiValues.length - 1];
    const currentMdi = mdiValues[mdiValues.length - 1];
    
    const isUptrend = currentPdi > currentMdi;
    const isTrendStrengthening = currentAdx > prevAdx;
    
    // Сильный тренд вверх начинается
    if (currentAdx > trendStrengthLevel && isTrendStrengthening && isUptrend) {
      this.logger.warn(`ADX ${currentAdx.toFixed(2)} показывает усиление восходящего тренда, покупаем`);
      return 'buy';
    }
    
    // Сильный тренд вниз или ослабление тренда
    if (currentAdx > trendStrengthLevel && isTrendStrengthening && !isUptrend && profit > 0) {
      this.logger.warn(`ADX ${currentAdx.toFixed(2)} показывает усиление нисходящего тренда, продаем`);
      return 'sell';
    }
    
    // Очень сильный тренд - возможна коррекция
    if (currentAdx > strongTrendLevel && !isTrendStrengthening && profit > 0) {
      this.logger.warn(`ADX ${currentAdx.toFixed(2)} достиг максимума и начал снижаться, возможна коррекция, продаем`);
      return 'sell';
    }
  }
}
