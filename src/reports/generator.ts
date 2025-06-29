/**
 * Модуль для генерации отчетов и графиков
 */

import { createCanvas } from 'canvas';
import { Chart, registerables } from 'chart.js';
import { DailyStats, WeeklyStats, TradeRecord } from '../trade-tracker';
import { join } from 'path';
import { Logger } from '@vitalets/logger';

// Регистрируем все компоненты Chart.js
Chart.register(...registerables);

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
    this.config = {
      includeCharts: true,
      chartWidth: 800,
      chartHeight: 400,
      outputDir: join(process.cwd(), 'reports'),
      ...config,
    };
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
    const canvas = createCanvas(this.config.chartWidth, this.config.chartHeight);
    const ctx = canvas.getContext('2d');

    const labels = stats.dailyStats.map(day => {
      const date = new Date(day.date);
      return date.toLocaleDateString('ru-RU', { weekday: 'short', month: 'short', day: 'numeric' });
    });

    const profitData = stats.dailyStats.map(day => day.totalProfit);
    const cumulativeData = [];
    let cumulative = 0;
    for (const profit of profitData) {
      cumulative += profit;
      cumulativeData.push(cumulative);
    }

    new Chart(ctx as any, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Дневная прибыль',
            data: profitData,
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.1,
            yAxisID: 'y',
          },
          {
            label: 'Накопительная прибыль',
            data: cumulativeData,
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            tension: 0.1,
            yAxisID: 'y1',
          },
        ],
      },
      options: {
        responsive: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'День недели',
            },
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Дневная прибыль (руб.)',
            },
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Накопительная прибыль (руб.)',
            },
            grid: {
              drawOnChartArea: false,
            },
          },
        },
        plugins: {
          title: {
            display: true,
            text: `Прибыль за неделю (${stats.weekStart} — ${stats.weekEnd})`,
          },
          legend: {
            display: true,
          },
        },
      },
    });

    return canvas.toBuffer('image/png');
  }

  /**
   * Создать график распределения сигналов
   */
  async generateSignalsChart(stats: DailyStats | WeeklyStats): Promise<Buffer> {
    const canvas = createCanvas(this.config.chartWidth, this.config.chartHeight);
    const ctx = canvas.getContext('2d');

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

    const labels = Object.keys(signalsData);
    const data = Object.values(signalsData);
    
    // Генерируем цвета для каждого сигнала
    const colors = labels.map((_, index) => {
      const hue = (index * 137.508) % 360; // Золотое сечение для равномерного распределения цветов
      return `hsl(${hue}, 70%, 60%)`;
    });

    new Chart(ctx as any, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: colors,
            borderWidth: 2,
            borderColor: '#fff',
          },
        ],
      },
      options: {
        responsive: false,
        plugins: {
          title: {
            display: true,
            text: title,
          },
          legend: {
            display: true,
            position: 'bottom',
          },
        },
      },
    });

    return canvas.toBuffer('image/png');
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
