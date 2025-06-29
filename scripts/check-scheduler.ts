/**
 * Проверка статуса планировщика отчетов
 */

import { config } from 'dotenv';
import { TelegramNotifier } from '../src/notifications/telegram.js';
import { TradeTracker } from '../src/trade-tracker/index.js';
import { ReportGenerator } from '../src/reports/generator.js';
import { ReportScheduler } from '../src/scheduler/index.js';

// Загружаем переменные окружения
config();

async function checkSchedulerStatus() {
  console.log('⏰ Проверка статуса планировщика...');
  
  const telegramNotifier = new TelegramNotifier();
  const tradeTracker = new TradeTracker();
  const reportGenerator = new ReportGenerator();
  const reportScheduler = new ReportScheduler(tradeTracker, reportGenerator, telegramNotifier);
  
  const status = reportScheduler.getStatus();
  console.log('\n' + status);
  
  if (telegramNotifier.isEnabled()) {
    console.log('\n📤 Отправка статуса в Telegram...');
    await telegramNotifier.sendMessage(status);
    console.log('✅ Статус отправлен');
  } else {
    console.log('\n❌ Telegram не настроен');
  }
}

checkSchedulerStatus().catch(error => {
  console.error('❌ Ошибка:', error);
  process.exit(1);
});
