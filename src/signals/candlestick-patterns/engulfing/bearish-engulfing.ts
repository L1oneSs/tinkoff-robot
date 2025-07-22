/**
 * Медвежий паттерн поглощения (Bearish Engulfing).
 * Большая медвежья свеча полностью поглощает предыдущую бычью свечу.
 */

import { Strategy } from '../../../strategy.js';
import { Signal, SignalParams, SignalResult } from '../../base.js';
import { 
  toCandleData, 
  isBullish,
  isBearish,
  bodySize,
  isEngulfing
} from '../candle-utils.js';

const defaultConfig = {
  /** Минимальное соотношение объема поглощающей свечи */
  minVolumeRatio: 1.2,
  /** Минимальное соотношение размера тела поглощающей свечи */
  minBodyRatio: 1.5,
};

export type BearishEngulfingSignalConfig = typeof defaultConfig;

export class BearishEngulfingSignal extends Signal<BearishEngulfingSignalConfig> {
  constructor(protected strategy: Strategy, config: Partial<BearishEngulfingSignalConfig> = {}) {
    super(strategy, { ...defaultConfig, ...config });
  }

  get minCandlesCount() {
    return 2;
  }

  calc({ candles }: SignalParams): SignalResult {
    if (candles.length < 2) return;

    const current = toCandleData(candles[candles.length - 1]);
    const prev = toCandleData(candles[candles.length - 2]);

    // Проверяем базовые условия медвежьего поглощения
    if (!isBullish(prev) || !isBearish(current)) return;

    // Проверяем паттерн поглощения
    if (!isEngulfing(prev, current)) return;

    // Проверяем дополнительные условия
    if (!this.validateEngulfing(prev, current)) return;

    return 'sell';
  }

  private validateEngulfing(
    prev: typeof toCandleData extends (...args: any[]) => infer R ? R : never,
    current: typeof toCandleData extends (...args: any[]) => infer R ? R : never
  ): boolean {
    const prevBody = bodySize(prev);
    const currentBody = bodySize(current);

    // Проверяем соотношение размеров тел
    if (prevBody > 0 && currentBody / prevBody < this.config.minBodyRatio) {
      return false;
    }

    // Проверяем соотношение объемов (если доступно)
    if (prev.volume > 0 && current.volume / prev.volume < this.config.minVolumeRatio) {
      return false;
    }

    return true;
  }
}
