'use client'

import { useState } from 'react'
import { Loader2, Mail } from 'lucide-react'

export default function ResendVerifyButton({ email }: { email: string }) {
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

  if (sent) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
        ✓ Email verifikasi baru dikirim ke {email}
      </div>
    )
  }

  return (
    <button
      onClick={resend}
      disabled={loading}
      className="btn-primary flex items-center gap-2 mx-auto"
    >
      {loading ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />}
      Kirim Ulang Email Verifikasi
    </button>
  )
}
