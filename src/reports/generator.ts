import { DailyStats, WeeklyStats, TradeRecord } from '../trade-tracker';
import { join } from 'path';
import { Logger } from '@vitalets/logger';
import * as d3 from 'd3';
import { createCanvas } from 'canvas';
import { JSDOM } from 'jsdom';

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
      
      // Настройка холста
      context.fillStyle = 'white';
      context.fillRect(0, 0, this.config.chartWidth, this.config.chartHeight);
      
      // Подготовка данных
      const labels = stats.dailyStats.map(day => {
        const date = new Date(day.date);
        return date.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric' });
      });
      
      const profitData = stats.dailyStats.map(day => day.totalProfit);
      const cumulativeData = [];
      let cumulative = 0;
      for (const profit of profitData) {
        cumulative += profit;
        cumulativeData.push(cumulative);
      }
      
      // Размеры графика
      const margin = { top: 50, right: 80, bottom: 60, left: 80 };
      const width = this.config.chartWidth - margin.left - margin.right;
      const height = this.config.chartHeight - margin.top - margin.bottom;
      
      // Шкалы
      const xScale = d3.scaleBand()
        .domain(labels)
        .range([0, width])
        .padding(0.1);
      
      const yScale1 = d3.scaleLinear()
        .domain(d3.extent(profitData) as [number, number])
        .nice()
        .range([height, 0]);
      
      const yScale2 = d3.scaleLinear()
        .domain(d3.extent(cumulativeData) as [number, number])
        .nice()
        .range([height, 0]);
      
      // Линия для дневной прибыли
      const line1 = d3.line<number>()
        .x((d, i) => (xScale(labels[i]) || 0) + xScale.bandwidth() / 2)
        .y(d => yScale1(d))
        .curve(d3.curveMonotoneX);
      
      // Линия для накопительной прибыли
      const line2 = d3.line<number>()
        .x((d, i) => (xScale(labels[i]) || 0) + xScale.bandwidth() / 2)
        .y(d => yScale2(d))
        .curve(d3.curveMonotoneX);
      
      // Рисуем график
      context.save();
      context.translate(margin.left, margin.top);
      
      // Заголовок
      context.fillStyle = '#333';
      context.font = 'bold 16px Arial';
      context.textAlign = 'center';
      context.fillText(`Прибыль за неделю (${stats.weekStart} — ${stats.weekEnd})`, width / 2, -20);
      
      // Оси
      context.strokeStyle = '#ccc';
      context.lineWidth = 1;
      
      // Вертикальные линии сетки
      labels.forEach((label, i) => {
        const x = (xScale(label) || 0) + xScale.bandwidth() / 2;
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, height);
        context.stroke();
      });
      
      // Горизонтальные линии сетки
      const yTicks = yScale1.ticks(5);
      yTicks.forEach(tick => {
        const y = yScale1(tick);
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(width, y);
        context.stroke();
      });
      
      // Дневная прибыль (синяя линия)
      context.strokeStyle = '#2196F3';
      context.lineWidth = 3;
      context.beginPath();
      profitData.forEach((d, i) => {
        const x = (xScale(labels[i]) || 0) + xScale.bandwidth() / 2;
        const y = yScale1(d);
        if (i === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      });
      context.stroke();
      
      // Точки для дневной прибыли
      context.fillStyle = '#2196F3';
      profitData.forEach((d, i) => {
        const x = (xScale(labels[i]) || 0) + xScale.bandwidth() / 2;
        const y = yScale1(d);
        context.beginPath();
        context.arc(x, y, 4, 0, 2 * Math.PI);
        context.fill();
      });
      
      // Накопительная прибыль (красная линия)
      context.strokeStyle = '#F44336';
      context.lineWidth = 3;
      context.beginPath();
      cumulativeData.forEach((d, i) => {
        const x = (xScale(labels[i]) || 0) + xScale.bandwidth() / 2;
        const y = yScale2(d);
        if (i === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      });
      context.stroke();
      
      // Точки для накопительной прибыли
      context.fillStyle = '#F44336';
      cumulativeData.forEach((d, i) => {
        const x = (xScale(labels[i]) || 0) + xScale.bandwidth() / 2;
        const y = yScale2(d);
        context.beginPath();
        context.arc(x, y, 4, 0, 2 * Math.PI);
        context.fill();
      });
      
      // Подписи осей
      context.fillStyle = '#333';
      context.font = '12px Arial';
      context.textAlign = 'center';
      
      // Подписи X
      labels.forEach((label, i) => {
        const x = (xScale(label) || 0) + xScale.bandwidth() / 2;
        context.fillText(label, x, height + 20);
      });
      
      // Подписи Y (левая ось)
      context.textAlign = 'right';
      yTicks.forEach(tick => {
        const y = yScale1(tick);
        context.fillText(tick.toFixed(0), -10, y + 4);
      });
      
      // Легенда
      context.fillStyle = '#2196F3';
      context.fillRect(width - 150, -10, 15, 3);
      context.fillStyle = '#333';
      context.font = '12px Arial';
      context.textAlign = 'left';
      context.fillText('Дневная прибыль', width - 130, -5);
      
      context.fillStyle = '#F44336';
      context.fillRect(width - 150, 10, 15, 3);
      context.fillStyle = '#333';
      context.fillText('Накопительная', width - 130, 15);
      
      context.restore();
      
      this.logger.info('График прибыли создан успешно с помощью D3.js');
      return canvas.toBuffer('image/png');
      
    } catch (error) {
      this.logger.error('Ошибка создания графика прибыли:', error);
      throw error;
    }
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
      
      // Настройка холста
      context.fillStyle = 'white';
      context.fillRect(0, 0, this.config.chartWidth, this.config.chartHeight);

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

      const entries = Object.entries(signalsData);
      if (entries.length === 0) {
        // Если нет данных, создаем пустой график
        context.fillStyle = '#333';
        context.font = 'bold 16px Arial';
        context.textAlign = 'center';
        context.fillText('Нет данных о сигналах', this.config.chartWidth / 2, this.config.chartHeight / 2);
        return canvas.toBuffer('image/png');
      }

      const total = entries.reduce((sum, [, count]) => sum + count, 0);
      
      // Центр круга
      const centerX = this.config.chartWidth / 2;
      const centerY = (this.config.chartHeight - 60) / 2 + 30; // Оставляем место для заголовка
      const radius = Math.min(this.config.chartWidth, this.config.chartHeight - 120) / 3;
      
      // Заголовок
      context.fillStyle = '#333';
      context.font = 'bold 16px Arial';
      context.textAlign = 'center';
      context.fillText(title, centerX, 30);
      
      // Генерируем цвета для каждого сигнала
      const colors = entries.map((_, index) => {
        const hue = (index * 137.508) % 360; // Золотое сечение для равномерного распределения цветов
        return `hsl(${hue}, 70%, 60%)`;
      });
      
      let currentAngle = -Math.PI / 2; // Начинаем сверху
      
      // Рисуем секторы
      entries.forEach(([signal, count], index) => {
        const sliceAngle = (count / total) * 2 * Math.PI;
        const endAngle = currentAngle + sliceAngle;
        
        // Рисуем сектор
        context.fillStyle = colors[index];
        context.beginPath();
        context.moveTo(centerX, centerY);
        context.arc(centerX, centerY, radius, currentAngle, endAngle);
        context.closePath();
        context.fill();
        
        // Обводка
        context.strokeStyle = '#fff';
        context.lineWidth = 2;
        context.stroke();
        
        // Подпись процента
        if (sliceAngle > 0.1) { // Показываем только если сектор достаточно большой
          const labelAngle = currentAngle + sliceAngle / 2;
          const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
          const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
          
          const percentage = ((count / total) * 100).toFixed(1);
          context.fillStyle = '#fff';
          context.font = 'bold 12px Arial';
          context.textAlign = 'center';
          context.fillText(`${percentage}%`, labelX, labelY);
        }
        
        currentAngle = endAngle;
      });
      
      // Легенда
      const legendStartY = centerY + radius + 30;
      const legendItemHeight = 20;
      
      context.font = '12px Arial';
      context.textAlign = 'left';
      
      entries.forEach(([signal, count], index) => {
        const y = legendStartY + index * legendItemHeight;
        
        // Цветной квадрат
        context.fillStyle = colors[index];
        context.fillRect(centerX - 150, y - 10, 12, 12);
        
        // Текст
        context.fillStyle = '#333';
        const percentage = ((count / total) * 100).toFixed(1);
        context.fillText(`${signal}: ${count} (${percentage}%)`, centerX - 130, y);
      });
      
      this.logger.info('График сигналов создан успешно с помощью D3.js');
      return canvas.toBuffer('image/png');
      
    } catch (error) {
      this.logger.error('Ошибка создания графика сигналов:', error);
      throw error;
    }
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
