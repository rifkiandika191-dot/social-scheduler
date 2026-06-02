# Panduan Monitor SIAKAD (Notifikasi Open/Tutup Perkuliahan)

Memantau kolom **Status (Open/Tutup)** tiap mata kuliah di halaman **Perkuliahan**
SIAKAD Kalla Institute (`siakad.kallabs.ac.id`) dan kirim notifikasi **Telegram**:

1. **Saat status sebuah mata kuliah berubah** (Open ➜ Tutup atau sebaliknya) → notif langsung.
2. **5 menit setelah perubahan** → **pengingat 1×** untuk mata kuliah tersebut (tidak diulang).

## ⚠️ Kenapa pakai cookie (bukan username/password)

Login EWAKo (SSO) memakai **captcha "Kode Keamanan"**, jadi login otomatis tiap
menit tidak bisa dilakukan. Solusinya: **pakai cookie sesi** — Anda login manual
sekali di browser, salin cookie-nya, dan monitor memakai cookie itu sampai
kedaluwarsa. Jika cookie habis, monitor mengirim notif agar Anda login ulang.

## 1. Bot Telegram

1. Chat **@BotFather** → `/newbot` → dapatkan **bot token**.
2. Kirim 1 pesan ke bot Anda, lalu buka `https://api.telegram.org/bot<TOKEN>/getUpdates`,
   cari `"chat":{"id":...}` → itu **chat id** Anda.

```env
TELEGRAM_BOT_TOKEN="123456:ABC-DEF..."
TELEGRAM_CHAT_ID="123456789"
```

> Dikosongkan = mode mock (hanya di-log), berguna untuk uji coba.

## 2. Ambil URL + cookie SIAKAD

1. Login di `ewako.kallabs.ac.id` → masuk **Sistem Informasi Akademik [MHS]** → klik menu **Perkuliahan**.
2. Salin **URL** halaman Perkuliahan dari address bar.
3. Buka **DevTools** (klik kanan → Inspect) → tab **Network** → refresh halaman →
   klik request halaman Perkuliahan → bagian **Request Headers** → salin **seluruh** nilai header `Cookie`.

```env
SIAKAD_PERKULIAHAN_URL="https://siakad.kallabs.ac.id/perkuliahan"   # sesuaikan dgn URL asli
SIAKAD_COOKIE="nama1=nilai1; nama2=nilai2; ..."                      # tempel cookie utuh
```

Kata kunci status sudah cocok dengan tampilan SIAKAD (Open/Tutup), tapi bisa disesuaikan:

```env
SIAKAD_OPEN_KEYWORDS="open,buka,dibuka,aktif"
SIAKAD_CLOSE_KEYWORDS="tutup,ditutup,closed,nonaktif"
SIAKAD_REMINDER_MINUTES="5"
SIAKAD_TIMEZONE="Asia/Jakarta"
```

## 3. Jalankan pengecekan berkala (cron)

Endpoint: `GET /api/siakad/check` — header `Authorization: Bearer <NEXTAUTH_SECRET>`.

Uji manual:

```bash
curl -H "Authorization: Bearer social-scheduler-secret-key-2024" \
  http://localhost:3000/api/siakad/check
# -> {"ok":true,"totalCourses":8,"changed":0,"reminders":0,...}
```

Otomatis tiap 1 menit: pakai **cron-job.org** / **UptimeRobot**:
- URL: `https://<domain-anda>/api/siakad/check`
- Header: `Authorization: Bearer <NEXTAUTH_SECRET>`
- Interval: 1 menit

## Cara kerja & catatan

- Parser membaca tabel, mengambil **Kode matkul** (mis. `KW022309`) + statusnya.
- State (status terakhir per matkul, waktu berubah, flag reminder) disimpan di
  `siakad-state.json` (di-`.gitignore`, tanpa migrasi DB).
- Pengecekan **pertama** = baseline (tanpa notif). Matkul baru yang muncul belakangan
  juga dianggap baseline.
- Cookie kedaluwarsa → notif "Sesi SIAKAD habis" dikirim **1×** sampai cookie diperbarui.
- File: `src/lib/siakad.ts`, `src/lib/telegram.ts`, `src/app/api/siakad/check/route.ts`.
