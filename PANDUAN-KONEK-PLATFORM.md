# Panduan Menghubungkan Akun via Login Platform (OAuth)

Dokumen ini menjelaskan cara mendaftarkan aplikasi di tiap platform supaya tombol
**"Hubungkan"** di halaman *Pengaturan → Sosial Media* berfungsi (pengguna login langsung
ke platform, lalu akunnya tersambung).

> **Kode OAuth-nya sudah jadi.** Yang Anda lakukan di sini hanya: (1) daftar app di tiap
> platform, (2) salin Client ID & Secret, (3) isi sebagai *Environment Variable* di Railway,
> (4) daftarkan *Redirect URI*. Selesai itu, tombol "Hubungkan" langsung aktif.

---

## 0. Hal wajib lebih dulu

### a) Set `NEXTAUTH_URL` di Railway
Semua *Redirect URI* dibangun dari `NEXTAUTH_URL`. Pastikan di Railway → **Variables**:

```
NEXTAUTH_URL = https://jadwalkonten.com
```

(ganti kalau domain Anda berubah)

### b) Redirect URI tiap platform
Pola: `https://<domain-anda>/api/oauth/callback/<platform>`. Untuk domain Anda sekarang:

| Platform  | Redirect URI yang harus didaftarkan |
|-----------|-------------------------------------|
| Instagram | `https://jadwalkonten.com/api/oauth/callback/instagram` |
| Facebook  | `https://jadwalkonten.com/api/oauth/callback/facebook` |
| Twitter/X | `https://jadwalkonten.com/api/oauth/callback/twitter` |
| TikTok    | `https://jadwalkonten.com/api/oauth/callback/tiktok` |
| LinkedIn  | `https://jadwalkonten.com/api/oauth/callback/linkedin` |
| YouTube   | `https://jadwalkonten.com/api/oauth/callback/youtube` |

### c) Cara isi Environment Variable di Railway
Buka project di Railway → tab **Variables** → **New Variable** → isi nama & nilai →
**Deploy** ulang. (Bukan file `.env` lokal — itu hanya untuk komputer Anda saat `npm run dev`.)

---

## 1. Facebook & Instagram (Meta) — satu app untuk dua-duanya

**Portal:** https://developers.facebook.com/apps

1. **Create App** → tipe **Business**.
2. Di **Settings → Basic**: salin **App ID** dan **App Secret**.
3. Tambah produk **Facebook Login** → di **Settings**-nya, isi
   **Valid OAuth Redirect URIs** dengan URI Facebook **dan** Instagram di tabel atas.
4. Untuk Instagram: tambah produk **Instagram Graph API** dan hubungkan
   **akun Instagram Business/Creator** ke sebuah **Facebook Page**.
5. Isi env var di Railway:

   ```
   FACEBOOK_APP_ID      = <App ID>
   FACEBOOK_APP_SECRET  = <App Secret>
   ```
   Instagram otomatis ikut memakai key di atas. (Opsional bisa diisi terpisah:
   `INSTAGRAM_CLIENT_ID`, `INSTAGRAM_CLIENT_SECRET`.)

> ⚠️ **Untuk benar-benar posting** (`instagram_content_publish`, `pages_manage_posts`),
> Meta mewajibkan **Business Verification + App Review**. Sebelum lolos review, hanya
> akun admin/tester app yang bisa dipakai (mode Development).

---

## 2. Twitter / X

**Portal:** https://developer.twitter.com → **Developer Portal**

1. Buat **Project** lalu **App** di dalamnya.
2. Masuk **User authentication settings** → **Set up**:
   - App permissions: **Read and write**
   - Type of App: **Web App** (Confidential client)
   - **Callback URI**: isi Redirect URI Twitter dari tabel atas.
