/**
 * Входная точка для торгового робота.
 * Робот запускает параллельно несколько стратегий, переданных в конфиге.
 */
import { CandlesLoader, RealAccount, SandboxAccount, TinkoffAccount, TinkoffInvestApi } from 'tinkoff-invest-api';
import { Logger, LogLevel } from '@vitalets/logger';
import { existsSync, mkdirSync } from 'fs';
import { Strategy, StrategyConfig } from './strategy.js';
import { Orders } from './account/orders.js';
import { Portfolio } from './account/portfolio.js';
import { TelegramNotifier } from './notifications/telegram.js';
import { TradeTracker } from './trade-tracker/index.js';
import { ReportGenerator } from './reports/generator.js';
import { ReportScheduler } from './scheduler/index.js';

const { REAL_ACCOUNT_ID = '', SANDBOX_ACCOUNT_ID = '' } = process.env;

// Убираем лишние символы из account ID
const cleanRealAccountId = REAL_ACCOUNT_ID.trim();
const cleanSandboxAccountId = SANDBOX_ACCOUNT_ID.trim();

export interface RobotConfig {
  /** Используем реальный счет или песочницу */
  useRealAccount: boolean,
  /** Запуск без создания заявок */
  dryRun?: boolean;
  /** Директория для кеширования свечей */
  cacheDir?: string,
  /** Уровень логирования */
  logLevel?: string,
  /** Используемые стратегии */
  strategies: StrategyConfig[],
  /** Включить уведомления и отчеты */
  enableNotifications?: boolean;
  /** Включить автоматические отчеты */
  enableReports?: boolean;
}

const defaults: Pick<RobotConfig, 'dryRun' | 'cacheDir' | 'logLevel' | 'enableNotifications' | 'enableReports'> = {
  dryRun: false,
  cacheDir: (() => {
    // В serverless окружении используем /tmp для кэша
    const isServerless = !!(
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env._HANDLER ||
      process.env.LAMBDA_TASK_ROOT ||
      process.env.YANDEX_CLOUD_FUNCTION_NAME ||
      process.env.YANDEX_CLOUD_FUNCTION_VERSION
    );
    return isServerless ? '/tmp/.cache' : '.cache';
  })(),
  logLevel: 'info',
  enableNotifications: true,
  enableReports: true,
};

export class Robot {
  config: RobotConfig;
  account: TinkoffAccount;
  candlesLoader: CandlesLoader;
  orders: Orders;
  portfolio: Portfolio;
  strategies: Strategy[];
  
  // Новые модули для уведомлений и отчетов
  telegramNotifier!: TelegramNotifier;
  tradeTracker!: TradeTracker;
  reportGenerator!: ReportGenerator;
  reportScheduler!: ReportScheduler;

  logger: Logger;

  constructor(public api: TinkoffInvestApi, config: RobotConfig) {
    this.config = Object.assign({}, defaults, config);
    this.logger = new Logger({ prefix: '[robot]:', level: this.config.logLevel as LogLevel });
    
    // Используем переданный API (правильный для типа аккаунта)
    this.account = config.useRealAccount
      ? new RealAccount(api, cleanRealAccountId)
      : new SandboxAccount(api, cleanSandboxAccountId);
    
    // Инициализируем кэш
    this.initializeCache();
      
    this.candlesLoader = new CandlesLoader(api, { cacheDir: this.config.cacheDir });
    this.orders = new Orders(this);
    this.portfolio = new Portfolio(this);
    this.strategies = this.config.strategies.map(strategyConfig => new Strategy(this, strategyConfig));
    
    // Инициализируем модули уведомлений и отчетов
    this.initializeModules();
  }

  /**
   * Инициализация папки кэша
   */
  private initializeCache() {
    if (this.config.cacheDir) {
      try {
        if (!existsSync(this.config.cacheDir)) {
          mkdirSync(this.config.cacheDir, { recursive: true });
          this.logger.info(`Создана папка кэша: ${this.config.cacheDir}`);
        }
      } catch (error) {
        this.logger.warn(`Не удалось создать папку кэша ${this.config.cacheDir}:`, error);
        // В случае ошибки, проверим доступность /tmp
        try {
          const tmpCacheDir = '/tmp/.cache';
          if (!existsSync(tmpCacheDir)) {
            mkdirSync(tmpCacheDir, { recursive: true });
            this.logger.info(`Создана резервная папка кэша: ${tmpCacheDir}`);
          }
          this.config.cacheDir = tmpCacheDir;
        } catch (tmpError) {
          this.logger.error('Не удалось создать резервную папку кэша:', tmpError);
          // Отключаем кэширование если не можем создать папку
          this.config.cacheDir = undefined;
        }
      }
    }
  }

  /**
   * Инициализация модулей уведомлений и отчетов
   */
  private initializeModules() {
    this.telegramNotifier = new TelegramNotifier();
    this.tradeTracker = new TradeTracker();
    this.reportGenerator = new ReportGenerator();
    this.reportScheduler = new ReportScheduler(
      this.tradeTracker,
      this.reportGenerator,
      this.telegramNotifier
    );
    
    if (this.config.enableNotifications) {
      this.logger.info('Уведомления включены');
    }
    if (this.config.enableReports) {
      this.logger.info('Автоматические отчеты включены');
    }
  }

  /**
   * Разовый запуск робота на текущих данных.
   * Подходит для запуска по расписанию.
   */
  async runOnce() {
    this.logger.log(`Вызов робота (${this.config.useRealAccount ? 'боевой счет' : 'песочница'})`);
    
    // Проверяем и отправляем отчеты (если включены)
    if (this.config.enableReports) {
      await this.reportScheduler.checkAndSendReports();
    }
    
    await this.portfolio.load();
    await this.orders.load();
    await this.runStrategies();
    this.logger.log(`Вызов робота завершен`);
  }

  // todo: Запуск робота в режиме стрима.
  // async runStream(intervalMinutes = 1) {
  // - take figi from strategies
  // - load candles for all figi
  // - watch prices for all figi
  // }

  private async runStrategies() {
    const tasks = this.strategies.map(strategy => strategy.run());
    await Promise.all(tasks);
  }

  /**
   * Записать сделку и отправить уведомление
   */
  async recordTrade(tradeData: {
    figi: string;
    instrumentName: string;
    action: 'buy' | 'sell';
    quantity: number;
    price: number;
    totalAmount: number;
    commission: number;
    profit?: number;
    profitPercent?: number;
    signals: string[];
    triggerExpression?: string;
  }) {
    if (!this.config.enableNotifications) return;

    try {
      // Записываем сделку
      const trade = this.tradeTracker.recordTrade(tradeData);
      
      // Отправляем уведомление в Telegram
      const notification = this.reportGenerator.formatTradeNotification(trade);
      await this.telegramNotifier.sendMessage(notification);
      
      this.logger.info(`Записана и отправлена информация о сделке: ${trade.action} ${trade.instrumentName}`);
    } catch (error) {
      this.logger.error('Ошибка при записи сделки:', error);
    }
  }

  /**
   * Получить статус планировщика
   */
  getSchedulerStatus(): string {
    return this.reportScheduler.getStatus();
  }

  /**
   * Проверить, торговое ли время
   */
  isTradingTime(): boolean {
    return this.reportScheduler.isTradingTime();
  }
}
