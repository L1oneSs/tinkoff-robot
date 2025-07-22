# 🤖 Tinkoff Robot - Торговый робот для Тинькофф Инвестиций

Автоматизированный торговый робот для работы с российскими акциями через [Tinkoff Invest API v2](https://tinkoff.github.io/investAPI/).

## 🎯 Что делает этот бот

Торговый робот автоматически анализирует рынок и принимает решения о покупке/продаже акций на основе:

### 📊 **Технический анализ:**
- **Классические индикаторы**: RSI, MACD, Bollinger Bands, скользящие средние (SMA, EMA, EWMA и др.)
- **Свечные паттерны**: Молот, Поглощение, Дожи, Три черных ворона и другие
- **Управление рисками**: автоматический Take Profit и Stop Loss

### 🔧 **Возможности:**
- ✅ Работа с несколькими инструментами одновременно
- ✅ Гибкая настройка стратегий для каждого инструмента
- ✅ Учет комиссий брокера
- ✅ Уведомления в Telegram о сделках
- ✅ Запись всех операций в Google Sheets
- ✅ **Бэктестинг стратегий** на исторических данных
- ✅ Развертывание в Yandex Cloud как serverless-функция
- ✅ Работа по расписанию в торговое время
- ✅ Режим песочницы для безопасного тестирования

### 📈 **Логика работы:**
1. Каждые 5 минут в торговые часы робот анализирует рынок
2. На основе настроенных сигналов принимает решение о покупке/продаже
3. Выставляет лимитные заявки по текущим рыночным ценам
4. Отправляет уведомления в Telegram
5. Записывает все операции в Google Sheets для аналитики

---

## 📋 Содержание

- [🚀 Быстрая установка](#-быстрая-установка)
- [⚙️ Настройка .env файла](#️-настройка-env-файла)
- [☁️ Настройка Yandex Cloud](#️-настройка-yandex-cloud)
- [📊 Настройка Google Sheets](#-настройка-google-sheets)
- [🤖 Настройка Telegram бота](#-настройка-telegram-бота)
- [🎮 Команды и скрипты](#-команды-и-скрипты)
- [🔧 Конфигурация стратегий](#-конфигурация-стратегий)
- [🚀 Запуск и развертывание](#-запуск-и-развертывание)

---

## 🚀 Быстрая установка

### 1️⃣ Клонирование и установка зависимостей
```bash
git clone https://github.com/your-username/tinkoff-robot.git
cd tinkoff-robot
npm ci
```

### 2️⃣ Создание .env файла
```bash
cp .env.example .env
```

### 3️⃣ Проверка установки
```bash
npm run build
npm run lint
```

---

## ⚙️ Настройка .env файла

Скопируйте `.env.example` в `.env` и заполните все необходимые параметры:

### 🏦 **Tinkoff Invest API**

1. **Получите токен API:**
   - Зайдите в [Тинькофф Инвестиции](https://www.tinkoff.ru/invest/)
   - Перейдите в раздел "Настройки" → "API"
   - Создайте токен с правами на торговлю
   - Скопируйте токен в переменную `TINKOFF_API_TOKEN`

2. **Получите ID счетов:**
   ```bash
   npm run accounts
   ```
   - Скопируйте ID реального счета в `REAL_ACCOUNT_ID`
   - Скопируйте ID песочницы в `SANDBOX_ACCOUNT_ID`

### 📱 **Telegram (для уведомлений)**

1. **Создайте бота:**
   - Напишите [@BotFather](https://t.me/botfather)
   - Выполните команду `/newbot`
   - Следуйте инструкциям
   - Скопируйте токен в `TELEGRAM_BOT_TOKEN`

2. **Получите Chat ID:**
   ```bash
   npm run telegram:chat-id
   ```
   - Или напишите боту @userinfobot и скопируйте ID из ответа
   - Вставьте в `TELEGRAM_CHAT_ID`

### 📊 **Google Sheets (для логирования)**

Настройка описана в разделе [Настройка Google Sheets](#-настройка-google-sheets) ниже.

---

## ☁️ Настройка Yandex Cloud

### 1️⃣ Установка CLI
```bash
# Установка yc CLI
curl -sSL https://storage.yandexcloud.net/yandexcloud-yc/install.sh | bash
```

> 📚 **Документация:** [Быстрая настройка CLI](https://cloud.yandex.ru/docs/cli/quickstart)

### 2️⃣ Авторизация
```bash
yc init
```
Следуйте инструкциям для подключения к вашему аккаунту.

### 3️⃣ Создание сервисного аккаунта
```bash
# Создаем сервисный аккаунт
yc iam service-account create --name tinkoff-robot-sa --description "Service account for Tinkoff Robot"

# Получаем ID аккаунта
yc iam service-account list

# Назначаем роли (замените SA_ID на ваш ID)
yc resource-manager folder add-access-binding $(yc config get folder-id) \
  --role serverless.functions.invoker \
  --subject serviceAccount:SA_ID

yc resource-manager folder add-access-binding $(yc config get folder-id) \
  --role functions.functionInvoker \
  --subject serviceAccount:SA_ID
```

> 📚 **Дополнительные ссылки:**
> - [Создание сервисного аккаунта](https://cloud.yandex.ru/docs/iam/operations/sa/create)
> - [Настройка триггеров по таймеру](https://cloud.yandex.ru/docs/functions/concepts/trigger/timer)

## 📊 Настройка Google Sheets

### 1️⃣ Создание проекта Google Cloud

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Включите Google Sheets API:
   - Перейдите в "APIs & Services" → "Library"
   - Найдите "Google Sheets API"
   - Нажмите "Enable"

### 2️⃣ Создание Service Account

1. Перейдите в "IAM & Admin" → "Service Accounts"
2. Нажмите "Create Service Account"
3. Заполните данные:
   - **Name**: `tinkoff-robot-sheets`
   - **Description**: `Service account for Tinkoff Robot sheets access`
4. Нажмите "Create and Continue"
5. На шаге "Grant access" можно пропустить
6. Нажмите "Done"

### 3️⃣ Создание ключа

1. Найдите созданный аккаунт в списке
2. Нажмите на email аккаунта
3. Перейдите во вкладку "Keys"
4. Нажмите "Add Key" → "Create New Key"
5. Выберите формат "JSON"
6. Скачайте файл ключа

### 4️⃣ Настройка .env

Из скачанного JSON файла скопируйте:
- `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `private_key` → `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`

### 5️⃣ Создание Google Sheets таблицы

1. Откройте [Google Sheets](https://sheets.google.com)
2. Создайте новую таблицу с названием "Tinkoff Robot Trades"
3. Скопируйте ID из URL (часть между `/d/` и `/edit`)
4. Вставьте ID в `GOOGLE_SPREADSHEET_ID`

### 6️⃣ Предоставление доступа

1. Откройте созданную таблицу
2. Нажмите "Share" (Поделиться)
3. В поле email вставьте значение `GOOGLE_SERVICE_ACCOUNT_EMAIL`
4. Установите права "Editor"
5. Нажмите "Send"

### 7️⃣ Кодирование ключа для Yandex Cloud

Для развертывания в Yandex Cloud нужен Base64-кодированный ключ:
```bash
# Создайте скрипт для кодирования
node -e "console.log(Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY).toString('base64'))"
```

Результат вставьте в `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_BASE64`.

---

## 🤖 Настройка Telegram бота

### 1️⃣ Создание бота
1. Откройте Telegram и найдите [@BotFather](https://t.me/botfather)
2. Отправьте команду `/newbot`
3. Введите имя бота (например, "Tinkoff Robot")
4. Введите username бота (например, "my_tinkoff_robot_bot")
5. Скопируйте полученный токен

### 2️⃣ Получение Chat ID
```bash
npm run telegram:chat-id
```

Или альтернативный способ:
1. Напишите вашему боту любое сообщение
2. Откройте в браузере: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
3. Найдите `"chat":{"id":ВАШЕ_ЧИСЛО}` - это ваш Chat ID

### 3️⃣ Тест уведомлений
```bash
npm run test:notifications
```

---

## 🎮 Команды и скрипты

### 📊 **Информационные команды:**
```bash
# Показать все счета
npm run accounts

# Показать текущие конфигурации
npm run config
```

### 🧪 **Тестирование и разработка:**
```bash
# Проверка кода
npm run lint

# Сборка проекта
npm run build

# Получить Chat ID для Telegram
npm run telegram:chat-id
```

### 📈 **Бэктестинг стратегий:**
```bash
# Бэктест для конкретного инструмента (21 день)
npx tsx scripts/run-backtest.ts SBER   # Тест Сбербанка
npx tsx scripts/run-backtest.ts GAZP   # Тест Газпрома
npx tsx scripts/run-backtest.ts YNDX   # Тест Яндекса

# Показать список доступных инструментов
npx tsx scripts/run-backtest.ts

# Результаты бэктеста включают:
# ✅ Общую прибыль/убыток за период
# ✅ Количество и процент прибыльных сделок
# ✅ Максимальную просадку
# ✅ Коэффициент Шарпа
# ✅ Статистику по каждому типу сигналов
# ✅ Детальную информацию о каждой сделке
```

### 🚀 **Торговля:**
```bash
# Запуск в режиме песочницы (безопасно)
npm run market

# Запуск на реальном счете (ОСТОРОЖНО!)
npm run market:real

# Сухой прогон (без реальных заявок)
npm run market -- --dry-run

# Разовый запуск по cron
npm run market -- --cron
```

### ☁️ **Развертывание:**
```bash
# Деплой в Yandex Cloud
npm run deploy
```

---

## 🔧 Конфигурация стратегий

Конфигурация находится в файле `src/config.ts`. Вы можете настроить:

### 📊 **Инструменты для торговли:**
- Список акций (FIGI)
- Размер позиций
- Таймфреймы для анализа

### 🎯 **Сигналы для покупки/продажи:**
- **Технические индикаторы**: RSI, MACD, Bollinger Bands
- **Скользящие средние**: SMA, EMA, EWMA, LWMA
- **Свечные паттерны**: Hammer, Doji, Engulfing, Three Black Crows, Three White Soldiers
- **Управление рисками**: Take Profit, Stop Loss

### ⚙️ **Параметры стратегии:**
- Пороги срабатывания сигналов
- Размеры позиций
- Управление рисками

### 📈 **Тестирование стратегий:**

Перед запуском робота на реальных деньгах **обязательно протестируйте** стратегии с помощью бэктестинга:

```bash
# Тестирование на исторических данных (21 день)
npx tsx scripts/run-backtest.ts SBER
```

**Бэктест показывает:**
- 💰 Общую прибыль/убыток за период
- 📊 Статистику сделок (количество, процент прибыльных)
- 📉 Максимальную просадку портфеля
- 📈 Коэффициент Шарпа (риск-доходность)
- 🎯 Эффективность каждого типа сигналов
- 📋 Детальную историю всех сделок

**Важно:** Результаты бэктеста не гарантируют будущую прибыльность, но помогают оценить логику стратегии.

---

## 🚀 Запуск и развертывание

### 🧪 **Тестирование локально (песочница):**
```bash
# Запуск в режиме песочницы
npm run market

# Разовый запуск с выводом отладки
npm run market -- --cron --debug
```

### 💰 **Запуск на реальном счете:**
```bash
# ВНИМАНИЕ: Реальные деньги!
npm run market:real

# Сухой прогон на реальном счете (без заявок)
npm run market:real -- --dry-run
```

### ☁️ **Развертывание в Yandex Cloud:**

1. **Деплой функции:**
   ```bash
   npm run deploy
   ```

2. **Создание триггера по расписанию:**
   
   В веб-интерфейсе Yandex Cloud:
   - Откройте раздел "Cloud Functions"
   - Найдите функцию `tinkoff-robot`
   - Создайте триггер типа "Таймер"
   - Cron-выражение: `0/5 7-16 ? * 2-6 *`
   - Это означает: каждые 5 минут с 10:00 до 19:00 МСК в рабочие дни

3. **Проверка работы:**
   - Следите за логами функции в Yandex Cloud
   - Проверяйте уведомления в Telegram
   - Контролируйте записи в Google Sheets

### 📊 **Мониторинг:**
- **Логи:** Yandex Cloud Console → Cloud Functions → Логи
- **Telegram:** Уведомления о сделках в реальном времени
- **Google Sheets:** Полная история всех операций
- **Отчеты:** Ежедневные и еженедельные сводки

---

## ⚠️ Важные замечания

### 🔒 **Безопасность:**
- Никогда не публикуйте файл `.env` в git
- Используйте сильные токены и регулярно их обновляйте
- Начинайте тестирование с песочницы

### 💰 **Управление рисками:**
- Не вкладывайте больше, чем готовы потерять
- **Обязательно проводите бэктестинг** стратегий перед реальным использованием
- Тестируйте стратегии в песочнице
- Следите за размерами позиций и stop-loss

### 🚨 **Поддержка:**
- Регулярно проверяйте логи
- Мониторьте уведомления в Telegram
- Ведите учет результатов торговли

---

## 📄 Лицензия

Apache 2.0
