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

App `campaigns`, `sessions`, `session_events` jadvallariga yozadi (agar Supabase yoqilgan bo'lsa).
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
