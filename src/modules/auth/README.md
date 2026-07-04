# Auth module

Модуль отвечает за регистрацию, вход, проверку доступности nickname, восстановление пароля и авторизацию через Telegram WebApp.

Базовый префикс маршрутов: `/api/auth`.

## Состав модуля

- `auth.routes.ts` - объявляет HTTP-маршруты, подключает валидацию и rate limit для восстановления пароля.
- `auth.controller.ts` - тонкий Express-слой: получает данные из запроса, вызывает сервис и возвращает JSON.
- `auth.service.ts` - основная бизнес-логика авторизации.
- `auth.repository.ts` - доступ к Prisma-моделям `User` и `PasswordResetToken`.
- `auth.schemas.ts` - Zod-схемы входных данных.
- `auth.helpers.ts` - общие helper-ы: публичная проекция пользователя, Telegram initData parsing, генерация reset-токенов.
- `auth-email.service.ts` и `auth-email.templates.ts` - отправка письма восстановления пароля через Mailtrap.
- `auth.types.ts` - DTO и Prisma-типы модуля.

## Модель данных

Модуль использует Prisma-модели:

- `User`
  - `email` уникален.
  - `nickname` уникален.
  - `telegramId` уникален и используется для Telegram-входа.
  - `passwordHash` хранит bcrypt-хэш пароля.
- `PasswordResetToken`
  - хранит только `tokenHash`, а не исходный токен.
  - привязан к пользователю через `userId`.
  - содержит `expiresAt`, `usedAt`, `createdAt`.
  - удаляется каскадно при удалении пользователя.

Публичный пользователь возвращается без `passwordHash`, `sourceCode`, `sourceType` и `promoLinkId`.

## JWT

После успешной регистрации или входа модуль возвращает access token.

Payload токена:

```ts
{
  id: string
  role: Role
  email: string
  nickname: string
}
```

Токен подписывается через `JWT_SECRET`, срок жизни задается `JWT_EXPIRES_IN`.

За проверку токена на защищенных маршрутах отвечает middleware `common/middleware/auth.ts`. Клиент должен передавать токен в заголовке:

```http
Authorization: Bearer <token>
```

## Endpoints

### `POST /api/auth/telegram/oidc`

Завершает Telegram Login через OpenID Connect Authorization Code Flow with PKCE.

Request body:

```json
{
  "code": "<telegram_authorization_code>",
  "codeVerifier": "<pkce_code_verifier>",
  "redirectUri": "https://YOUR_DOMAIN/auth/telegram/callback"
}
```

Backend выполняет server-side exchange в `https://oauth.telegram.org/token` с `grant_type=authorization_code`, Basic Authorization по `TELEGRAM_LOGIN_CLIENT_ID:TELEGRAM_LOGIN_CLIENT_SECRET`, `redirect_uri` и `code_verifier`. Полученный `id_token` проверяется через Telegram JWKS `https://oauth.telegram.org/.well-known/jwks.json`: подпись, `iss=https://oauth.telegram.org`, `aud=TELEGRAM_LOGIN_CLIENT_ID` и срок действия.

После проверки backend ищет пользователя по `telegramId`, при отсутствии создает пользователя, затем возвращает обычный access token приложения:

```json
{
  "user": {
    "id": "clx...",
    "role": "user",
    "email": "tg_123456789@telegram.local",
    "phone": null,
    "nickname": "telegram_user",
    "avatarUrl": "https://...",
    "telegramId": "123456789"
  },
  "token": "<jwt>"
}
```

Env:

```dotenv
TELEGRAM_LOGIN_CLIENT_ID=1234567890
TELEGRAM_LOGIN_CLIENT_SECRET=change-me
```

`@BotFather` -> `Bot Settings` -> `Web Login` -> `Allowed URLs`:

```text
https://YOUR_DOMAIN/auth/telegram/callback
```

Для локальной проверки используйте HTTPS tunnel, например ngrok:

