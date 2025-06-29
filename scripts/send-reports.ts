/**
 * Ручная отправка отчетов
 */

import { config } from 'dotenv';
import { TelegramNotifier } from '../src/notifications/telegram.js';
import { TradeTracker } from '../src/trade-tracker/index.js';
import { ReportGenerator } from '../src/reports/generator.js';
import { ReportScheduler } from '../src/scheduler/index.js';

// Загружаем переменные окружения
config();

async function sendManualReports() {
  const reportType = process.argv[2] || 'daily';
  const date = process.argv[3] || new Date().toISOString().split('T')[0];
  
  console.log(`📊 Ручная отправка ${reportType === 'weekly' ? 'еженедельного' : 'ежедневного'} отчета...`);
  
  const telegramNotifier = new TelegramNotifier();
  const tradeTracker = new TradeTracker();
  const reportGenerator = new ReportGenerator();
  const reportScheduler = new ReportScheduler(tradeTracker, reportGenerator, telegramNotifier);
  
  if (!telegramNotifier.isEnabled()) {
    console.log('❌ Telegram не настроен');
    return;
  }
  
  try {
    if (reportType === 'weekly') {
      await reportScheduler.sendWeeklyReport();
      console.log('✅ Еженедельный отчет отправлен');
    } else {
      await reportScheduler.sendDailyReport();
      console.log('✅ Ежедневный отчет отправлен');
    }
  } catch (error) {
    console.error('❌ Ошибка при отправке отчета:', error);
  }
}

if (process.argv.includes('--help')) {
  console.log(`
📊 Ручная отправка отчетов

Использование:
  npx ts-node-esm scripts/send-reports.ts [тип] [дата]

Параметры:
  тип    - daily (по умолчанию) или weekly
  дата   - дата в формате YYYY-MM-DD (по умолчанию сегодня)

Примеры:
  npx ts-node-esm scripts/send-reports.ts daily
  npx ts-node-esm scripts/send-reports.ts weekly
  npx ts-node-esm scripts/send-reports.ts daily 2025-06-29
  `);
} else {
  sendManualReports().catch(error => {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  });
}
