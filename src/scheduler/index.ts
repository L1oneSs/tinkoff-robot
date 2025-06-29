/**
 * Модуль планировщика для автоматической отправки отчетов
 */

import { Logger } from '@vitalets/logger';
import { TradeTracker } from '../trade-tracker';
import { ReportGenerator } from '../reports/generator';
import { TelegramNotifier } from '../notifications/telegram';

export interface SchedulerConfig {
  timezone: string;
  dailyReportTime: string; // HH:MM формат
  enableWeeklyReports: boolean;
  enableFileCleanup: boolean;
  enableWeekendMode: boolean; // отключать ли отчеты в выходные
}

export class ReportScheduler {
  private logger: Logger;
  private config: SchedulerConfig;
  private tradeTracker: TradeTracker;
  private reportGenerator: ReportGenerator;
  private telegramNotifier: TelegramNotifier;

  constructor(
    tradeTracker: TradeTracker,
    reportGenerator: ReportGenerator,
    telegramNotifier: TelegramNotifier,
    config: Partial<SchedulerConfig> = {}
  ) {
    this.logger = new Logger({ prefix: '[ReportScheduler]:', level: 'info' });
    this.config = {
      timezone: 'Europe/Moscow',
      dailyReportTime: '18:50',
      enableWeeklyReports: true,
      enableFileCleanup: true,
      enableWeekendMode: true,
      ...config,
    };
    
    this.tradeTracker = tradeTracker;
    this.reportGenerator = reportGenerator;
    this.telegramNotifier = telegramNotifier;
  }

  /**
   * Проверить, нужно ли отправить ежедневный отчет
   */
  shouldSendDailyReport(): boolean {
    const now = new Date();
    const moscowTime = this.getMoscowTime(now);
    
    // Проверяем, рабочий ли день
    if (this.config.enableWeekendMode && this.isWeekend(moscowTime)) {
      return false;
    }
    
    // Проверяем время
    const currentTime = this.formatTime(moscowTime);
    const [targetHour, targetMinute] = this.config.dailyReportTime.split(':').map(Number);
    const [currentHour, currentMinute] = currentTime.split(':').map(Number);
    
    // Отправляем отчет если время между 18:50 и 19:00
    if (targetHour === 18 && targetMinute === 50) {
      return currentHour === 18 && currentMinute >= 50 && currentMinute < 60;
    }
    
    return currentHour === targetHour && currentMinute === targetMinute;
  }

  /**
   * Проверить, нужно ли отправить еженедельный отчет
   */
  shouldSendWeeklyReport(): boolean {
    if (!this.config.enableWeeklyReports) {
      return false;
    }
    
    const now = new Date();
    const moscowTime = this.getMoscowTime(now);
    
    // Отправляем еженедельный отчет по пятницам
    const isFriday = moscowTime.getDay() === 5;
    
    // В то же время, что и ежедневный отчет
    const currentTime = this.formatTime(moscowTime);
    const [targetHour, targetMinute] = this.config.dailyReportTime.split(':').map(Number);
    const [currentHour, currentMinute] = currentTime.split(':').map(Number);
    
    if (targetHour === 18 && targetMinute === 50) {
      return isFriday && currentHour === 18 && currentMinute >= 50 && currentMinute < 60;
    }
    
    return isFriday && currentHour === targetHour && currentMinute === targetMinute;
  }

  /**
   * Проверить, нужно ли очистить файл сделок
   */
  shouldCleanupTrades(): boolean {
    if (!this.config.enableFileCleanup) {
      return false;
    }
    
    const now = new Date();
    const moscowTime = this.getMoscowTime(now);
    
    // Очищаем файл по пятницам после отправки еженедельного отчета
    const isFriday = moscowTime.getDay() === 5;
    const currentTime = this.formatTime(moscowTime);
    
    // Очищаем в 19:00 по пятницам
    return isFriday && currentTime === '19:00';
  }

  /**
   * Отправить ежедневный отчет
   */
  async sendDailyReport(): Promise<void> {
    try {
      const today = this.formatDate(this.getMoscowTime(new Date()));
      const dailyStats = this.tradeTracker.getDailyStats(today);
      
      this.logger.info(`Отправка ежедневного отчета за ${today}`);
      
      // Текстовый отчет
      const reportText = this.reportGenerator.generateDailyReport(dailyStats);
      await this.telegramNotifier.sendMessage(reportText);
      
      // График сигналов (если есть сделки)
      if (Object.keys(dailyStats.signalsUsed).length > 0) {
        const signalsChart = await this.reportGenerator.generateSignalsChart(dailyStats);
        await this.telegramNotifier.sendDocument(signalsChart, `signals_${today}.png`);
      }
      
      this.logger.info('Ежедневный отчет отправлен');
    } catch (error) {
      this.logger.error('Ошибка при отправке ежедневного отчета:', error);
    }
  }

