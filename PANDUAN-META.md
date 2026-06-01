# Panduan Detail: Hubungkan Facebook & Instagram (Meta)

Facebook dan Instagram memakai **satu app Meta yang sama**. Selesai sekali setup, dua-duanya
aktif. Ikuti urut dari atas.

**Nilai yang akan Anda butuhkan (salin dulu):**

- Redirect URI Facebook:
  `https://jadwalkonten.com/api/oauth/callback/facebook`
- Redirect URI Instagram:
  `https://jadwalkonten.com/api/oauth/callback/instagram`
- Env var yang nanti diisi di Railway: `FACEBOOK_APP_ID` dan `FACEBOOK_APP_SECRET`

---

## Langkah 1 — Siapkan akun & aset

Sebelum mulai, pastikan Anda punya:

1. **Akun Facebook** biasa (untuk login ke developer portal).
2. **Facebook Page** (Halaman) — bukan profil pribadi. Kalau belum punya, buat dulu di
   facebook.com → Pages → Create.
3. **Akun Instagram tipe Bisnis/Creator** — bukan akun pribadi.
   - Di app Instagram → Settings → **Account type and tools** → **Switch to Professional account** → pilih Business/Creator.
4. **Hubungkan Instagram ke Facebook Page** tadi:
   - Di Facebook Page → **Settings → Linked accounts → Instagram** → connect.

> Ketiga aset ini wajib kalau Anda mau **posting ke Instagram** lewat API. Instagram pribadi
> biasa tidak bisa.

---

## Langkah 2 — Buat App di Meta for Developers

1. Buka **https://developers.facebook.com** → login dengan akun Facebook Anda.
2. Pertama kali: klik **Get Started** dan setujui syarat developer (verifikasi nomor HP/email).
3. Klik menu **My Apps** (kanan atas) → **Create App**.
4. Saat ditanya **"What do you want to do?"** (use case):
   - Pilih **Other** lalu **Next** → pilih tipe **Business** → **Next**.
5. Isi:
   - **App name**: bebas, mis. `Social Scheduler`
   - **App contact email**: email Anda
6. Klik **Create app** (mungkin diminta masukkan password Facebook).

Sekarang Anda masuk ke **App Dashboard**.

---

## Langkah 3 — Ambil App ID & App Secret

1. Di sidebar kiri: **App settings → Basic**.
2. Salin **App ID** (angka panjang).
3. Di **App Secret** → klik **Show** → masukkan password → salin nilainya.

Simpan dua nilai ini, nanti dipakai di Langkah 6.

---

## Langkah 4 — Tambah & atur Facebook Login

1. Di App Dashboard → cari **Add Product** (atau menu **Products** di sidebar).
2. Pada kartu **Facebook Login**, klik **Set up**.
3. Pilih platform **Web** kalau ditanya. Untuk **Site URL** isi:
   `https://jadwalkonten.com`
4. Di sidebar buka **Facebook Login → Settings**, lalu isi
   **Valid OAuth Redirect URIs** dengan **kedua** URI ini (satu per baris):

   ```
   https://jadwalkonten.com/api/oauth/callback/facebook
   https://jadwalkonten.com/api/oauth/callback/instagram
   ```
5. Pastikan **Client OAuth Login** dan **Web OAuth Login** dalam keadaan **ON**.
6. Klik **Save changes**.

---

## Langkah 5 — Tambah Instagram

1. **Add Product** lagi → cari **Instagram** (Instagram Graph API) → **Set up**.
2. Ikuti wizard untuk menautkan **akun Instagram Bisnis** + **Facebook Page** dari Langkah 1.
3. Tidak perlu kredensial baru — Instagram memakai App ID & Secret yang sama.

---

## Langkah 6 — Isi key di Railway

1. Buka project Anda di **Railway** → tab **Variables**.
2. Tambah dua variabel (klik **New Variable** untuk masing-masing):

   ```
   FACEBOOK_APP_ID      = <App ID dari Langkah 3>
   FACEBOOK_APP_SECRET  = <App Secret dari Langkah 3>
   ```
3. Pastikan juga ada (kalau belum):

   ```
   NEXTAUTH_URL = https://jadwalkonten.com
   ```
4. Railway akan **redeploy** otomatis. Tunggu sampai status **Deployed**.

> Instagram otomatis ikut aktif karena memakai key yang sama. (Kalau mau dipisah, bisa juga
> diisi `INSTAGRAM_CLIENT_ID` & `INSTAGRAM_CLIENT_SECRET`, tapi tidak wajib.)

---

## Langkah 7 — Tes di aplikasi

1. Buka aplikasi → **Pengaturan → Sosial Media**.
2. Kartu **Facebook** dan **Instagram** sekarang harus menampilkan tombol **"Hubungkan"**
   (bukan lagi "Belum dikonfigurasi").
3. Klik **Hubungkan** → Anda diarahkan ke halaman login/izin Facebook → **Continue/Allow**.
4. Setelah itu kembali ke aplikasi dengan notifikasi akun berhasil dihubungkan.

---

## Penting: mode Development vs Live

- App baru ada di **mode Development**. Di mode ini, **hanya Anda** (admin) dan orang yang
  Anda tambahkan sebagai **Role/Tester** yang bisa login dan dipakai untuk tes.
- Untuk membuka ke **publik** (semua orang bisa konek) dan benar-benar **posting otomatis**,
  Meta mewajibkan:
  1. **Business Verification** (verifikasi bisnis Anda), dan
  2. **App Review** untuk izin: `instagram_content_publish`, `pages_manage_posts`,
     `pages_read_engagement`, `instagram_basic`.
  - Submit lewat **App Review → Permissions and Features** di dashboard.
- **Menambahkan tester (tanpa review, untuk tes dulu):** App Dashboard → **App Roles → Roles**
  → **Add People** → pilih **Testers** → undang akun yang akan dipakai tes.

---

## Catatan upload konten

Walau akun sudah tersambung, proses publikasi terjadwal di aplikasi saat ini masih
**simulasi** (`src/lib/scheduler.ts`) — belum benar-benar mengunggah ke Instagram/Facebook.
Setelah key Anda lolos App Review, beri tahu saya untuk mengganti simulasi itu dengan
panggilan **Graph API** asli (publish foto/video ke Page & Instagram Business).
