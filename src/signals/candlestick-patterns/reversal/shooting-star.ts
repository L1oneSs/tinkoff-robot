/**
 * Паттерн "Падающая звезда" (Shooting Star) и "Перевернутый молот" (Inverted Hammer).
 * Классический паттерн разворота с длинной верхней тенью и маленьким телом.
 */

import { Strategy } from '../../../strategy.js';
import { Signal, SignalParams, SignalResult } from '../../base.js';
import { 
  toCandleData, 
  isDoji, 
  isLongUpperShadow, 
  lowerShadow, 
  bodySize,
  candleRange,
  isBullish,
  isBearish
} from '../candle-utils.js';

const defaultConfig = {
  /** Минимальное соотношение верхней тени к телу */
  shadowToBodyRatio: 2,
  /** Максимальное соотношение нижней тени к телу */
  maxLowerShadowRatio: 0.5,
  /** Требовать подтверждения на следующей свече */
  requireConfirmation: true,
};

export type ShootingStarSignalConfig = typeof defaultConfig;

export class ShootingStarSignal extends Signal<ShootingStarSignalConfig> {
  constructor(protected strategy: Strategy, config: Partial<ShootingStarSignalConfig> = {}) {
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
    if (!this.isShootingStarPattern(current)) return;

    // Если требуется подтверждение, проверяем предыдущую свечу
    if (this.config.requireConfirmation && prev) {
      // Падающая звезда после восходящего тренда + медвежье подтверждение
      if (isBullish(prev) && isBearish(current)) {
        return 'sell';
      }
      // Перевернутый молот после нисходящего тренда + бычье подтверждение
      if (isBearish(prev) && isBullish(current)) {
        return 'buy';
      }
    } else {
      // Без подтверждения - определяем по позиции тела
      const bodyPosition = this.getBodyPosition(current);
      return bodyPosition < 0.4 ? 'sell' : 'buy';
    }
  }

  private isShootingStarPattern(candle: typeof toCandleData extends (...args: any[]) => infer R ? R : never): boolean {
    // Исключаем дожи
    if (isDoji(candle)) return false;

    const body = bodySize(candle);
    const lowerShadowSize = lowerShadow(candle);

    // Проверяем длинную верхнюю тень
    if (!isLongUpperShadow(candle, this.config.shadowToBodyRatio)) return false;

    // Проверяем короткую нижнюю тень
    if (body > 0 && lowerShadowSize / body > this.config.maxLowerShadowRatio) return false;

    // Тело должно быть в нижней части диапазона
    const bodyPosition = this.getBodyPosition(candle);
    return bodyPosition < 0.4;
  }

  private getBodyPosition(candle: typeof toCandleData extends (...args: any[]) => infer R ? R : never): number {
    const range = candleRange(candle);
    if (range === 0) return 0.5;
    
    return (Math.max(candle.open, candle.close) - candle.low) / range;
  }
}
