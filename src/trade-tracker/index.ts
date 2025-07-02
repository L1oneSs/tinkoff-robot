/**
 * Модуль для отслеживания и записи торговых сделок в Google Sheets
 */

import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
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

  constructor() {
    this.logger = new Logger({ prefix: '[TradeTracker]:', level: 'info' });
    this.logger.info('TradeTracker инициализирован для работы с Google Sheets');
  }

  /**
   * Записать новую сделку в Google Sheets
   */
  async recordTrade(trade: Omit<TradeRecord, 'id' | 'timestamp' | 'sessionDate'>): Promise<TradeRecord> {
    const now = new Date();
    const tradeRecord: TradeRecord = {
      ...trade,
      id: this.generateTradeId(),
      timestamp: now,
      sessionDate: this.formatDate(now),
    };

    try {
      await this.saveTradeToGoogleSheets(tradeRecord);
      this.logger.info(`Сделка записана в Google Sheets: ${trade.action} ${trade.quantity} ${trade.instrumentName} по ${trade.price}`);
    } catch (error) {
      this.logger.error('Ошибка записи сделки в Google Sheets:', error);
      // Не бросаем ошибку, чтобы не прерывать торговлю
    }

    return tradeRecord;
  }

  /**
   * Получить все сделки из Google Sheets
   */
  async loadTrades(): Promise<TradeRecord[]> {
    try {
      return await this.loadTradesFromGoogleSheets();
    } catch (error) {
      this.logger.error('Ошибка загрузки сделок из Google Sheets:', error);
      return [];
    }
  }

  /**
   * Очистить сделки (не реализовано для Google Sheets)
   */
  clearTrades() {
    this.logger.warn('Очистка сделок не поддерживается для Google Sheets');
  }

  /**
   * Сохранить сделку в Google Sheets
   */
  private async saveTradeToGoogleSheets(trade: TradeRecord): Promise<void> {
    const doc = await this.getGoogleSheetsDoc();
    const worksheet = await this.getOrCreateWorksheet(doc);

    // Добавляем строку с данными сделки
    await worksheet.addRow({
      'ID': trade.id,
      'Дата': trade.sessionDate,
      'Время': trade.timestamp.toLocaleTimeString('ru-RU'),
      'FIGI': trade.figi,
      'Инструмент': trade.instrumentName,
      'Действие': trade.action === 'buy' ? 'Покупка' : 'Продажа',
      'Количество': trade.quantity,
      'Цена': trade.price,
      'Сумма': trade.totalAmount,
      'Комиссия': trade.commission,
      'Прибыль': trade.profit || '',
      'Прибыль %': trade.profitPercent || '',
      'Сигналы': trade.signals.join(', '),
      'Триггер': trade.triggerExpression || ''
    });
  }

  /**
   * Загрузить сделки из Google Sheets
   */
  private async loadTradesFromGoogleSheets(): Promise<TradeRecord[]> {
    const doc = await this.getGoogleSheetsDoc();
    const worksheet = await this.getOrCreateWorksheet(doc);

    const rows = await worksheet.getRows();
    
    return rows.map(row => ({
      id: row.get('ID'),
      timestamp: new Date(`${row.get('Дата')} ${row.get('Время')}`),
      figi: row.get('FIGI'),
      instrumentName: row.get('Инструмент'),
      action: row.get('Действие') === 'Покупка' ? 'buy' : 'sell',
      quantity: parseFloat(row.get('Количество')) || 0,
      price: parseFloat(row.get('Цена')) || 0,
      totalAmount: parseFloat(row.get('Сумма')) || 0,
      commission: parseFloat(row.get('Комиссия')) || 0,
      profit: row.get('Прибыль') ? parseFloat(row.get('Прибыль')) : undefined,
      profitPercent: row.get('Прибыль %') ? parseFloat(row.get('Прибыль %')) : undefined,
      signals: row.get('Сигналы') ? row.get('Сигналы').split(', ') : [],
      triggerExpression: row.get('Триггер') || undefined,
      sessionDate: row.get('Дата')
    }));
  }

  /**
   * Получить Google Sheets документ
   */
  private async getGoogleSheetsDoc(): Promise<GoogleSpreadsheet> {
    // Декодируем приватный ключ
    let privateKey: string;
    if (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_BASE64) {
      privateKey = Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_BASE64, 'base64').toString('utf-8');
    } else {
      privateKey = (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '').replace(/\\n/g, '\n');
    }

    // Создаем JWT клиент
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SPREADSHEET_ID!, serviceAccountAuth);
    await doc.loadInfo();

    return doc;
  }

  /**
   * Получить или создать рабочий лист
   */
  private async getOrCreateWorksheet(doc: GoogleSpreadsheet) {
    const worksheetTitle = process.env.GOOGLE_WORKSHEET_TITLE || 'Trades';
    
    let worksheet = doc.sheetsByTitle[worksheetTitle];
    
    if (!worksheet) {
      // Создаем новый лист с заголовками
      worksheet = await doc.addSheet({
        title: worksheetTitle,
        headerValues: [
          'ID', 'Дата', 'Время', 'FIGI', 'Инструмент', 'Действие', 
          'Количество', 'Цена', 'Сумма', 'Комиссия', 'Прибыль', 
          'Прибыль %', 'Сигналы', 'Триггер'
        ]
      });
      this.logger.info(`Создан новый лист "${worksheetTitle}" в Google Sheets`);
    }

    return worksheet;
  }

  private generateTradeId(): string {
    return `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
