# Panduan Deploy ke Railway.com

## Urutan yang Benar: GitHub dulu, baru Railway

### LANGKAH 1 — Push ke GitHub

```bash
cd ~/Documents/social-scheduler

# Init git repo
git init
git add .
git commit -m "Initial commit: Social Scheduler"

# Buat repo baru di github.com (Private), lalu:
git remote add origin https://github.com/USERNAME/social-scheduler.git
git branch -M main
git push -u origin main
```

---

### LANGKAH 2 — Ganti SQLite → PostgreSQL untuk Railway

Edit `prisma/schema.prisma`, ubah datasource:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Commit perubahan ini:
```bash
git add prisma/schema.prisma
git commit -m "Switch to PostgreSQL for production"
git push
```

---

### LANGKAH 3 — Setup di Railway.com

1. Buka **railway.app** → New Project → Deploy from GitHub Repo
2. Pilih repo `social-scheduler`
3. Railway otomatis deteksi Next.js

#### Tambah PostgreSQL database:
- Di dashboard Railway → **+ New** → **Database** → **PostgreSQL**
- Copy `DATABASE_URL` dari tab Variables

#### Set Environment Variables di Railway:
```
DATABASE_URL=postgresql://... (dari Railway PostgreSQL)
NEXTAUTH_SECRET=random-string-panjang-minimal-32-karakter
NEXTAUTH_URL=https://your-app.railway.app

# Email (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=emailkamu@gmail.com
SMTP_PASS=app-password-gmail

# Social Media API (isi sesuai yang sudah punya)
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
TWITTER_API_KEY=
TWITTER_API_SECRET=
TIKTOK_CLIENT_KEY=
TIKTOK_CLIENT_SECRET=
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
YOUTUBE_CLIENT_ID=
YOUTUBE_CLIENT_SECRET=
```

#### Build Command Railway (sudah di railway.toml):
```
npm install && npx prisma generate && npx prisma db push && npm run build
```

#### Start Command:
```
npm start
```

---

### LANGKAH 4 — Seed database production

Setelah deploy berhasil, jalankan di Railway terminal:
```bash
npx tsx prisma/seed.ts
```

---

### LANGKAH 5 — Update callback URL OAuth

Setelah dapat domain Railway (misal: `social-scheduler.railway.app`), update semua OAuth callback:
- **Instagram/Facebook**: developers.facebook.com → App → Valid OAuth Redirect URIs → tambah `https://your-app.railway.app/api/oauth/callback/instagram`
- **Twitter**: developer.twitter.com → App → Callback URLs
- **TikTok**: developers.tiktok.com → App → Redirect URI
- **LinkedIn**: linkedin.com/developers → Redirect URLs
- **YouTube/Google**: console.cloud.google.com → Credentials → Authorized redirect URIs

---

## Catatan Penting

### Upload File di Railway
Railway tidak punya persistent disk default. Untuk upload media, gunakan salah satu:
- **Cloudinary** (gratis 25GB) — paling mudah
- **AWS S3** (bayar sesuai pemakaian)
- **Railway Volume** (add-on berbayar)

### Cara setup Cloudinary:
1. Daftar di cloudinary.com
2. Tambah env: `CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name`
3. Update `src/app/api/media/upload/route.ts` untuk upload ke Cloudinary

### Custom Domain
Railway → Settings → Domains → Add Custom Domain
Masukkan domain Anda dan arahkan DNS ke Railway.

---

## Ringkasan Alur Deploy

```
Kode lokal → GitHub → Railway auto-deploy
     ↑
  git push main = deploy otomatis
```

Setiap kali `git push` ke branch `main`, Railway otomatis build dan deploy ulang.
