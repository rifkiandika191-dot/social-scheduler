'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Mail, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function CheckEmailPage() {
  const params  = useSearchParams()
  const email   = params.get('email') || ''
  const [sent, setSent]       = useState(false)
  const [loading, setLoading] = useState(false)

  async function resend() {
    setLoading(true)
    await fetch('/api/auth/resend-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    setLoading(false)
    setSent(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-600 to-pink-500 flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">S</span>
          </div>
        </div>
        <div className="card p-8 text-center space-y-4">
          <div className="w-20 h-20 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto">
            <Mail size={40} className="text-brand-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Cek Email Anda</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            Kami mengirim link verifikasi ke<br />
            <strong className="text-gray-800">{email || 'email Anda'}</strong>
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-left text-sm text-gray-600 space-y-2">
            <p className="font-medium text-gray-700">Langkah selanjutnya:</p>
            <p>1. Buka inbox email Anda</p>
            <p>2. Cari email dari Social Scheduler</p>
            <p>3. Klik tombol "Verifikasi Email"</p>
            <p className="text-gray-400 text-xs">Link berlaku 24 jam. Cek folder spam jika tidak ada di inbox.</p>
          </div>

          {sent ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
              ✓ Email verifikasi baru sudah dikirim!
            </div>
          ) : (
            <button
              onClick={resend}
              disabled={loading}
              className="btn-secondary text-sm flex items-center gap-2 mx-auto"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : null}
              Kirim Ulang Email
            </button>
          )}

          <Link href="/login" className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1 justify-center">
            <ArrowLeft size={13} /> Kembali ke Login
          </Link>
        </div>
      </div>
    </div>
  )
}
