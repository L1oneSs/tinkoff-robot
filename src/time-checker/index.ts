/**
 * Модуль для проверки торгового времени
 */

import { Logger } from '@vitalets/logger';

export class TradingTimeChecker {
  private logger: Logger;

  constructor() {
    this.logger = new Logger({ prefix: '[TradingTime]:', level: 'info' });
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
   * Получить статус торгового времени
   */
  getStatus(): string {
    const now = new Date();
    const moscowTime = this.getMoscowTime(now);
    const currentTime = this.formatTime(moscowTime);
    const isTrading = this.isTradingTime();
    
    return `📅 *Статус торгового времени*\n\n` +
           `🕐 *Московское время:* ${currentTime}\n` +
           `📈 *Торговое время:* ${isTrading ? 'Да' : 'Нет'}\n` +
           `⏰ *Торговые часы:* 10:00-19:00 МСК (пн-пт)`;
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
}

// Экспортируем старое имя для обратной совместимости
export const ReportScheduler = TradingTimeChecker;
