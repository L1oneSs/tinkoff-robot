/**
 * Простая система отправки отчётов через Google Sheets и Telegram
 */

import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { Logger } from '@vitalets/logger';
import { TelegramNotifier } from '../notifications/telegram.js';

interface ReportConfig {
  googleServiceAccountEmail: string;
  googleServiceAccountPrivateKey: string;
  googleServiceAccountPrivateKeyBase64?: string;
  googleSpreadsheetId: string;
  googleWorksheetTitle?: string;
  telegramBotToken: string;
  telegramChatId: string;
}

export class SimpleReportSender {
  private logger: Logger;
  private config: ReportConfig;
  private telegramNotifier: TelegramNotifier;

  constructor() {
    this.logger = new Logger({ prefix: '[Reports]:', level: 'info' });
    
    this.config = {
      googleServiceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!,
      googleServiceAccountPrivateKey: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '',
      googleServiceAccountPrivateKeyBase64: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_BASE64,
      googleSpreadsheetId: process.env.GOOGLE_SPREADSHEET_ID!,
      googleWorksheetTitle: process.env.GOOGLE_WORKSHEET_TITLE || 'Trades',
      telegramBotToken: process.env.TELEGRAM_BOT_TOKEN!,
      telegramChatId: process.env.TELEGRAM_CHAT_ID!
    };

    this.telegramNotifier = new TelegramNotifier();
  }

  /**
   * Проверить время и отправить отчёт если нужно
   */
  async checkAndSendReports(): Promise<void> {
    try {
      // Получаем текущее время по МСК
      const moscowTime = new Date(new Date().toLocaleString("en-US", {timeZone: "Europe/Moscow"}));
      const currentHour = moscowTime.getHours();
      const currentMinute = moscowTime.getMinutes();
      const currentDay = moscowTime.getDay(); // 0 = воскресенье, 1-5 = рабочие дни
      
      this.logger.info(`Время МСК: ${moscowTime.toLocaleString('ru-RU')}, день недели: ${currentDay}`);

      // Проверяем, рабочий ли день (понедельник-пятница)
      if (currentDay === 0 || currentDay === 6) {
        this.logger.info('Выходной день - отчёты не отправляем');
        return;
      }

      // Проверяем время отправки отчётов (19:00 МСК ± 5 минут)
      const isReportTime = (currentHour === 19 && currentMinute >= 0 && currentMinute <= 10);
      
      if (!isReportTime) {
        this.logger.info(`Не время для отчётов (${currentHour}:${currentMinute}). Отчёты отправляются в 19:00-19:10 МСК`);
        return;
      }

      this.logger.info('Время для отправки отчётов! Начинаем...');

      const dateStr = moscowTime.toISOString().split('T')[0];
      
      // В пятницу отправляем дневной + недельный
      if (currentDay === 5) {
        this.logger.info('Пятница - отправляем дневной и недельный отчёты');
        await this.sendDailyReport(dateStr);
        await this.sendWeeklyReport(dateStr);
      } else {
        // В остальные дни только дневной
        this.logger.info('Будний день - отправляем дневной отчёт');
        await this.sendDailyReport(dateStr);
      }

    } catch (error) {
      this.logger.error('Ошибка при проверке и отправке отчётов:', error);
      // Не бросаем ошибку, чтобы не прерывать основную торговлю
    }
  }

  /**
   * Отправить дневной отчёт
   */
  private async sendDailyReport(date: string): Promise<void> {
    try {
      const stats = await this.getDayStats(date);
      
      const report = `📊 <b>Дневной отчёт за ${date}</b>

💰 <b>Результаты торгов:</b>
• Сделок: ${stats.totalTrades}
• Прибыль: ${stats.totalProfit.toFixed(2)} ₽
• Комиссии: ${stats.totalCommission.toFixed(2)} ₽

📈 <b>Детали:</b>
• Покупки: ${stats.buyTrades}
• Продажи: ${stats.sellTrades}
• Прибыльных: ${stats.profitableTrades}
• Убыточных: ${stats.losingTrades}
• Win Rate: ${stats.winRate.toFixed(1)}%

🏆 <b>Лучшая сделка:</b> +${stats.biggestWin.toFixed(2)} ₽
📉 <b>Худшая сделка:</b> ${stats.biggestLoss.toFixed(2)} ₽`;

      await this.telegramNotifier.sendMessage(report, 'HTML');
      this.logger.info('Дневной отчёт отправлен');
      
    } catch (error) {
      this.logger.error('Ошибка отправки дневного отчёта:', error);
    }
  }