3. Salin **OAuth 2.0 Client ID** dan **Client Secret** (bukan "API Key/Secret" lama).
4. Isi env var di Railway:

   ```
   TWITTER_API_KEY     = <OAuth 2.0 Client ID>
   TWITTER_API_SECRET  = <OAuth 2.0 Client Secret>
   ```
   *(Nama variabelnya memang "API_KEY", tapi yang diisi adalah Client ID/Secret OAuth 2.0.)*

> ⚠️ **Posting tweet via API kini butuh paket berbayar** (mulai tier **Basic**). Tier gratis
> sangat terbatas untuk menulis.

---

## 3. TikTok

**Portal:** https://developers.tiktok.com

1. **Manage apps** → buat app baru.
2. Tambah produk **Login Kit** dan **Content Posting API**.
3. Daftarkan **Redirect URI** TikTok dari tabel atas.
4. Salin **Client Key** dan **Client Secret**, isi di Railway:

   ```
   TIKTOK_CLIENT_KEY     = <Client Key>
   TIKTOK_CLIENT_SECRET  = <Client Secret>
   ```

> ⚠️ Scope `video.publish` / `video.upload` butuh **audit/approval** dari TikTok sebelum bisa
> dipakai publik.

---

## 4. LinkedIn

**Portal:** https://www.linkedin.com/developers/apps

1. **Create app** (wajib ditautkan ke sebuah **LinkedIn Page** milik Anda).
2. Tab **Products**: aktifkan **Sign In with LinkedIn** dan **Share on LinkedIn**.
3. Tab **Auth**:
   - Salin **Client ID** dan **Client Secret**.
   - Tambahkan **Authorized redirect URL** = Redirect URI LinkedIn dari tabel atas.
4. Isi env var di Railway:

   ```
   LINKEDIN_CLIENT_ID      = <Client ID>
   LINKEDIN_CLIENT_SECRET  = <Client Secret>
   ```

> ⚠️ LinkedIn sedang memigrasi scope lama (`r_liteprofile`, `r_emailaddress`) ke
> **OpenID Connect** (`openid profile email`). Kalau login ditolak soal scope, beri tahu saya
> untuk menyesuaikan scope di `src/lib/oauth.ts`.

---

## 5. YouTube (Google Cloud)

**Portal:** https://console.cloud.google.com

1. Buat **Project** baru.
2. **APIs & Services → Library** → aktifkan **YouTube Data API v3**.
3. **OAuth consent screen** → tipe **External** → isi data app → tambah scope
   `youtube.upload` & `youtube.readonly` → tambahkan **Test users** (email Anda).
4. **Credentials → Create Credentials → OAuth client ID** → tipe **Web application**:
   - **Authorized redirect URIs** = Redirect URI YouTube dari tabel atas.
5. Salin **Client ID** dan **Client Secret**, isi di Railway:

   ```
   YOUTUBE_CLIENT_ID      = <Client ID>
   YOUTUBE_CLIENT_SECRET  = <Client Secret>
   ```

> ⚠️ Selama app belum **diverifikasi Google**, hanya **test users** (maks. 100) yang bisa
> login, dan akan muncul layar peringatan "app belum diverifikasi".

---

## Setelah selesai

1. Pastikan setiap key sudah masuk di **Railway → Variables** dan project sudah **redeploy**.
2. Buka **Pengaturan → Sosial Media** — platform yang key-nya sudah diisi akan berubah dari
   *"Belum dikonfigurasi"* menjadi tombol **"Hubungkan"**.
3. Klik **Hubungkan** → Anda diarahkan login ke platform → izinkan → akun tersambung.

> **Catatan penting soal upload konten:** saat ini proses publikasi terjadwal di
> `src/lib/scheduler.ts` masih **simulasi** (belum benar-benar mengunggah ke platform).
> Agar konten sungguh terkirim, perlu implementasi API publish tiap platform — dan itu baru
> bisa berjalan setelah key Anda **lolos review** masing-masing platform. Minta saya kerjakan
> kapan saja kalau key sudah siap.
