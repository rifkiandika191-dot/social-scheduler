import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { sendEmail, welcomeEmail } from '@/lib/email'
import Link from 'next/link'
import { CheckCircle2, XCircle, Clock } from 'lucide-react'

export default async function VerifyPage({ params }: { params: { token: string } }) {
  const user = await prisma.user.findUnique({ where: { verificationToken: params.token } })

  if (!user) {
    return <VerifyResult status="invalid" />
  }

  if (user.emailVerified) {
    return <VerifyResult status="already" />
  }

  if (user.verificationExpiry && user.verificationExpiry < new Date()) {
    return <VerifyResult status="expired" email={user.email} />
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, verificationToken: null, verificationExpiry: null },
  })

  await sendEmail({
    to: user.email,
    subject: 'Selamat datang di Social Scheduler!',
    html: welcomeEmail({ name: user.name }),
  })

  return <VerifyResult status="success" name={user.name} />
}

function VerifyResult({ status, name, email }: { status: string; name?: string; email?: string }) {
  const configs = {
    success: {
      icon: <CheckCircle2 size={48} className="text-green-500" />,
      bg: 'bg-green-50',
      title: `Email Terverifikasi! 🎉`,
      desc: `Selamat ${name}, akun Anda sudah aktif. Silakan masuk untuk mulai menggunakan Social Scheduler.`,
      btn: { href: '/login?verified=1', label: 'Masuk Sekarang', cls: 'btn-primary' },
    },
    invalid: {
      icon: <XCircle size={48} className="text-red-500" />,
      bg: 'bg-red-50',
      title: 'Link Tidak Valid',
      desc: 'Link verifikasi tidak ditemukan atau sudah digunakan.',
      btn: { href: '/register', label: 'Daftar Ulang', cls: 'btn-secondary' },
    },
    expired: {
      icon: <Clock size={48} className="text-orange-500" />,
      bg: 'bg-orange-50',
      title: 'Link Kadaluarsa',
      desc: 'Link verifikasi sudah kadaluarsa (berlaku 24 jam). Minta link baru.',
      btn: null,
    },
    already: {
      icon: <CheckCircle2 size={48} className="text-blue-500" />,
      bg: 'bg-blue-50',
      title: 'Sudah Terverifikasi',
      desc: 'Email Anda sudah terverifikasi sebelumnya.',
      btn: { href: '/login', label: 'Masuk', cls: 'btn-primary' },
    },
  }

  const c = configs[status as keyof typeof configs] || configs.invalid

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-600 to-pink-500 flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">S</span>
          </div>
        </div>
        <div className="card p-8 text-center space-y-4">
          <div className={`w-20 h-20 ${c.bg} rounded-2xl flex items-center justify-center mx-auto`}>
            {c.icon}
          </div>
          <h1 className="text-xl font-bold text-gray-900">{c.title}</h1>
          <p className="text-gray-500 text-sm leading-relaxed">{c.desc}</p>

          {status === 'expired' && email && <ResendButton email={email} />}
          {c.btn && (
            <Link href={c.btn.href} className={`${c.btn.cls} inline-block mt-2 px-8`}>
              {c.btn.label}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

// Client component untuk resend
import ResendVerifyButton from './ResendVerifyButton'
function ResendButton({ email }: { email: string }) {
  return <ResendVerifyButton email={email} />
}
