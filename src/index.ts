import { Telegraf, session } from 'telegraf';
import { PrismaClient } from '@prisma/client';
import { getWorkingDays } from './calendar.js';
import { BotContext } from './types.js';
import { message } from 'telegraf/filters';
import { Markup } from 'telegraf';

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
      `Ваша текущая зарплата: ${user.salary} руб.\n\n` +
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

  const workingDays = await getWorkingDays();
  const avance = (user.salary / workingDays) * Math.floor(workingDays / 2);
  
  await ctx.reply(`Аванс за текущий месяц: ${avance.toFixed(2)} руб.`, getMainKeyboard());
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

  const workingDays = await getWorkingDays();
  const avance = (user.salary / workingDays) * Math.floor(workingDays / 2);
  const salary = (user.salary / workingDays) * workingDays - avance;
  
  await ctx.reply(`Зарплата за текущий месяц: ${salary.toFixed(2)} руб.`, getMainKeyboard());
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
      `Зарплата успешно установлена: ${salary} руб.\n\n` +
      'Выберите действие:',
      getMainKeyboard()
    );
  }
});

// Error handling
bot.catch((err, ctx) => {
  ctx.reply(`Произошла ошибка. Пожалуйста, попробуйте позже. ${err}`);
});

// Start the bot
bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
