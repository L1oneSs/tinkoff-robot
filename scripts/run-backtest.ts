/**
 * Бэктест стратегии на исторических данных с реальными конфигурациями инструментов:
 * 
 * Основные команды:
 * npx tsx scripts/run-backtest.ts SBER  - Тест Сбербанка
 * npx tsx scripts/run-backtest.ts GAZP  - Тест Газпрома
 * 
 * Загружает реальные исторические данные из Tinkoff API и использует 
 * настоящие сигналы и стратегии из конфигурации инструмента
 */
import { Helpers } from 'tinkoff-invest-api';
import { api } from './init-api.js';
import { CandleInterval, HistoricCandle } from 'tinkoff-invest-api/dist/generated/marketdata.js';
import { InstrumentInfo, BaseInstrumentConfig, SignalContext } from '../src/instruments/base-config.js';
import { getActiveNewInstrumentConfigs } from '../src/instrument-configs.js';

// Импортируем сигналы для вычислений
import { ProfitLossSignal } from '../src/signals/profit-loss.js';
import { 
  SmaCrossoverSignal,
  RsiCrossoverSignal,
  MacdSignal,
  EmaCrossoverSignal,
  BollingerBandsSignal,
  WilliamsRSignal,
  AcSignal,
  AoSignal,
  CciSignal,
  StochasticSignal,
  AdxSignal,
  PSARSignal,
  SuperTrendSignal,
  MoveSignal,
  RocSignal
} from '../src/signals/self-trading-indicators/index.js';

// Импортируем свечные паттерны
import {
  HammerSignal,
  ShootingStarSignal,
  HaramiSignal,
  BullishEngulfingSignal,
  BearishEngulfingSignal,
  DojiSignal
} from '../src/signals/candlestick-patterns/index.js';

// Параметры бэктеста
const BACKTEST_CONFIG = {
  // Период для бэктеста (последние N дней)
  daysBack: 21, // Покрываем период с 7 по 21 июля (21 день назад от сегодня)
  // Начальная сумма для симуляции
  initialBalance: 13000, // 13,000 рублей
  // Комиссия брокера (в процентах)
  commission: 0.3,
  // Симулировать торговые часы как на сервере (10:00-19:00 МСК, пн-пт)
  useRealTradingHours: true, // Отключаем для точного сравнения с реальными сделками в UTC
  // Интервал свечей для анализа (можно менять: CANDLE_INTERVAL_5_MIN, CANDLE_INTERVAL_1_HOUR, etc.)
  candleInterval: 'CANDLE_INTERVAL_5_MIN' as const,
  // Размер порции для загрузки (дней) - API ограничивает 7 дней для 5-минутных свечей
  chunkSizeDays: 7,
};

// Результаты симуляции
interface BacktestResult {
  instrument: string;
  ticker: string;
  totalTrades: number;
  profitableTrades: number;
  totalProfit: number;
  totalProfitPercent: number;
  maxDrawdown: number;
  sharpeRatio: number;
  trades: TradeRecord[];
  signalsSummary: SignalsSummary;
}

interface TradeRecord {
  date: Date;
  type: 'BUY' | 'SELL';
  price: number;
  quantity: number;
  amount: number;
  balance: number;
  profit?: number;
  signal: string;
}

interface SignalsSummary {
  [signalName: string]: {
    total: number;
    profitable: number;
    totalProfit: number;
  };
}

main();