  /**
   * Отправить еженедельный отчет
   */
  async sendWeeklyReport(): Promise<void> {
    try {
      const now = this.getMoscowTime(new Date());
      const { weekStart, weekEnd } = this.getCurrentWeek(now);
      
      const weeklyStats = this.tradeTracker.getWeeklyStats(weekStart, weekEnd);
      
      this.logger.info(`Отправка еженедельного отчета за ${weekStart} - ${weekEnd}`);
      
      // Текстовый отчет
      const reportText = this.reportGenerator.generateWeeklyReport(weeklyStats);
      await this.telegramNotifier.sendMessage(reportText);
      
      // График прибыли за неделю
      const profitChart = await this.reportGenerator.generateWeeklyProfitChart(weeklyStats);
      await this.telegramNotifier.sendDocument(profitChart, `weekly_profit_${weekStart}_${weekEnd}.png`);
      
      // График сигналов за неделю
      const signalsChart = await this.reportGenerator.generateSignalsChart(weeklyStats);
      await this.telegramNotifier.sendDocument(signalsChart, `weekly_signals_${weekStart}_${weekEnd}.png`);
      
      // Детальный отчет по сделкам
      const weekTrades = this.tradeTracker.getCurrentWeekTrades();
      if (weekTrades.length > 0) {
        const tradesReport = this.reportGenerator.generateTradesReport(weekTrades);
        await this.telegramNotifier.sendMessage(tradesReport);
      }
      
      this.logger.info('Еженедельный отчет отправлен');
    } catch (error) {
      this.logger.error('Ошибка при отправке еженедельного отчета:', error);
    }
  }

  /**
   * Очистить файл сделок
   */
  async cleanupTrades(): Promise<void> {
    try {
      this.logger.info('Очистка файла сделок');
      this.tradeTracker.clearTrades();
      
      await this.telegramNotifier.sendMessage(
        '🧹 *Еженедельная очистка*\n\nФайл сделок очищен. Начинаем новую торговую неделю!'
      );
      
      this.logger.info('Файл сделок очищен');
    } catch (error) {
      this.logger.error('Ошибка при очистке файла сделок:', error);
    }
  }

  /**
   * Запустить автоматическую проверку и отправку отчетов
   */
  async checkAndSendReports(): Promise<void> {
    this.logger.info('Проверка необходимости отправки отчетов');
    
    // Проверяем еженедельный отчет первым (так как он по пятницам)
    if (this.shouldSendWeeklyReport()) {
      await this.sendWeeklyReport();
    }
    // Затем ежедневный отчет
    else if (this.shouldSendDailyReport()) {
      await this.sendDailyReport();
    }
    
    // Проверяем очистку файла (после отчетов)
    if (this.shouldCleanupTrades()) {
      await this.cleanupTrades();
    }
  }

  /**
   * Получить время по московскому часовому поясу
   */
  private getMoscowTime(date: Date): Date {
    return new Date(date.toLocaleString("en-US", { timeZone: "Europe/Moscow" }));
  }

  /**
   * Проверить, выходной ли день
   */
  private isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6; // воскресенье или суббота
  }

  /**
   * Форматировать время в HH:MM
   */
  private formatTime(date: Date): string {
    return date.toTimeString().slice(0, 5);
  }

  /**
   * Форматировать дату в YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Получить начало и конец текущей недели
   */
  private getCurrentWeek(date: Date): { weekStart: string; weekEnd: string } {
    const monday = new Date(date);
    const day = monday.getDay();
    const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
    monday.setDate(diff);
    
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    
    return {
      weekStart: this.formatDate(monday),
      weekEnd: this.formatDate(sunday),
    };
  }

  /**
   * Проверить, торговое ли время (10:00-19:00 МСК в будние дни)
   */
  isTradingTime(): boolean {
    const now = new Date();
    const moscowTime = this.getMoscowTime(now);
    
    // Проверяем, рабочий ли день
    if (this.isWeekend(moscowTime)) {
      return false;
    }
    
    const currentHour = moscowTime.getHours();
    return currentHour >= 10 && currentHour < 19;
  }

  /**
   * Получить статус планировщика
   */
  getStatus(): string {
    const now = new Date();
    const moscowTime = this.getMoscowTime(now);
    const currentTime = this.formatTime(moscowTime);
    const isTrading = this.isTradingTime();
    const shouldDaily = this.shouldSendDailyReport();
    const shouldWeekly = this.shouldSendWeeklyReport();
    const shouldCleanup = this.shouldCleanupTrades();
    
    return `📅 *Статус планировщика*\n\n` +
           `🕐 *Московское время:* ${currentTime}\n` +
           `📈 *Торговое время:* ${isTrading ? 'Да' : 'Нет'}\n` +
           `📊 *Ежедневный отчет:* ${shouldDaily ? 'Готов к отправке' : 'Ожидание'}\n` +
           `📅 *Еженедельный отчет:* ${shouldWeekly ? 'Готов к отправке' : 'Ожидание'}\n` +
           `🧹 *Очистка файла:* ${shouldCleanup ? 'Готова' : 'Ожидание'}`;
  }
}
