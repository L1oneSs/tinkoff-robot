/**
 * Экспорт всех сигналов на основе свечных паттернов (Candlestick Patterns).
 * 
 * Категории:
 * - Reversal: Паттерны разворота тренда
 * - Continuation: Паттерны продолжения тренда  
 * - Engulfing: Паттерны поглощения
 * - Doji: Паттерны неопределенности (дожи)
 */

// Экспорт всех паттернов
export * from './reversal/hammer.js';
export * from './reversal/shooting-star.js';
export * from './reversal/harami.js';

export * from './continuation/three-white-soldiers.js';
export * from './continuation/three-black-crows.js';

export * from './engulfing/bullish-engulfing.js';
export * from './engulfing/bearish-engulfing.js';

export * from './doji/classic-doji.js';

// Экспорт утилит
export * from './candle-utils.js';
