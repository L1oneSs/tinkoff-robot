/**
 * Базовые типы для конфигураций инструментов
 */

import { CandleInterval } from 'tinkoff-invest-api/dist/generated/marketdata.js';
import { ProfitLossSignalConfig } from '../signals/profit-loss.js';
import { 
  SmaCrossoverSignalConfig,
  RsiCrossoverSignalConfig,
  BollingerBandsSignalConfig,
  MacdSignalConfig,
  EmaCrossoverSignalConfig,
  AcSignalConfig,
  AoSignalConfig,
  CciSignalConfig,
  StochasticSignalConfig,
  WilliamsRSignalConfig,
  AdxSignalConfig,
  PSARSignalConfig,
  SuperTrendSignalConfig,
  MoveSignalConfig,
  RocSignalConfig
} from '../signals/self-trading-indicators/index.js';

/**
 * Информация об инструменте
 */
export interface InstrumentInfo {
  /** FIGI инструмента */
  figi: string;
  /** Название инструмента */
  name: string;
  /** Тикер */
  ticker: string;
  /** Сектор экономики */
  sector: string;
}

export type SignalResult = 'buy' | 'sell' | void;

export interface SignalContext {
  profit: () => boolean;
  sma: () => boolean;
  ema: () => boolean;
  rsi: () => boolean;
  bollinger: () => boolean;
  macd: () => boolean;
  williams: () => boolean;
  ac: () => boolean;
  ao: () => boolean;
  cci: () => boolean;
  stochastic: () => boolean;
  adx: () => boolean;
  psar: () => boolean;
  supertrend: () => boolean;
  move: () => boolean;
  roc: () => boolean;
}

export interface InstrumentSignals {
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
}

export interface TradingTriggers {
  /** Функция покупки */
  buySignal: (signals: SignalContext) => boolean;
  /** Функция продажи */
  sellSignal: (signals: SignalContext) => boolean;
  /** Описание стратегии */
  description?: string;
}

export interface BaseInstrumentConfig extends InstrumentInfo {
  /** Активен ли инструмент для торговли */
  enabled: boolean;
  /** Кол-во лотов в заявке */
  orderLots: number;
  /** Комиссия брокера, % от суммы сделки */
  brokerFee: number;
  /** Интервал свечей */
  interval: CandleInterval;
  /** Конфигурации сигналов */
  signals?: InstrumentSignals;
  /** Триггеры покупки/продажи */
  triggers?: TradingTriggers;
}

/**
 * Базовая конфигурация без данных об инструменте
 */
export const DEFAULT_BASE_CONFIG: Omit<BaseInstrumentConfig, 'figi' | 'name' | 'ticker' | 'sector'> = {
  enabled: true,
  orderLots: 1,
  brokerFee: 0.3,
  interval: CandleInterval.CANDLE_INTERVAL_5_MIN,
  signals: {
    profit: {
      takeProfit: 10,
      stopLoss: 5,
    }
  },
  triggers: {
    buySignal: (signals: SignalContext) => signals.profit(),
    sellSignal: (signals: SignalContext) => signals.profit(),
    description: 'Базовая стратегия только на управлении рисками'
  }
};
