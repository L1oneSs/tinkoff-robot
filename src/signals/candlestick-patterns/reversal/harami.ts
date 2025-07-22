/**
 * Паттерн "Харами" (Harami) - двухсвечной паттерн разворота.
 * Вторая свеча полностью помещается внутри тела первой.
 */

import { Strategy } from '../../../strategy.js';
import { Signal, SignalParams, SignalResult } from '../../base.js';
import { 
  toCandleData, 
  bodySize,
  isBullish,
  isBearish,
  isLongBody
} from '../candle-utils.js';

const defaultConfig = {
  /** Минимальное соотношение тела первой свечи ко второй */
  bodyRatio: 2,
  /** Требовать, чтобы первая свеча была с длинным телом */
  requireLongFirstBody: true,
};

export type HaramiSignalConfig = typeof defaultConfig;

export class HaramiSignal extends Signal<HaramiSignalConfig> {
  constructor(protected strategy: Strategy, config: Partial<HaramiSignalConfig> = {}) {
    super(strategy, { ...defaultConfig, ...config });
  }

  get minCandlesCount() {
    return 2;
  }

  calc({ candles }: SignalParams): SignalResult {
    if (candles.length < 2) return;

    const current = toCandleData(candles[candles.length - 1]);
    const prev = toCandleData(candles[candles.length - 2]);

    if (!this.isHaramiPattern(prev, current)) return;

    // Медвежий харами: большая бычья свеча + маленькая медвежья
    if (isBullish(prev) && isBearish(current)) {
      return 'sell';
    }

    // Бычий харами: большая медвежья свеча + маленькая бычья  
    if (isBearish(prev) && isBullish(current)) {
      return 'buy';
    }
  }

  private isHaramiPattern(
    first: typeof toCandleData extends (...args: any[]) => infer R ? R : never,
    second: typeof toCandleData extends (...args: any[]) => infer R ? R : never
  ): boolean {
    const firstBody = bodySize(first);
    const secondBody = bodySize(second);

    // Проверяем соотношение тел
    if (secondBody === 0 || firstBody / secondBody < this.config.bodyRatio) {
      return false;
    }

    // Проверяем длину первой свечи если требуется
    if (this.config.requireLongFirstBody && !isLongBody(first)) {
      return false;
    }

    // Вторая свеча должна быть внутри тела первой
    const firstMax = Math.max(first.open, first.close);
    const firstMin = Math.min(first.open, first.close);
    const secondMax = Math.max(second.open, second.close);
    const secondMin = Math.min(second.open, second.close);

    return secondMax <= firstMax && secondMin >= firstMin;
  }
}
