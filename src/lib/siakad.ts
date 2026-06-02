// Monitor status open/close (Open/Tutup) tiap mata kuliah pada halaman
// "Perkuliahan" SIAKAD Kalla Institute (siakad.kallabs.ac.id).
//
// CATATAN PENTING soal LOGIN:
//   Login EWAKo (SSO) memakai captcha "Kode Keamanan" sehingga login otomatis
//   tidak dapat dilakukan. Karena itu monitor memakai COOKIE SESI:
//   Anda login manual di browser, salin cookie, lalu simpan di SIAKAD_COOKIE.
//   Saat cookie kedaluwarsa, monitor mengirim notifikasi agar Anda login ulang
//   dan memperbarui cookie.
//
// Cara kerja:
//   1. GET halaman Perkuliahan memakai SIAKAD_COOKIE.
//   2. Parse tabel -> map { kodeMatkul: 'open' | 'closed' } (+ nama matkul).
//   3. Bandingkan dgn status tersimpan (file JSON) PER mata kuliah.
//   4. Jika ada yang BERUBAH (Open <-> Tutup) -> notif Telegram langsung.
//   5. 5 menit setelah perubahan suatu matkul -> kirim pengingat 1x utk matkul itu.

import { promises as fs } from 'fs'
import path from 'path'
import { sendTelegram } from './telegram'

export type SiakadStatus = 'open' | 'closed'

interface CourseState {
  status: SiakadStatus
  name: string
  changedAt: string   // ISO; kapan status matkul ini terakhir berubah
  reminderSent: boolean
}

interface SiakadState {
  courses: Record<string, CourseState>   // key = kode matkul
  lastCheckedAt: string | null
  lastError?: string | null
  sessionExpiredNotified?: boolean        // agar notif "login ulang" tidak spam
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

async function readState(): Promise<SiakadState> {
  try {
    const raw = await fs.readFile(STATE_FILE, 'utf8')
    const s = JSON.parse(raw) as SiakadState
    if (!s.courses) s.courses = {}
    return s
  } catch {
    return { courses: {}, lastCheckedAt: null }
  }
}

async function writeState(state: SiakadState): Promise<void> {
  await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2), 'utf8')
}

// ---------------------------------------------------------------------------
// Ambil halaman Perkuliahan (pakai cookie sesi)
// ---------------------------------------------------------------------------

class SessionExpiredError extends Error {}

