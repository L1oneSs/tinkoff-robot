/**
 * Вспомогательные функции для анализа свечных паттернов.
 */
import { HistoricCandle } from 'tinkoff-invest-api/dist/generated/marketdata.js';
import { Helpers } from 'tinkoff-invest-api';

export interface CandleData {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Конвертация HistoricCandle в CandleData
 */
export function toCandleData(candle: HistoricCandle): CandleData {
  return {
    open: Helpers.toNumber(candle.open!),
    high: Helpers.toNumber(candle.high!),
    low: Helpers.toNumber(candle.low!),
    close: Helpers.toNumber(candle.close!),
    volume: candle.volume || 0,
  };
}

/**
 * Размер тела свечи
 */
export function bodySize(candle: CandleData): number {
  return Math.abs(candle.close - candle.open);
}

/**
 * Размер верхней тени
 */
export function upperShadow(candle: CandleData): number {
  return candle.high - Math.max(candle.open, candle.close);
}

/**
 * Размер нижней тени
 */
export function lowerShadow(candle: CandleData): number {
  return Math.min(candle.open, candle.close) - candle.low;
}

/**
 * Полный размер свечи (high - low)
 */
export function candleRange(candle: CandleData): number {
  return candle.high - candle.low;
}

/**
 * Является ли свеча растущей (bullish)
 */
export function isBullish(candle: CandleData): boolean {
  return candle.close > candle.open;
}

/**
 * Является ли свеча падающей (bearish)
 */
export function isBearish(candle: CandleData): boolean {
  return candle.close < candle.open;
}

/**
 * Является ли свеча дожи (открытие ≈ закрытие)
 */
export function isDoji(candle: CandleData, threshold = 0.1): boolean {
  const range = candleRange(candle);
  if (range === 0) return true;
  return (bodySize(candle) / range) <= threshold;
}

/**
 * Является ли тело свечи длинным относительно теней
 */
export function isLongBody(candle: CandleData, ratio = 0.6): boolean {
  const range = candleRange(candle);
  if (range === 0) return false;
  return (bodySize(candle) / range) >= ratio;
}

/**
 * Является ли верхняя тень длинной
 */
export function isLongUpperShadow(candle: CandleData, ratio = 2): boolean {
  const body = bodySize(candle);
  return upperShadow(candle) >= body * ratio;
}

/**
 * Является ли нижняя тень длинной
 */
export function isLongLowerShadow(candle: CandleData, ratio = 2): boolean {
  const body = bodySize(candle);
  return lowerShadow(candle) >= body * ratio;
}

/**
 * Поглощает ли первая свеча вторую (engulfing pattern)
 */
export function isEngulfing(prev: CandleData, current: CandleData): boolean {
  return (
    isBullish(current) && isBearish(prev) &&
    current.open <= prev.close &&
    current.close >= prev.open
  ) || (
    isBearish(current) && isBullish(prev) &&
    current.open >= prev.close &&
    current.close <= prev.open
  );
}

/**
 * Средняя волатильность за период
 */
export function averageVolatility(candles: CandleData[], period = 14): number {
  const ranges = candles.slice(-period).map(candleRange);
  return ranges.reduce((sum, range) => sum + range, 0) / ranges.length;
}

/**
 * Средний размер тела за период
 */
export function averageBodySize(candles: CandleData[], period = 14): number {
  const bodies = candles.slice(-period).map(bodySize);
  return bodies.reduce((sum, body) => sum + body, 0) / bodies.length;
}