```text
https://YOUR_NGROK_DOMAIN/auth/telegram/callback
```

### `POST /api/auth/signup`

Регистрирует пользователя с email/password.

Request body:

```json
{
  "email": "player@example.com",
  "nickname": "player",
  "password": "Player12345!",
  "phone": "+77001234567"
}
```

Валидация:

- `email` - валидный email, приводится к lowercase.
- `nickname` - строка 3-30 символов, trim.
- `password` - строка 8-128 символов.
- `phone` - опциональная строка 6-30 символов, trim.

Успешный ответ: `201 Created`.

```json
{
  "user": {
    "id": "clx...",
    "role": "user",
    "email": "player@example.com",
    "phone": "+77001234567",
    "nickname": "player",
    "avatarUrl": null,
    "telegramId": null
  },
  "token": "<jwt>"
}
```

Ошибки:

- `409 Conflict` - email уже зарегистрирован.
- `409 Conflict` - nickname уже зарегистрирован.

После регистрации запускается warmup-сценарий `startAbandonedRegistrationWarmup`.

### `POST /api/auth/signin`

Авторизует пользователя по email и паролю.

Request body:

```json
{
  "email": "player@example.com",
  "password": "Player12345!"
}
```

Валидация:

- `email` - валидный email, приводится к lowercase.
- `password` - строка 1-128 символов.

Успешный ответ: `200 OK`.

```json
{
  "user": {
    "id": "clx...",
    "role": "user",
    "email": "player@example.com",
    "phone": null,
    "nickname": "player",
    "avatarUrl": null,
    "telegramId": null
  },
  "token": "<jwt>"
}
```

Ошибки:

- `401 Unauthorized` - неверный email или пароль.

После входа запускается warmup-сценарий `startAbandonedRegistrationWarmup`.

### `GET /api/auth/nickname/availability`

Проверяет, свободен ли nickname.

Query params:

```http
GET /api/auth/nickname/availability?nickname=player
```

Валидация:

- `nickname` - строка 3-30 символов, trim.

Успешный ответ:

```json
{
  "available": true
}
```

### `POST /api/auth/forgot-password`

Создает ссылку восстановления пароля и отправляет ее на email.

Request body:

```json
{
  "email": "player@example.com"
}
```

Валидация:

- `email` - валидный email, приводится к lowercase.

Успешный ответ всегда одинаковый, даже если пользователь не найден:

```json
{
  "message": "Если указанный email зарегистрирован, мы отправим письмо для восстановления пароля"
}
```

Особенности:

- Для пользователей с email `@telegram.local` письмо не отправляется.
- Новый запрос помечает все предыдущие неиспользованные reset-токены пользователя как использованные.
- Исходный токен не сохраняется в БД, сохраняется только SHA-256 hash.
- Срок жизни токена - 30 минут.
- Ссылка строится как `${PUBLIC_SITE_URL}/reset-password?token=<token>`.
- Для маршрута включен отдельный rate limit: 5 запросов за 15 минут.

Ошибки:

- `500 Internal Server Error` - не удалось отправить письмо восстановления пароля.

### `POST /api/auth/reset-password`

Меняет пароль по reset-токену.

Request body:

```json
{
  "token": "<reset-token>",
  "password": "NewPlayer12345!"
}
```

Валидация:

- `token` - строка 32-256 символов, trim.
- `password` - строка 8-128 символов.

Успешный ответ:

```json
{
  "message": "Пароль успешно изменен"
}
```

Особенности:

- Токен ищется по SHA-256 hash.
- Токен должен существовать, быть неиспользованным и не просроченным.
- Использование токена и смена пароля выполняются в транзакции.
- После успешной смены пароля все остальные активные reset-токены пользователя помечаются использованными.
- Для маршрута включен отдельный rate limit: 5 запросов за 15 минут.

Ошибки:

- `400 Bad Request` - ссылка недействительна или устарела.

