# Ezoza Interactive App

Vite + React loyiha. Endi app ikki yirik imkoniyatga ega:

1. `Creator Studio` orqali kampaniya sozlash va share link yaratish.
2. Foydalanuvchi sessiyasi bo'yicha event/result tracking.

## Run

1. `npm install`
2. `npm run dev`
3. Odatdagi o'yin: `http://localhost:5173`
4. Creator Studio: `http://localhost:5173?mode=studio`

## Dynamic Config

Ikki usul bor:

1. `?campaign=<slug>`: kampaniya config remote storage'dan olinadi (Supabase).
2. `?cfg=<encoded>`: config link ichida bo'ladi (fallback, backend shartsiz).

## Tracking Storage

App `love_campaigns`, `love_sessions`, `love_session_events` jadvallariga yozadi (agar Supabase yoqilgan bo'lsa).
Supabase bo'lmasa localStorage fallback ishlaydi.

### Environment

`.env.local`:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Schema uchun: `docs/supabase-schema.sql`

## Creator Studio funksiyalari

- kampaniya yaratish
- share link chiqarish
- kampaniya sessionlarini ko'rish
- session summary va event loglarni ko'rish

## Telegram Bot

Bot orqali:

- campaign yaratish (ism/familiya/maxsus personaj/campaign nomi)
- link berish
- natijalarni ko'rish

### Bot environment

Bot uchun quyidagi env lar kerak:

```env
TELEGRAM_BOT_TOKEN=...
WEB_APP_URL=https://your-app.vercel.app
BOT_MODE=polling

# Supabase (biri bo'lsa yetadi)
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
# yoki
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

### Local run (polling)

```bash
npm run bot
```

### Render deploy (webhook)

1. Telegram bot kodini ishlatadigan servisni Render'da yarating (repo orqali).
2. Render service env lariga quyidagilarni kiriting:

```env
TELEGRAM_BOT_TOKEN=...
WEB_APP_URL=https://your-app.vercel.app
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
BOT_MODE=webhook
```

3. `render.yaml` qo'shilgan, shuning uchun Blueprint bilan ham ko'tarish mumkin.
4. Render `RENDER_EXTERNAL_URL` env ni avtomatik beradi, bot webhook manzilini o'zi sozlaydi.
5. Botni ochib `/start` bosing, keyin `/create` bilan campaign yarating.

Bot buyruqlari:

- `/start`
- `/create`
- `/campaigns`
- `/results`
- `/cancel`
