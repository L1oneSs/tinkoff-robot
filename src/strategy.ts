/**
 * Стратегия торговли.
 *
 * Особенности:
 * - все заявки выставляются только лимитные
 * - если актив уже куплен, то повторной покупки не происходит
 */

/* eslint-disable max-statements */

import { CandleInterval } from 'tinkoff-invest-api/dist/generated/marketdata.js';
import { RobotModule } from './utils/robot-module.js';
import { LimitOrderReq } from './account/orders.js';
import { Robot } from './robot.js';
import { ProfitLossSignal, ProfitLossSignalConfig } from './signals/profit-loss.js';
import { FigiInstrument } from './figi.js';
import { OrderDirection } from 'tinkoff-invest-api/dist/generated/orders.js';
import { Logger } from '@vitalets/logger';

// Импорт всех сигналов
import {
  SmaCrossoverSignal, SmaCrossoverSignalConfig,
  RsiCrossoverSignal, RsiCrossoverSignalConfig,
  BollingerBandsSignal, BollingerBandsSignalConfig,
  MacdSignal, MacdSignalConfig,
  EmaCrossoverSignal, EmaCrossoverSignalConfig,
  AcSignal, AcSignalConfig,
  AoSignal, AoSignalConfig,
  CciSignal, CciSignalConfig,
  StochasticSignal, StochasticSignalConfig,
  WilliamsRSignal, WilliamsRSignalConfig,
  AdxSignal, AdxSignalConfig,
  PSARSignal, PSARSignalConfig,
  SuperTrendSignal, SuperTrendSignalConfig,
  MoveSignal, MoveSignalConfig,
  RocSignal, RocSignalConfig
} from './signals/self-trading-indicators/index.js';

export interface StrategyConfig {
  /** ID инструмента */
  figi: string;
  /** Активен ли инструмент для торговли */
  enabled: boolean;
  /** Кол-во лотов в заявке на покупку */
  orderLots: number;
  /** Комиссия брокера, % от суммы сделки */
  brokerFee: number;
  /** Интервал свечей */
  interval: CandleInterval;
  
  // Конфигурации сигналов (все опциональные)
  signals?: {
    profit?: ProfitLossSignalConfig;
    sma?: SmaCrossoverSignalConfig;
    rsi?: RsiCrossoverSignalConfig;
    bollinger?: BollingerBandsSignalConfig;
    macd?: MacdSignalConfig;
    ema?: EmaCrossoverSignalConfig;
    ac?: AcSignalConfig;
    ao?: AoSignalConfig;
    cci?: CciSignalConfig;
    stochastic?: StochasticSignalConfig;
    williams?: WilliamsRSignalConfig;
    adx?: AdxSignalConfig;
    psar?: PSARSignalConfig;
    supertrend?: SuperTrendSignalConfig;
    move?: MoveSignalConfig;
    roc?: RocSignalConfig;
  };
}

export class Strategy extends RobotModule {
  instrument: FigiInstrument;
  currentProfit = 0;

  // Используемые сигналы - все возможные типы
  profitSignal?: ProfitLossSignal;
  smaSignal?: SmaCrossoverSignal;
  rsiSignal?: RsiCrossoverSignal;
  bollingerSignal?: BollingerBandsSignal;
  macdSignal?: MacdSignal;
  emaSignal?: EmaCrossoverSignal;
  acSignal?: AcSignal;
  aoSignal?: AoSignal;
  cciSignal?: CciSignal;
  stochasticSignal?: StochasticSignal;
  williamsSignal?: WilliamsRSignal;
  adxSignal?: AdxSignal;
  psarSignal?: PSARSignal;
  supertrendSignal?: SuperTrendSignal;
  moveSignal?: MoveSignal;
  rocSignal?: RocSignal;

  constructor(robot: Robot, public config: StrategyConfig) {
    super(robot);
    this.logger = new Logger({ prefix: `[strategy_${config.figi}]:`, level: robot.logger.level });
    this.instrument = new FigiInstrument(robot, this.config.figi);
    this.initializeSignals();
  }

  /**
   * Инициализация сигналов на основе конфигурации
   */
  private initializeSignals() {
    const signals = this.config.signals;
    if (!signals) return;

    this.initializePrimarySignals(signals);
    this.initializeOscillators(signals);
    this.initializeTrendSignals(signals);
    this.initializeMomentumSignals(signals);
  }

