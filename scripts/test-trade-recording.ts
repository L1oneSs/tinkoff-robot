/**
 * Тест записи сделки в Google Sheets
 */

import { config } from 'dotenv';
import { TradeTracker } from '../src/trade-tracker/index.js';

// Загружаем переменные окружения
config();

async function testTradeRecording() {
  console.log('🧪 Тестируем запись сделки в Google Sheets...');
  
  try {
    const tradeTracker = new TradeTracker();
    
    // Создаем тестовую сделку
    const testTrade = await tradeTracker.recordTrade({
      figi: 'BBG004730N88',
      instrumentName: 'Сбер Банк (ТЕСТ)',
      action: 'buy',
      quantity: 1,
      price: 285.5,
      totalAmount: 285.5,
      commission: 2.85,
      signals: ['test-signal'],
      triggerExpression: 'test-trigger'
    });
    
    console.log('✅ Тестовая сделка создана:', {
      id: testTrade.id,
      action: testTrade.action,
      instrument: testTrade.instrumentName,
      price: testTrade.price
    });
    
    // Попробуем загрузить сделки обратно
    console.log('📥 Загружаем сделки из Google Sheets...');
    const trades = await tradeTracker.loadTrades();
    
    console.log(`📊 Найдено ${trades.length} сделок в Google Sheets`);
    
    // Найдем нашу тестовую сделку
    const ourTrade = trades.find(trade => trade.id === testTrade.id);
    if (ourTrade) {
      console.log('✅ Наша тестовая сделка найдена в Google Sheets!');
      console.log('   Данные:', {
        id: ourTrade.id,
        action: ourTrade.action,
        instrument: ourTrade.instrumentName,
        price: ourTrade.price,
        date: ourTrade.sessionDate
      });
    } else {
      console.log('❌ Наша тестовая сделка НЕ найдена в Google Sheets!');
    }
    
    console.log('\n🎉 Тест записи сделок завершён!');
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании записи сделок:', error);
    process.exit(1);
  }
}

testTradeRecording();
