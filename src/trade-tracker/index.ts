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

export interface DailyStats {
  date: string;
  totalTrades: number;
  buyTrades: number;
  sellTrades: number;
  totalProfit: number;
  totalProfitPercent: number;
  totalCommission: number;
  instruments: string[];
  signalsUsed: Record<string, number>;
  successfulTrades: number;
  losingTrades: number;
  averageProfit: number;
  bestTrade: TradeRecord | null;
  worstTrade: TradeRecord | null;
}

export interface WeeklyStats {
  weekStart: string;
  weekEnd: string;
  dailyStats: DailyStats[];
  totalProfit: number;
  totalTrades: number;
  totalCommission: number;
  bestDay: string;
  worstDay: string;
  mostActiveInstrument: string;
  mostUsedSignal: string;
}

export class TradeTracker {
  private logger: Logger;
  private tradesFilePath: string;
  private tradesMemory: TradeRecord[] = []; // In-memory хранение для serverless

  constructor() {
    this.logger = new Logger({ prefix: '[TradeTracker]:', level: 'info' });
    // В serverless окружении используем /tmp для записи файлов
    const isServerless = this.isServerlessEnvironment();
    const baseDir = isServerless ? '/tmp' : process.cwd();
    this.tradesFilePath = join(baseDir, 'trades.json');
    
    // В Yandex Cloud всегда загружаем сделки в память при старте
    if (this.isYandexCloud()) {
      this.logger.info('Yandex Cloud обнаружен: используем in-memory хранение сделок');
      this.restoreTradesFromEnv(); // Попытка восстановить сделки из переменной окружения
    }
  }

  /**
   * Определяет, запущен ли код в Yandex Cloud
   */
  private isYandexCloud(): boolean {
    return !!(
      process.env.YANDEX_CLOUD_FUNCTION_NAME ||
      process.env.YANDEX_CLOUD_FUNCTION_VERSION ||
      process.env._YANDEX_CLOUD_
    );
  }

  /**
   * Определяет, запущен ли код в serverless окружении
   */
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
      // В Yandex Cloud используем память
      this.tradesMemory.push(tradeRecord);
      this.saveTradestoEnv(); // Сохраняем в переменную окружения
      this.logger.info(`[YANDEX] Сделка записана в память: ${trade.action} ${trade.quantity} ${trade.instrumentName} по ${trade.price}`);
      
      // Также логируем в формате, который можно будет парсить
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
    // В Yandex Cloud используем память
    if (this.isYandexCloud()) {
      return this.tradesMemory;
    }

    // Обычная файловая загрузка
    if (!existsSync(this.tradesFilePath)) {
      return [];
    }

