'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, CheckCircle2, Mail } from 'lucide-react'

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-pink-50 flex items-center justify-center"><div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" /></div>}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const [form, setForm]       = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [unverifiedEmail, setUnverifiedEmail] = useState('')
  const [resendSent, setResendSent]           = useState(false)

  const verified   = searchParams.get('verified') === '1'
  const registered = searchParams.get('registered') === '1'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setUnverifiedEmail('')
    setLoading(true)

    const res = await signIn('credentials', {
      email:    form.email,
      password: form.password,
      redirect: false,
    })

    setLoading(false)

    if (res?.error === 'EMAIL_NOT_VERIFIED') {
      setUnverifiedEmail(form.email)
      return
    }
    if (res?.error) {
      setError('Email atau password salah.')
      return
    }
    router.push('/dashboard')
  }

  async function resendVerification() {
    await fetch('/api/auth/resend-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: unverifiedEmail }),
    })
    setResendSent(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-600 to-pink-500 flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Selamat datang kembali</h1>
          <p className="text-gray-500 mt-1">Masuk ke akun Social Scheduler Anda</p>
        </div>

        <div className="card p-8">
          {/* Banner sukses */}
          {verified && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 flex items-center gap-3">
              <CheckCircle2 size={20} className="text-green-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-800">Email berhasil diverifikasi!</p>
                <p className="text-xs text-green-600">Akun Anda sudah aktif. Silakan masuk.</p>
              </div>
            </div>
          )}
          {registered && !verified && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 flex items-center gap-3">
              <Mail size={20} className="text-blue-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-blue-800">Akun berhasil dibuat!</p>
                <p className="text-xs text-blue-600">Cek email Anda untuk verifikasi sebelum masuk.</p>
              </div>
            </div>
          )}

          {/* Banner email belum verifikasi */}
          {unverifiedEmail && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4">
              <p className="text-sm font-semibold text-orange-800 flex items-center gap-2">
                <Mail size={15} /> Email belum diverifikasi
              </p>
              <p className="text-xs text-orange-600 mt-1">
                Silakan cek email <strong>{unverifiedEmail}</strong> dan klik link verifikasi.
              </p>
              {resendSent ? (
                <p className="text-xs text-green-600 mt-2 font-medium">✓ Email verifikasi baru dikirim!</p>
              ) : (
                <button
                  onClick={resendVerification}
                  className="text-xs text-orange-700 underline mt-2 hover:text-orange-900"
                >
                  Kirim ulang email verifikasi
                </button>
              )}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" placeholder="nama@email.com"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                required />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} className="input pr-10"
                  placeholder="Password Anda"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  required />
                <button type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="btn-primary w-full py-2.5 flex items-center justify-center gap-2">
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Belum punya akun?{' '}
            <Link href="/register" className="text-brand-600 hover:underline font-medium">
              Daftar gratis
            </Link>
          </p>
        </div>
        <p className="text-center text-xs text-gray-400 mt-4">
          Demo: admin@demo.com / demo123
        </p>
      </div>
    </div>
  )
}

