# Ezoza Interactive App

Vite + React loyiha. Endi app ikki yirik imkoniyatga ega:

1. `Creator Studio` orqali kampaniya sozlash va share link yaratish.
2. Foydalanuvchi sessiyasi bo'yicha event/result tracking.

## Run

1. `npm install`
2. `npm run dev`
3. Odatdagi o'yin: `http://localhost:5173`
4. Creator Studio: `http://localhost:5173?mode=studio`
5. Admin Panel: `http://localhost:5173?mode=admin&key=YOUR_KEY`

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
VITE_ADMIN_PANEL_KEY=your_private_admin_key
```

Schema uchun: `docs/supabase-schema.sql`

## Creator Studio funksiyalari

- kampaniya yaratish
- share link chiqarish
- kampaniya sessionlarini ko'rish
- session summary va event loglarni ko'rish

## Admin Panel

- barcha userlar yaratgan campaign/ulashishlarni ko'rish
- barcha sessionlarni ko'rish (all yoki campaign bo'yicha)
- session summary va event loglarni to'liq ko'rish

Kirish:

- `?mode=admin&key=YOUR_KEY`
- `YOUR_KEY` = `.env.local` dagi `VITE_ADMIN_PANEL_KEY`

## Telegram Bot

Bot orqali:

- campaign yaratish (ism/familiya/maxsus personaj/campaign nomi)
- maxsus personaj rasmi yuborish (photo/file) va battle ga ulash
- link berish
- natijalarni ko'rish

### Bot environment

Bot uchun quyidagi env lar kerak:

```env
TELEGRAM_BOT_TOKEN=...
WEB_APP_URL=https://your-app.vercel.app
TELEGRAM_WEBAPP_BUTTON_TEXT=Love App
BOT_MODE=polling
MAX_SPECIAL_IMAGE_BYTES=1200000

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

### Telegram Web App ochilmasa

1. BotFatherda domenni ulang: `/setdomain` -> `your-app.vercel.app`
2. Bot menu button Web App URL `https://...` ekanini tekshiring
3. Render deploydan keyin botga `/start` yuboring (menu button qayta o'rnatiladi)