  private initializePrimarySignals(signals: any) {
    if (signals.profit) this.profitSignal = new ProfitLossSignal(this, signals.profit);
    if (signals.sma) this.smaSignal = new SmaCrossoverSignal(this, signals.sma);
    if (signals.rsi) this.rsiSignal = new RsiCrossoverSignal(this, signals.rsi);
    if (signals.bollinger) this.bollingerSignal = new BollingerBandsSignal(this, signals.bollinger);
    if (signals.macd) this.macdSignal = new MacdSignal(this, signals.macd);
    if (signals.ema) this.emaSignal = new EmaCrossoverSignal(this, signals.ema);
  }

  private initializeOscillators(signals: any) {
    if (signals.ac) this.acSignal = new AcSignal(this, signals.ac);
    if (signals.ao) this.aoSignal = new AoSignal(this, signals.ao);
    if (signals.cci) this.cciSignal = new CciSignal(this, signals.cci);
    if (signals.stochastic) this.stochasticSignal = new StochasticSignal(this, signals.stochastic);
    if (signals.williams) this.williamsSignal = new WilliamsRSignal(this, signals.williams);
  }

  private initializeTrendSignals(signals: any) {
    if (signals.adx) this.adxSignal = new AdxSignal(this, signals.adx);
    if (signals.psar) this.psarSignal = new PSARSignal(this, signals.psar);
    if (signals.supertrend) this.supertrendSignal = new SuperTrendSignal(this, signals.supertrend);
  }

  private initializeMomentumSignals(signals: any) {
    if (signals.move) this.moveSignal = new MoveSignal(this, signals.move);
    if (signals.roc) this.rocSignal = new RocSignal(this, signals.roc);
  }

  /**
   * Входная точка: запуск стратегии.
   */
  async run() {
    // Проверяем, активна ли стратегия
    if (!this.config.enabled) {
      this.logger.info('Стратегия отключена в конфигурации');
      return;
    }
    
    await this.instrument.loadInfo();
    if (!this.instrument.isTradingAvailable()) return;
    await this.loadCandles();
    this.calcCurrentProfit();
    const signal = this.calcSignal();
    if (signal) {
      await this.robot.orders.cancelExistingOrders(this.config.figi);
      await this.robot.portfolio.loadPositionsWithBlocked();
      if (signal === 'buy') await this.buy();
      if (signal === 'sell') await this.sell();
    }
  }

  /**
   * Загрузка свечей.
   */
  protected async loadCandles() {
    await this.instrument.loadCandles({
      interval: this.config.interval,
      minCount: this.calcRequiredCandlesCount(),
    });
  }

  /**
   * Расчет сигнала к покупке или продаже.
   * Комбинирует сигналы от всех активных индикаторов.
   */
  protected calcSignal() {
    const signalParams = { candles: this.instrument.candles, profit: this.currentProfit };
    const signals = this.calculateAllSignals(signalParams);
    this.logSignals(signals);
    return this.prioritizeSignals(signals);
  }

  private calculateAllSignals(signalParams: any) {
    return {
      profit: this.profitSignal?.calc(signalParams),
      sma: this.smaSignal?.calc(signalParams),
      rsi: this.rsiSignal?.calc(signalParams),
      bollinger: this.bollingerSignal?.calc(signalParams),
      macd: this.macdSignal?.calc(signalParams),
      ema: this.emaSignal?.calc(signalParams),
      ac: this.acSignal?.calc(signalParams),
      ao: this.aoSignal?.calc(signalParams),
      cci: this.cciSignal?.calc(signalParams),
      stochastic: this.stochasticSignal?.calc(signalParams),
      williams: this.williamsSignal?.calc(signalParams),
      adx: this.adxSignal?.calc(signalParams),
      psar: this.psarSignal?.calc(signalParams),
      supertrend: this.supertrendSignal?.calc(signalParams),
      move: this.moveSignal?.calc(signalParams),
      roc: this.rocSignal?.calc(signalParams),
    };
  }

  private prioritizeSignals(signals: Record<string, any>) {
    // 1. Управление рисками (самый важный)
    if (signals.profit) return signals.profit;
    
    // 2. Трендовые индикаторы
    const trendSignal = this.getTrendSignal(signals);
    if (trendSignal) return trendSignal;
    
    // 3. Осцилляторы
    const oscillatorSignal = this.getOscillatorSignal(signals);
    if (oscillatorSignal) return oscillatorSignal;
    
    // 4. Скользящие средние
    const movingAverageSignal = this.getMovingAverageSignal(signals);
    if (movingAverageSignal) return movingAverageSignal;
    
    // 5. Остальные сигналы
    return this.getOtherSignals(signals);
  }

