/**
 * Тестирование системы уведомлений и отчетов
 */

import { config } from 'dotenv';
import { TelegramNotifier } from '../src/notifications/telegram.js';
import { TradeTracker } from '../src/trade-tracker/index.js';
import { ReportGenerator } from '../src/reports/generator.js';
import { ReportScheduler } from '../src/scheduler/index.js';

// Загружаем переменные окружения
config();

async function testNotificationsAndReports() {
  console.log('🚀 Тестирование системы уведомлений и отчетов...');
  
  // Инициализируем компоненты
  const telegramNotifier = new TelegramNotifier();
  const tradeTracker = new TradeTracker();
  const reportGenerator = new ReportGenerator();
  const reportScheduler = new ReportScheduler(tradeTracker, reportGenerator, telegramNotifier);
  
  console.log('📱 Проверка Telegram бота...');
  if (telegramNotifier.isEnabled()) {
    console.log('✅ Telegram бот настроен и готов к работе');
    
    // Тестовое уведомление
    await telegramNotifier.sendMessage('🤖 *Тест системы уведомлений*\n\nСистема уведомлений торгового робота работает корректно!');
  } else {
    console.log('❌ Telegram бот не настроен. Проверьте TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID в .env');
  }
  
  console.log('\n📊 Тестирование трекера сделок...');
  
  // Создаем тестовые сделки
  const testTrade1 = tradeTracker.recordTrade({
    figi: 'BBG004730N88',
    instrumentName: 'Сбер Банк',
    action: 'buy',
    quantity: 1,
    price: 285.5,
    totalAmount: 2855,
    commission: 2.85,
    signals: ['rsi', 'sma'],
  });
  
  console.log('✅ Создана тестовая сделка покупки:', testTrade1.id);
  
  const testTrade2 = tradeTracker.recordTrade({
    figi: 'BBG004730N88',
    instrumentName: 'Сбер Банк',
    action: 'sell',
    quantity: 1,
    price: 295.0,
    totalAmount: 2950,
    commission: 2.95,
    profit: 86.7,
    profitPercent: 3.04,
    signals: ['profit'],
  });
  
  console.log('✅ Создана тестовая сделка продажи:', testTrade2.id);
  
  console.log('\n📈 Генерация отчетов...');
  
  // Генерируем отчет за сегодня
  const today = new Date().toISOString().split('T')[0];
  const dailyStats = tradeTracker.getDailyStats(today);
  const dailyReport = reportGenerator.generateDailyReport(dailyStats);
  
  console.log('📋 Ежедневный отчет:');
  console.log(dailyReport);
  
  if (telegramNotifier.isEnabled()) {
    console.log('\n📤 Отправка отчета в Telegram...');
    await telegramNotifier.sendMessage(dailyReport);
    
    // Генерируем и отправляем график
    if (Object.keys(dailyStats.signalsUsed).length > 0) {
      console.log('📊 Генерация графика сигналов...');
      const signalsChart = await reportGenerator.generateSignalsChart(dailyStats);
      await telegramNotifier.sendDocument(signalsChart, `test_signals_${today}.png`);
      console.log('✅ График отправлен');
    }
  }
  
  console.log('\n🕐 Проверка планировщика...');
  const schedulerStatus = reportScheduler.getStatus();
  console.log(schedulerStatus);
  
  console.log('\n⏰ Проверка торгового времени...');
  const isTradingTime = reportScheduler.isTradingTime();
  console.log(`Торговое время: ${isTradingTime ? 'Да' : 'Нет'}`);
  
  console.log('\n📋 Все тестовые сделки:');
  const allTrades = tradeTracker.loadTrades();
  allTrades.forEach(trade => {
    console.log(`${trade.timestamp.toLocaleString()} - ${trade.action} ${trade.instrumentName} ${trade.quantity} по ${trade.price}`);
  });
  
  console.log('\n🎉 Тестирование завершено успешно!');
  console.log('\n💡 Следующие шаги:');
  console.log('1. Интегрируйте в основной скрипт запуска');
  console.log('2. Настройте cron для запуска каждые 5 минут в торговые дни');
  console.log('3. Проверьте работу на реальном счете');
  
  // Очищаем тестовые данные (опционально)
  // tradeTracker.clearTrades();
  // console.log('🧹 Тестовые данные очищены');
}

testNotificationsAndReports().catch(error => {
  console.error('❌ Ошибка при тестировании:', error);
  process.exit(1);
});
