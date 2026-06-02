// Monitor status open/close perkuliahan di SIAKAD.
//
// Cara kerja:
//   1. Login ke SIAKAD (POST kredensial, simpan cookie sesi).
//   2. Ambil halaman perkuliahan, deteksi status: 'open' | 'closed' | 'unknown'.
//   3. Bandingkan dengan status tersimpan sebelumnya (file JSON).
//   4. Jika BERUBAH (open <-> closed): kirim notifikasi Telegram langsung,
//      catat waktu perubahan, reset flag reminder.
//   5. Jika sudah lewat SIAKAD_REMINDER_MINUTES (default 5) menit dari perubahan
//      dan reminder belum dikirim: kirim pengingat 1x, lalu set flag.
//
// Semua bagian yang spesifik ke situs SIAKAD Anda dikonfigurasi via env
// (lihat .env.example) sehingga tidak perlu mengubah kode.

import { promises as fs } from 'fs'
import path from 'path'
import { sendTelegram } from './telegram'

export type SiakadStatus = 'open' | 'closed' | 'unknown'

interface SiakadState {
  status: SiakadStatus
  changedAt: string | null   // ISO; kapan status terakhir berubah
  reminderSent: boolean      // apakah pengingat 5 menit sudah dikirim utk perubahan terakhir
  lastCheckedAt: string | null
  lastError?: string | null
}

const STATE_FILE = process.env.SIAKAD_STATE_FILE || path.join(process.cwd(), 'siakad-state.json')

function env(name: string, fallback = ''): string {
  return (process.env[name] || fallback).trim()
}

function reminderMinutes(): number {
  const n = parseInt(env('SIAKAD_REMINDER_MINUTES', '5'), 10)
  return Number.isFinite(n) && n > 0 ? n : 5
}

// ---------------------------------------------------------------------------
// State persistence (file JSON)
// ---------------------------------------------------------------------------

async function readState(): Promise<SiakadState | null> {
  try {
    const raw = await fs.readFile(STATE_FILE, 'utf8')
    return JSON.parse(raw) as SiakadState
  } catch {
    return null
  }
}

async function writeState(state: SiakadState): Promise<void> {
  await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2), 'utf8')
}

// ---------------------------------------------------------------------------
// HTTP dengan cookie jar sederhana (login butuh sesi melewati redirect)
// ---------------------------------------------------------------------------

function parseSetCookie(headers: Headers, jar: Map<string, string>) {
  // Node fetch menggabungkan beberapa Set-Cookie; ambil per entri.
  const raw = (headers as any).getSetCookie?.() as string[] | undefined
  const cookies = raw && raw.length ? raw : (headers.get('set-cookie') ? [headers.get('set-cookie') as string] : [])
  for (const c of cookies) {
    const [pair] = c.split(';')
    const idx = pair.indexOf('=')
    if (idx > 0) jar.set(pair.slice(0, idx).trim(), pair.slice(idx + 1).trim())
  }
}

function cookieHeader(jar: Map<string, string>): string {
  return Array.from(jar.entries()).map(([k, v]) => `${k}=${v}`).join('; ')
}

async function fetchWithCookies(
  url: string,
  jar: Map<string, string>,
  init: RequestInit = {},
  maxRedirects = 5,
): Promise<{ res: Response; body: string; finalUrl: string }> {
  let currentUrl = url
  let method = (init.method || 'GET').toUpperCase()
  let body = init.body

  for (let i = 0; i <= maxRedirects; i++) {
    const headers = new Headers(init.headers as HeadersInit)
    headers.set('User-Agent', env('SIAKAD_USER_AGENT', 'Mozilla/5.0 (compatible; SiakadMonitor/1.0)'))
    if (jar.size) headers.set('Cookie', cookieHeader(jar))

    const res: Response = await fetch(currentUrl, { ...init, method, body, headers, redirect: 'manual' })
    parseSetCookie(res.headers, jar)

    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      currentUrl = new URL(res.headers.get('location') as string, currentUrl).toString()
      // Redirect setelah POST jadi GET (303/302 umum pada login).
      if (method === 'POST') { method = 'GET'; body = undefined }
      continue
    }

    const text = await res.text()
    return { res, body: text, finalUrl: currentUrl }
  }
  throw new Error('Terlalu banyak redirect saat mengakses SIAKAD')
}

