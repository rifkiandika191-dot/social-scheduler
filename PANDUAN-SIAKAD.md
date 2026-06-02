# Panduan Monitor SIAKAD (Notifikasi Open/Close Perkuliahan)

Fitur ini memantau status **buka/tutup perkuliahan** di SIAKAD dan mengirim
notifikasi ke **Telegram**:

1. **Saat status berubah** (buka ➜ tutup atau sebaliknya) → kirim notifikasi langsung.
2. **5 menit setelah perubahan** → kirim **pengingat 1×** (tidak diulang).

## 1. Siapkan Bot Telegram

1. Chat ke **@BotFather** di Telegram → `/newbot` → ikuti instruksi → dapat **bot token**.
2. Dapatkan **chat id** Anda:
   - Chat dulu ke bot Anda (kirim pesan apa saja).
   - Buka `https://api.telegram.org/bot<TOKEN>/getUpdates` di browser.
   - Cari `"chat":{"id":...}` → itu chat id Anda.

Isi di `.env`:

```env
TELEGRAM_BOT_TOKEN="123456:ABC-DEF..."
TELEGRAM_CHAT_ID="123456789"
```

> Jika dikosongkan, notifikasi hanya di-log ke console (mode mock) untuk uji coba.

## 2. Konfigurasi akses SIAKAD

Isi di `.env` (lihat `.env.example` untuk daftar lengkap):

```env
SIAKAD_LOGIN_URL="https://siakad.kampus.ac.id/login"
SIAKAD_PERKULIAHAN_URL="https://siakad.kampus.ac.id/perkuliahan"
SIAKAD_USERNAME="nim_atau_username"
SIAKAD_PASSWORD="password_anda"

# Nama field form login (lihat HTML halaman login: klik kanan → Inspect)
SIAKAD_USER_FIELD="username"
SIAKAD_PASS_FIELD="password"

# Kalau form login pakai token CSRF (mis. Laravel), isi nama field-nya:
SIAKAD_CSRF_FIELD=""   # contoh: _token

# Kata kunci penentu status (tidak case-sensitive)
SIAKAD_OPEN_KEYWORDS="buka,dibuka,open,aktif"
SIAKAD_CLOSE_KEYWORDS="tutup,ditutup,closed,nonaktif,tidak aktif"
```

### Menyetel deteksi status

Sistem mengambil halaman perkuliahan lalu mencari kata kunci di atas:
- Hanya kata "open" yang muncul → status **buka**.
- Hanya kata "close" yang muncul → status **tutup**.
- Keduanya / tidak ada yang cocok → **tidak diketahui** (tidak ada notifikasi, supaya tak ada alarm palsu).

Kalau halaman perkuliahan banyak teks lain yang ikut mengandung kata-kata itu,
persempit pencarian ke bagian tertentu dengan **regex**:

```env
# Contoh: hanya lihat blok yang memuat label "Status Perkuliahan ... </div>"
SIAKAD_SECTION_REGEX="Status Perkuliahan.*?</div>"
```

## 3. Jalankan pengecekan berkala (cron)

Endpoint: `GET /api/siakad/check`
Header wajib: `Authorization: Bearer <NEXTAUTH_SECRET>`
(atau set `SIAKAD_CRON_SECRET` khusus).

Uji manual (lokal):

```bash
curl -H "Authorization: Bearer social-scheduler-secret-key-2024" \
  http://localhost:3000/api/siakad/check
```

Responsnya JSON, mis. `{"ok":true,"status":"open","changed":false,...}`.

### Otomatis tiap 1 menit

Pakai layanan cron eksternal (gratis), mis. **cron-job.org** atau **UptimeRobot**:
- URL: `https://<domain-anda>/api/siakad/check`
- Method: GET
- Header: `Authorization: Bearer <NEXTAUTH_SECRET>`
- Interval: 1 menit

## Catatan teknis

- State (status terakhir, waktu perubahan, flag reminder) disimpan di file
  `siakad-state.json` (sudah di-`.gitignore`). Tidak perlu migrasi database.
- Pengecekan **pertama** hanya menetapkan baseline (tidak mengirim notifikasi).
- Di Railway, filesystem bersifat ephemeral: setelah redeploy, baseline diset
  ulang (paling banyak 1 notifikasi terlewat/duplikat setelah deploy).
- File terkait:
  - `src/lib/siakad.ts` — login, scraping, deteksi, logika notifikasi
  - `src/lib/telegram.ts` — kirim pesan Telegram
  - `src/app/api/siakad/check/route.ts` — endpoint cron
