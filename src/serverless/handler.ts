/**
 * Запуск из серверлесс функции.
 */
import { Handler, TimerMessage, fixConsoleForLogging } from 'yandex-cloud-fn';
import { TinkoffInvestApi } from 'tinkoff-invest-api';
import { Logger } from '@vitalets/logger';
import { Robot, RobotConfig } from '../robot.js';
import { config } from '../config.js';
import { SimpleReportSender } from '../reports/simple-reporter.js';

fixConsoleForLogging();

const logger = new Logger({ prefix: '[Handler]:', level: 'info' });

const api = new TinkoffInvestApi({
  token: process.env.TINKOFF_API_TOKEN!,
  appName:' vitalets/tinkoff-robot',
});

const configOverwrite: Partial<RobotConfig> = {
  useRealAccount: true,
  dryRun: false, 
};

export const handler: Handler<TimerMessage> = async event => {
  try {
    // Сначала запускаем торгового робота
    const finalConfig = { ...config, ...configOverwrite };
    logger.log('Конфигурация робота:', {
      useRealAccount: finalConfig.useRealAccount,
      dryRun: finalConfig.dryRun,
      strategiesCount: finalConfig.strategies.length
    });
    
    const robot = new Robot(api, finalConfig);
    await robot.runOnce();
    
    // После торговли проверяем время и отправляем отчёты если нужно
    const reportSender = new SimpleReportSender();
    await reportSender.checkAndSendReports();
    
  } catch (e) {
    throw attachEventToError(e, event);
  }
};

function attachEventToError(error: Error, event: TimerMessage) {
  error.stack += ` EVENT: ${JSON.stringify(event)}`;
  return error;
}