  private getTrendSignal(signals: Record<string, any>) {
    return signals.adx || signals.supertrend || signals.psar;
  }

  private getOscillatorSignal(signals: Record<string, any>) {
    return signals.rsi || signals.stochastic || signals.williams || signals.cci;
  }

  private getMovingAverageSignal(signals: Record<string, any>) {
    return signals.sma || signals.ema || signals.macd;
  }

  private getOtherSignals(signals: Record<string, any>) {
    return signals.ac || signals.ao || signals.move || signals.roc || signals.bollinger;
  }

  /**
   * Покупка.
   */
  protected async buy() {
    const availableLots = this.calcAvailableLots();
    if (availableLots > 0) {
      this.logger.warn(`Позиция уже в портфеле, лотов ${availableLots}. Ждем сигнала к продаже...`);
      return;
    }

    const currentPrice = this.instrument.getCurrentPrice();
    const orderReq: LimitOrderReq = {
      figi: this.config.figi,
      direction: OrderDirection.ORDER_DIRECTION_BUY,
      quantity: this.config.orderLots,
      price: this.api.helpers.toQuotation(this.instrument.getCurrentPrice()),
    };

    if (this.checkEnoughCurrency(orderReq)) {
      this.logger.warn(`Покупаем по цене ${currentPrice}.`);
      await this.robot.orders.postLimitOrder(orderReq);
    }
  }

  /**
   * Продажа.
   */
  protected async sell() {
    const availableLots = this.calcAvailableLots();
    if (availableLots === 0) {
      this.logger.warn(`Позиции в портфеле нет. Ждем сигнала к покупке...`);
      return;
    }

    const currentPrice = this.instrument.getCurrentPrice();
    const orderReq: LimitOrderReq = {
      figi: this.config.figi,
      direction: OrderDirection.ORDER_DIRECTION_SELL,
      quantity: availableLots, // продаем все, что есть
      price: this.api.helpers.toQuotation(currentPrice),
    };

    this.logger.warn([
      `Продаем по цене ${currentPrice}.`,
      `Расчетная маржа: ${this.currentProfit > 0 ? '+' : ''}${this.currentProfit.toFixed(2)}%`
    ].join(' '));

    await this.robot.orders.postLimitOrder(orderReq);
  }

  /**
   * Кол-во лотов в портфеле.
   */
  protected calcAvailableLots() {
    const availableQty = this.robot.portfolio.getAvailableQty(this.config.figi);
    const lotSize = this.instrument.getLotSize();
    return Math.round(availableQty / lotSize);
  }

  /**
   * Достаточно ли денег для заявки на покупку.
   */
  protected checkEnoughCurrency(orderReq: LimitOrderReq) {
    const price = this.api.helpers.toNumber(orderReq.price!);
    const orderPrice = price * orderReq.quantity * this.instrument.getLotSize();
    const orderPriceWithComission = orderPrice * (1 + this.config.brokerFee / 100);
    const balance = this.robot.portfolio.getBalance();
    if (orderPriceWithComission > balance) {
      this.logger.warn(`Недостаточно средств для покупки: ${orderPriceWithComission} > ${balance}`);
      return false;
    }
    return true;
  }

  /**
   * Расчет профита в % за продажу 1 шт инструмента по текущей цене (с учетом комиссий).
   * Вычисляется относительно цены покупки, которая берется из portfolio.
   */
  protected calcCurrentProfit() {
    const buyPrice = this.robot.portfolio.getBuyPrice(this.config.figi);
    if (!buyPrice) {
      this.currentProfit = 0;
      return;
    }
    const currentPrice = this.instrument.getCurrentPrice();
    const comission = (buyPrice + currentPrice) * this.config.brokerFee / 100;
    const profit = currentPrice - buyPrice - comission;
    this.currentProfit = 100 * profit / buyPrice;
  }

  /**
   * Расчет необходимого кол-ва свечей, чтобы хватило всем сигналам.
   */
  protected calcRequiredCandlesCount() {
    const signals = [
      this.profitSignal, this.smaSignal, this.rsiSignal, this.bollingerSignal,
      this.macdSignal, this.emaSignal, this.acSignal, this.aoSignal,
      this.cciSignal, this.stochasticSignal, this.williamsSignal, this.adxSignal,
      this.psarSignal, this.supertrendSignal, this.moveSignal, this.rocSignal,
    ];
    
    const minCounts = signals
      .filter(signal => signal !== undefined)
      .map(signal => signal!.minCandlesCount);
    
    return minCounts.length > 0 ? Math.max(...minCounts) : 0;
  }