### `POST /api/auth/signin-with-telegram`

Авторизует пользователя через Telegram WebApp `initData`.

Request body:

```json
{
  "initData": "query_id=...&user=...&auth_date=...&hash=..."
}
```

Валидация:

- `initData` - непустая строка.
- Внутри `initData` обязательны `hash`, `auth_date` и `user`.
- `user` должен быть валидным JSON с полями:
  - `id` - number.
  - `first_name` - строка 1-128 символов.
  - `username` - опциональная строка 1-128 символов.
  - `last_name` - опциональная строка 1-128 символов.

Проверка подписи:

- `initData` проверяется через `verifyTelegramWebAppData(initData, BOT_TOKEN)`.
- Поддерживается проверка через HMAC `hash` и Telegram Ed25519 `signature`.

Поведение:

- Если пользователь с таким `telegramId` найден, модуль возвращает его и JWT.
- Если пользователь не найден, создается новый пользователь:
  - `telegramId` = Telegram user id как строка.
  - `email` = `tg_<telegramId>@telegram.local`.
  - `nickname` = `username` или `tg_user_<telegramId>`.
  - если nickname занят, добавляется суффикс с `telegramId`; максимум 20 попыток.
  - `role` = `user`.
  - `passwordHash` создается для технического пароля `telegram-password`.

Успешный ответ:

```json
{
  "user": {
    "id": "clx...",
    "role": "user",
    "email": "tg_123456@telegram.local",
    "phone": null,
    "nickname": "telegram_username",
    "avatarUrl": null,
    "telegramId": "123456"
  },
  "token": "<jwt>"
}
```

Ошибки:

- `400 Bad Request` - отсутствуют обязательные поля Telegram initData или `user` не является валидным JSON.
- `401 Unauthorized` - подпись Telegram initData некорректна.
- `409 Conflict` - не удалось подобрать уникальный nickname или Prisma вернула unique constraint error.
- `500 Internal Server Error` - непредвиденная ошибка Telegram-входа.

После Telegram-входа запускается warmup-сценарий `startAbandonedRegistrationWarmup`.

## Переменные окружения

Модуль напрямую или косвенно использует:

- `JWT_SECRET` - секрет подписи JWT, минимум 24 символа.
- `JWT_EXPIRES_IN` - срок жизни JWT, по умолчанию `7d`.
- `BCRYPT_ROUNDS` - сложность bcrypt, от 10 до 15, по умолчанию `12`.
- `BOT_TOKEN` - токен Telegram-бота для проверки WebApp initData.
- `PUBLIC_SITE_URL` - базовый URL frontend-приложения для reset-ссылки.
- `MAILTRAP_TOKEN` - токен Mailtrap для отправки писем восстановления пароля.

## Безопасность

- Пароли хранятся только как bcrypt-хэши.
- Reset-токены генерируются через `crypto.randomBytes(32).toString('base64url')`.
- В БД сохраняется только SHA-256 hash reset-токена.
- Ответ `forgot-password` не раскрывает, существует ли email в системе.
- Старые reset-токены пользователя инвалидируются при создании нового токена и после успешной смены пароля.
- Telegram `initData` не доверяется без проверки подписи через `BOT_TOKEN`.
- JWT содержит только минимальный набор данных, нужный для авторизации.

## Зависимости от других модулей

- `WarmupService` - запускает сценарий прогрева после signup/signin/Telegram signin.
- `common/utils/password.ts` - bcrypt hash/verify.
- `common/utils/jwt.ts` - подпись JWT.
- `common/utils/telegram-auth.ts` - проверка Telegram WebApp подписи.
- `common/middleware/validate.ts` - Zod-валидация входных данных.
- `common/errors/app-error.ts` - доменные HTTP-ошибки.

## Тестирование

Связанные тесты:

- `tests/auth/telegram-auth.test.ts` - проверка Telegram WebApp подписи.

Для запуска всех тестов:

```bash
npm test
```