async function fetchPerkuliahanHtml(): Promise<string> {
  const url = env('SIAKAD_PERKULIAHAN_URL')
  const cookie = env('SIAKAD_COOKIE')

  if (!url) throw new Error('SIAKAD_PERKULIAHAN_URL belum diisi')
  if (!cookie) throw new SessionExpiredError('SIAKAD_COOKIE belum diisi (login manual lalu salin cookie)')

  const res = await fetch(url, {
    headers: {
      'Cookie': cookie,
      'User-Agent': env('SIAKAD_USER_AGENT', 'Mozilla/5.0 (compatible; SiakadMonitor/1.0)'),
      'Accept': 'text/html,application/xhtml+xml',
    },
    redirect: 'follow',
  })
  const body = await res.text()

  // Deteksi sesi habis: ter-redirect ke EWAKo/login, atau halaman login muncul.
  const onLoginPage = /Kode Keamanan|Single Sign On|EWAKo|name=["']?password/i.test(body)
  const redirectedToSso = /ewako\.kallabs\.ac\.id/i.test(res.url) && !/siakad/i.test(res.url)
  if (!res.ok || onLoginPage || redirectedToSso) {
    throw new SessionExpiredError('Sesi SIAKAD habis / tidak login (perlu perbarui SIAKAD_COOKIE)')
  }

  return body
}

// ---------------------------------------------------------------------------
// Parse tabel perkuliahan -> { kode: {status, name} }
// ---------------------------------------------------------------------------

const CODE_RE = /[A-Z]{2}\d{6}/   // mis. KW022309, KU022205, KI022203

export function parsePerkuliahan(html: string): Record<string, { status: SiakadStatus; name: string }> {
  const openKw = env('SIAKAD_OPEN_KEYWORDS', 'open,buka,dibuka,aktif')
    .split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
  const closeKw = env('SIAKAD_CLOSE_KEYWORDS', 'tutup,ditutup,closed,nonaktif')
    .split(',').map(s => s.trim().toLowerCase()).filter(Boolean)

  const result: Record<string, { status: SiakadStatus; name: string }> = {}

  // Pisah per baris tabel.
  const rows = html.split(/<tr[\s>]/i)
  for (const row of rows) {
    const codeMatch = row.match(CODE_RE)
    if (!codeMatch) continue
    const code = codeMatch[0]

    const text = row.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').toLowerCase()
    const hasOpen = openKw.some(k => text.includes(k))
    const hasClose = closeKw.some(k => text.includes(k))
    if (hasOpen === hasClose) continue   // ambigu / tidak ada status -> lewati

    // Nama matkul: ambil teks sel tepat setelah kode, sampai '[' (jumlah sks).
    let name = ''
    const nameMatch = row.match(new RegExp(`${code}\\s*</td>\\s*<td[^>]*>([^<\\[]+)`, 'i'))
    if (nameMatch) name = nameMatch[1].trim()

    result[code] = { status: hasOpen ? 'open' : 'closed', name }
  }

  return result
}

// ---------------------------------------------------------------------------
// Logika utama: cek + notifikasi
// ---------------------------------------------------------------------------

function label(s: SiakadStatus): string {
  return s === 'open' ? 'BUKA (Open)' : 'TUTUP'
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', {
    timeZone: env('SIAKAD_TIMEZONE', 'Asia/Jakarta'),
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function courseLabel(code: string, name: string): string {
  return name ? `${code} — ${name}` : code
}

export interface SiakadCheckResult {
  ok: boolean
  totalCourses: number
  changed: number
  reminders: number
  reason?: string
}

export async function runSiakadCheck(): Promise<SiakadCheckResult> {
  const nowDate = new Date()
  const now = nowDate.toISOString()
  const state = await readState()

  // Ambil & parse halaman.
  let current: Record<string, { status: SiakadStatus; name: string }>
  try {
    const html = await fetchPerkuliahanHtml()
    current = parsePerkuliahan(html)
  } catch (e: any) {
    const reason = e?.message || String(e)
    // Sesi habis -> beri tahu sekali agar tidak spam.
    if (e instanceof SessionExpiredError && !state.sessionExpiredNotified) {
      await sendTelegram(
        `🔒 <b>Sesi SIAKAD Habis</b>\n\n` +
        `Monitor tidak bisa membaca halaman Perkuliahan.\n` +
        `Silakan login ulang di browser lalu perbarui <code>SIAKAD_COOKIE</code>.\n\n` +
        `Detail: ${reason}`
      )
      state.sessionExpiredNotified = true
    }
    state.lastCheckedAt = now
    state.lastError = reason
    await writeState(state)
    return { ok: false, totalCourses: Object.keys(state.courses).length, changed: 0, reminders: 0, reason }
  }

  // Sesi sehat lagi -> reset flag.
  state.sessionExpiredNotified = false
  state.lastError = null

  const isFirstRun = Object.keys(state.courses).length === 0
  const changes: string[] = []

  for (const [code, { status, name }] of Object.entries(current)) {
    const prev = state.courses[code]

    if (!prev) {
      // Matkul baru terlihat. Pada run pertama -> baseline diam.
      // Jika muncul belakangan (matkul baru), anggap baseline juga (tanpa notif).
      state.courses[code] = { status, name, changedAt: now, reminderSent: true }
      continue
    }

    // Perbarui nama jika sekarang terdeteksi.
    if (name && prev.name !== name) prev.name = name

    if (status !== prev.status) {
      changes.push(`• ${courseLabel(code, prev.name || name)}: ${label(prev.status)} ➜ ${label(status)}`)
      prev.status = status
      prev.changedAt = now
      prev.reminderSent = false
    }
  }

  // Kirim notifikasi perubahan (gabung jadi satu pesan).
  if (!isFirstRun && changes.length > 0) {
    await sendTelegram(
      `⚠️ <b>Perubahan Status Perkuliahan</b>\n\n` +
      changes.join('\n') +
      `\n\n🕒 ${fmtTime(now)}`
    )
  }

  // Kirim pengingat 5 menit (1x per perubahan) untuk matkul yang sudah lewat ambang.
  const reminders: string[] = []
  for (const [code, c] of Object.entries(state.courses)) {
    if (c.reminderSent) continue
    const elapsedMin = (nowDate.getTime() - new Date(c.changedAt).getTime()) / 60000
    if (elapsedMin >= reminderMinutes()) {
      reminders.push(`• ${courseLabel(code, c.name)}: ${label(c.status)} (sejak ${fmtTime(c.changedAt)})`)
      c.reminderSent = true
    }
  }
  if (reminders.length > 0) {
    await sendTelegram(
      `⏰ <b>Pengingat (${reminderMinutes()} menit)</b>\n\n` +
      `Status berikut sudah berubah lebih dari ${reminderMinutes()} menit lalu:\n` +
      reminders.join('\n')
    )
  }

  state.lastCheckedAt = now
  await writeState(state)

  return {
    ok: true,
    totalCourses: Object.keys(current).length,
    changed: changes.length,
    reminders: reminders.length,
    reason: isFirstRun ? 'baseline' : undefined,
  }
}
