# NafasBaru Frontend (Next.js + Tailwind)

## Env
Create `.env` from `.env.example`:
```
NEXT_PUBLIC_API_BASE=https://your-backend.example.com
```

## Run locally
```
npm install
npm run dev
```

## Pages
- `/` Landing (Hero, fitur ringkas, berita link)
- `/features` Fitur utama
- `/challenge` Mulai challenge, progress bar, milestone badge
- `/news` Link berita publik (WHO, Kemenkes, CDC)
- `/contact` Kontak & disclaimer
- `/auth` Login/Daftar

## Deploy (Vercel)
- Import repo → set env `NEXT_PUBLIC_API_BASE` ke URL backend publik (Railway/Render)
- Build command: `npm run build`, Output: `.next`
