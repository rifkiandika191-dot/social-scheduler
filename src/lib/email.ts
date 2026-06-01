import { Resend } from 'resend'

let resendClient: Resend | null = null

function getResend() {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY)
  }
  return resendClient
}

const APP_NAME = 'Social Scheduler'
const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'
const FROM_EMAIL = process.env.RESEND_FROM || 'Social Scheduler <onboarding@resend.dev>'

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!process.env.RESEND_API_KEY) {
    console.log('[Email Mock - set RESEND_API_KEY to send real emails]', { to, subject })
    return { success: true, mock: true }
  }

  try {
    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    })
    if (error) {
      console.error('Resend error:', error)
      return { success: false, error }
    }
    return { success: true, data }
  } catch (error) {
    console.error('Email error:', error)
    return { success: false, error }
  }
}

function baseTemplate(content: string) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f5;margin:0;padding:20px}
  .wrap{max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)}
  .hdr{background:linear-gradient(135deg,#7c3aed,#ec4899);padding:40px;text-align:center;color:#fff}
  .hdr h1{margin:0;font-size:24px;font-weight:700}
  .hdr p{margin:8px 0 0;opacity:.85;font-size:15px}
  .body{padding:36px}
  .body p{color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px}
  .btn{display:inline-block;background:#7c3aed;color:#fff !important;padding:14px 36px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;margin:8px 0 20px}
  .info{background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:16px;font-size:13px;color:#6b7280;margin:16px 0}
  .info a{color:#7c3aed;word-break:break-all}
  .foot{padding:24px;text-align:center;color:#9ca3af;font-size:13px;background:#f9fafb;border-top:1px solid #f3f4f6}
</style></head><body>
<div class="wrap">${content}
<div class="foot"><p>${APP_NAME} &mdash; Kelola semua sosial media dari satu tempat</p></div>
</div></body></html>`
}

export function welcomeEmail(params: { name: string }) {
  return baseTemplate(`
    <div class="hdr">
      <h1>Selamat Datang! 🎉</h1>
      <p>Akun Anda sudah aktif</p>
    </div>
    <div class="body">
      <p>Halo <strong>${params.name}</strong>,</p>
      <p>Email Anda berhasil diverifikasi. Akun sudah aktif dan siap digunakan!</p>
      <div style="text-align:center;margin:28px 0">
        <a href="${BASE_URL}/dashboard" class="btn">🚀 Mulai Sekarang</a>
      </div>
      <p>Yang bisa Anda lakukan di ${APP_NAME}:</p>
      <ul style="color:#374151;font-size:14px;line-height:2.2;padding-left:20px">
        <li>📸 Upload foto &amp; video konten</li>
        <li>📅 Jadwalkan ke semua platform sekaligus</li>
        <li>📊 Pantau analitik performa konten</li>
        <li>👥 Kolaborasi bersama tim</li>
      </ul>
    </div>`)
}

export function postFailedEmail(params: {
  userName: string; postCaption: string
  platform: string; errorMessage: string; retryUrl: string
}) {
  return baseTemplate(`
    <div class="hdr"><h1>Unggahan Gagal ⚠️</h1><p>Ada masalah dengan postingan Anda</p></div>
    <div class="body">
      <p>Halo <strong>${params.userName}</strong>,</p>
      <p>Postingan ke <strong>${params.platform}</strong> gagal dipublikasikan.</p>
      <div class="info"><p style="margin:0"><strong>Error:</strong> ${params.errorMessage}</p></div>
      <p><strong>Konten:</strong> "${params.postCaption}"</p>
      <div style="text-align:center;margin:24px 0">
        <a href="${params.retryUrl}" class="btn">🔄 Coba Lagi</a>
      </div>
    </div>`)
}

export function teamInviteEmail(params: { inviterName: string; teamName: string; inviteUrl: string }) {
  return baseTemplate(`
    <div class="hdr"><h1>Undangan Tim 👋</h1></div>
    <div class="body">
      <p><strong>${params.inviterName}</strong> mengundang Anda bergabung ke tim <strong>${params.teamName}</strong> di ${APP_NAME}.</p>
      <div style="text-align:center;margin:28px 0">
        <a href="${params.inviteUrl}" class="btn">✅ Terima Undangan</a>
      </div>
      <p style="color:#9ca3af;font-size:13px">Undangan berlaku 7 hari. Abaikan jika tidak mengenal pengirim.</p>
    </div>`)
}

export function passwordResetEmail(params: { name: string; token: string }) {
  const url = `${BASE_URL}/reset-password/${params.token}`
  return baseTemplate(`
    <div class="hdr"><h1>Reset Password 🔒</h1></div>
    <div class="body">
      <p>Halo <strong>${params.name}</strong>,</p>
      <p>Anda meminta reset password. Klik tombol di bawah:</p>
      <div style="text-align:center;margin:28px 0">
        <a href="${url}" class="btn">🔑 Reset Password</a>
      </div>
      <div class="info"><p style="margin:0">Link berlaku <strong>1 jam</strong>. Abaikan jika tidak meminta reset.</p></div>
    </div>`)
}
