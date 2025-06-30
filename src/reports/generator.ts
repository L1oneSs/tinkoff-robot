import { DailyStats, WeeklyStats, TradeRecord } from '../trade-tracker';
import { join } from 'path';
import { Logger } from '@vitalets/logger';
import { createCanvas } from 'canvas';

export interface ReportConfig {
  includeCharts: boolean;
  chartWidth: number;
  chartHeight: number;
  outputDir: string;
}

export class ReportGenerator {
  private logger: Logger;
  private config: ReportConfig;

  constructor(config: Partial<ReportConfig> = {}) {
    this.logger = new Logger({ prefix: '[ReportGenerator]:', level: 'info' });
    
    // В serverless окружении используем /tmp для выходных файлов
    const isServerless = this.isServerlessEnvironment();
    const defaultOutputDir = isServerless 
      ? join('/tmp', 'reports') 
      : join(process.cwd(), 'reports');
    
    this.config = {
      includeCharts: true,
      chartWidth: 800,
      chartHeight: 400,
      outputDir: defaultOutputDir,
      ...config,
    };
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
   * Создать ежедневный отчет
   */
  generateDailyReport(stats: DailyStats): string {
    const profitEmoji = stats.totalProfit >= 0 ? '📈' : '📉';
    const winRate = stats.sellTrades > 0 
      ? (stats.successfulTrades / stats.sellTrades * 100).toFixed(1) 
      : '0.0';
    
    let report = `🤖 *Ежедневный отчет за ${stats.date}*\n\n`;
    
    // Основные метрики
    report += `💰 *Прибыль:* ${stats.totalProfit.toFixed(2)} руб. ${profitEmoji}\n`;
    report += `📊 *Доходность:* ${stats.totalProfitPercent.toFixed(2)}%\n`;
    report += `🔄 *Всего сделок:* ${stats.totalTrades}\n`;
    report += `📥 *Покупок:* ${stats.buyTrades}\n`;
    report += `📤 *Продаж:* ${stats.sellTrades}\n`;
    report += `✅ *Успешных:* ${stats.successfulTrades} (${winRate}%)\n`;
    report += `❌ *Убыточных:* ${stats.losingTrades}\n`;
    report += `💸 *Комиссии:* ${stats.totalCommission.toFixed(2)} руб.\n\n`;
    
    // Средняя прибыль
    if (stats.sellTrades > 0) {
      report += `📊 *Средняя прибыль:* ${stats.averageProfit.toFixed(2)} руб.\n\n`;
    }
    
    // Лучшая и худшая сделки
    if (stats.bestTrade) {
      report += `🏆 *Лучшая сделка:* ${stats.bestTrade.instrumentName} (+${stats.bestTrade.profit?.toFixed(2)} руб.)\n`;
    }
    if (stats.worstTrade) {
      const worstProfit = stats.worstTrade.profit?.toFixed(2);
      report += `💥 *Худшая сделка:* ${stats.worstTrade.instrumentName} (${worstProfit} руб.)\n\n`;
    }
    
    // Торгуемые инструменты
    if (stats.instruments.length > 0) {
      report += `📋 *Инструменты:* ${stats.instruments.join(', ')}\n\n`;
    }
    
    // Использованные сигналы
    if (Object.keys(stats.signalsUsed).length > 0) {
      report += `🎯 *Сигналы:*\n`;
      Object.entries(stats.signalsUsed)
        .sort(([,a], [,b]) => b - a)
        .forEach(([signal, count]) => {
          report += `• ${signal}: ${count}\n`;
        });
    }
    
    return report;
  }

  /**
   * Создать еженедельный отчет
   */
  generateWeeklyReport(stats: WeeklyStats): string {
    const profitEmoji = stats.totalProfit >= 0 ? '📈' : '📉';
    const avgDailyProfit = stats.dailyStats.length > 0 
      ? (stats.totalProfit / stats.dailyStats.length).toFixed(2) 
      : '0.00';
    
    let report = `📅 *Еженедельный отчет (${stats.weekStart} — ${stats.weekEnd})*\n\n`;
    
    // Общие метрики
    report += `💰 *Общая прибыль:* ${stats.totalProfit.toFixed(2)} руб. ${profitEmoji}\n`;
    report += `📊 *Средняя прибыль в день:* ${avgDailyProfit} руб.\n`;
    report += `🔄 *Всего сделок:* ${stats.totalTrades}\n`;
    report += `💸 *Общие комиссии:* ${stats.totalCommission.toFixed(2)} руб.\n\n`;
    
    // Лучший и худший день
    report += `🏆 *Лучший день:* ${stats.bestDay}\n`;
    report += `💥 *Худший день:* ${stats.worstDay}\n\n`;
    
    // Самые активные
    report += `🎯 *Самый активный инструмент:* ${stats.mostActiveInstrument}\n`;
    report += `📡 *Самый используемый сигнал:* ${stats.mostUsedSignal}\n\n`;
    
    // Разбивка по дням
    report += `📈 *Детали по дням:*\n`;
    stats.dailyStats.forEach(day => {
      const dayProfit = day.totalProfit.toFixed(2);
      const dayEmoji = day.totalProfit >= 0 ? '✅' : '❌';
      report += `• ${day.date}: ${dayProfit} руб. (${day.totalTrades} сделок) ${dayEmoji}\n`;
    });
    
    return report;
  }

  /**
   * Создать график прибыли за неделю
   */
  async generateWeeklyProfitChart(stats: WeeklyStats): Promise<Buffer> {
    if (!this.config.includeCharts) {
      throw new Error('Генерация графиков отключена в конфигурации');
    }

    try {
      const canvas = createCanvas(this.config.chartWidth, this.config.chartHeight);
      const context = canvas.getContext('2d');
      
      this.drawProfitChart(context, stats);
      
      this.logger.info('График прибыли создан успешно');
      return canvas.toBuffer('image/png');
      
    } catch (error) {
      this.logger.error('Ошибка создания графика прибыли:', error);
      throw error;
    }
  }

  /**
   * Отрисовка графика прибыли
   */
  private drawProfitChart(context: any, stats: WeeklyStats) {
    // Настройка холста
    context.fillStyle = 'white';
    context.fillRect(0, 0, this.config.chartWidth, this.config.chartHeight);
    
    // Подготовка данных
    const profitData = stats.dailyStats.map(day => day.totalProfit);
    
    // Размеры графика
    const margin = { top: 50, right: 80, bottom: 60, left: 80 };
    const width = this.config.chartWidth - margin.left - margin.right;
    const height = this.config.chartHeight - margin.top - margin.bottom;
    
    // Простые шкалы
    const minProfit = Math.min(...profitData);
    const maxProfit = Math.max(...profitData);
    
    // Рисуем график
    context.save();
    context.translate(margin.left, margin.top);
    
    this.drawProfitTitle(context, width, stats);
    this.drawProfitLine(context, profitData, width, height, minProfit, maxProfit);
    this.drawProfitLegend(context, width);
    
    context.restore();
  }

  /**
   * Отрисовка заголовка графика прибыли
   */
  private drawProfitTitle(context: any, width: number, stats: WeeklyStats) {
    context.fillStyle = '#333';
    context.font = 'bold 16px Arial';
    context.textAlign = 'center';
    context.fillText(`Прибыль за неделю (${stats.weekStart} — ${stats.weekEnd})`, width / 2, -20);
  }

  /**
   * Отрисовка линии прибыли
   */
  private drawProfitLine(
    context: any, 
    profitData: number[], 
    width: number, 
    height: number, 
    minProfit: number, 
    maxProfit: number
  ) {
    // Дневная прибыль (синяя линия)
    context.strokeStyle = '#2196F3';
    context.lineWidth = 3;
    context.beginPath();
    profitData.forEach((profit, index) => {
      const x = (index / (profitData.length - 1)) * width;
      const y = height - ((profit - minProfit) / (maxProfit - minProfit)) * height;
      if (index === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    });
    context.stroke();
    
    // Точки для дневной прибыли
    context.fillStyle = '#2196F3';
    profitData.forEach((profit, index) => {
      const x = (index / (profitData.length - 1)) * width;
      const y = height - ((profit - minProfit) / (maxProfit - minProfit)) * height;
      context.beginPath();
      context.arc(x, y, 4, 0, 2 * Math.PI);
      context.fill();
    });
  }

  /**
   * Отрисовка легенды графика прибыли
   */
  private drawProfitLegend(context: any, width: number) {
    context.fillStyle = '#2196F3';
    context.fillRect(width - 150, -10, 15, 3);
    context.fillStyle = '#333';
    context.font = '12px Arial';
    context.textAlign = 'left';
    context.fillText('Дневная прибыль', width - 130, -5);
  }

  /**
   * Создать график распределения сигналов
   */
  async generateSignalsChart(stats: DailyStats | WeeklyStats): Promise<Buffer> {
    if (!this.config.includeCharts) {
      throw new Error('Генерация графиков отключена в конфигурации');
    }

    try {
      const canvas = createCanvas(this.config.chartWidth, this.config.chartHeight);
      const context = canvas.getContext('2d');
      
      this.drawSignalsChart(context, stats);
      
      this.logger.info('График сигналов создан успешно');
      return canvas.toBuffer('image/png');
      
    } catch (error) {
      this.logger.error('Ошибка создания графика сигналов:', error);
      throw error;
    }
  }

  /**
   * Отрисовка графика сигналов
   */
  private drawSignalsChart(context: any, stats: DailyStats | WeeklyStats) {
    // Настройка холста
    context.fillStyle = 'white';
    context.fillRect(0, 0, this.config.chartWidth, this.config.chartHeight);

    const { signalsData, title } = this.prepareSignalsData(stats);
    const entries = Object.entries(signalsData);
    
    if (entries.length === 0) {
      this.drawEmptySignalsChart(context);
      return;
    }

    this.drawSignalsPieChart(context, entries, title);
  }

  /**
   * Подготовка данных для графика сигналов
   */
  private prepareSignalsData(stats: DailyStats | WeeklyStats) {
    let signalsData: Record<string, number>;
    let title: string;

    if ('dailyStats' in stats) {
      // Это еженедельная статистика
      signalsData = {};
      stats.dailyStats.forEach(day => {
        Object.entries(day.signalsUsed).forEach(([signal, count]) => {
          signalsData[signal] = (signalsData[signal] || 0) + count;
        });
      });
      title = `Использование сигналов за неделю (${stats.weekStart} — ${stats.weekEnd})`;
    } else {
      // Это дневная статистика
      signalsData = stats.signalsUsed;
      title = `Использование сигналов за ${stats.date}`;
    }

    return { signalsData, title };
  }

  /**
   * Отрисовка пустого графика сигналов
   */
  private drawEmptySignalsChart(context: any) {
    context.fillStyle = '#333';
    context.font = 'bold 16px Arial';
    context.textAlign = 'center';
    context.fillText('Нет данных о сигналах', this.config.chartWidth / 2, this.config.chartHeight / 2);
  }

  /**
   * Отрисовка круговой диаграммы сигналов
   */
  private drawSignalsPieChart(context: any, entries: [string, number][], title: string) {
    const total = entries.reduce((sum, [, count]) => sum + count, 0);
    
    // Центр круга
    const centerX = this.config.chartWidth / 2;
    const centerY = (this.config.chartHeight - 60) / 2 + 30;
    const radius = Math.min(this.config.chartWidth, this.config.chartHeight - 120) / 3;
    
    // Заголовок
    context.fillStyle = '#333';
    context.font = 'bold 16px Arial';
    context.textAlign = 'center';
    context.fillText(title, centerX, 30);
    
    this.drawPieSlices(context, entries, total, centerX, centerY, radius);
    this.drawSignalsLegend(context, entries, total, centerX, centerY, radius);
  }

  /**
   * Отрисовка секторов круговой диаграммы
   */
  private drawPieSlices(
    context: any, 
    entries: [string, number][], 
    total: number, 
    centerX: number, 
    centerY: number, 
    radius: number
  ) {
    const colors = entries.map((_, index) => {
      const hue = (index * 137.508) % 360;
      return `hsl(${hue}, 70%, 60%)`;
    });
    
    let currentAngle = -Math.PI / 2;
    
    entries.forEach(([, count], index) => {
      const sliceAngle = (count / total) * 2 * Math.PI;
      const endAngle = currentAngle + sliceAngle;
      
      context.fillStyle = colors[index];
      context.beginPath();
      context.moveTo(centerX, centerY);
      context.arc(centerX, centerY, radius, currentAngle, endAngle);
      context.closePath();
      context.fill();
      
      context.strokeStyle = '#fff';
      context.lineWidth = 2;
      context.stroke();
      
      currentAngle = endAngle;
    });
  }

  /**
   * Отрисовка легенды для графика сигналов
   */
  private drawSignalsLegend(
    context: any, 
    entries: [string, number][], 
    total: number, 
    centerX: number, 
    centerY: number, 
    radius: number
  ) {
    const colors = entries.map((_, index) => {
      const hue = (index * 137.508) % 360;
      return `hsl(${hue}, 70%, 60%)`;
    });
    
    const legendStartY = centerY + radius + 30;
    const legendItemHeight = 20;
    
    context.font = '12px Arial';
    context.textAlign = 'left';
    
    entries.forEach(([signalName, count], index) => {
      const y = legendStartY + index * legendItemHeight;
      
      context.fillStyle = colors[index];
      context.fillRect(centerX - 150, y - 10, 12, 12);
      
      context.fillStyle = '#333';
      const percentage = ((count / total) * 100).toFixed(1);
      context.fillText(`${signalName}: ${count} (${percentage}%)`, centerX - 130, y);
    });
  }

  /**
   * Создать сводный отчет о торговых парах
   */
  generateTradesReport(trades: TradeRecord[]): string {
    if (trades.length === 0) {
      return '📊 *Нет сделок за выбранный период*';
    }

    let report = '📋 *Детальный отчет по сделкам*\n\n';

    // Группируем по инструментам
    const byInstrument = trades.reduce((acc, trade) => {
      if (!acc[trade.instrumentName]) {
        acc[trade.instrumentName] = [];
      }
      acc[trade.instrumentName].push(trade);
      return acc;
    }, {} as Record<string, TradeRecord[]>);

    Object.entries(byInstrument).forEach(([instrument, instrumentTrades]) => {
      const buys = instrumentTrades.filter(t => t.action === 'buy');
      const sells = instrumentTrades.filter(t => t.action === 'sell');
      const totalProfit = sells.reduce((sum, t) => sum + (t.profit || 0), 0);

      report += `🏷️ *${instrument}*\n`;
      report += `• Покупок: ${buys.length}\n`;
      report += `• Продаж: ${sells.length}\n`;
      report += `• Прибыль: ${totalProfit.toFixed(2)} руб.\n\n`;
    });

    return report;
  }

  /**
   * Форматировать уведомление о сделке
   */
  formatTradeNotification(trade: TradeRecord): string {
    const actionEmoji = trade.action === 'buy' ? '🟢' : '🔴';
    const actionText = trade.action === 'buy' ? 'ПОКУПКА' : 'ПРОДАЖА';
    
    let message = `${actionEmoji} *${actionText}*\n\n`;
    message += `📄 *Инструмент:* ${trade.instrumentName}\n`;
    message += `📊 *Количество:* ${trade.quantity}\n`;
    message += `💰 *Цена:* ${trade.price.toFixed(2)} руб.\n`;
    message += `💵 *Сумма:* ${trade.totalAmount.toFixed(2)} руб.\n`;
    message += `💸 *Комиссия:* ${trade.commission.toFixed(2)} руб.\n`;
    
    if (trade.action === 'sell' && trade.profit !== undefined) {
      const profitEmoji = trade.profit >= 0 ? '📈' : '📉';
      message += `${profitEmoji} *Прибыль:* ${trade.profit.toFixed(2)} руб. (${trade.profitPercent?.toFixed(2)}%)\n`;
    }
    
    if (trade.signals.length > 0) {
      message += `🎯 *Сигналы:* ${trade.signals.join(', ')}\n`;
    }
    
    if (trade.triggerExpression) {
      message += `⚡ *Триггер:* \`${trade.triggerExpression}\`\n`;
    }
    
    message += `⏰ *Время:* ${trade.timestamp.toLocaleString('ru-RU')}\n`;
    
    return message;
  }
}
