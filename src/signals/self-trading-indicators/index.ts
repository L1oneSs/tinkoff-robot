/**
 * Экспорт всех самобытных торговых индикаторов (Self-Trading Indicators).
 * 
 * Категории:
 * - Oscillators: Индикаторы перекупленности/перепроданности
 * - Trend Following: Трендовые индикаторы
 * - Moving Averages: Индикаторы на основе скользящих средних
 * - Volatility: Индикаторы волатильности
 * - Momentum: Индикаторы моментума
 */

// Экспорт по категориям
export * as oscillators from './oscillators/index.js';
export * as trendFollowing from './trend-following/index.js';
export * as movingAverages from './moving-averages/index.js';
export * as volatility from './volatility/index.js';
export * as momentum from './momentum/index.js';

// Также экспортируем все индивидуально для прямого доступа
export * from './oscillators/index.js';
export * from './trend-following/index.js';
export * from './moving-averages/index.js';
export * from './volatility/index.js';
export * from './momentum/index.js';
