/**
 * Конфигурация.
 */
import { RobotConfig } from './robot.js';
import { getActiveInstrumentConfigs } from './instrument-configs.js';

export const config: RobotConfig = {
  /** Используем реальный счет или песочницу */
  useRealAccount: true, // Временно отключаем до получения production токена
  /** Уровень логирования */
  logLevel: 'info',
  /** Используемые стратегии: загружаем из конфигураций инструментов */
  strategies: getActiveInstrumentConfigs()
};
