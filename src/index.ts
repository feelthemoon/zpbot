import { Telegraf, session } from 'telegraf';
import { PrismaClient } from '@prisma/client';
import { getWorkingDays, getWorkingDaysForFirstHalf, getWorkingDaysForSecondHalf, getDayInfo } from './calendar.js';
import { BotContext } from './types.js';
import { message } from 'telegraf/filters';
import { Markup } from 'telegraf';
import { formatThousands } from './utils.js';

const prisma = new PrismaClient();
const bot = new Telegraf<BotContext>(process.env.BOT_TOKEN || '');

// Middleware for session
bot.use(session());

// Создаем клавиатуру с кнопками
const getMainKeyboard = () => {
  return Markup.keyboard([
    ['💰 Аванс', '💵 Получка'],
    ['📝 Изменить зарплату']
  ]).resize();
};

// Start command
bot.start(async (ctx) => {
  const chatId = ctx.chat.id.toString();
  const user = await prisma.user.findUnique({
    where: { chatId }
  });

  if (!user) {
    await ctx.reply('Добро пожаловать! Пожалуйста, введите вашу зарплату:');
    ctx.session = { ...ctx.session, expectingSalary: true };
  } else {
    await ctx.reply(
      `Ваша текущая зарплата: ${formatThousands(user.salary)} руб.\n\n` +
      'Выберите действие:',
      getMainKeyboard()
    );
  }
});

// Обработчик кнопки Аванс
bot.hears('💰 Аванс', async (ctx) => {
  const chatId = ctx.chat.id.toString();
  const user = await prisma.user.findUnique({
    where: { chatId }
  });

  if (!user) {
    await ctx.reply('Пожалуйста, сначала установите вашу зарплату через команду /start');
    return;
  }

  const totalWorkingDays = await getWorkingDays();
  const firstHalfWorkingDays = await getWorkingDaysForFirstHalf();
  const avance = (user.salary / totalWorkingDays) * firstHalfWorkingDays;
  
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const fifteenthOfMonth = new Date(now.getFullYear(), now.getMonth(), 15);
  
  await ctx.reply(
    `Аванс за текущий месяц (${formatDate(startOfMonth)} - ${formatDate(fifteenthOfMonth)}):\n` +
    `• Рабочих дней в первой половине: ${firstHalfWorkingDays}\n` +
    `• Рабочих дней в месяце: ${totalWorkingDays}\n` +
    `• Сумма аванса: ${formatThousands(avance.toFixed(2))} руб.`,
    getMainKeyboard()
  );
});

// Обработчик кнопки Получка
bot.hears('💵 Получка', async (ctx) => {
  const chatId = ctx.chat.id.toString();
  const user = await prisma.user.findUnique({
    where: { chatId }
  });

  if (!user) {
    await ctx.reply('Пожалуйста, сначала установите вашу зарплату через команду /start');
    return;
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const fifteenthOfMonth = new Date(now.getFullYear(), now.getMonth(), 15);
  const sixteenthOfMonth = new Date(now.getFullYear(), now.getMonth(), 16);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const totalWorkingDays = await getWorkingDays();
  const firstHalfWorkingDays = await getWorkingDaysForFirstHalf();
  const secondHalfWorkingDays = await getWorkingDaysForSecondHalf();
  
  const avance = (user.salary / totalWorkingDays) * firstHalfWorkingDays;
  const salary = (user.salary / totalWorkingDays) * secondHalfWorkingDays;
  
  await ctx.reply(
    `Зарплата за текущий месяц:\n` +
    `• Первая половина (${formatDate(startOfMonth)} - ${formatDate(fifteenthOfMonth)}):\n` +
    `  - Рабочих дней: ${firstHalfWorkingDays}\n` +
    `  - Аванс: ${formatThousands(avance.toFixed(2))} руб.\n` +
    `• Вторая половина (${formatDate(sixteenthOfMonth)} - ${formatDate(endOfMonth)}):\n` +
    `  - Рабочих дней: ${secondHalfWorkingDays}\n` +
    `  - К выплате: ${formatThousands(salary.toFixed(2))} руб.\n` +
    `• Всего рабочих дней в месяце: ${totalWorkingDays}`,
    getMainKeyboard()
  );
});

// Обработчик кнопки Изменить зарплату
bot.hears('📝 Изменить зарплату', async (ctx) => {
  await ctx.reply('Пожалуйста, введите новую сумму зарплаты:');
  ctx.session = { expectingSalary: true };
});

// Обработчик ввода зарплаты
bot.on(message('text'), async (ctx) => {
  if (ctx.session?.expectingSalary) {
    const salary = parseFloat(ctx.message.text);
    if (isNaN(salary) || salary <= 0) {
      await ctx.reply('Пожалуйста, введите корректную сумму зарплаты (число больше 0):');
      return;
    }

    const chatId = ctx.chat.id.toString();
    await prisma.user.upsert({
      where: { chatId },
      update: { salary },
      create: { chatId, salary }
    });

    ctx.session = { expectingSalary: false };
    await ctx.reply(
      `Зарплата успешно установлена: ${formatThousands(salary)} руб.\n\n` +
      'Выберите действие:',
      getMainKeyboard()
    );
  }
});

// Вспомогательная функция для форматирования даты
function formatDate(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${day}.${month}`;
}

// Error handling
bot.catch((_, ctx) => {
  ctx.reply('Произошла ошибка. Пожалуйста, попробуйте позже.');
});

// Start the bot
bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
