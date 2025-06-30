/**
 * Централизованный сборщик конфигураций инструментов.
 * Обеспечивает обратную совместимость со старым интерфейсом Strategy.
 */

import { CandleInterval } from 'tinkoff-invest-api/dist/generated/marketdata.js';
import { BaseInstrumentConfig } from './instruments/base-config.js';
import { 
  ROSN_CONFIG, TATN_CONFIG, GAZP_CONFIG, LKOH_CONFIG, NVTK_CONFIG,
  SBER_CONFIG, VTBR_CONFIG, SVCB_CONFIG,
  RUAL_CONFIG, NLMK_CONFIG, GMKN_CONFIG, CHMF_CONFIG, MAGN_CONFIG, ALRS_CONFIG, PLZL_CONFIG,
  MGNT_CONFIG, OZON_CONFIG, FIXP_CONFIG,
  MTSS_CONFIG,
  YNDX_CONFIG, WUSH_CONFIG, VKCO_CONFIG,
  HYDR_CONFIG, IRAO_CONFIG,
  PHOR_CONFIG,
  PIKK_CONFIG,
  AFLT_CONFIG
} from './instruments/index.js';

// Экспорт всех типов из новой структуры
export {
  BaseInstrumentConfig,
  InstrumentSignals,
  TradingTriggers,
  DEFAULT_BASE_CONFIG
} from './instruments/base-config.js';

// Экспорт всех конфигураций
export * from './instruments/index.js';

/**
 * Сборная коллекция всех конфигураций
 */
const ALL_INSTRUMENT_CONFIGS: BaseInstrumentConfig[] = [
  // Нефтегаз
  ROSN_CONFIG,
  TATN_CONFIG,
  GAZP_CONFIG,
  LKOH_CONFIG,
  NVTK_CONFIG,
  
  // Банки
  SBER_CONFIG,
  VTBR_CONFIG,
  SVCB_CONFIG,
  
  // Металлургия и горнодобыча
  RUAL_CONFIG,
  NLMK_CONFIG,
  GMKN_CONFIG,
  CHMF_CONFIG,
  MAGN_CONFIG,
  ALRS_CONFIG,
  PLZL_CONFIG,
  
  // Ритейл
  MGNT_CONFIG,
  OZON_CONFIG,
  FIXP_CONFIG,
  
  // Телекоммуникации
  MTSS_CONFIG,
  
  // Технологии
  YNDX_CONFIG,
  WUSH_CONFIG,
  VKCO_CONFIG,
  
  // Энергетика
  HYDR_CONFIG,
  IRAO_CONFIG,
  
  // Удобрения
  PHOR_CONFIG,
  
  // Недвижимость
  PIKK_CONFIG,
  
  // Авиакосмическая промышленность
  AFLT_CONFIG
];

/**
 * Словарь всех конфигураций для быстрого доступа по FIGI
 */
export const INSTRUMENT_CONFIGS: Record<string, BaseInstrumentConfig> = 
  ALL_INSTRUMENT_CONFIGS.reduce((acc, config) => {
    acc[config.figi] = config;
    return acc;
  }, {} as Record<string, BaseInstrumentConfig>);

/**
 * Совместимость со старым интерфейсом Strategy
 */
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
  
  // Старый формат сигналов для совместимости
  signals?: Record<string, unknown>;
}

/**
 * Преобразование новой конфигурации в старый формат для Strategy
 */
export function convertToStrategyConfig(config: BaseInstrumentConfig): StrategyConfig {
  return {
    figi: config.figi,
    enabled: config.enabled,
    orderLots: config.orderLots,
    brokerFee: config.brokerFee,
    interval: config.interval,
    signals: config.signals as Record<string, unknown>
  };
}

/**
 * Получить конфигурацию для инструмента (старый интерфейс)
 */
export function getInstrumentConfig(figi: string): StrategyConfig | undefined {
  const config = INSTRUMENT_CONFIGS[figi];
  return config ? convertToStrategyConfig(config) : undefined;
}

/**
 * Получить все активные конфигурации (старый интерфейс)
 */
export function getActiveInstrumentConfigs(): StrategyConfig[] {
  return ALL_INSTRUMENT_CONFIGS
    .filter(config => config.enabled)
    .map(convertToStrategyConfig);
}

/**
 * Получить конфигурацию нового формата
 */
export function getNewInstrumentConfig(figi: string): BaseInstrumentConfig | undefined {
  return INSTRUMENT_CONFIGS[figi];
}

/**
 * Получить все активные конфигурации нового формата
 */
export function getActiveNewInstrumentConfigs(): BaseInstrumentConfig[] {
  return ALL_INSTRUMENT_CONFIGS.filter(config => config.enabled);
}

export {};
