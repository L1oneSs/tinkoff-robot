/**
 * Telegram уведомления для торгового робота
 */
import TelegramBot from 'node-telegram-bot-api';
import { Logger } from '@vitalets/logger';

export interface TradeNotification {
  type: 'buy' | 'sell';
  instrument: string;
  ticker: string;
  price: number;
  quantity: number;
  amount: number;
  signals: string[];
  timestamp: Date;
  profit?: number; // для продаж
}

export class TelegramNotifier {
  private bot?: TelegramBot;
  private chatId: string;
  private logger: Logger;

  constructor() {
    this.logger = new Logger({ prefix: '[telegram]:', level: 'info' });
    
    const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
    this.chatId = process.env.TELEGRAM_CHAT_ID?.trim() || '';

    if (!botToken || botToken === 'YOUR_BOT_TOKEN_HERE') {
      this.logger.warn('Telegram bot token не настроен. Уведомления отключены.');
      return;
    }

    if (!this.chatId || this.chatId === 'YOUR_CHAT_ID_HERE') {
      this.logger.warn('Telegram chat ID не настроен. Уведомления отключены.');
      return;
    }

    try {
      this.bot = new TelegramBot(botToken);
      this.logger.info('Telegram бот инициализирован');
    } catch (error) {
      this.logger.error('Ошибка инициализации Telegram бота:', error);
    }
  }

  /**
   * Отправка уведомления о сделке
   */
  async sendTradeNotification(trade: TradeNotification): Promise<void> {
    if (!this.bot) return;

    try {
      const message = this.formatTradeMessage(trade);
      await this.bot.sendMessage(this.chatId, message, { parse_mode: 'HTML' });
      this.logger.info(`Отправлено уведомление о ${trade.type === 'buy' ? 'покупке' : 'продаже'} ${trade.ticker}`);
    } catch (error) {
      this.logger.error('Ошибка отправки уведомления в Telegram:', error);
    }
  }

  /**
   * Отправка текстового сообщения
   */
  async sendMessage(message: string, parseMode: 'HTML' | 'Markdown' = 'Markdown'): Promise<void> {
    if (!this.bot) return;

    try {
      await this.bot.sendMessage(this.chatId, message, { parse_mode: parseMode });
      this.logger.info('Отправлено сообщение в Telegram');
    } catch (error) {
      this.logger.error('Ошибка отправки сообщения в Telegram:', error);
    }
  }

  /**
   * Отправка файла (графика или документа)
   */
  async sendDocument(fileData: string | Buffer, filename?: string, caption?: string): Promise<void> {
    if (!this.bot) return;

    try {
      if (typeof fileData === 'string') {
        // Отправка файла по пути
        await this.bot.sendDocument(this.chatId, fileData, {
          caption,
          parse_mode: 'HTML'
        });
      } else {
        // Отправка Buffer как фото/документ
        await this.bot.sendPhoto(this.chatId, fileData, {
          caption,
          parse_mode: 'HTML'
        });
      }
      this.logger.info('Отправлен документ в Telegram');
    } catch (error) {
      this.logger.error('Ошибка отправки документа в Telegram:', error);
    }
  }

  /**
   * Форматирование сообщения о сделке
   */
  private formatTradeMessage(trade: TradeNotification): string {
    const action = trade.type === 'buy' ? '📈 ПОКУПКА' : '📉 ПРОДАЖА';
    const emoji = trade.type === 'buy' ? '🟢' : '🔴';
    
    let message = `${emoji} <b>${action}</b>\n\n`;
    message += `📊 <b>${trade.ticker}</b>\n`;
    message += `💰 Цена: <code>${trade.price.toFixed(2)} ₽</code>\n`;
    message += `📦 Количество: <code>${trade.quantity} лот.</code>\n`;
    message += `💵 Сумма: <code>${trade.amount.toFixed(2)} ₽</code>\n`;
    
    if (trade.type === 'sell' && trade.profit !== undefined) {
      const profitEmoji = trade.profit > 0 ? '💚' : '❤️';
      message += `${profitEmoji} Прибыль: <code>${trade.profit > 0 ? '+' : ''}${trade.profit.toFixed(2)}%</code>\n`;
    }
    
    if (trade.signals.length > 0) {
      message += `🔔 Сигналы: <code>${trade.signals.join(', ')}</code>\n`;
    }
    
    message += `⏰ ${trade.timestamp.toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })} МСК`;
    
    return message;
  }

  /**
   * Проверка доступности бота
   */
  isEnabled(): boolean {
    return !!this.bot;
  }
}