  /**
   * Отправить недельный отчёт
   */
  private async sendWeeklyReport(endDate: string): Promise<void> {
    try {
      // Вычисляем начало недели (понедельник)
      const end = new Date(endDate);
      const start = new Date(end);
      start.setDate(end.getDate() - 4); // Пятница минус 4 дня = понедельник
      const startDate = start.toISOString().split('T')[0];

      const stats = await this.getWeekStats(startDate, endDate);
      
      const report = `📅 <b>Недельный отчёт ${startDate} — ${endDate}</b>

💰 <b>Итоги недели:</b>
• Сделок: ${stats.totalTrades}
• Прибыль: ${stats.totalProfit.toFixed(2)} ₽
• Комиссии: ${stats.totalCommission.toFixed(2)} ₽

📊 <b>Статистика:</b>
• Покупки: ${stats.buyTrades}
• Продажи: ${stats.sellTrades}
• Прибыльных: ${stats.profitableTrades}
• Убыточных: ${stats.losingTrades}
• Win Rate: ${stats.winRate.toFixed(1)}%

🏆 <b>Лучшая сделка:</b> +${stats.biggestWin.toFixed(2)} ₽
📉 <b>Худшая сделка:</b> ${stats.biggestLoss.toFixed(2)} ₽

Хороших выходных! 🎉`;

      await this.telegramNotifier.sendMessage(report, 'HTML');
      this.logger.info('Недельный отчёт отправлен');
      
    } catch (error) {
      this.logger.error('Ошибка отправки недельного отчёта:', error);
    }
  }

  /**
   * Получить статистику за день
   */
  private async getDayStats(date: string) {
    const trades = await this.getTradesFromSheets(date, date);
    return this.calculateStats(trades);
  }

  /**
   * Получить статистику за неделю
   */
  private async getWeekStats(startDate: string, endDate: string) {
    const trades = await this.getTradesFromSheets(startDate, endDate);
    return this.calculateStats(trades);
  }

  /**
   * Получить сделки из Google Sheets
   */
  private async getTradesFromSheets(fromDate: string, toDate: string): Promise<any[]> {
    try {
      // Декодируем приватный ключ
      let privateKey: string;
      if (this.config.googleServiceAccountPrivateKeyBase64) {
        // Используем base64 ключ (для serverless)
        privateKey = Buffer.from(this.config.googleServiceAccountPrivateKeyBase64, 'base64').toString('utf-8');
      } else {
        // Используем обычный ключ
        privateKey = this.config.googleServiceAccountPrivateKey.replace(/\\n/g, '\n');
      }
      
      // Создаем JWT клиент для Google Sheets
      const serviceAccountAuth = new JWT({
        email: this.config.googleServiceAccountEmail,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const doc = new GoogleSpreadsheet(this.config.googleSpreadsheetId, serviceAccountAuth);
      await doc.loadInfo();

      const worksheet = doc.sheetsByTitle[this.config.googleWorksheetTitle!];
      if (!worksheet) {
        this.logger.warn(`Лист "${this.config.googleWorksheetTitle}" не найден`);
        return [];
      }

      const rows = await worksheet.getRows();
      
      // Фильтруем по датам
      const trades = rows.filter(row => {
        const tradeDate = row.get('Дата');
        if (!tradeDate) return false;
        return tradeDate >= fromDate && tradeDate <= toDate;
      });

      this.logger.info(`Загружено ${trades.length} сделок за период ${fromDate} - ${toDate}`);
      return trades;

    } catch (error) {
      this.logger.error('Ошибка получения данных из Google Sheets:', error);
      return [];
    }
  }

  /**
   * Рассчитать статистику по сделкам
   */
  private calculateStats(trades: any[]) {
    const stats = {
      totalTrades: trades.length,
      totalProfit: 0,
      totalCommission: 0,
      buyTrades: 0,
      sellTrades: 0,
      profitableTrades: 0,
      losingTrades: 0,
      winRate: 0,
      biggestWin: 0,
      biggestLoss: 0
    };

    trades.forEach(trade => {
      // Подсчёт типов сделок
      const action = trade.get('Действие');
      if (action === 'Покупка') {
        stats.buyTrades++;
      } else if (action === 'Продажа') {
        stats.sellTrades++;
      }

      // Комиссии
      const commission = parseFloat(trade.get('Комиссия')) || 0;
      stats.totalCommission += commission;

      // Прибыль
      const profit = parseFloat(trade.get('Прибыль')) || 0;
      if (profit !== 0) {
        stats.totalProfit += profit;
        
        if (profit > 0) {
          stats.profitableTrades++;
          if (profit > stats.biggestWin) {
            stats.biggestWin = profit;
          }
        } else {
          stats.losingTrades++;
          if (profit < stats.biggestLoss) {
            stats.biggestLoss = profit;
          }
        }
      }
    });

    // Win Rate
    const tradesWithResult = stats.profitableTrades + stats.losingTrades;
    stats.winRate = tradesWithResult > 0 ? (stats.profitableTrades / tradesWithResult) * 100 : 0;

    return stats;
  }
}
