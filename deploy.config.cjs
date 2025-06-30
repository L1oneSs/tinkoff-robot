const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const env = dotenv.parse(fs.readFileSync(path.resolve(__dirname, './.env')));

module.exports = {
  useCliConfig: true,
  functionName: 'tinkoff-robot',
  deploy: {
    files: [ 'package*.json', 'dist/**' ],
    handler: 'dist/serverless/cjs/index.handler',
    runtime: 'nodejs16',
    timeout: 5,
    memory: 128,
    account: 'tinkoff-robot-sa',
    environment: {
      NODE_ENV: 'production',
      TINKOFF_API_TOKEN: env.TINKOFF_API_TOKEN,
      REAL_ACCOUNT_ID: env.REAL_ACCOUNT_ID,
      SANDBOX_ACCOUNT_ID: env.SANDBOX_ACCOUNT_ID,
      TELEGRAM_BOT_TOKEN: env.TELEGRAM_BOT_TOKEN,
      TELEGRAM_CHAT_ID: env.TELEGRAM_CHAT_ID,
      
      // Google Sheets для отчётов
      GOOGLE_SERVICE_ACCOUNT_EMAIL: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_BASE64: env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_BASE64,
      GOOGLE_SPREADSHEET_ID: env.GOOGLE_SPREADSHEET_ID,
      GOOGLE_WORKSHEET_TITLE: env.GOOGLE_WORKSHEET_TITLE || 'Trades',
    },
  },
};