  protected logSignals(signals: Record<string, unknown>) {
    const time = this.instrument.candles[this.instrument.candles.length - 1].time?.toLocaleString();
    this.logger.warn(`Сигналы: ${Object.keys(signals).map(k => `${k}=${signals[k] || 'wait'}`).join(', ')} (${time})`);
  }

  /**
   * Новые методы для работы с триггерами из нового формата конфигураций
   */

  /**
   * Получить новую конфигурацию с триггерами
   */
  getNewConfig() {
    const { getNewInstrumentConfig } = require('./instrument-configs.js');
    return getNewInstrumentConfig(this.config.figi);
  }

  /**
   * Проверить сигнал покупки по новым триггерам
   */
  shouldBuyWithTriggers(): boolean {
    const newConfig = this.getNewConfig();
    if (!newConfig?.triggers?.buySignal) return false;

    const signalStates = this.getSignalStates();
    return this.evaluateTriggers(newConfig.triggers.buySignal, signalStates);
  }

  /**
   * Проверить сигнал продажи по новым триггерам
   */
  shouldSellWithTriggers(): boolean {
    const newConfig = this.getNewConfig();
    if (!newConfig?.triggers?.sellSignal) return false;

    const signalStates = this.getSignalStates();
    return this.evaluateTriggers(newConfig.triggers.sellSignal, signalStates);
  }

  /**
   * Получить состояния всех сигналов
   */
  private getSignalStates(): Record<string, boolean> {
    const states: Record<string, boolean> = {};
    const signalParams = {
      candles: this.instrument.candles,
      profit: this.currentProfit
    };

    // Проверяем все сигналы и записываем их состояния
    if (this.profitSignal) states.profit = this.profitSignal.calc(signalParams) === 'sell';
    if (this.smaSignal) states.sma = this.smaSignal.calc(signalParams) === 'buy';
    if (this.rsiSignal) states.rsi = this.rsiSignal.calc(signalParams) === 'buy';
    if (this.bollingerSignal) states.bollinger = this.bollingerSignal.calc(signalParams) === 'buy';
    if (this.macdSignal) states.macd = this.macdSignal.calc(signalParams) === 'buy';
    if (this.emaSignal) states.ema = this.emaSignal.calc(signalParams) === 'buy';
    if (this.acSignal) states.ac = this.acSignal.calc(signalParams) === 'buy';
    if (this.aoSignal) states.ao = this.aoSignal.calc(signalParams) === 'buy';
    if (this.cciSignal) states.cci = this.cciSignal.calc(signalParams) === 'buy';
    if (this.stochasticSignal) states.stochastic = this.stochasticSignal.calc(signalParams) === 'buy';
    if (this.williamsSignal) states.williams = this.williamsSignal.calc(signalParams) === 'buy';
    if (this.adxSignal) states.adx = this.adxSignal.calc(signalParams) === 'buy';
    if (this.psarSignal) states.psar = this.psarSignal.calc(signalParams) === 'buy';
    if (this.supertrendSignal) states.supertrend = this.supertrendSignal.calc(signalParams) === 'buy';
    if (this.moveSignal) states.move = this.moveSignal.calc(signalParams) === 'buy';
    if (this.rocSignal) states.roc = this.rocSignal.calc(signalParams) === 'buy';

    return states;
  }

  /**
   * Вычисление логических выражений триггеров
   */
  private evaluateTriggers(expression: string, signals: Record<string, boolean>): boolean {
    try {
      // Замещаем названия сигналов на их значения
      let processedExpression = expression;
      
      for (const [signalName, value] of Object.entries(signals)) {
        const regex = new RegExp(`\\b${signalName}\\b`, 'g');
        processedExpression = processedExpression.replace(regex, value.toString());
      }
      
      // Заменяем логические операторы на JavaScript операторы
      processedExpression = processedExpression
        .replace(/&&/g, ' && ')
        .replace(/\|\|/g, ' || ')
        .replace(/!/g, '!')
        .replace(/\(/g, '(')
        .replace(/\)/g, ')');
      
      // Выполняем выражение
      return eval(processedExpression);
    } catch (error) {
      this.logger.error(`Ошибка в выражении триггера: ${expression}`, error);
      return false;
    }
  }
}
