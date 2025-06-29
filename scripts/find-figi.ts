#!/usr/bin/env node
/**
 * Скрипт для поиска FIGI по тикеру
 * 
 * Использование:
 * npx tsx scripts/find-figi.ts SBER
 * npx tsx scripts/find-figi.ts VTBR
 * npx tsx scripts/find-figi.ts GAZP
 */

import { config } from 'dotenv';
import { TinkoffInvestApi } from 'tinkoff-invest-api';
import { InstrumentStatus } from 'tinkoff-invest-api/dist/generated/instruments.js';

// Загружаем переменные окружения
config();

function printInstruments(instruments: any[]) {
  instruments.forEach((instrument, index) => {
    console.log(`📊 ${index + 1}. ${instrument.name}`);
    console.log(`   Тикер: ${instrument.ticker}`);
    console.log(`   FIGI: ${instrument.figi}`);
    console.log(`   Класс: ${instrument.instrumentType || 'Акция'}`);
    console.log(`   Валюта: ${instrument.currency}`);
    console.log(`   Биржа: ${instrument.exchange}`);
    console.log(`   Торговля доступна: ${instrument.tradingStatus === 'SECURITY_TRADING_STATUS_NORMAL_TRADING' ? 'Да' : 'Нет'}`);
    
    if (instrument.lot) {
      console.log(`   Размер лота: ${instrument.lot}`);
    }
    
    if (instrument.minPriceIncrement) {
      const minPrice = Number(instrument.minPriceIncrement.units) + Number(instrument.minPriceIncrement.nano) / 1000000000;
      console.log(`   Мин. шаг цены: ${minPrice}`);
    }
    
    console.log('');
  });

  // Если найден только один инструмент, выводим FIGI отдельно для удобства копирования
  if (instruments.length === 1) {
    console.log(`🎯 FIGI для копирования: ${instruments[0].figi}`);
  }
}

async function findFigi(ticker: string) {
  if (!ticker) {
    console.log('❌ Укажите тикер. Пример: npx tsx scripts/find-figi.ts SBER');
    process.exit(1);
  }

  // Проверяем токен
  const token = (process.env.TINKOFF_TOKEN || process.env.TINKOFF_API_TOKEN)?.trim();
  if (!token) {
    console.log('❌ Переменная окружения TINKOFF_TOKEN или TINKOFF_API_TOKEN не установлена');
    console.log('Убедитесь, что файл .env содержит правильный токен');
    process.exit(1);
  }

  try {
    console.log(`🔍 Поиск FIGI для тикера: ${ticker.toUpperCase()}\n`);

    // Создаем API
    const api = new TinkoffInvestApi({
      token: token,
      appName: 'tinkoff-robot-figi-finder'
    });

    // Поиск акций по тикеру
    const sharesResponse = await api.instruments.shares({
      instrumentStatus: InstrumentStatus.INSTRUMENT_STATUS_BASE
    });
    
    // Фильтруем по тикеру
    const matchingShares = sharesResponse.instruments.filter(instrument => 
      instrument.ticker.toUpperCase() === ticker.toUpperCase()
    );

    if (matchingShares.length > 0) {
      console.log(`✅ Найдено акций: ${matchingShares.length}\n`);
      printInstruments(matchingShares);
      return;
    }
    
    // Если акции не найдены, ищем в облигациях
    const bondsResponse = await api.instruments.bonds({
      instrumentStatus: InstrumentStatus.INSTRUMENT_STATUS_BASE
    });
    
    const matchingBonds = bondsResponse.instruments.filter(instrument => 
      instrument.ticker.toUpperCase() === ticker.toUpperCase()
    );
    
    if (matchingBonds.length > 0) {
      console.log(`✅ Найдено облигаций: ${matchingBonds.length}\n`);
      printInstruments(matchingBonds);
      return;
    }

    // Если ничего не найдено, ищем в ETF
    const etfResponse = await api.instruments.etfs({
      instrumentStatus: InstrumentStatus.INSTRUMENT_STATUS_BASE
    });
    
    const matchingEtfs = etfResponse.instruments.filter(instrument => 
      instrument.ticker.toUpperCase() === ticker.toUpperCase()
    );
    
    if (matchingEtfs.length > 0) {
      console.log(`✅ Найдено ETF: ${matchingEtfs.length}\n`);
      printInstruments(matchingEtfs);
      return;
    }

    console.log(`❌ Инструменты с тикером "${ticker}" не найдены`);

  } catch (error) {
    console.error('❌ Ошибка при поиске FIGI:', error);
  }
}

// Получаем тикер из аргументов командной строки
const ticker = process.argv[2];
findFigi(ticker).catch(console.error);
