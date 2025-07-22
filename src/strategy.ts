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
import { getNewInstrumentConfig } from './instrument-configs.js';
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

// Интерфейс для базового сигнала
interface BaseSignal {
  calc(params: { candles: any[], profit: number }): 'buy' | 'sell' | null;
  minCandlesCount: number;
}

// Реестр сигналов для автоматического управления
interface SignalRegistry {
  [key: string]: {
    instance?: BaseSignal;
    signalClass: any;
    configKey: string;
  };
}

export class Strategy extends RobotModule {
  instrument: FigiInstrument;
  currentProfit = 0;

  // Реестр всех возможных сигналов
  private signalRegistry: SignalRegistry = {
    profit: { signalClass: ProfitLossSignal, configKey: 'profit' },
    sma: { signalClass: SmaCrossoverSignal, configKey: 'sma' },
    rsi: { signalClass: RsiCrossoverSignal, configKey: 'rsi' },
    bollinger: { signalClass: BollingerBandsSignal, configKey: 'bollinger' },
    macd: { signalClass: MacdSignal, configKey: 'macd' },
    ema: { signalClass: EmaCrossoverSignal, configKey: 'ema' },
    ac: { signalClass: AcSignal, configKey: 'ac' },
    ao: { signalClass: AoSignal, configKey: 'ao' },
    cci: { signalClass: CciSignal, configKey: 'cci' },
    stochastic: { signalClass: StochasticSignal, configKey: 'stochastic' },
    williams: { signalClass: WilliamsRSignal, configKey: 'williams' },
    adx: { signalClass: AdxSignal, configKey: 'adx' },
    psar: { signalClass: PSARSignal, configKey: 'psar' },
    supertrend: { signalClass: SuperTrendSignal, configKey: 'supertrend' },
    move: { signalClass: MoveSignal, configKey: 'move' },
    roc: { signalClass: RocSignal, configKey: 'roc' }
  };

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

    // Автоматическая инициализация всех сигналов через реестр
    Object.entries(this.signalRegistry).forEach(([signalName, signalInfo]) => {
      const config = (signals as any)[signalInfo.configKey];
      if (config) {
        signalInfo.instance = new signalInfo.signalClass(this, config);
      }
    });
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
   * Использует новую логику функций-триггеров.
   */
  protected calcSignal() {
    // Проверяем, использует ли стратегия новые функции-триггеры
    const newConfig = this.getNewConfig();
    if (newConfig?.triggers?.buySignal || newConfig?.triggers?.sellSignal) {
      // Создаем контекст с функциями сигналов
      const signalContext = this.createSignalContext();
      
      // Проверяем сигналы покупки и продажи
      try {
        if (newConfig.triggers.sellSignal?.(signalContext)) return 'sell';
        if (newConfig.triggers.buySignal?.(signalContext)) return 'buy';
      } catch (error) {
        this.logger.error('Ошибка выполнения триггера:', error);
      }
      
      return null;
    }
    
    // Если нет новых триггеров, возвращаем null (нет сигнала)
    return null;
  }

  /**
   * Создать контекст с функциями сигналов
   */
  private createSignalContext(): import('./instruments/base-config.js').SignalContext {
    const signalParams = {
      candles: this.instrument.candles,
      profit: this.currentProfit
    };

    // Автоматически создаем контекст через реестр
    const context: any = {};
    
    Object.entries(this.signalRegistry).forEach(([signalName, signalInfo]) => {
      context[signalName] = () => {
        if (!signalInfo.instance) return false;
        
        const result = signalInfo.instance.calc(signalParams);
        
        // Для profit сигнала проверяем 'sell', для остальных - 'buy'
        return signalName === 'profit' ? result === 'sell' : result === 'buy';
      };
    });

    return context;
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
      
      // Записываем сделку и отправляем уведомление
      await this.recordBuyTrade(currentPrice, this.config.orderLots);
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
      quantity: availableLots, // необходима продажа все, что есть
      price: this.api.helpers.toQuotation(currentPrice),
    };

    this.logger.warn([
      `Продаем по цене ${currentPrice}.`,
      `Расчетная маржа: ${this.currentProfit > 0 ? '+' : ''}${this.currentProfit.toFixed(2)}%`
    ].join(' '));

    await this.robot.orders.postLimitOrder(orderReq);
    
    // Записываем сделку и отправляем уведомление
    await this.recordSellTrade(currentPrice, availableLots);
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
    const minCounts = Object.values(this.signalRegistry)
      .filter(signalInfo => signalInfo.instance)
      .map(signalInfo => signalInfo.instance!.minCandlesCount);
    
    return minCounts.length > 0 ? Math.max(...minCounts) : 0;
  }

  /**
   * Новые методы для работы с триггерами из нового формата конфигураций
   */

  /**
   * Получить новую конфигурацию с триггерами
   */
  private getNewConfig() {
    return getNewInstrumentConfig(this.config.figi);
  }

  /**
   * Записать сделку покупки
   */
  private async recordBuyTrade(price: number, quantity: number) {
    const lotSize = this.instrument.getLotSize();
    const totalAmount = price * quantity * lotSize;
    const commission = totalAmount * this.config.brokerFee / 100;
    const activeSignals = this.getActiveSignals();
    
    await this.robot.recordTrade({
      figi: this.config.figi,
      instrumentName: this.instrument.getDisplayName() || this.config.figi,
      action: 'buy',
      quantity,
      price,
      totalAmount,
      commission,
      signals: activeSignals,
    });
  }

  /**
   * Записать сделку продажи
   */
  private async recordSellTrade(price: number, quantity: number) {
    const lotSize = this.instrument.getLotSize();
    const totalAmount = price * quantity * lotSize;
    const commission = totalAmount * this.config.brokerFee / 100;
    const activeSignals = this.getActiveSignals();
    
    await this.robot.recordTrade({
      figi: this.config.figi,
      instrumentName: this.instrument.getDisplayName() || this.config.figi,
      action: 'sell',
      quantity,
      price,
      totalAmount,
      commission,
      profit: this.currentProfit * totalAmount / 100, // прибыль в рублях
      profitPercent: this.currentProfit,
      signals: activeSignals,
    });
  }

  /**
   * Получить список активных сигналов
   */
  private getActiveSignals(): string[] {
    const signalParams = { candles: this.instrument.candles, profit: this.currentProfit };
    const signals: string[] = [];
    
    // Автоматически проверяем все сигналы через реестр
    Object.entries(this.signalRegistry).forEach(([signalName, signalInfo]) => {
      if (!signalInfo.instance) return;
      
      const result = signalInfo.instance.calc(signalParams);
      const isActive = signalName === 'profit' ? result === 'sell' : result === 'buy';
      
      if (isActive) {
        signals.push(signalName);
      }
    });
    
    return signals.length > 0 ? signals : ['manual'];
  }
}
