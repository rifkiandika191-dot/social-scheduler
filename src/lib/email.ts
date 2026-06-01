import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!process.env.SMTP_USER) {
    console.log('[Email Mock]', { to, subject })
    return { success: true, mock: true }
  }
  try {
    await transporter.sendMail({ from: process.env.SMTP_FROM, to, subject, html })
    return { success: true }
  } catch (error) {
    console.error('Email error:', error)
    return { success: false, error }
  }
}

const APP_NAME = 'Social Scheduler'
const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'

function baseTemplate(content: string) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  body{font-family:-apple-system,sans-serif;background:#f5f5f5;margin:0;padding:20px}
  .wrap{max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden}
  .hdr{background:linear-gradient(135deg,#7c3aed,#ec4899);padding:36px;text-align:center;color:#fff}
  .hdr h1{margin:0;font-size:22px;font-weight:700}
  .hdr p{margin:8px 0 0;opacity:.85;font-size:14px}
  .body{padding:32px}
  .body p{color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px}
  .btn{display:inline-block;background:#7c3aed;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;margin:8px 0 16px}
  .info{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px;font-size:13px;color:#6b7280;margin:16px 0}
  .foot{padding:24px;text-align:center;color:#9ca3af;font-size:13px;background:#f9fafb}
</style></head><body>
<div class="wrap">${content}
<div class="foot"><p>${APP_NAME} &mdash; Kelola semua sosial media Anda dari satu tempat</p></div>
</div></body></html>`
}

export function verificationEmail(params: { name: string; token: string }) {
  const url = `${BASE_URL}/verify/${params.token}`
  return baseTemplate(`
    <div class="hdr"><h1>Verifikasi Email Anda</h1><p>Satu langkah lagi untuk mulai!</p></div>
    <div class="body">
      <p>Halo <strong>${params.name}</strong>,</p>
      <p>Terima kasih sudah mendaftar di ${APP_NAME}. Klik tombol di bawah untuk memverifikasi email Anda:</p>
      <a href="${url}" class="btn">Verifikasi Email Sekarang</a>
      <div class="info">
        <p style="margin:0">Link ini berlaku selama <strong>24 jam</strong>.</p>
        <p style="margin:8px 0 0">Jika tidak bisa klik tombol, copy link ini:<br/>
        <a href="${url}" style="color:#7c3aed;word-break:break-all">${url}</a></p>
      </div>
      <p style="color:#9ca3af;font-size:13px">Jika Anda tidak membuat akun, abaikan email ini.</p>
    </div>`)
}

export function welcomeEmail(params: { name: string }) {
  return baseTemplate(`
    <div class="hdr"><h1>Selamat Datang di ${APP_NAME}! 🎉</h1></div>
    <div class="body">
      <p>Halo <strong>${params.name}</strong>,</p>
      <p>Email Anda berhasil diverifikasi. Akun Anda sudah aktif dan siap digunakan!</p>
      <a href="${BASE_URL}/dashboard" class="btn">Mulai Sekarang</a>
      <p>Berikut yang bisa Anda lakukan:</p>
      <ul style="color:#374151;font-size:14px;line-height:2">
        <li>📸 Upload foto & video konten Anda</li>
        <li>📅 Jadwalkan posting ke semua platform sekaligus</li>
        <li>📊 Pantau analitik performa konten</li>
        <li>👥 Undang tim untuk kolaborasi</li>
      </ul>
    </div>`)
}

export function postFailedEmail(params: { userName: string; postCaption: string; platform: string; errorMessage: string; retryUrl: string }) {
  return baseTemplate(`
    <div class="hdr"><h1>Unggahan Gagal ⚠️</h1><p>Ada masalah dengan postingan Anda</p></div>
    <div class="body">
      <p>Halo <strong>${params.userName}</strong>,</p>
      <p>Postingan ke <strong>${params.platform}</strong> gagal dipublikasikan.</p>
      <div class="info"><p style="margin:0"><strong>Error:</strong> ${params.errorMessage}</p></div>
      <p><strong>Konten:</strong> "${params.postCaption}"</p>
      <a href="${params.retryUrl}" class="btn">Coba Lagi</a>
    </div>`)
}

export function teamInviteEmail(params: { inviterName: string; teamName: string; inviteUrl: string }) {
  return baseTemplate(`
    <div class="hdr"><h1>Undangan Tim</h1></div>
    <div class="body">
      <p><strong>${params.inviterName}</strong> mengundang Anda bergabung ke tim <strong>${params.teamName}</strong>.</p>
      <a href="${params.inviteUrl}" class="btn">Terima Undangan</a>
      <p style="color:#9ca3af;font-size:13px">Undangan berlaku 7 hari. Jika tidak mengenal pengirim, abaikan email ini.</p>
    </div>`)
}

export function passwordResetEmail(params: { name: string; token: string }) {
  const url = `${BASE_URL}/reset-password/${params.token}`
  return baseTemplate(`
    <div class="hdr"><h1>Reset Password</h1></div>
    <div class="body">
      <p>Halo <strong>${params.name}</strong>,</p>
      <p>Anda meminta reset password. Klik tombol di bawah:</p>
      <a href="${url}" class="btn">Reset Password</a>
      <div class="info"><p style="margin:0">Link berlaku <strong>1 jam</strong>. Jika tidak meminta, abaikan email ini.</p></div>
    </div>`)
}
