import { DailyStats, WeeklyStats, TradeRecord } from '../trade-tracker';
import { join } from 'path';
import { Logger } from '@vitalets/logger';

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
      process.env.YANDEX_CLOUD_FUNCTION_VERSION ||
      process.env._YANDEX_CLOUD_
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
    
    // В serverless окружении добавляем информацию о логах
    if (this.isServerlessEnvironment() && stats.totalTrades === 0) {
      report += `📋 *Информация:* В Yandex Cloud Functions статистика может быть неполной.\n`;
      report += `🔍 Для получения полной истории сделок проверьте логи функции.\n\n`;
    }
    
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
      const svgContent = this.generateProfitChartSVG(stats);
      
      this.logger.info('График прибыли создан успешно (SVG)');
      return Buffer.from(svgContent, 'utf-8');
      
    } catch (error) {
      this.logger.error('Ошибка создания графика прибыли:', error);
      throw error;
    }
  }

  /**
   * Генерация SVG графика прибыли
   */
  private generateProfitChartSVG(stats: WeeklyStats): string {
    const width = this.config.chartWidth;
    const height = this.config.chartHeight;
    const margin = { top: 50, right: 80, bottom: 60, left: 80 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    
    const profitData = stats.dailyStats.map(day => day.totalProfit);
    const labels = stats.dailyStats.map(day => {
      const date = new Date(day.date);
      return date.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric' });
    });
    
    const minProfit = Math.min(...profitData);
    const maxProfit = Math.max(...profitData);
    const range = maxProfit - minProfit || 1;
    
    // Генерируем точки для линии
    const points = profitData.map((profit, index) => {
      const x = margin.left + (index / (profitData.length - 1)) * chartWidth;
      const y = margin.top + chartHeight - ((profit - minProfit) / range) * chartHeight;
      return `${x},${y}`;
    }).join(' ');
    
    // Генерируем оси Y
    const yTicks = 5;
    const yAxisLabels = Array.from({ length: yTicks }, (_, i) => {
      const value = minProfit + (range * i) / (yTicks - 1);
      const y = margin.top + chartHeight - (i / (yTicks - 1)) * chartHeight;
      return { value: value.toFixed(0), y };
    });
    
    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="white"/>
        
        <!-- Заголовок -->
        <text x="${width / 2}" y="30" text-anchor="middle" font-family="Arial" font-size="16" 
              font-weight="bold" fill="#333">
          Прибыль за неделю (${stats.weekStart} — ${stats.weekEnd})
        </text>
        
        <!-- Сетка -->
        ${yAxisLabels.map(tick => `
          <line x1="${margin.left}" y1="${tick.y}" x2="${margin.left + chartWidth}" y2="${tick.y}" 
                stroke="#e0e0e0" stroke-width="1"/>
        `).join('')}
        
        <!-- Оси -->
        <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" 
              y2="${margin.top + chartHeight}" stroke="#333" stroke-width="2"/>
        <line x1="${margin.left}" y1="${margin.top + chartHeight}" 
              x2="${margin.left + chartWidth}" y2="${margin.top + chartHeight}" 
              stroke="#333" stroke-width="2"/>
        
        <!-- Подписи Y -->
        ${yAxisLabels.map(tick => `
          <text x="${margin.left - 10}" y="${tick.y + 5}" text-anchor="end" 
                font-family="Arial" font-size="12" fill="#333">
            ${tick.value}
          </text>
        `).join('')}
        
        <!-- Подписи X -->
        ${labels.map((label, i) => {
          const x = margin.left + (i / (labels.length - 1)) * chartWidth;
          return `<text x="${x}" y="${margin.top + chartHeight + 20}" text-anchor="middle" 
                        font-family="Arial" font-size="12" fill="#333">
            ${label}
          </text>`;
        }).join('')}
        
        <!-- Линия прибыли -->
        <polyline points="${points}" fill="none" stroke="#2196F3" stroke-width="3"/>
        
        <!-- Точки -->
        ${profitData.map((profit, index) => {
          const x = margin.left + (index / (profitData.length - 1)) * chartWidth;
          const y = margin.top + chartHeight - ((profit - minProfit) / range) * chartHeight;
          return `<circle cx="${x}" cy="${y}" r="4" fill="#2196F3"/>`;
        }).join('')}
        
        <!-- Легенда -->
        <rect x="${width - 150}" y="${margin.top - 10}" width="15" height="3" fill="#2196F3"/>
        <text x="${width - 130}" y="${margin.top - 5}" font-family="Arial" font-size="12" fill="#333">
          Дневная прибыль
        </text>
      </svg>
    `;
  }

  /**
   * Создать график распределения сигналов
   */
  async generateSignalsChart(stats: DailyStats | WeeklyStats): Promise<Buffer> {
    if (!this.config.includeCharts) {
      throw new Error('Генерация графиков отключена в конфигурации');
    }

    try {
      const svgContent = this.generateSignalsChartSVG(stats);
      
      this.logger.info('График сигналов создан успешно (SVG)');
      return Buffer.from(svgContent, 'utf-8');
      
    } catch (error) {
      this.logger.error('Ошибка создания графика сигналов:', error);
      throw error;
    }
  }

  /**
   * Генерация SVG графика сигналов
   */
  private generateSignalsChartSVG(stats: DailyStats | WeeklyStats): string {
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
      return this.generateEmptySignalsChartSVG();
    }

    const width = this.config.chartWidth;
    const height = this.config.chartHeight;
    const centerX = width / 2;
    const centerY = (height - 60) / 2 + 30;
    const radius = Math.min(width, height - 120) / 3;
    
    const total = entries.reduce((sum, [, count]) => sum + (count as number), 0);
    
    // Генерируем цвета
    const colors = entries.map((_, index) => {
      const hue = (index * 137.508) % 360;
      return `hsl(${hue}, 70%, 60%)`;
    });
    
    // Генерируем секторы
    let currentAngle = -Math.PI / 2;
    const sectors = entries.map(([signal, count], index) => {
      const numCount = count as number;
      const sliceAngle = (numCount / total) * 2 * Math.PI;
      const endAngle = currentAngle + sliceAngle;
      
      const x1 = centerX + Math.cos(currentAngle) * radius;
      const y1 = centerY + Math.sin(currentAngle) * radius;
      const x2 = centerX + Math.cos(endAngle) * radius;
      const y2 = centerY + Math.sin(endAngle) * radius;
      
      const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;
      
      const pathData = [
        `M ${centerX} ${centerY}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        'Z'
      ].join(' ');
      
      const sector = `<path d="${pathData}" fill="${colors[index]}" stroke="white" stroke-width="2"/>`;
      
      currentAngle = endAngle;
      return { sector, signal, count: numCount, color: colors[index] };
    });
    
    // Генерируем легенду
    const legendItems = sectors.map(({ signal, count, color }, index) => {
      const y = centerY + radius + 50 + index * 20;
      const percentage = ((count / total) * 100).toFixed(1);
      
      return `
        <rect x="${centerX - 150}" y="${y - 10}" width="12" height="12" fill="${color}"/>
        <text x="${centerX - 130}" y="${y}" font-family="Arial" font-size="12" fill="#333">
          ${signal}: ${count} (${percentage}%)
        </text>
      `;
    });
    
    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="white"/>
        
        <!-- Заголовок -->
        <text x="${centerX}" y="30" text-anchor="middle" font-family="Arial" 
              font-size="16" font-weight="bold" fill="#333">
          ${title}
        </text>
        
        <!-- Секторы -->
        ${sectors.map(s => s.sector).join('')}
        
        <!-- Легенда -->
        ${legendItems.join('')}
      </svg>
    `;
  }

  /**
   * Генерация пустого SVG графика сигналов
   */
  private generateEmptySignalsChartSVG(): string {
    const width = this.config.chartWidth;
    const height = this.config.chartHeight;
    
    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="white"/>
        <text x="${width / 2}" y="${height / 2}" text-anchor="middle" 
              font-family="Arial" font-size="16" font-weight="bold" fill="#333">
          Нет данных о сигналах
        </text>
      </svg>
    `;
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
