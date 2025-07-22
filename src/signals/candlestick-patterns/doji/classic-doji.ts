/**
 * Классический паттерн "Дожи" (Doji).
 * Свеча неопределенности с равными или почти равными ценами открытия и закрытия.
 */

import { Strategy } from '../../../strategy.js';
import { Signal, SignalParams, SignalResult } from '../../base.js';
import { 
  toCandleData, 
  isDoji,
  upperShadow,
  lowerShadow,
  candleRange,
  isBullish,
  isBearish
} from '../candle-utils.js';

const defaultConfig = {
  /** Максимальное соотношение тела к диапазону для определения дожи */
  dojiThreshold: 0.1,
  /** Требовать подтверждения следующей свечой */
  requireConfirmation: true,
  /** Минимальная длина теней для значимости */
  minShadowRatio: 0.3,
};

export type DojiSignalConfig = typeof defaultConfig;

export class DojiSignal extends Signal<DojiSignalConfig> {
  constructor(protected strategy: Strategy, config: Partial<DojiSignalConfig> = {}) {
    super(strategy, { ...defaultConfig, ...config });
  }

  get minCandlesCount() {
    return this.config.requireConfirmation ? 3 : 2;
  }

  calc({ candles }: SignalParams): SignalResult {
    if (candles.length < this.minCandlesCount) return;

    const currentIndex = candles.length - 1;
    const current = toCandleData(candles[currentIndex]);
    const prev = toCandleData(candles[currentIndex - 1]);
    
    let confirmation: ReturnType<typeof toCandleData> | null = null;
    if (this.config.requireConfirmation && candles.length > 2) {
      confirmation = toCandleData(candles[currentIndex + 1] || candles[currentIndex]);
    }

    // Проверяем дожи на предыдущей свече
    if (!isDoji(prev, this.config.dojiThreshold)) return;

    // Проверяем значимость дожи
    if (!this.isSignificantDoji(prev)) return;

    // Определяем тип дожи и направление сигнала
    const dojiType = this.classifyDoji(prev);
    
    if (this.config.requireConfirmation && confirmation) {
      // Ищем подтверждение в текущей свече
      return this.getConfirmedSignal(prev, current, dojiType);
    } else {
      // Без подтверждения - базируемся на контексте
      const recentCandleData = candles.slice(-3).map(toCandleData);
      return this.getContextBasedSignal(recentCandleData, dojiType);
    }
  }

  private isSignificantDoji(candle: typeof toCandleData extends (...args: any[]) => infer R ? R : never): boolean {
    const range = candleRange(candle);
    if (range === 0) return false;

    const upperShadowSize = upperShadow(candle);
    const lowerShadowSize = lowerShadow(candle);

    // Хотя бы одна из теней должна быть значимой
    const minShadowLength = range * this.config.minShadowRatio;
    return upperShadowSize >= minShadowLength || lowerShadowSize >= minShadowLength;
  }

  private classifyDoji(candle: typeof toCandleData extends (...args: any[]) => infer R ? R : never): string {
    const upperShadowSize = upperShadow(candle);
    const lowerShadowSize = lowerShadow(candle);
    const range = candleRange(candle);

    if (range === 0) return 'perfect-doji';

    // Длинноногий дожи
    if (upperShadowSize > range * 0.4 && lowerShadowSize > range * 0.4) {
      return 'long-legged-doji';
    }

    // Надгробие (длинная верхняя тень)
    if (upperShadowSize > range * 0.7) {
      return 'gravestone-doji';
    }

    // Стрекоза (длинная нижняя тень) 
    if (lowerShadowSize > range * 0.7) {
      return 'dragonfly-doji';
    }

    return 'standard-doji';
  }

  private getConfirmedSignal(
    doji: typeof toCandleData extends (...args: any[]) => infer R ? R : never,
    confirmation: typeof toCandleData extends (...args: any[]) => infer R ? R : never,
    dojiType: string
  ): SignalResult {
    // Стрекоза + бычье подтверждение = покупка
    if (dojiType === 'dragonfly-doji' && isBullish(confirmation)) {
      return 'buy';
    }

    // Надгробие + медвежье подтверждение = продажа
    if (dojiType === 'gravestone-doji' && isBearish(confirmation)) {
      return 'sell';
    }

    // Длинноногий дожи - ориентируемся на подтверждение
    if (dojiType === 'long-legged-doji') {
      return isBullish(confirmation) ? 'buy' : 'sell';
    }

    return;
  }

  private getContextBasedSignal(
    recentCandles: (typeof toCandleData extends (...args: any[]) => infer R ? R : never)[],
    dojiType: string
  ): SignalResult {
    if (recentCandles.length < 2) return;

    const trend = this.identifyTrend(recentCandles.slice(0, -1));

    // Стрекоза в нисходящем тренде - потенциальный разворот вверх
    if (dojiType === 'dragonfly-doji' && trend === 'bearish') {
      return 'buy';
    }

    // Надгробие в восходящем тренде - потенциальный разворот вниз
    if (dojiType === 'gravestone-doji' && trend === 'bullish') {
      return 'sell';
    }

    return;
  }

  private identifyTrend(candles: (typeof toCandleData extends (...args: any[]) => infer R ? R : never)[]): string {
    if (candles.length < 2) return 'neutral';

    const bullishCount = candles.filter(isBullish).length;
    const bearishCount = candles.filter(isBearish).length;

    if (bullishCount > bearishCount) return 'bullish';
    if (bearishCount > bullishCount) return 'bearish';
    return 'neutral';
  }
}
