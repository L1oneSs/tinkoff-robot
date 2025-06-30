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
  NVTK: {
    figi: 'BBG00475KKY8',
    name: 'НОВАТЭК',
    ticker: 'NVTK',
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
  SVCB: {
    figi: 'TCS00A0ZZAC4',
    name: 'Совкомбанк',
    ticker: 'SVCB',
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
  CHMF: {
    figi: 'BBG00475K6C3',
    name: 'Северсталь',
    ticker: 'CHMF',
    sector: 'Металлургия'
  },
  MAGN: {
    figi: 'BBG004S68507',
    name: 'ММК',
    ticker: 'MAGN',
    sector: 'Металлургия'
  },
  ALRS: {
    figi: 'BBG004S68B31',
    name: 'АЛРОСА',
    ticker: 'ALRS',
    sector: 'Горнодобыча'
  },
  PLZL: {
    figi: 'BBG000R607Y3',
    name: 'Полюс',
    ticker: 'PLZL',
    sector: 'Горнодобыча'
  },

  // Ритейл
  MGNT: {
    figi: 'BBG004RVFCY3',
    name: 'Магнит',
    ticker: 'MGNT',
    sector: 'Ритейл'
  },
  OZON: {
    figi: 'BBG00Y91R9T3',
    name: 'Озон',
    ticker: 'OZON',
    sector: 'Ритейл'
  },
  FIXP: {
    figi: 'BBG00ZHCX1X2',
    name: 'Fix Price',
    ticker: 'FIXP',
    sector: 'Ритейл'
  },

  // Телекоммуникации
  MTSS: {
    figi: 'BBG004S681W1',
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
  },
  WUSH: {
    figi: 'TCS00A105EX7',
    name: 'Whoosh',
    ticker: 'WUSH',
    sector: 'Технологии'
  },
  VKCO: {
    figi: 'TCS00A106YF0',
    name: 'VK Company',
    ticker: 'VKCO',
    sector: 'Технологии'
  },

  // Энергетика и коммунальные услуги
  HYDR: {
    figi: 'BBG00475K2X9',
    name: 'РусГидро',
    ticker: 'HYDR',
    sector: 'Энергетика'
  },
  IRAO: {
    figi: 'BBG004S68473',
    name: 'Интер РАО',
    ticker: 'IRAO',
    sector: 'Энергетика'
  },

  // Химическая промышленность
  PHOR: {
    figi: 'BBG004S689R0',
    name: 'ФосАгро',
    ticker: 'PHOR',
    sector: 'Удобрения'
  },

  // Недвижимость
  PIKK: {
    figi: 'BBG004S68BH6',
    name: 'ПИК',
    ticker: 'PIKK',
    sector: 'Недвижимость'
  },

  // Транспорт
  AFLT: {
    figi: 'BBG004S683W7',
    name: 'Аэрофлот',
    ticker: 'AFLT',
    sector: 'Авиаперевозки'
  },


  // Финансовые услуги
  MOEX: {
    figi: 'BBG004730JJ5',
    name: 'Московская биржа',
    ticker: 'MOEX',
    sector: 'Финансовые услуги'
  },
  CBOM: {
    figi: 'BBG009GSYN76',
    name: 'МКБ',
    ticker: 'CBOM',
    sector: 'Банки'
  },
  AFKS: {
    figi: 'BBG004S68614',
    name: 'АФК Система',
    ticker: 'AFKS',
    sector: 'Диверсифицированные инвестиции'
  },

  // Второй эшелон - Нефтегаз
  BANE: {
    figi: 'BBG004S68758',
    name: 'Башнефть',
    ticker: 'BANE',
    sector: 'Нефтегаз'
  },

  // Энергетика второго эшелона
  FEES: {
    figi: 'BBG00475JZZ6',
    name: 'Россети',
    ticker: 'FEES',
    sector: 'Энергетика'
  },

  // Недвижимость второго эшелона
  LSRG: {
    figi: 'BBG004S68C39',
    name: 'ЛСР',
    ticker: 'LSRG',
    sector: 'Недвижимость'
  },

  // HR/Технологии второго эшелона
  HHRU: {
    figi: 'TCS2207L1061',
    name: 'HeadHunter',
    ticker: 'HHRU',
    sector: 'Интернет-сервисы'
  },

  // Третий эшелон
  AQUA: {
    figi: 'BBG000W325F7',
    name: 'ИНАРКТИКА',
    ticker: 'AQUA',
    sector: 'Рыболовство'
  },
  GCHE: {
    figi: 'BBG000RTHVK7',
    name: 'Черкизово',
    ticker: 'GCHE',
    sector: 'Пищевая промышленность'
  },
  RTKM: {
    figi: 'BBG004S682Z6',
    name: 'Ростелеком',
    ticker: 'RTKM',
    sector: 'Телекоммуникации'
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
