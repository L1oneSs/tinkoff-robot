/**
 * Паттерн "Три черных ворона" (Three Black Crows).
 * Три последовательных медвежьих свечи с убывающими максимумами и минимумами.
 */

import { Strategy } from '../../../strategy.js';
import { Signal, SignalParams, SignalResult } from '../../base.js';
import { 
  toCandleData, 
  isBearish,
  bodySize,
  isLongBody
} from '../candle-utils.js';

const defaultConfig = {
  /** Минимальное соотношение размера тела свечи к диапазону */
  minBodyRatio: 0.6,
  /** Максимальное перекрытие тел соседних свечей (в процентах) */
  maxBodyOverlap: 0.3,
};

export type ThreeBlackCrowsSignalConfig = typeof defaultConfig;

export class ThreeBlackCrowsSignal extends Signal<ThreeBlackCrowsSignalConfig> {
  constructor(protected strategy: Strategy, config: Partial<ThreeBlackCrowsSignalConfig> = {}) {
    super(strategy, { ...defaultConfig, ...config });
  }

  get minCandlesCount() {
    return 3;
  }

  calc({ candles }: SignalParams): SignalResult {
    if (candles.length < 3) return;

    const third = toCandleData(candles[candles.length - 1]);
    const second = toCandleData(candles[candles.length - 2]);
    const first = toCandleData(candles[candles.length - 3]);

    if (!this.isThreeBlackCrows(first, second, third)) return;

    return 'sell';
  }

  private isThreeBlackCrows(
    first: typeof toCandleData extends (...args: any[]) => infer R ? R : never,
    second: typeof toCandleData extends (...args: any[]) => infer R ? R : never,
    third: typeof toCandleData extends (...args: any[]) => infer R ? R : never
  ): boolean {
    // Все три свечи должны быть медвежьими
    if (!isBearish(first) || !isBearish(second) || !isBearish(third)) {
      return false;
    }

    // Все свечи должны иметь длинные тела
    if (!isLongBody(first, this.config.minBodyRatio) || 
        !isLongBody(second, this.config.minBodyRatio) || 
        !isLongBody(third, this.config.minBodyRatio)) {
      return false;
    }

    // Каждая следующая свеча должна закрываться ниже предыдущей
    if (second.close >= first.close || third.close >= second.close) {
      return false;
    }

    // Каждая следующая свеча должна открываться ниже предыдущей (но не слишком низко)
    if (!this.isValidOpening(first, second) || !this.isValidOpening(second, third)) {
      return false;
    }

    return true;
  }

  private isValidOpening(
    prev: typeof toCandleData extends (...args: any[]) => infer R ? R : never,
    current: typeof toCandleData extends (...args: any[]) => infer R ? R : never
  ): boolean {
    // Текущая свеча должна открываться ниже закрытия предыдущей
    if (current.open >= prev.close) return false;

    // Но не слишком низко (гэп не должен быть слишком большим)
    const prevBody = bodySize(prev);
    const overlap = prev.close - current.open;
    
    return overlap <= prevBody * this.config.maxBodyOverlap;
  }
}
