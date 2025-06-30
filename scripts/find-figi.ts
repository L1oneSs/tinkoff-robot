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
import type { Share, Bond, Etf } from 'tinkoff-invest-api/dist/generated/instruments.js';

// Загружаем переменные окружения
config();

function printInstruments(instruments: (Share | Bond | Etf)[]) {
  instruments.forEach((instrument, index) => {
    console.log(`📊 ${index + 1}. ${instrument.name}`);
    console.log(`   Тикер: ${instrument.ticker}`);
    console.log(`   FIGI: ${instrument.figi}`);
    console.log(`   Класс: ${(instrument as any).instrumentType || 'Неизвестно'}`);
    console.log(`   Валюта: ${instrument.currency}`);
    console.log(`   Биржа: ${instrument.exchange}`);
    console.log(`   Торговля доступна: ${instrument.tradingStatus === 1 ? 'Да' : 'Нет'}`);
    
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

async function searchInShares(api: TinkoffInvestApi, ticker: string) {
  const response = await api.instruments.shares({
    instrumentStatus: InstrumentStatus.INSTRUMENT_STATUS_BASE
  });
  
  return response.instruments.filter(instrument => 
    instrument.ticker.toUpperCase() === ticker.toUpperCase()
  );
}

async function searchInBonds(api: TinkoffInvestApi, ticker: string) {
  const response = await api.instruments.bonds({
    instrumentStatus: InstrumentStatus.INSTRUMENT_STATUS_BASE
  });
  
  return response.instruments.filter(instrument => 
    instrument.ticker.toUpperCase() === ticker.toUpperCase()
  );
}

async function searchInEtfs(api: TinkoffInvestApi, ticker: string) {
  const response = await api.instruments.etfs({
    instrumentStatus: InstrumentStatus.INSTRUMENT_STATUS_BASE
  });
  
  return response.instruments.filter(instrument => 
    instrument.ticker.toUpperCase() === ticker.toUpperCase()
  );
}

function validateInput(ticker: string): void {
  if (!ticker) {
    console.log('❌ Укажите тикер. Пример: npx tsx scripts/find-figi.ts SBER');
    process.exit(1);
  }
}

function validateToken(): string {
  const token = (process.env.TINKOFF_TOKEN || process.env.TINKOFF_API_TOKEN)?.trim();
  if (!token) {
    console.log('❌ Переменная окружения TINKOFF_TOKEN или TINKOFF_API_TOKEN не установлена');
    console.log('Убедитесь, что файл .env содержит правильный токен');
    process.exit(1);
  }
  return token;
}

async function searchInAllInstruments(api: TinkoffInvestApi, ticker: string) {
  // Поиск в акциях
  const matchingShares = await searchInShares(api, ticker);
  if (matchingShares.length > 0) {
    console.log(`✅ Найдено акций: ${matchingShares.length}\n`);
    printInstruments(matchingShares);
    return true;
  }
  
  // Поиск в облигациях
  const matchingBonds = await searchInBonds(api, ticker);
  if (matchingBonds.length > 0) {
    console.log(`✅ Найдено облигаций: ${matchingBonds.length}\n`);
    printInstruments(matchingBonds);
    return true;
  }

  // Поиск в ETF
  const matchingEtfs = await searchInEtfs(api, ticker);
  if (matchingEtfs.length > 0) {
    console.log(`✅ Найдено ETF: ${matchingEtfs.length}\n`);
    printInstruments(matchingEtfs);
    return true;
  }

  return false;
}

async function findFigi(ticker: string) {
  validateInput(ticker);
  const token = validateToken();

  try {
    console.log(`🔍 Поиск FIGI для тикера: ${ticker.toUpperCase()}\n`);

    const api = new TinkoffInvestApi({
      token: token,
      appName: 'tinkoff-robot-figi-finder'
    });

    const found = await searchInAllInstruments(api, ticker);
    
    if (!found) {
      console.log(`❌ Инструменты с тикером "${ticker}" не найдены`);
    }

  } catch (error) {
    console.error('❌ Ошибка при поиске FIGI:', error);
  }
}

// Получаем тикер из аргументов командной строки
const ticker = process.argv[2];
findFigi(ticker).catch(console.error);
