#!/usr/bin/env node
/**
 * Auto-push ke GitHub setiap kali ada perubahan file.
 * Jalankan: node auto-push.mjs
 */

import { watch }       from 'fs'
import { execSync }    from 'child_process'
import { existsSync }  from 'fs'
import path            from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT   = __dirname
const DEBOUNCE  = 8000  // tunggu 8 detik setelah perubahan terakhir sebelum push

const IGNORE = new Set([
  '.git', 'node_modules', '.next', 'public/uploads',
  'dev.db', 'dev.db-journal', '.env', 'tsconfig.tsbuildinfo',
])

function shouldIgnore(filepath) {
  return IGNORE.has(path.basename(filepath)) ||
    filepath.includes('node_modules') ||
    filepath.includes('.next') ||
    filepath.includes('.git') ||
    filepath.endsWith('.db') ||
    filepath.endsWith('.db-journal')
}

function run(cmd) {
  try {
    return execSync(cmd, { cwd: PROJECT, encoding: 'utf8', stdio: 'pipe' })
  } catch (e) {
    return e.stderr || e.stdout || ''
  }
}

function getTimestamp() {
  return new Date().toLocaleString('id-ID', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

let timer      = null
let pendingFiles = new Set()
let isPushing  = false

function schedulePush(filepath) {
  if (shouldIgnore(filepath)) return
  pendingFiles.add(path.relative(PROJECT, filepath))

  clearTimeout(timer)
  timer = setTimeout(async () => {
    if (isPushing) return
    isPushing = true

    const status = run('git status --porcelain').trim()
    if (!status) { isPushing = false; pendingFiles.clear(); return }

    const files   = [...pendingFiles].slice(0, 5).join(', ')
    const more    = pendingFiles.size > 5 ? ` +${pendingFiles.size - 5} file lain` : ''
    const message = `auto: update ${files}${more} [${getTimestamp()}]`

    console.log(`\n📦 Perubahan terdeteksi di ${pendingFiles.size} file`)
    console.log(`⬆️  Pushing ke GitHub...`)

    run('git add .')
    const commitOut = run(`git commit -m "${message}"`)
    const pushOut   = run('git push origin main')

    if (pushOut.includes('error') || pushOut.includes('fatal')) {
      console.log(`❌ Push gagal:`, pushOut)
    } else {
      console.log(`✅ Berhasil push: "${message}"`)
    }

    isPushing  = false
    pendingFiles.clear()
  }, DEBOUNCE)
}

// Watcher utama
console.log('👀 Memantau perubahan file...')
console.log(`📁 Project: ${PROJECT}`)
console.log(`⏱️  Delay push: ${DEBOUNCE / 1000} detik setelah perubahan terakhir`)
console.log('🔄 Auto-push ke GitHub aktif. Tekan Ctrl+C untuk berhenti.\n')

watch(PROJECT, { recursive: true }, (event, filename) => {
  if (filename) schedulePush(path.join(PROJECT, filename))
})

// Pastikan tidak ada perubahan yang tertinggal saat keluar
process.on('SIGINT', () => {
  console.log('\n\n🛑 Auto-push dihentikan.')
  process.exit(0)
})
