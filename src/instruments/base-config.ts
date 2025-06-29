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

export type SignalResult = 'buy' | 'sell' | void;

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
  /** Условие покупки (например: "profit && (sma || ema)") */
  buySignal: string;
  /** Условие продажи (например: "profit || (macd && bollinger)") */
  sellSignal: string;
  /** Описание стратегии */
  description?: string;
}

export interface BaseInstrumentConfig {
  /** ID инструмента */
  figi: string;
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
 * Базовая конфигурация по умолчанию
 */
export const DEFAULT_BASE_CONFIG: Omit<BaseInstrumentConfig, 'figi'> = {
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
    buySignal: 'profit',
    sellSignal: 'profit',
    description: 'Базовая стратегия только на управлении рисками'
  }
};
