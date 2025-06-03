# Telegram Salary Bot

Telegram бот для расчета зарплаты и аванса с учетом производственного календаря.

## Функциональность

- Сохранение зарплаты пользователя
- Расчет аванса за текущий месяц
- Расчет зарплаты за текущий месяц
- Учет рабочих дней по производственному календарю

## Команды

- `/start` - Начало работы с ботом, установка зарплаты
- Кнопка "💰 Аванс" - Расчет аванса за текущий месяц
- Кнопка "💵 Получка" - Расчет зарплаты за текущий месяц
- Кнопка "📝 Изменить зарплату" - Изменение суммы зарплаты

## Локальная разработка

1. Клонируйте репозиторий:
```bash
git clone <repository-url>
cd zpbot
```

2. Установите зависимости:
```bash
npm install
```

3. Создайте файл `.env` на основе `.env.example` и заполните необходимые переменные окружения:
```bash
cp .env.example .env
```

4. Инициализируйте базу данных:
```bash
npx prisma migrate dev
```

5. Соберите проект:
```bash
npm run build
```

## Запуск

Для запуска в режиме разработки:
```bash
npm run dev
```

Для запуска в production:
```bash
npm run build
npm start
```

## Деплой на VPS

### Подготовка VPS

1. Установите Docker и Docker Compose на VPS:
```bash
# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Установка Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

2. Создайте директорию для проекта:
```bash
sudo mkdir -p /opt/zpbot
sudo chown $USER:$USER /opt/zpbot
```

3. Клонируйте репозиторий:
```bash
cd /opt
git clone <repository-url> zpbot
```

### Настройка GitHub Actions

1. Создайте аккаунт на Docker Hub (если еще нет)
2. Создайте токен доступа в Docker Hub (Account Settings -> Security -> New Access Token)
3. Добавьте следующие секреты в настройках GitHub репозитория (Settings -> Secrets and variables -> Actions):
   - `DOCKERHUB_USERNAME` - ваше имя пользователя Docker Hub
   - `DOCKERHUB_TOKEN` - токен доступа Docker Hub
   - `VPS_HOST` - IP-адрес вашего VPS
   - `VPS_USERNAME` - имя пользователя для SSH
   - `VPS_SSH_KEY` - приватный SSH ключ для доступа к VPS

### Деплой

После настройки CI/CD, деплой будет происходить автоматически при:
1. Пуш в ветку `main`
2. Ручном запуске workflow через GitHub Actions

Для ручного деплоя:
1. Перейдите в раздел Actions вашего GitHub репозитория
2. Выберите workflow "Deploy Bot"
3. Нажмите "Run workflow"

## Технологии

- TypeScript
- Node.js
- Telegraf (Telegram Bot Framework)
- Prisma (ORM)
- SQLite (База данных)
- Docker
- GitHub Actions
- Docker Hub

## Лицензия

ISC 