# Social Scheduler - Cara Penggunaan

## Cara Menjalankan

```bash
cd /Users/muhammadrifqi/Documents/social-scheduler
npm run dev
```

Buka browser: http://localhost:3000

## Login Demo
- Email: `admin@demo.com`
- Password: `demo123`

## Fitur Lengkap

### 1. Upload & Edit Konten (`/create`)
- Drag & drop foto/video (max 50MB)
- **Editor bawaan** dengan:
  - 10 preset filter (Vivid, Matte, Drama, Warm, Cool, Vintage, B&W, dll)
  - Slider manual: Kecerahan, Kontras, Saturasi, Blur, Grayscale, Sepia, Hue
  - **Overlay Story**: Border tepi dengan pilihan warna, ketebalan, dan gaya (solid/dashed/double/rounded)
  - **Gradient Overlay**: Pilih warna dan arah gradient
  - **Teks Overlay**: Tambah teks di atas, tengah, atau bawah konten
  - **Vignette**: Efek gelap di pinggiran untuk tampilan dramatis
- Tulis caption dan hashtag
- Toggle mode Story vs Post biasa

### 2. Jadwal & Antrian (`/schedule`)
- Pilih "Publikasikan Sekarang" atau jadwalkan ke waktu tertentu
- Posting **simultan ke semua platform** yang dipilih sekaligus
- Tampilan status per platform:
  - Draft / Terjadwal / Memproses / Tayang / Gagal
- Tombol "Coba Lagi" untuk post yang gagal
- Hapus post dari antrian

### 3. Analitik (`/analytics`)
- Metrik: Views, Likes, Komentar, Share, Jangkauan, Tayangan
- **Grafik engagement harian** (Area chart)
- **Breakdown per platform** (Pie chart)
- **Top 5 post terbaik**
- Filter periode: 7 hari / 30 hari / 3 bulan

### 4. Tim (`/team`)
- Buat tim dengan nama custom
- **Undang anggota via email** (kirim link undangan)
- Atur role: Owner / Admin / Editor / Anggota / Penonton
- Ubah role atau hapus anggota

### 5. Notifikasi (`/notifications`)
- **Email otomatis** jika post gagal (via SMTP)
- Notifikasi in-app: post tayang, gagal, undangan tim
- Tandai semua sudah dibaca

### 6. Pengaturan (`/settings`)
- **Hubungkan akun sosial media**: Instagram, Twitter/X, TikTok, Facebook, YouTube, LinkedIn
- Edit profil (nama & email)
- Ubah password dengan validasi

## Konfigurasi Email (Opsional)

Edit file `.env`:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=emailanda@gmail.com
SMTP_PASS=app-password-gmail
```

Untuk Gmail, gunakan [App Password](https://support.google.com/accounts/answer/185833).

## Integrasi API Sosial Media (Opsional)

Isi API keys di `.env` untuk koneksi nyata:
- Instagram/Facebook: Butuh Facebook Developer App
- Twitter/X: Butuh Twitter Developer Account
- TikTok: Butuh TikTok for Developers
- LinkedIn: Butuh LinkedIn Developer App
- YouTube: Butuh Google Cloud Console

## Penjadwalan Otomatis

Jalankan endpoint ini setiap menit via cron job:
```
GET http://localhost:3000/api/scheduler/run
Authorization: Bearer your-secret-key
```

Atau gunakan layanan cron seperti Vercel Cron Jobs, GitHub Actions, atau crontab.

## Struktur Proyek

```
src/
├── app/
│   ├── (auth)/login/          # Halaman login
│   ├── (auth)/register/       # Halaman daftar
│   ├── (dashboard)/
│   │   ├── dashboard/         # Dashboard utama
│   │   ├── create/            # Buat & edit konten
│   │   ├── schedule/          # Jadwal & antrian
│   │   ├── analytics/         # Analitik
│   │   ├── team/              # Manajemen tim
│   │   ├── notifications/     # Notifikasi
│   │   └── settings/          # Pengaturan
│   └── api/                   # REST API endpoints
├── components/
│   ├── editor/MediaEditor.tsx  # Editor dengan filter & overlay
│   ├── layout/                 # Sidebar, Providers
│   └── ui/                     # Komponen UI dasar
└── lib/
    ├── db.ts                   # Prisma client
    ├── auth.ts                 # NextAuth config
    ├── email.ts                # Email templates
    ├── scheduler.ts            # Post scheduler
    └── utils.ts                # Helper functions
```