// ---------------------------------------------------------------------------
// Login + ambil halaman perkuliahan
// ---------------------------------------------------------------------------

async function fetchPerkuliahanHtml(): Promise<string> {
  const loginUrl = env('SIAKAD_LOGIN_URL')
  const perkuliahanUrl = env('SIAKAD_PERKULIAHAN_URL')
  const username = env('SIAKAD_USERNAME')
  const password = env('SIAKAD_PASSWORD')

  if (!loginUrl || !perkuliahanUrl || !username || !password) {
    throw new Error('Konfigurasi SIAKAD belum lengkap (SIAKAD_LOGIN_URL, SIAKAD_PERKULIAHAN_URL, SIAKAD_USERNAME, SIAKAD_PASSWORD)')
  }

  const jar = new Map<string, string>()

  // 1) GET halaman login untuk dapat cookie awal + (opsional) token CSRF.
  const loginPage = await fetchWithCookies(loginUrl, jar)

  // 2) Susun form login.
  const form = new URLSearchParams()
  form.set(env('SIAKAD_USER_FIELD', 'username'), username)
  form.set(env('SIAKAD_PASS_FIELD', 'password'), password)

  // Token CSRF opsional: cari pakai regex yang bisa dikonfigurasi.
  // Default menangkap <input name="_token" value="..."> ala Laravel/CodeIgniter.
  const csrfField = env('SIAKAD_CSRF_FIELD')
  if (csrfField) {
    const csrfRegex = env('SIAKAD_CSRF_REGEX') ||
      `name=["']${csrfField}["'][^>]*value=["']([^"']+)["']`
    const m = loginPage.body.match(new RegExp(csrfRegex, 'i'))
    if (m && m[1]) form.set(csrfField, m[1])
  }

  // Field tambahan statis (mis. login=1) lewat SIAKAD_EXTRA_FIELDS="a=1&b=2"
  const extra = env('SIAKAD_EXTRA_FIELDS')
  if (extra) {
    new URLSearchParams(extra).forEach((v, k) => form.set(k, v))
  }

  // 3) POST login.
  await fetchWithCookies(loginUrl, jar, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  })

  // 4) GET halaman perkuliahan dengan sesi yang sudah login.
  const page = await fetchWithCookies(perkuliahanUrl, jar)
  return page.body
}

// ---------------------------------------------------------------------------
// Deteksi status open/close dari HTML
// ---------------------------------------------------------------------------

export function detectStatus(html: string): SiakadStatus {
  let text = html

  // Persempit ke bagian tertentu dulu jika SIAKAD_SECTION_REGEX diisi
  // (mis. menangkap baris/blok khusus "perkuliahan").
  const sectionRegex = env('SIAKAD_SECTION_REGEX')
  if (sectionRegex) {
    const m = html.match(new RegExp(sectionRegex, 'i'))
    if (m) text = m[0]
  }

  // Buang tag HTML -> teks polos, lowercase.
  const plain = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').toLowerCase()

  const openKw = env('SIAKAD_OPEN_KEYWORDS', 'buka,dibuka,open,aktif')
    .split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
  const closeKw = env('SIAKAD_CLOSE_KEYWORDS', 'tutup,ditutup,closed,nonaktif,tidak aktif')
    .split(',').map(s => s.trim().toLowerCase()).filter(Boolean)

  const hasOpen = openKw.some(k => plain.includes(k))
  const hasClose = closeKw.some(k => plain.includes(k))

  // Hanya yakin jika tepat satu kategori cocok; selain itu 'unknown'
  // supaya tidak ada notifikasi palsu.
  if (hasOpen && !hasClose) return 'open'
  if (hasClose && !hasOpen) return 'closed'
  return 'unknown'
}