    try {
      const data = readFileSync(this.tradesFilePath, 'utf8');
      if (!data.trim()) {
        // Файл пустой
        return [];
      }
      const trades = JSON.parse(data);
      // Преобразуем строки дат обратно в Date объекты
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
   * Сохранить сделки в файл
   */
  private saveTrades(trades: TradeRecord[]) {
    try {
      writeFileSync(this.tradesFilePath, JSON.stringify(trades, null, 2), 'utf8');
    } catch (error) {
      this.logger.error('Ошибка при сохранении сделок:', error);
      
      // В serverless окружении попробуем перенаправить в /tmp
      if (this.isServerlessEnvironment() && !this.tradesFilePath.startsWith('/tmp')) {
        try {
          const tmpPath = join('/tmp', 'trades.json');
          writeFileSync(tmpPath, JSON.stringify(trades, null, 2), 'utf8');
          this.logger.warn(`Сделки сохранены в резервном месте: ${tmpPath}`);
          this.tradesFilePath = tmpPath;
        } catch (tmpError) {
          this.logger.error('Ошибка при сохранении в резервном месте:', tmpError);
          // В крайнем случае - просто логируем данные
          this.logger.info('Сделки для логирования:', JSON.stringify(trades, null, 2));
        }
      }
    }
  }

  /**
   * Получить статистику за день
   */
  getDailyStats(date: string): DailyStats {
    const trades = this.loadTrades().filter(trade => trade.sessionDate === date);
    
    // Логирование для отладки
    if (this.isYandexCloud()) {
      this.logger.info(`[YANDEX] Получение статистики за ${date}`);
      this.logger.info(`[YANDEX] Всего сделок в памяти: ${this.tradesMemory.length}`);
      this.logger.info(`[YANDEX] Сделок за дату ${date}: ${trades.length}`);
      if (trades.length > 0) {
        this.logger.info(`[YANDEX] Сделки: ${JSON.stringify(trades, null, 2)}`);
      } else {
        // В Yandex Cloud возвращаем заглушку с информацией о логах
        this.logger.info('[YANDEX] Сделки не найдены в памяти. Проверьте логи Yandex Cloud для получения истории сделок.');
        return {
          date,
          totalTrades: 0,
          buyTrades: 0,
          sellTrades: 0,
          totalProfit: 0,
          totalProfitPercent: 0,
          totalCommission: 0,
          instruments: [],
          signalsUsed: {},
          successfulTrades: 0,
          losingTrades: 0,
          averageProfit: 0,
          bestTrade: null,
          worstTrade: null
        };
      }
    }
    
    const buyTrades = trades.filter(t => t.action === 'buy').length;
    const sellTrades = trades.filter(t => t.action === 'sell').length;
    const profitTrades = trades.filter(t => t.action === 'sell' && (t.profit || 0) > 0);
    const lossTrades = trades.filter(t => t.action === 'sell' && (t.profit || 0) < 0);
    
    const totalProfit = trades
      .filter(t => t.action === 'sell')
      .reduce((sum, t) => sum + (t.profit || 0), 0);
    
    const totalProfitPercent = trades
      .filter(t => t.action === 'sell')
      .reduce((sum, t) => sum + (t.profitPercent || 0), 0);
    
    const totalCommission = trades.reduce((sum, t) => sum + t.commission, 0);
    
    const instruments = [...new Set(trades.map(t => t.instrumentName))];
    
    // Подсчет использованных сигналов
    const signalsUsed: Record<string, number> = {};
    trades.forEach(trade => {
      trade.signals.forEach(signal => {
        signalsUsed[signal] = (signalsUsed[signal] || 0) + 1;
      });
    });
    
    const sellTradesWithProfit = trades.filter(t => t.action === 'sell' && t.profit !== undefined);
    const bestTrade = sellTradesWithProfit.reduce((best, current) => 
      !best || (current.profit || 0) > (best.profit || 0) ? current : best, null as TradeRecord | null);
    
    const worstTrade = sellTradesWithProfit.reduce((worst, current) => 
      !worst || (current.profit || 0) < (worst.profit || 0) ? current : worst, null as TradeRecord | null);
    
    const averageProfit = sellTradesWithProfit.length > 0 
      ? totalProfit / sellTradesWithProfit.length 
      : 0;

    return {
      date,
      totalTrades: trades.length,
      buyTrades,
      sellTrades,
      totalProfit,
      totalProfitPercent,
      totalCommission,
      instruments,
      signalsUsed,
      successfulTrades: profitTrades.length,
      losingTrades: lossTrades.length,
      averageProfit,
      bestTrade,
      worstTrade,
    };
  }

  /**
   * Получить статистику за неделю
   */
  getWeeklyStats(weekStart: string, weekEnd: string): WeeklyStats {
    const days = this.getDateRange(weekStart, weekEnd);
    const dailyStats = days.map(day => this.getDailyStats(day));
    
    const totalProfit = dailyStats.reduce((sum, day) => sum + day.totalProfit, 0);
    const totalTrades = dailyStats.reduce((sum, day) => sum + day.totalTrades, 0);
    const totalCommission = dailyStats.reduce((sum, day) => sum + day.totalCommission, 0);
    
    const bestDay = dailyStats.reduce((best, current) => 
      current.totalProfit > best.totalProfit ? current : best).date;
    
    const worstDay = dailyStats.reduce((worst, current) => 
      current.totalProfit < worst.totalProfit ? current : worst).date;
    
    // Самый активный инструмент за неделю
    const instrumentCounts: Record<string, number> = {};
    dailyStats.forEach(day => {
      day.instruments.forEach(instrument => {
        instrumentCounts[instrument] = (instrumentCounts[instrument] || 0) + 1;
      });
    });
    const mostActiveInstrument = Object.keys(instrumentCounts).reduce((a, b) => 
      instrumentCounts[a] > instrumentCounts[b] ? a : b, '');
    
    // Самый используемый сигнал за неделю
    const signalCounts: Record<string, number> = {};
    dailyStats.forEach(day => {
      Object.entries(day.signalsUsed).forEach(([signal, count]) => {
        signalCounts[signal] = (signalCounts[signal] || 0) + count;
      });
    });
    const mostUsedSignal = Object.keys(signalCounts).reduce((a, b) => 
      signalCounts[a] > signalCounts[b] ? a : b, '');

    return {
      weekStart,
      weekEnd,
      dailyStats,
      totalProfit,
      totalTrades,
      totalCommission,
      bestDay,
      worstDay,
      mostActiveInstrument,
      mostUsedSignal,
    };
  }

  /**
   * Очистить файл сделок (для пятницы)
   */
  clearTrades() {
    try {
      writeFileSync(this.tradesFilePath, '[]', 'utf8');
      this.logger.info('Файл сделок очищен');
    } catch (error) {
      this.logger.error('Ошибка при очистке файла сделок:', error);
      // В serverless случае попробуем очистить в /tmp
      if (this.isServerlessEnvironment() && !this.tradesFilePath.startsWith('/tmp')) {
        try {
          const tmpPath = join('/tmp', 'trades.json');
          writeFileSync(tmpPath, '[]', 'utf8');
          this.logger.warn(`Сделки очищены в резервном месте: ${tmpPath}`);
          this.tradesFilePath = tmpPath;
        } catch (tmpError) {
          this.logger.error('Ошибка при очистке резервного файла:', tmpError);
        }
      }
    }
  }

  /**
   * Получить сделки за текущую неделю
   */
  getCurrentWeekTrades(): TradeRecord[] {
    const now = new Date();
    const monday = this.getMonday(now);
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    
    const mondayStr = this.formatDate(monday);
    const sundayStr = this.formatDate(sunday);
    
    return this.loadTrades().filter(trade => 
      trade.sessionDate >= mondayStr && trade.sessionDate <= sundayStr
    );
  }

  /**
   * Восстановить сделки из логов (для Yandex Cloud)
   * В serverless окружении можем восстанавливать сделки из переменных окружения
   */
  private restoreTradesFromEnv() {
    if (!this.isYandexCloud()) return;

    try {
      // Попытка восстановить из переменной окружения
      const tradesData = process.env.TRADES_DATA;
      if (tradesData) {
        const trades = JSON.parse(tradesData);
        this.tradesMemory = trades.map((trade: any) => ({
          ...trade,
          timestamp: new Date(trade.timestamp),
        }));
        this.logger.info(`[YANDEX] Восстановлено ${this.tradesMemory.length} сделок из переменной окружения`);
      }
    } catch (error) {
      this.logger.error('[YANDEX] Ошибка при восстановлении сделок из переменной:', error);
    }
  }

  /**
   * Сохранить сделки в переменную окружения (для Yandex Cloud)
   */
  private saveTradestoEnv() {
    if (!this.isYandexCloud()) return;

    try {
      process.env.TRADES_DATA = JSON.stringify(this.tradesMemory);
      this.logger.info(`[YANDEX] Сохранено ${this.tradesMemory.length} сделок в переменную окружения`);
    } catch (error) {
      this.logger.error('[YANDEX] Ошибка при сохранении сделок в переменную:', error);
    }
  }

  private generateTradeId(): string {
    return `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private getDateRange(start: string, end: string): string[] {
    const dates: string[] = [];
    const current = new Date(start);
    const endDate = new Date(end);
    
    while (current <= endDate) {
      dates.push(this.formatDate(current));
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  }

  private getMonday(date: Date): Date {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  }
}
