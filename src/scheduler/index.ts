/**
 * Упрощенный модуль для проверки торгового времени
 */

import { Logger } from '@vitalets/logger';

export class ReportScheduler {
  private logger: Logger;

  constructor() {
    this.logger = new Logger({ prefix: '[ReportScheduler]:', level: 'info' });
  }

  /**
   * Заглушка для совместимости - отчеты отключены
   */
  async checkAndSendReports(): Promise<void> {
    // Больше никаких отчетов не отправляем
    this.logger.debug('Отчеты отключены');
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
    
    return `📅 *Статус робота*\n\n` +
           `🕐 *Московское время:* ${currentTime}\n` +
           `📈 *Торговое время:* ${isTrading ? 'Да' : 'Нет'}\n` +
           `📊 *Отчеты:* Отключены (только уведомления о сделках)`;
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
