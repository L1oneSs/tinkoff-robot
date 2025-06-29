/**
 * Список доступных торговых инструментов с их идентификаторами.
 * Каждый инструмент содержит FIGI (Financial Instrument Global Identifier).
 */

export interface InstrumentInfo {
  /** FIGI инструмента */
  figi: string;
  /** Название инструмента */
  name: string;
  /** Тикер */
  ticker: string;
  /** Сектор экономики */
  sector: string;
}

export const INSTRUMENTS: Record<string, InstrumentInfo> = {
  // Нефтегаз
  ROSN: {
    figi: 'BBG004731354',
    name: 'Роснефть',
    ticker: 'ROSN',
    sector: 'Нефтегаз'
  },
  TATN: {
    figi: 'BBG004S68829', 
    name: 'Татнефть',
    ticker: 'TATN',
    sector: 'Нефтегаз'
  },
  GAZP: {
    figi: 'BBG004730RP0',
    name: 'Газпром',
    ticker: 'GAZP',
    sector: 'Нефтегаз'
  },
  LKOH: {
    figi: 'BBG004731032',
    name: 'ЛУКОЙЛ',
    ticker: 'LKOH',
    sector: 'Нефтегаз'
  },

  // Банки
  SBER: {
    figi: 'BBG004730N88',
    name: 'Сбербанк',
    ticker: 'SBER',
    sector: 'Банки'
  },
  VTBR: {
    figi: 'BBG004730ZJ9',
    name: 'ВТБ',
    ticker: 'VTBR',
    sector: 'Банки'
  },

  // Металлургия
  RUAL: {
    figi: 'BBG008F2T3T2',
    name: 'РУСАЛ',
    ticker: 'RUAL',
    sector: 'Металлургия'
  },
  NLMK: {
    figi: 'BBG004S68CP5',
    name: 'НЛМК',
    ticker: 'NLMK', 
    sector: 'Металлургия'
  },
  GMKN: {
    figi: 'BBG004731489',
    name: 'ГМК Норильский никель',
    ticker: 'GMKN',
    sector: 'Металлургия'
  },

  // Ритейл
  DSKY: {
    figi: 'BBG000BN56Q9',
    name: 'Детский мир',
    ticker: 'DSKY',
    sector: 'Ритейл'
  },
  MGNT: {
    figi: 'BBG004S681B1',
    name: 'Магнит',
    ticker: 'MGNT',
    sector: 'Ритейл'
  },

  // Телекоммуникации
  MTSS: {
    figi: 'BBG004S68473',
    name: 'МТС',
    ticker: 'MTSS',
    sector: 'Телекоммуникации'
  },

  // Технологии
  YNDX: {
    figi: 'BBG006L8G4H1',
    name: 'Яндекс',
    ticker: 'YNDX',
    sector: 'Технологии'
  }
};

/**
 * Получить информацию об инструменте по тикеру
 */
export function getInstrumentByTicker(ticker: string): InstrumentInfo | undefined {
  return INSTRUMENTS[ticker];
}

/**
 * Получить информацию об инструменте по FIGI
 */
export function getInstrumentByFigi(figi: string): InstrumentInfo | undefined {
  return Object.values(INSTRUMENTS).find(instrument => instrument.figi === figi);
}

/**
 * Получить все инструменты определенного сектора
 */
export function getInstrumentsBySector(sector: string): InstrumentInfo[] {
  return Object.values(INSTRUMENTS).filter(instrument => instrument.sector === sector);
}

/**
 * Получить список всех доступных секторов
 */
export function getAllSectors(): string[] {
  const sectors = new Set(Object.values(INSTRUMENTS).map(instrument => instrument.sector));
  return Array.from(sectors).sort();
}
