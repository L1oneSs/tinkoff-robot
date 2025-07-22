/**
 * Паттерн "Молот" (Hammer) и "Повешенный" (Hanging Man).
 * Классический паттерн разворота с длинной нижней тенью и маленьким телом.
 */

import { Strategy } from '../../../strategy.js';
import { Signal, SignalParams, SignalResult } from '../../base.js';
import { 
  toCandleData, 
  isDoji, 
  isLongLowerShadow, 
  upperShadow, 
  bodySize,
  candleRange,
  isBullish
} from '../candle-utils.js';

const defaultConfig = {
  /** Минимальное соотношение нижней тени к телу */
  shadowToBodyRatio: 2,
  /** Максимальное соотношение верхней тени к телу */
  maxUpperShadowRatio: 0.5,
  /** Требовать подтверждения на следующей свече */
  requireConfirmation: true,
};

export type HammerSignalConfig = typeof defaultConfig;

export class HammerSignal extends Signal<HammerSignalConfig> {
  constructor(protected strategy: Strategy, config: Partial<HammerSignalConfig> = {}) {
    super(strategy, { ...defaultConfig, ...config });
  }

  get minCandlesCount() {
    return this.config.requireConfirmation ? 2 : 1;
  }

  calc({ candles }: SignalParams): SignalResult {
    if (candles.length < this.minCandlesCount) return;

    const current = toCandleData(candles[candles.length - 1]);
    const prev = candles.length > 1 ? toCandleData(candles[candles.length - 2]) : null;

    // Проверяем паттерн на текущей свече
    if (!this.isHammerPattern(current)) return;

    // Если требуется подтверждение, проверяем предыдущую свечу
    if (this.config.requireConfirmation && prev) {
      // Молот после нисходящего тренда + бычье подтверждение
      if (prev.close > prev.open && current.close > current.open) {
        return 'buy';
      }
      // Повешенный после восходящего тренда + медвежье подтверждение  
      if (prev.close < prev.open && current.close < current.open) {
        return 'sell';
      }
    } else {
      // Без подтверждения - просто наличие паттерна
      return isBullish(current) ? 'buy' : 'sell';
    }
  }

  private isHammerPattern(candle: typeof toCandleData extends (...args: any[]) => infer R ? R : never): boolean {
    // Исключаем дожи
    if (isDoji(candle)) return false;

    const body = bodySize(candle);
    const upperShadowSize = upperShadow(candle);
    const range = candleRange(candle);

    // Проверяем длинную нижнюю тень
    if (!isLongLowerShadow(candle, this.config.shadowToBodyRatio)) return false;

    // Проверяем короткую верхнюю тень
    if (body > 0 && upperShadowSize / body > this.config.maxUpperShadowRatio) return false;

    // Тело должно быть в верхней части диапазона
    const bodyPosition = (Math.min(candle.open, candle.close) - candle.low) / range;
    return bodyPosition > 0.6;
  }
}
