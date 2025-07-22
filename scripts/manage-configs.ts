/**
 * Утилита для управления конфигурациями инструментов.
 * Позволяет просматривать, включать/выключать и настраивать инструменты.
 */

import { 
  INSTRUMENT_CONFIGS, 
  getActiveInstrumentConfigs
} from '../src/instrument-configs.js';

/**
 * Показать информацию о всех инструментах
 */
function showAllInstruments() {
  console.log('🔍 === ОБЗОР ВСЕХ ИНСТРУМЕНТОВ ===\n');
  
  Object.values(INSTRUMENT_CONFIGS).forEach(config => {
    const status = config.enabled ? '✅ АКТИВЕН' : '❌ ОТКЛЮЧЕН';
    const signalsCount = config.signals ? Object.keys(config.signals).length : 0;
    
    console.log(`${status} ${config.ticker} (${config.name})`);
    console.log(`   Сектор: ${config.sector}`);
    console.log(`   Лоты: ${config.orderLots}, Комиссия: ${config.brokerFee}%`);
    console.log(`   Интервал: ${config.interval}, Сигналов: ${signalsCount}`);
    
    if (config.signals && signalsCount > 0) {
      console.log(`   Активные сигналы: ${Object.keys(config.signals).join(', ')}`);
    }
    console.log('');
  });
}

/**
 * Показать только активные инструменты
 */
function showActiveInstruments() {
  console.log('✅ === АКТИВНЫЕ ИНСТРУМЕНТЫ ===\n');
  
  const active = getActiveInstrumentConfigs();
  console.log(`Всего активных инструментов: ${active.length}\n`);
  
  active.forEach(config => {
    const signalsCount = config.signals ? Object.keys(config.signals).length : 0;
    
    console.log(`📈 ${config.ticker} - ${config.name}`);
    console.log(`   Сектор: ${config.sector}`);
    console.log(`   Сигналов: ${signalsCount}`);
    if (config.signals) {
      console.log(`   Типы: ${Object.keys(config.signals).join(', ')}`);
    }
    console.log('');
  });
}

/**
 * Показать детальную информацию об инструменте
 */
function showInstrumentDetails(ticker: string) {
  const config = Object.values(INSTRUMENT_CONFIGS).find(c => c.ticker === ticker);
  if (!config) {
    console.log(`❌ Инструмент ${ticker} не найден`);
    return;
  }
  
  console.log(`📊 === ДЕТАЛИ: ${ticker} ===\n`);
  console.log(`Название: ${config.name}`);
  console.log(`FIGI: ${config.figi}`);
  console.log(`Сектор: ${config.sector}`);
  console.log(`Статус: ${config.enabled ? '✅ Активен' : '❌ Отключен'}`);
  console.log(`Лоты: ${config.orderLots}`);
  console.log(`Комиссия: ${config.brokerFee}%`);
  console.log(`Интервал: ${config.interval}\n`);
  
  if (config.signals) {
    console.log('🎯 Настроенные сигналы:');
    Object.entries(config.signals).forEach(([type, signalConfig]) => {
      console.log(`  • ${type}:`, JSON.stringify(signalConfig, null, 4));
    });
  } else {
    console.log('🎯 Сигналы не настроены');
  }
}

/**
 * Показать статистику по секторам
 */
function showSectorStats() {
  console.log('📊 === СТАТИСТИКА ПО СЕКТОРАМ ===\n');
  
  const sectors: Record<string, { total: number; active: number; tickers: string[] }> = {};
  
  Object.values(INSTRUMENT_CONFIGS).forEach(config => {
    if (!sectors[config.sector]) {
      sectors[config.sector] = { total: 0, active: 0, tickers: [] };
    }
    sectors[config.sector].total++;
    sectors[config.sector].tickers.push(config.ticker);
    if (config.enabled) {
      sectors[config.sector].active++;
    }
  });
  
  Object.entries(sectors).forEach(([sector, stats]) => {
    console.log(`🏭 ${sector}:`);
    console.log(`   Всего: ${stats.total}, Активных: ${stats.active}`);
    console.log(`   Тикеры: ${stats.tickers.join(', ')}`);
    console.log('');
  });
}

// Обработка аргументов командной строки
const command = process.argv[2];
const argument = process.argv[3];

switch (command) {
  case 'all':
    showAllInstruments();
    break;
  case 'active':
    showActiveInstruments();
    break;
  case 'details':
    if (argument) {
      showInstrumentDetails(argument.toUpperCase());
    } else {
      console.log('❌ Укажите тикер инструмента. Пример: npm run config details SBER');
    }
    break;
  case 'sectors':
    showSectorStats();
    break;
  default:
    console.log(`
🔧 === УПРАВЛЕНИЕ КОНФИГУРАЦИЯМИ ===

Использование: npm run config <команда> [аргумент]

Команды:
  all      - Показать все инструменты
  active   - Показать только активные инструменты  
  details  - Показать детали инструмента (требует тикер)
  sectors  - Показать статистику по секторам

Примеры:
  npm run config all
  npm run config active
  npm run config details SBER
  npm run config sectors
`);
}
