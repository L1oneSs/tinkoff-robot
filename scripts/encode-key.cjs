const fs = require('fs');
const path = require('path');

// Читаем .env файл
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

// Ищем приватный ключ
const keyMatch = envContent.match(/GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="([^"]+)"/);
if (!keyMatch) {
  console.error('Не найден GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY в .env файле');
  process.exit(1);
}

const privateKey = keyMatch[1].replace(/\\n/g, '\n');
const encoded = Buffer.from(privateKey).toString('base64');

console.log('Base64 закодированный ключ:');
console.log(encoded);
console.log('\nДобавьте в .env:');
console.log(`GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_BASE64="${encoded}"`);

// Автоматически добавляем в .env файл
const newEnvContent = envContent + `\n# Base64-кодированный ключ для Yandex Cloud\nGOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_BASE64="${encoded}"\n`;
fs.writeFileSync(envPath, newEnvContent);
console.log('\n✅ Ключ автоматически добавлен в .env файл');
