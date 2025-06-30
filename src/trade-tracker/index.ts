/**
 * Модуль для отслеживания и записи торговых сделок
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { Logger } from '@vitalets/logger';

export interface TradeRecord {
  id: string;
  timestamp: Date;
  figi: string;
  instrumentName: string;
  action: 'buy' | 'sell';
  quantity: number;
  price: number;
  totalAmount: number;
  commission: number;
  profit?: number; // только для продаж
  profitPercent?: number; // только для продаж
  signals: string[]; // какие сигналы сработали
  triggerExpression?: string; // выражение триггера (если используется)
  sessionDate: string; // дата торговой сессии (YYYY-MM-DD)
}

export class TradeTracker {
  private logger: Logger;
  private tradesFilePath: string;
  private tradesMemory: TradeRecord[] = []; // In-memory хранение для serverless

  constructor() {
    this.logger = new Logger({ prefix: '[TradeTracker]:', level: 'info' });
    if (this.isYandexCloud()) {
      this.logger.info('Yandex Cloud обнаружен: используем in-memory хранение сделок');
      this.tradesFilePath = '';
    } else {
      const isServerless = this.isServerlessEnvironment();
      const baseDir = isServerless ? '/tmp' : process.cwd();
      this.tradesFilePath = join(baseDir, 'trades.json');
    }
  }

  private isYandexCloud(): boolean {
    return !!(
      process.env.YANDEX_CLOUD_FUNCTION_NAME ||
      process.env.YANDEX_CLOUD_FUNCTION_VERSION ||
      process.env._YANDEX_CLOUD_
    );
  }

  private isServerlessEnvironment(): boolean {
    return !!(
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env._HANDLER ||
      process.env.LAMBDA_TASK_ROOT ||
      process.env.YANDEX_CLOUD_FUNCTION_NAME ||
      process.env.YANDEX_CLOUD_FUNCTION_VERSION
    );
  }

  /**
   * Записать новую сделку
   */
  recordTrade(trade: Omit<TradeRecord, 'id' | 'timestamp' | 'sessionDate'>): TradeRecord {
    const now = new Date();
    const tradeRecord: TradeRecord = {
      ...trade,
      id: this.generateTradeId(),
      timestamp: now,
      sessionDate: this.formatDate(now),
    };

    if (this.isYandexCloud()) {
      // В Yandex Cloud: только память + логи (без переменных окружения)
      this.tradesMemory.push(tradeRecord);
      this.logger.info(
        `[YANDEX] Сделка записана: ${trade.action} ${trade.quantity} ${trade.instrumentName} по ${trade.price}`
      );
      this.logger.info(`[TRADE_DATA]: ${JSON.stringify(tradeRecord)}`);
    } else {
      // Обычная файловая запись
      const trades = this.loadTrades();
      trades.push(tradeRecord);
      this.saveTrades(trades);
    }

    this.logger.info(`Записана сделка: ${trade.action} ${trade.quantity} ${trade.instrumentName} по ${trade.price}`);
    return tradeRecord;
  }

  /**
   * Получить все сделки
   */
  loadTrades(): TradeRecord[] {
    // В Yandex Cloud используем только память
    if (this.isYandexCloud()) {
      return this.tradesMemory;
    }

    // В локальном окружении используем файлы
    if (!existsSync(this.tradesFilePath)) {
      return [];
    }

    try {
      const data = readFileSync(this.tradesFilePath, 'utf8');
      if (!data.trim()) {
        return [];
      }
      const trades = JSON.parse(data);
      return trades.map((trade: TradeRecord) => ({
        ...trade,
        timestamp: new Date(trade.timestamp),
      }));
    } catch (error) {
      this.logger.error('Ошибка при загрузке сделок:', error);
      return [];
    }
  }

  /**
   * Очистить сделки (только для локального окружения)
   */
  clearTrades() {
    if (this.isYandexCloud()) {
      this.tradesMemory = [];
      this.logger.info('Сделки очищены из памяти (Yandex Cloud)');
      return;
    }
    try {
      writeFileSync(this.tradesFilePath, '[]', 'utf8');
      this.logger.info('Файл сделок очищен');
    } catch (error) {
      this.logger.error('Ошибка при очистке файла сделок:', error);
    }
  }

  private saveTrades(trades: TradeRecord[]) {
    if (this.isYandexCloud()) {
      // В Yandex Cloud не сохраняем в файлы
      return;
    }

    try {
      writeFileSync(this.tradesFilePath, JSON.stringify(trades, null, 2), 'utf8');
    } catch (error) {
      this.logger.error('Ошибка при сохранении сделок:', error);
    }
  }

  private generateTradeId(): string {
    return `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