async function main() {
  console.log('🚀 Запуск бэктеста стратегии...\n');
  
  // Получаем тикер из аргументов командной строки
  const ticker = process.argv[2];
  
  // Получаем все активные конфигурации инструментов
  const allConfigs = getActiveNewInstrumentConfigs();
  
  // Ищем конфигурацию инструмента по тикеру
  const strategyConfig = allConfigs.find(s => s.ticker === ticker.toUpperCase());
  if (!strategyConfig) {
    console.error(`❌ Инструмент ${ticker.toUpperCase()} не найден в конфигурации!`);
    console.log(`📋 Доступные инструменты: ${allConfigs.map(s => s.ticker).join(', ')}`);
    return;
  }
  
  console.log(`📊 Тестируем инструмент: ${strategyConfig.figi} (${strategyConfig.ticker})`);
  console.log(`📅 Период: ${BACKTEST_CONFIG.daysBack} дней назад`);
  console.log(`💰 Начальный баланс: ${BACKTEST_CONFIG.initialBalance.toLocaleString()} руб.`);
  console.log(`💸 Комиссия: ${BACKTEST_CONFIG.commission}%`);
  console.log(`⏰ Торговое время: ${BACKTEST_CONFIG.useRealTradingHours ? '10:00-19:00 МСК (пн-пт)' : '24/7'}`);
  console.log(`� Интервал свечей: 5 минут (как на сервере)\n`);

  // Получаем информацию об инструменте
  const instrumentInfo = await getInstrumentInfo(strategyConfig.figi);
  if (!instrumentInfo) {
    console.error('❌ Не удалось получить информацию об инструменте!');
    return;
  }

  console.log(`🏷️  Инструмент: ${instrumentInfo.name} (${instrumentInfo.ticker})`);
  console.log(`🏭 Сектор: ${strategyConfig.sector}\n`);

  // Загружаем исторические данные порциями
  const candles = await loadHistoricalDataInChunks(strategyConfig.figi, BACKTEST_CONFIG.candleInterval);
  if (candles.length === 0) {
    console.error('❌ Не удалось загрузить исторические данные!');
    return;
  }

  console.log(`📈 Загружено свечей: ${candles.length}`);
  console.log(`📅 Период: ${candles[0].time?.toLocaleDateString()} - ${candles[candles.length - 1].time?.toLocaleDateString()}\n`);

  // Запускаем бэктест
  const result = await runBacktest(strategyConfig, candles, instrumentInfo);
  
  // Выводим результаты
  printResults(result);
}

async function getInstrumentInfo(figi: string): Promise<InstrumentInfo | null> {
  try {
    const { instrument } = await api.instruments.getInstrumentBy({ 
      idType: 1, // INSTRUMENT_ID_TYPE_FIGI
      classCode: '', 
      id: figi 
    });
    
    if (!instrument) return null;
    
    return {
      figi: instrument.figi,
      ticker: instrument.ticker,
      name: instrument.name,
      sector: 'Unknown', // Поле sector недоступно в API
    };
  } catch (error) {
    console.error('Ошибка получения информации об инструменте:', error);
    return null;
  }
}

async function loadHistoricalData(figi: string, interval: CandleInterval): Promise<HistoricCandle[]> {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - BACKTEST_CONFIG.chunkSizeDays);

  console.log(`📡 Загружаем порцию данных: ${from.toLocaleDateString()} - ${to.toLocaleDateString()}...`);

  try {
    const { candles } = await api.marketdata.getCandles({
      figi,
      from,
      to,
      interval,
    });

    return candles;
  } catch (error) {
    console.error('Ошибка загрузки исторических данных:', error);
    return [];
  }
}

// Функция для загрузки данных порциями (для покрытия длинного периода)
async function loadHistoricalDataInChunks(figi: string, candleIntervalName: string): Promise<HistoricCandle[]> {
  // Преобразуем строковое название в enum
  const intervalMap: { [key: string]: CandleInterval } = {
    'CANDLE_INTERVAL_1_MIN': 1,
    'CANDLE_INTERVAL_5_MIN': 2, 
    'CANDLE_INTERVAL_15_MIN': 3,
    'CANDLE_INTERVAL_HOUR': 4,
    'CANDLE_INTERVAL_DAY': 5,
  };
  
  const interval = intervalMap[candleIntervalName];
  if (!interval) {
    throw new Error(`Неподдерживаемый интервал свечей: ${candleIntervalName}`);
  }

  console.log('📡 Загружаем исторические данные порциями...');
  
  const allCandles: HistoricCandle[] = [];
  const totalDays = BACKTEST_CONFIG.daysBack;
  const chunkSize = BACKTEST_CONFIG.chunkSizeDays;
  
  // Загружаем данные порциями от самого старого к новому
  for (let daysAgo = totalDays; daysAgo > 0; daysAgo -= chunkSize) {
    const chunkEnd = Math.max(0, daysAgo - chunkSize);
    
    const to = new Date();
    to.setDate(to.getDate() - chunkEnd);
    
    const from = new Date();
    from.setDate(from.getDate() - daysAgo);
    
    console.log(`📦 Порция ${Math.ceil((totalDays - daysAgo + chunkSize) / chunkSize)}: ${from.toLocaleDateString()} - ${to.toLocaleDateString()}`);
    
    try {
      const { candles } = await api.marketdata.getCandles({
        figi,
        from,
        to,
        interval,
      });
      
      console.log(`   ✅ Загружено ${candles.length} свечей`);
      allCandles.push(...candles);
      
      // Пауза между запросами чтобы не превысить лимиты API
      if (daysAgo > chunkSize) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
    } catch (error) {
      console.error(`❌ Ошибка загрузки порции ${from.toLocaleDateString()} - ${to.toLocaleDateString()}:`, error);
      // Продолжаем загрузку других порций
    }
  }
  
  // Сортируем свечи по времени (на всякий случай)
  allCandles.sort((a, b) => {
    const timeA = a.time?.getTime() || 0;
    const timeB = b.time?.getTime() || 0;
    return timeA - timeB;
  });
  
  console.log(`🎯 Итого загружено: ${allCandles.length} свечей`);
  return allCandles;
}