// ---------------------------------------------------------------------------
// Logika utama: cek + notifikasi
// ---------------------------------------------------------------------------

function label(s: SiakadStatus): string {
  return s === 'open' ? 'BUKA' : s === 'closed' ? 'TUTUP' : 'TIDAK DIKETAHUI'
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', {
    timeZone: env('SIAKAD_TIMEZONE', 'Asia/Jakarta'),
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export interface SiakadCheckResult {
  ok: boolean
  status: SiakadStatus
  changed: boolean
  reminderSent: boolean
  notified: boolean
  reason?: string
}

export async function runSiakadCheck(): Promise<SiakadCheckResult> {
  const now = new Date()
  const prev = await readState()

  // Ambil status sekarang dari SIAKAD.
  let status: SiakadStatus
  try {
    const html = await fetchPerkuliahanHtml()
    status = detectStatus(html)
  } catch (e: any) {
    const reason = e?.message || String(e)
    await writeState({
      status: prev?.status ?? 'unknown',
      changedAt: prev?.changedAt ?? null,
      reminderSent: prev?.reminderSent ?? true,
      lastCheckedAt: now.toISOString(),
      lastError: reason,
    })
    return { ok: false, status: prev?.status ?? 'unknown', changed: false, reminderSent: prev?.reminderSent ?? true, notified: false, reason }
  }

  // Status tidak jelas -> jangan picu notifikasi, cukup catat.
  if (status === 'unknown') {
    await writeState({
      status: prev?.status ?? 'unknown',
      changedAt: prev?.changedAt ?? null,
      reminderSent: prev?.reminderSent ?? true,
      lastCheckedAt: now.toISOString(),
      lastError: 'Status tidak terdeteksi (cek SIAKAD_OPEN/CLOSE_KEYWORDS atau SIAKAD_SECTION_REGEX)',
    })
    return { ok: true, status: 'unknown', changed: false, reminderSent: prev?.reminderSent ?? true, notified: false, reason: 'unknown' }
  }

  // Pertama kali jalan: tetapkan baseline tanpa notifikasi.
  if (!prev || prev.status === 'unknown' || !prev.changedAt) {
    await writeState({ status, changedAt: now.toISOString(), reminderSent: true, lastCheckedAt: now.toISOString(), lastError: null })
    return { ok: true, status, changed: false, reminderSent: true, notified: false, reason: 'baseline' }
  }

  // Status BERUBAH -> notifikasi langsung.
  if (status !== prev.status) {
    await sendTelegram(
      `⚠️ <b>Perubahan Status Perkuliahan</b>\n\n` +
      `Status berubah: <b>${label(prev.status)}</b> ➜ <b>${label(status)}</b>\n` +
      `🕒 ${fmtTime(now.toISOString())}`
    )
    await writeState({ status, changedAt: now.toISOString(), reminderSent: false, lastCheckedAt: now.toISOString(), lastError: null })
    return { ok: true, status, changed: true, reminderSent: false, notified: true }
  }

  // Status SAMA -> cek apakah perlu kirim pengingat 5 menit (1x).
  const elapsedMin = (now.getTime() - new Date(prev.changedAt).getTime()) / 60000
  if (!prev.reminderSent && elapsedMin >= reminderMinutes()) {
    await sendTelegram(
      `⏰ <b>Pengingat</b>\n\n` +
      `Status perkuliahan sudah <b>${label(status)}</b> sejak ${fmtTime(prev.changedAt)} ` +
      `(lebih dari ${reminderMinutes()} menit).`
    )
    await writeState({ ...prev, reminderSent: true, lastCheckedAt: now.toISOString(), lastError: null })
    return { ok: true, status, changed: false, reminderSent: true, notified: true }
  }

  // Tidak ada perubahan & belum waktunya/atau sudah dikirim.
  await writeState({ ...prev, lastCheckedAt: now.toISOString(), lastError: null })
  return { ok: true, status, changed: false, reminderSent: prev.reminderSent, notified: false }
}
