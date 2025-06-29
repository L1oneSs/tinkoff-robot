/**
 * Получение Chat ID для Telegram
 */

import TelegramBot from 'node-telegram-bot-api';
import { config } from 'dotenv';

// Загружаем переменные окружения
config();

const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();

if (!botToken || botToken === 'YOUR_BOT_TOKEN_HERE') {
  console.log('❌ TELEGRAM_BOT_TOKEN не настроен в .env');
  process.exit(1);
}

console.log('🤖 Получение Chat ID...');
console.log('📝 Инструкция:');
console.log('1. Напишите вашему боту любое сообщение (например, "привет")');
console.log('2. Этот скрипт покажет ваш Chat ID');
console.log('3. Скопируйте Chat ID в .env файл');
console.log('\n⏳ Ожидание сообщений от бота...\n');

try {
  const bot = new TelegramBot(botToken, { polling: false });
  
  // Получаем последние обновления
  bot.getUpdates().then(updates => {
    if (updates.length === 0) {
      console.log('📭 Сообщений не найдено.');
      console.log('💡 Сначала напишите боту любое сообщение, затем запустите скрипт заново.');
      return;
    }
    
    console.log('📨 Найдены сообщения:');
    updates.forEach((update, index) => {
      if (update.message) {
        const chatId = update.message.chat.id;
        const firstName = update.message.from?.first_name || 'Неизвестно';
        const username = update.message.from?.username || 'нет';
        const text = update.message.text || 'медиа сообщение';
        
        console.log(`\n${index + 1}. От: ${firstName} (@${username})`);
        console.log(`   Chat ID: ${chatId}`);
        console.log(`   Сообщение: "${text}"`);
        console.log(`   Время: ${new Date(update.message.date * 1000).toLocaleString()}`);
      }
    });
    
    // Показываем самый последний Chat ID
    const lastUpdate = updates[updates.length - 1];
    if (lastUpdate.message) {
      const chatId = lastUpdate.message.chat.id;
      console.log(`\n🎯 Ваш Chat ID: ${chatId}`);
      console.log('\n📝 Добавьте эту строку в .env:');
      console.log(`TELEGRAM_CHAT_ID=${chatId}`);
    }
  }).catch(error => {
    console.error('❌ Ошибка при получении обновлений:', error.message);
    console.log('\n💡 Возможные причины:');
    console.log('- Неверный токен бота');
    console.log('- Бот заблокирован или удален');
    console.log('- Проблемы с интернет-соединением');
  });
  
} catch (error) {
  console.error('❌ Ошибка инициализации бота:', error);
}
