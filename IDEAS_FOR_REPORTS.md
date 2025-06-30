# 💡 Идеи для реализации отчетов в будущем

## 🎯 Текущее состояние
- ✅ Уведомления о сделках в реальном времени через Telegram
- ❌ Ежедневные и еженедельные отчеты отключены
- ✅ Сделки логируются в памяти (локально) или в логах (Yandex Cloud)

## 🚀 Простые варианты для отчетов

### 1. 📄 **Telegram-файлы (самое простое)**
```typescript
// В конце каждого дня отправлять CSV-файл с сделками
const csvContent = trades.map(t => 
  `${t.timestamp},${t.action},${t.instrumentName},${t.price},${t.profit || 0}`
).join('\n');

await telegramNotifier.sendDocument(
  Buffer.from(csvContent), 
  `trades_${date}.csv`
);
```

**Плюсы:** Очень просто, работает везде  
**Минусы:** Нет красивого форматирования

---

### 2. 📊 **Google Sheets (умеренная сложность)**
```typescript
import { GoogleSpreadsheet } from 'google-spreadsheet';

// Добавлять сделки прямо в Google таблицу
async function addTradeToSheet(trade: TradeRecord) {
  const doc = new GoogleSpreadsheet(SHEET_ID);
  await doc.useServiceAccountAuth(credentials);
  await doc.loadInfo();
  
  const sheet = doc.sheetsByIndex[0];
  await sheet.addRow({
    date: trade.sessionDate,
    action: trade.action,
    instrument: trade.instrumentName,
    price: trade.price,
    profit: trade.profit || 0
  });
}
```

**Плюсы:** Автоматические графики, можно смотреть с телефона  
**Минусы:** Нужны API ключи Google

---

### 3. ☁️ **Yandex Object Storage (для Yandex Cloud)**
```typescript
// Сохранять отчеты в S3-совместимое хранилище
async function saveReportToStorage(reportData: any, filename: string) {
  const s3 = new AWS.S3({
    endpoint: 'https://storage.yandexcloud.net',
    region: 'ru-central1'
  });
  
  await s3.putObject({
    Bucket: 'trading-reports',
    Key: filename,
    Body: JSON.stringify(reportData),
    ContentType: 'application/json'
  }).promise();
}
```

**Плюсы:** Интеграция с Yandex Cloud, дешево  
**Минусы:** Нужно настраивать S3

---

### 4. 📧 **Email отчеты**
```typescript
import nodemailer from 'nodemailer';

async function sendEmailReport(stats: any) {
  const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: { user: EMAIL, pass: PASSWORD }
  });
  
  await transporter.sendMail({
    to: EMAIL,
    subject: `Торговый отчет за ${stats.date}`,
    html: generateEmailReport(stats)
  });
}
```

**Плюсы:** Привычно, можно с вложениями  
**Минусы:** Нужны настройки почты

---

### 5. 🗃️ **SQLite база (локально)**
```typescript
import Database from 'better-sqlite3';

// Простая локальная база для накопления статистики
const db = new Database('trades.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS trades (
    id TEXT PRIMARY KEY,
    timestamp TEXT,
    action TEXT,
    instrument TEXT,
    price REAL,
    profit REAL
  )
`);

function saveTrade(trade: TradeRecord) {
  const stmt = db.prepare(`
    INSERT INTO trades VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(trade.id, trade.timestamp, trade.action, 
           trade.instrumentName, trade.price, trade.profit);
}
```

**Плюсы:** Быстро, надежно, SQL-запросы  
**Минусы:** Только локально

---

## 🎨 **Мое предложение (самое простое для начала):**

### 📋 **Telegram + CSV файлы**
1. **Каждый день в 19:00** - отправлять CSV файл с сделками
2. **По пятницам** - отправлять сводку за неделю в виде текста
3. **Хранение** - в TradeTracker добавить метод `exportToCsv()`

```typescript
// Пример реализации:
class SimpleReports {
  async sendDailyReport(telegramNotifier: TelegramNotifier, trades: TradeRecord[]) {
    if (trades.length === 0) return;
    
    const csv = this.generateCsv(trades);
    const summary = this.generateSummary(trades);
    
    await telegramNotifier.sendMessage(summary);
    await telegramNotifier.sendDocument(
      Buffer.from(csv), 
      `trades_${new Date().toISOString().split('T')[0]}.csv`
    );
  }
  
  private generateCsv(trades: TradeRecord[]): string {
    const header = 'Время,Действие,Инструмент,Цена,Количество,Сумма,Комиссия,Прибыль\n';
    const rows = trades.map(t => 
      `${t.timestamp.toISOString()},${t.action},${t.instrumentName},${t.price},${t.quantity},${t.totalAmount},${t.commission},${t.profit || 0}`
    ).join('\n');
    return header + rows;
  }
  
  private generateSummary(trades: TradeRecord[]): string {
    const profit = trades.filter(t => t.action === 'sell')
                         .reduce((sum, t) => sum + (t.profit || 0), 0);
    
    return `📊 *Дневной отчет*\n\n` +
           `🔄 Сделок: ${trades.length}\n` +
           `💰 Прибыль: ${profit.toFixed(2)} руб.\n` +
           `📎 Детали в приложенном файле`;
  }
}
```

**Что нужно:**
- 20-30 строк кода
- Работает везде (локально + Yandex Cloud)
- Файлы можно открыть в Excel
- Постепенно можно улучшать

---

## 🛠️ **Хотите попробовать?**

Выберите вариант, и я помогу реализовать:
1. **CSV-файлы в Telegram** (5 минут)
2. **Google Sheets** (15 минут + настройка API)
3. **Email отчеты** (10 минут + настройка почты)
4. **SQLite база** (15 минут)
5. **Yandex Object Storage** (20 минут + настройка S3)

Самый простой - вариант 1. Просто скажите, и я добавлю!
