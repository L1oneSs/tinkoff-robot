/**
 * Расчет индикаторов.
 */
import {
  SMA,
  WEMA,
  WMA,
  EMA,
  EWMA,
  LWMA,
  AO,
  AC,
  Move,
  Wave,
  Stochastic,
  RSI,
  CCI,
  ATR,
  ROC,
  DC,
  cRSI,
  BollingerBands,
  StandardDeviation,
  MACD,
  HeikenAshi,
  Pivot,
  PSAR,
  ADX,
  WWS,
  SuperTrend,
  Extremums,
  Level,
  UniLevel,
  Correlation,
} from "@debut/indicators";

export type Series = number[];
export type OHLC = {
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

/**
 * Простое скользящее среднее, SMA
 */
export function sma(prices: Series, length: number) {
  const sma = new SMA(length);
  return prices.map((price) => sma.nextValue(price));
}

/**
 * Взвешенное экспоненциальное скользящее среднее, WEMA
 */
export function wema(prices: Series, length: number) {
  const wema = new WEMA(length);
  return prices.map((price) => wema.nextValue(price));
}

/**
 * Взвешенное скользящее среднее, WMA
 */
export function wma(prices: Series, length: number) {
  const wma = new WMA(length);
  return prices.map((price) => wma.nextValue(price));
}

/**
 * Экспоненциальное скользящее среднее, EMA
 */
export function ema(prices: Series, length: number) {
  const ema = new EMA(length);
  return prices.map((price) => ema.nextValue(price));
}

/**
 * Экспоненциально взвешенное скользящее среднее, EWMA
 */
export function ewma(prices: Series, length: number) {
  const ewma = new EWMA(length);
  return prices.map((price) => ewma.nextValue(price));
}

/**
 * Линейно взвешенное скользящее среднее, LWMA
 */
export function lwma(prices: Series, length: number) {
  const lwma = new LWMA(length);
  return prices.map((price) => lwma.nextValue(price));
}

/**
 * Awesome Oscillator, AO
 */
export function ao(candles: OHLC[]) {
  const ao = new AO();
  return candles.map((candle) => ao.nextValue(candle.high, candle.low));
}

/**
 * Accelerator Oscillator, AC
 */
export function ac(candles: OHLC[]) {
  const ac = new AC();
  return candles.map((candle) => ac.nextValue(candle.high, candle.low));
}

/**
 * Move индикатор
 */
export function move(prices: Series, length: number) {
  const move = new Move(length);
  return prices.map((price) => move.nextValue(price));
}

/**
 * Wave индикатор
 */
export function wave(candles: OHLC[]) {
  const wave = new Wave();
  return candles.map((candle) =>
    wave.nextValue(candle.open, candle.close, candle.high, candle.low),
  );
}

/**
 * Стохастический осциллятор
 */
export function stochastic(
  candles: OHLC[],
  kLength = 14,
  kSmoothing = 1,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _dLength = 3,
) {
  const stoch = new Stochastic(kLength, kSmoothing);
  return candles.map((candle) =>
    stoch.nextValue(candle.high, candle.low, candle.close),
  );
}

/**
 * Индекс относительной силы, RSI
 */
export function rsi(prices: Series, length = 14) {
  const rsi = new RSI(length);
  return prices.map((price) => rsi.nextValue(price));
}

/**
 * Commodity Channel Index, CCI
 */
export function cci(candles: OHLC[], length = 20) {
  const cci = new CCI(length);
  return candles.map((candle) =>
    cci.nextValue(candle.high, candle.low, candle.close),
  );
}

/**
 * Average True Range, ATR
 */
export function atr(candles: OHLC[], length = 14) {
  const atr = new ATR(length);
  return candles.map((candle) => atr.nextValue(candle.high, candle.low, candle.close));
}

/**
 * Rate of Change, ROC
 */
export function roc(prices: Series, length = 12) {
  const roc = new ROC(length);
  return prices.map((price) => roc.nextValue(price));
}

/**
 * Donchian Channels, DC
 */
export function dc(candles: OHLC[], length = 20) {
  const dc = new DC(length);
  return candles.map((candle) => dc.nextValue(candle.high, candle.low));
}

/**
 * Cumulative RSI, cRSI
 */
export function crsi(
  prices: Series,
  rsiLength = 14,
  stochLength = 14,
  kLength = 3,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _dLength = 3,
) {
  const crsi = new cRSI(rsiLength, stochLength, kLength);
  return prices.map((price) => crsi.nextValue(price));
}

/**
 * Полосы Боллинджера
 */
export function bollingerBands(
  prices: Series,
  length = 20,
  stdDev = 2,
) {
  const bb = new BollingerBands(length, stdDev);
  return prices.map((price) => bb.nextValue(price));
}

/**
 * Стандартное отклонение
 */
export function standardDeviation(prices: Series, length = 20) {
  const sd = new StandardDeviation(length);
  return prices.map((price) => sd.nextValue(price));
}

/**
 * MACD - схождение/расхождение скользящих средних
 */
export function macd(
  prices: Series,
  fastLength = 12,
  slowLength = 26,
  signalLength = 9,
) {
  const macd = new MACD(fastLength, slowLength, signalLength);
  return prices.map((price) => macd.nextValue(price));
}

/**
 * Heiken Ashi свечи
 */
export function heikenAshi(candles: OHLC[]) {
  const ha = new HeikenAshi();
  return candles.map((candle) =>
    ha.nextValue(candle.open, candle.high, candle.low, candle.close),
  );
}

/**
 * Pivot Points
 */
export function pivot(candles: OHLC[]) {
  const pivot = new Pivot();
  return candles.map((candle) =>
    pivot.nextValue(candle.high, candle.low, candle.close),
  );
}

/**
 * Parabolic SAR
 */
export function psar(candles: OHLC[], step = 0.02, max = 0.2) {
  const psar = new PSAR(step, max);
  return candles.map((candle) =>
    psar.nextValue(candle.high, candle.low, candle.close),
  );
}

/**
 * Average Directional Index, ADX
 */
export function adx(candles: OHLC[], length = 14) {
  const adx = new ADX(length);
  return candles.map((candle) =>
    adx.nextValue(candle.high, candle.low, candle.close),
  );
}

/**
 * Williams %R индикатор, WWS
 */
export function wws(prices: Series, length = 14) {
  const wws = new WWS(length);
  return prices.map((price) => wws.nextValue(price));
}

/**
 * SuperTrend индикатор
 */
export function superTrend(
  candles: OHLC[],
  length = 10,
  multiplier = 3,
) {
  const st = new SuperTrend(length, multiplier);
  return candles.map((candle) =>
    st.nextValue(candle.high, candle.low, candle.close),
  );
}

/**
 * Экстремумы (максимумы и минимумы)
 */
export function extremums(
  prices: Series,
  length = 5,
  mode: "max" | "min" = "max",
) {
  const ext = new Extremums(length, mode);
  return prices.map((price) => ext.nextValue(price));
}

/**
 * Уровни поддержки/сопротивления
 */
export function level(
  prices: Series,
  period = 3,
  samples = 10,
  redundant = 2,
  type: "WEMA" | "EMA" | "SMA" = "SMA",
) {
  const level = new Level(period, samples, redundant, type);
  return prices.map((price) => level.nextValue(price));
}

/**
 * Универсальные уровни
 */
export function uniLevel(
  prices: Series,
  redundant = 3,
  samples = 10,
  multiplier = 1,
  offset = 0,
) {
  const uniLevel = new UniLevel(redundant, SMA, samples, multiplier, offset);
  return prices.map((price) => uniLevel.nextValue(price));
}

/**
 * Корреляция между двумя сериями
 */
export function correlation(
  series1: Series,
  series2: Series,
  length = 20,
) {
  const corr = new Correlation(length);
  const results = [];
  for (let i = 0; i < Math.min(series1.length, series2.length); i++) {
    results.push(corr.nextValue(series1[i], series2[i]));
  }
  return results;
}

/**
 * Highest value в серии за period
 */
export function highest(series: Series, period: number): number {
  return Math.max(...series.slice(-period));
}

/**
 * Lowest value в серии за period
 */
export function lowest(series: Series, period: number): number {
  return Math.min(...series.slice(-period));
}

/**
 * Типичная цена (HLC/3)
 */
export function typicalPrice(candle: OHLC): number {
  return (candle.high + candle.low + candle.close) / 3;
}

/**
 * Медианная цена (HL/2)
 */
export function medianPrice(candle: OHLC): number {
  return (candle.high + candle.low) / 2;
}

/**
 * Weighted Close (HLCC/4)
 */
export function weightedClose(candle: OHLC): number {
  return (candle.high + candle.low + candle.close * 2) / 4;
}

/**
 * Возвращает true если source1 пересек source2 сверху вниз
 */
export function crossover(source1: Series, source2: Series) {
  const [prev1, cur1] = source1.slice(-2);
  const [prev2, cur2] = source2.slice(-2);
  return cur1 > cur2 && prev1 < prev2;
}

/**
 * Возвращает true если source1 пересек source2 снизу вверх
 */
export function crossunder(source1: Series, source2: Series) {
  const [prev1, cur1] = source1.slice(-2);
  const [prev2, cur2] = source2.slice(-2);
  return cur1 < cur2 && prev1 > prev2;
}

/**
 * Возвращает серию из константы.
 */
export function toSeries(value: number, length: number): Series {
  return new Array(length).fill(value);
}