async function runBacktest(
  strategyConfig: BaseInstrumentConfig, 
  candles: HistoricCandle[], 
  instrumentInfo: InstrumentInfo
): Promise<BacktestResult> {
  console.log('🔄 Начинаем симуляцию торговли...\n');
  
  let balance = BACKTEST_CONFIG.initialBalance;
  let position = 0; // Количество акций в позиции
  let positionValue = 0; // Стоимость позиции
  const trades: TradeRecord[] = [];
  const signalsSummary: SignalsSummary = {};
  
  // Создаем объекты сигналов из конфигурации
  const signalInstances: { [key: string]: any } = {};
  
  // Создаем заглушку для Strategy с минимально необходимыми свойствами
  const mockStrategy = {
    logger: {
      withPrefix: (prefix: string) => ({
        debug: () => {},
        info: () => {},
        warn: () => {},
        error: () => {}
      })
    }
  } as any;
  
  if (strategyConfig.signals?.profit) {
    signalInstances.profit = new ProfitLossSignal(mockStrategy, strategyConfig.signals.profit);
  }
  if (strategyConfig.signals?.sma) {
    signalInstances.sma = new SmaCrossoverSignal(mockStrategy, strategyConfig.signals.sma);
  }
  if (strategyConfig.signals?.rsi) {
    signalInstances.rsi = new RsiCrossoverSignal(mockStrategy, strategyConfig.signals.rsi);
  }
  if (strategyConfig.signals?.macd) {
    signalInstances.macd = new MacdSignal(mockStrategy, strategyConfig.signals.macd);
  }
  if (strategyConfig.signals?.ema) {
    signalInstances.ema = new EmaCrossoverSignal(mockStrategy, strategyConfig.signals.ema);
  }
  if (strategyConfig.signals?.bollinger) {
    signalInstances.bollinger = new BollingerBandsSignal(mockStrategy, strategyConfig.signals.bollinger);
  }
  if (strategyConfig.signals?.williams) {
    signalInstances.williams = new WilliamsRSignal(mockStrategy, strategyConfig.signals.williams);
  }
  if (strategyConfig.signals?.ac) {
    signalInstances.ac = new AcSignal(mockStrategy, strategyConfig.signals.ac);
  }
  if (strategyConfig.signals?.ao) {
    signalInstances.ao = new AoSignal(mockStrategy, strategyConfig.signals.ao);
  }
  if (strategyConfig.signals?.cci) {
    signalInstances.cci = new CciSignal(mockStrategy, strategyConfig.signals.cci);
  }
  if (strategyConfig.signals?.stochastic) {
    signalInstances.stochastic = new StochasticSignal(mockStrategy, strategyConfig.signals.stochastic);
  }
  if (strategyConfig.signals?.adx) {
    signalInstances.adx = new AdxSignal(mockStrategy, strategyConfig.signals.adx);
  }
  if (strategyConfig.signals?.psar) {
    signalInstances.psar = new PSARSignal(mockStrategy, strategyConfig.signals.psar);
  }
  if (strategyConfig.signals?.supertrend) {
    signalInstances.supertrend = new SuperTrendSignal(mockStrategy, strategyConfig.signals.supertrend);
  }
  if (strategyConfig.signals?.move) {
    signalInstances.move = new MoveSignal(mockStrategy, strategyConfig.signals.move);
  }
  if (strategyConfig.signals?.roc) {
    signalInstances.roc = new RocSignal(mockStrategy, strategyConfig.signals.roc);
  }
  
  // Свечные паттерны
  if (strategyConfig.signals?.hammer) {
    signalInstances.hammer = new HammerSignal(mockStrategy, strategyConfig.signals.hammer);
  }
  if (strategyConfig.signals?.shootingStar) {
    signalInstances.shootingStar = new ShootingStarSignal(mockStrategy, strategyConfig.signals.shootingStar);
  }
  if (strategyConfig.signals?.harami) {
    signalInstances.harami = new HaramiSignal(mockStrategy, strategyConfig.signals.harami);
  }
  if (strategyConfig.signals?.bullishEngulfing) {
    signalInstances.bullishEngulfing = new BullishEngulfingSignal(mockStrategy, strategyConfig.signals.bullishEngulfing);
  }
  if (strategyConfig.signals?.bearishEngulfing) {
    signalInstances.bearishEngulfing = new BearishEngulfingSignal(mockStrategy, strategyConfig.signals.bearishEngulfing);
  }
  if (strategyConfig.signals?.doji) {
    signalInstances.doji = new DojiSignal(mockStrategy, strategyConfig.signals.doji);
  }
  
  // Минимальное количество свечей для начала торговли (для индикаторов)
  const minCandles = 50;
  
  // Вспомогательная функция для проверки торгового времени
  const isTradingTime = (date: Date): boolean => {
    if (!BACKTEST_CONFIG.useRealTradingHours) {
      return true; // Торгуем 24/7 если отключена проверка
    }
    
    // Московское время
    const moscowTime = new Date(date.toLocaleString("en-US", { timeZone: "Europe/Moscow" }));
    const dayOfWeek = moscowTime.getDay(); // 0 = воскресенье, 6 = суббота
    const hour = moscowTime.getHours();
    
    // Проверяем рабочие дни (понедельник-пятница) и торговые часы (10:00-19:00)
    return (dayOfWeek >= 1 && dayOfWeek <= 5) && (hour >= 10 && hour < 19);
  };
  
  for (let i = minCandles; i < candles.length; i++) {
    const currentCandle = candles[i];
    const currentPrice = currentCandle.close ? Helpers.toNumber(currentCandle.close!) : 0;
    
    if (currentPrice === 0) continue;
    
    // Проверяем торговое время (как на сервере)
    if (!isTradingTime(currentCandle.time || new Date())) {
      continue; // Пропускаем анализ вне торгового времени
    }
    
    // Берем историю свечей для расчета сигналов
    const candleHistory = candles.slice(0, i + 1);
    
    // Рассчитываем все сигналы
    const signalResults: { [key: string]: 'buy' | 'sell' | void } = {};
    let currentBalance = balance + (position > 0 ? position * currentPrice : 0);
    
    for (const [signalName, signalInstance] of Object.entries(signalInstances)) {
      if (signalName === 'profit' && position > 0) {
        // Для profit/loss нужна текущая прибыль
        const currentProfit = ((position * currentPrice - positionValue) / positionValue) * 100;
        signalResults[signalName] = signalInstance.calc({ 
          candles: candleHistory, 
          profit: currentProfit 
        });
      } else if (signalName !== 'profit') {
        signalResults[signalName] = signalInstance.calc({ 
          candles: candleHistory, 
          profit: 0 
        });
      }
    }
    
    // Отладка: выводим сигналы каждые 50 свечей или когда есть активность
    const shouldShowDebug = (i % 50 === 0) || Object.values(signalResults).some(r => r === 'buy' || r === 'sell');
    const tradingTimeStatus = isTradingTime(currentCandle.time || new Date()) ? '🟢' : '🔴';
    
    if (shouldShowDebug) {
      console.log(`Свеча ${i} (${currentCandle.time?.toLocaleString()}) ${tradingTimeStatus}: Цена=${currentPrice.toFixed(2)}, Позиция=${position}`);
      console.log(`  Сигналы:`, signalResults);
    }
    
    // Создаем контекст сигналов для триггеров
    const signalContext: SignalContext = {
      profit: () => signalResults.profit === 'sell', 
      sma: () => signalResults.sma === 'buy',
      rsi: () => signalResults.rsi === 'buy', 
      bollinger: () => signalResults.bollinger === 'buy',
      macd: () => signalResults.macd === 'buy',
      ema: () => signalResults.ema === 'buy',
      cci: () => signalResults.cci === 'buy',
      stochastic: () => signalResults.stochastic === 'buy',
      williams: () => signalResults.williams === 'buy',
      adx: () => signalResults.adx === 'buy',
      psar: () => signalResults.psar === 'buy',
      supertrend: () => signalResults.supertrend === 'buy',
      move: () => signalResults.move === 'buy',
      roc: () => signalResults.roc === 'buy',
      ac: () => signalResults.ac === 'buy',
      ao: () => signalResults.ao === 'buy',
      
      // Свечные паттерны
      hammer: () => signalResults.hammer === 'buy',
      shootingStar: () => signalResults.shootingStar === 'sell', // ShootingStar - медвежий паттерн
      harami: () => signalResults.harami === 'buy',
      bullishEngulfing: () => signalResults.bullishEngulfing === 'buy',
      bearishEngulfing: () => signalResults.bearishEngulfing === 'sell', // BearishEngulfing - медвежий паттерн
      doji: () => signalResults.doji === 'buy'
    };
    
    // Также нужен контекст для sell сигналов
    const sellSignalContext: SignalContext = {
      profit: () => signalResults.profit === 'sell', 
      sma: () => signalResults.sma === 'sell',
      rsi: () => signalResults.rsi === 'sell', 
      bollinger: () => signalResults.bollinger === 'sell',
      macd: () => signalResults.macd === 'sell',
      ema: () => signalResults.ema === 'sell',
      cci: () => signalResults.cci === 'sell',
      stochastic: () => signalResults.stochastic === 'sell',
      williams: () => signalResults.williams === 'sell',
      adx: () => signalResults.adx === 'sell',
      psar: () => signalResults.psar === 'sell',
      supertrend: () => signalResults.supertrend === 'sell',
      move: () => signalResults.move === 'sell',
      roc: () => signalResults.roc === 'sell',
      ac: () => signalResults.ac === 'sell',
      ao: () => signalResults.ao === 'sell',
      
      // Свечные паттерны для продажи
      hammer: () => signalResults.hammer === 'sell',
      shootingStar: () => signalResults.shootingStar === 'sell',
      harami: () => signalResults.harami === 'sell', 
      bullishEngulfing: () => signalResults.bullishEngulfing === 'sell',
      bearishEngulfing: () => signalResults.bearishEngulfing === 'sell',
      doji: () => signalResults.doji === 'sell'
    };
    
    // Получаем решение о покупке/продаже из конфигурации инструмента
    const buySignal = strategyConfig.triggers?.buySignal(signalContext);
    const sellSignal = strategyConfig.triggers?.sellSignal(sellSignalContext);
    
    // Определяем какой именно сигнал сработал (для статистики)
    let triggerSignal = 'unknown';
    if (buySignal) {
      // Для покупки ищем активные buy сигналы
      for (const [signalName, result] of Object.entries(signalResults)) {
        if (result === 'buy' && signalContext[signalName as keyof SignalContext]?.()) {
          triggerSignal = signalName;
          break;
        }
      }
    } else if (sellSignal) {
      // Для продажи ищем активные sell сигналы
      for (const [signalName, result] of Object.entries(signalResults)) {
        if (result === 'sell' && sellSignalContext[signalName as keyof SignalContext]?.()) {
          triggerSignal = signalName;
          break;
        }
      }
    }
    
    // Покупка (если нет позиции)
    if (buySignal && position === 0) {
      // Используем размер лота из конфигурации инструмента
      const lotSize = strategyConfig.orderLots || 1;
      const commission = (lotSize * currentPrice) * (BACKTEST_CONFIG.commission / 100);
      const totalCost = (lotSize * currentPrice) + commission;
      
      // Проверяем, хватает ли средств
      if (balance >= totalCost) {
        balance -= totalCost;
        position = lotSize;
        positionValue = lotSize * currentPrice;
        
        const trade: TradeRecord = {
          date: currentCandle.time || new Date(),
          type: 'BUY',
          price: currentPrice,
          quantity: lotSize,
          amount: totalCost,
          balance,
          signal: triggerSignal
        };
        
        trades.push(trade);
        
        console.log(`🟢 ПОКУПКА | ${trade.date.toLocaleDateString()}, ${trade.date.toLocaleTimeString()} | ${lotSize}x${currentPrice.toFixed(2)} = ${totalCost.toFixed(2)} руб. | Позиция: ${position} | Сигнал: ${triggerSignal}`);
      } else {
        console.log(`⚠️  Недостаточно средств для покупки ${lotSize} лотов по ${currentPrice.toFixed(2)} руб.`);
      }
    }
    
    // Продажа (если есть позиция)
    else if (sellSignal && position > 0) {
      const grossAmount = position * currentPrice;
      const commission = grossAmount * (BACKTEST_CONFIG.commission / 100);
      const netAmount = grossAmount - commission;
      const profit = netAmount - positionValue;
      
      balance += netAmount;
      
      const trade: TradeRecord = {
        date: currentCandle.time || new Date(),
        type: 'SELL',
        price: currentPrice,
        quantity: position,
        amount: netAmount,
        balance,
        profit,
        signal: triggerSignal
      };
      
      trades.push(trade);
      
      // Обновляем статистику сигналов
      if (!signalsSummary[triggerSignal]) {
        signalsSummary[triggerSignal] = { total: 0, profitable: 0, totalProfit: 0 };
      }
      signalsSummary[triggerSignal].total++;
      signalsSummary[triggerSignal].totalProfit += profit;
      if (profit > 0) {
        signalsSummary[triggerSignal].profitable++;
      }
      
      console.log(`🔴 ПРОДАЖА | ${trade.date.toLocaleDateString()}, ${trade.date.toLocaleTimeString()} | ${position}x${currentPrice.toFixed(2)} = ${netAmount.toFixed(2)} руб. | Прибыль: ${profit.toFixed(2)} руб. | Сигнал: ${triggerSignal}`);
      
      position = 0;
      positionValue = 0;
    }
  }
  
  // Подсчитываем статистику
  const totalProfit = balance - BACKTEST_CONFIG.initialBalance;
  // Если есть открытая позиция, добавляем её текущую стоимость к балансу (но не создаем сделку)
  const finalBalance = balance + (position > 0 ? position * (candles[candles.length - 1].close ? Helpers.toNumber(candles[candles.length - 1].close!) : 0) : 0);
  const finalProfit = finalBalance - BACKTEST_CONFIG.initialBalance;
  const totalProfitPercent = (finalProfit / BACKTEST_CONFIG.initialBalance) * 100;
  const profitableTrades = trades.filter(t => t.type === 'SELL' && t.profit! > 0).length;
  const sellTrades = trades.filter(t => t.type === 'SELL').length;
  
  // Максимальная просадка
  let maxDrawdown = 0;
  let peak = BACKTEST_CONFIG.initialBalance;
  let currentBalance = BACKTEST_CONFIG.initialBalance;
  
  for (const trade of trades) {
    currentBalance = trade.balance + (position * trade.price);
    if (currentBalance > peak) {
      peak = currentBalance;
    }
    const drawdown = ((peak - currentBalance) / peak) * 100;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }
  
  // Коэффициент Шарпа (упрощенный)
  const returns = trades.filter(t => t.type === 'SELL').map(t => t.profit! / BACKTEST_CONFIG.initialBalance);
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + Math.pow(b - avgReturn, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  const sharpeRatio = stdDev === 0 ? 0 : avgReturn / stdDev;
  
  return {
    instrument: instrumentInfo.name,
    ticker: instrumentInfo.ticker,
    totalTrades: sellTrades,
    profitableTrades,
    totalProfit: finalProfit,
    totalProfitPercent,
    maxDrawdown,
    sharpeRatio,
    trades,
    signalsSummary
  };
}

function printResults(result: BacktestResult) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 РЕЗУЛЬТАТЫ БЭКТЕСТА');
  console.log('='.repeat(60));
  
  console.log(`🏷️  Инструмент: ${result.instrument} (${result.ticker})`);
  console.log(`💰 Начальная сумма: ${BACKTEST_CONFIG.initialBalance.toLocaleString()} руб.`);
  console.log(`💵 Итоговая сумма: ${(BACKTEST_CONFIG.initialBalance + result.totalProfit).toLocaleString()} руб.`);
  console.log(`📈 Общая прибыль: ${result.totalProfit.toFixed(2)} руб. (${result.totalProfitPercent.toFixed(2)}%)`);
  console.log(`📊 Всего сделок: ${result.totalTrades}`);
  console.log(`✅ Прибыльных сделок: ${result.profitableTrades} (${result.totalTrades > 0 ? (result.profitableTrades / result.totalTrades * 100).toFixed(1) : 0}%)`);
  
  // Показываем информацию о незакрытых позициях если есть
  const hasPendingPosition = result.trades.filter(t => t.type === 'BUY').length > result.trades.filter(t => t.type === 'SELL').length;
  if (hasPendingPosition) {
    console.log(`📋 Есть незакрытая позиция (учтена в итоговом балансе по рыночной цене)`);
  }
  
  console.log(`📉 Максимальная просадка: ${result.maxDrawdown.toFixed(2)}%`);
  console.log(`📊 Коэффициент Шарпа: ${result.sharpeRatio.toFixed(2)}`);
  
  console.log(`\n📊 Статистика по сигналам:`);
  for (const [signal, stats] of Object.entries(result.signalsSummary)) {
    const winRate = stats.total > 0 ? (stats.profitable / stats.total * 100).toFixed(1) : '0';
    console.log(`  ${signal}: ${stats.total} сделок, ${stats.profitable} прибыльных (${winRate}%), прибыль: ${stats.totalProfit.toFixed(2)} руб.`);
  }
  
  // Детальный вывод всех сделок
  console.log(`\n📋 ДЕТАЛИ ВСЕХ СДЕЛОК:`);
  console.log('='.repeat(60));
  
  if (result.trades.length === 0) {
    console.log('❌ Сделок не было');
  } else {
    let currentProfit = 0;
    for (let i = 0; i < result.trades.length; i++) {
      const trade = result.trades[i];
      const dateStr = trade.date.toLocaleDateString('ru-RU');
      const timeStr = trade.date.toLocaleTimeString('ru-RU');
      
      if (trade.type === 'BUY') {
        console.log(`${i + 1}. 🟢 ПОКУПКА | ${dateStr} ${timeStr}`);
        console.log(`   Количество: ${trade.quantity} шт.`);
        console.log(`   Цена: ${trade.price.toFixed(2)} руб.`);
        console.log(`   Сумма: ${trade.amount.toFixed(2)} руб. (с комиссией)`);
        console.log(`   Сигнал: ${trade.signal}`);
        console.log(`   Баланс после покупки: ${trade.balance.toFixed(2)} руб.`);
      } else {
        currentProfit += trade.profit || 0;
        const profitIcon = (trade.profit || 0) > 0 ? '📈' : '📉';
        console.log(`${i + 1}. 🔴 ПРОДАЖА | ${dateStr} ${timeStr}`);
        console.log(`   Количество: ${trade.quantity} шт.`);
        console.log(`   Цена: ${trade.price.toFixed(2)} руб.`);
        console.log(`   Сумма: ${trade.amount.toFixed(2)} руб. (после комиссии)`);
        console.log(`   Сигнал: ${trade.signal}`);
        console.log(`   ${profitIcon} Прибыль/убыток: ${(trade.profit || 0).toFixed(2)} руб.`);
        console.log(`   Накопленная прибыль: ${currentProfit.toFixed(2)} руб.`);
        console.log(`   Баланс после продажи: ${trade.balance.toFixed(2)} руб.`);
      }
      console.log('');
    }
  }
  
  // Проверяем наличие незакрытых позиций
  const lastCandle = result.trades.length > 0 ? result.trades[result.trades.length - 1] : null;
  if (lastCandle && result.trades.filter(t => t.type === 'BUY').length > result.trades.filter(t => t.type === 'SELL').length) {
    console.log(`⚠️  ВНИМАНИЕ: Остались незакрытые позиции!`);
    console.log(`   Их рыночная стоимость учтена в итоговом балансе.`);
    console.log('');
  }
  
  if (result.totalProfit > 0) {
    console.log(`\n🎉 Стратегия показала положительный результат!`);
  } else {
    console.log(`\n⚠️  Стратегия показала отрицательный результат.`);
  }
  
  console.log('='.repeat(60));
}
