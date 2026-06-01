'use client'

import { useEffect, useState } from 'react'
import { useSession }          from 'next-auth/react'
import { useSearchParams }     from 'next/navigation'
import {
  Link2, Unlink, Loader2, CheckCircle2, Plus,
  User, Lock, Save, ExternalLink, AlertCircle, RefreshCw,
} from 'lucide-react'
import { toast }      from '@/components/ui/Toaster'
import { cn }         from '@/lib/utils'
import { PlanBadge }  from '@/components/ui/PlanBadge'

const PLATFORMS = [
  {
    id: 'instagram', name: 'Instagram',
    icon: '📸', color: 'from-purple-500 via-pink-500 to-orange-400',
    envKeys: ['INSTAGRAM_CLIENT_ID', 'INSTAGRAM_CLIENT_SECRET'],
    guide: 'https://developers.facebook.com/docs/instagram-basic-display-api',
  },
  {
    id: 'facebook', name: 'Facebook',
    icon: '👥', color: 'from-blue-600 to-blue-800',
    envKeys: ['FACEBOOK_APP_ID', 'FACEBOOK_APP_SECRET'],
    guide: 'https://developers.facebook.com',
  },
  {
    id: 'twitter', name: 'Twitter/X',
    icon: '🐦', color: 'from-sky-400 to-sky-600',
    envKeys: ['TWITTER_API_KEY', 'TWITTER_API_SECRET'],
    guide: 'https://developer.twitter.com',
  },
  {
    id: 'tiktok', name: 'TikTok',
    icon: '🎵', color: 'from-gray-800 to-gray-900',
    envKeys: ['TIKTOK_CLIENT_KEY', 'TIKTOK_CLIENT_SECRET'],
    guide: 'https://developers.tiktok.com',
  },
  {
    id: 'youtube', name: 'YouTube',
    icon: '▶️', color: 'from-red-500 to-red-700',
    envKeys: ['YOUTUBE_CLIENT_ID', 'YOUTUBE_CLIENT_SECRET'],
    guide: 'https://console.cloud.google.com',
  },
  {
    id: 'linkedin', name: 'LinkedIn',
    icon: '💼', color: 'from-blue-700 to-blue-900',
    envKeys: ['LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET'],
    guide: 'https://www.linkedin.com/developers',
  },
]

export default function SettingsPage() {
  const { data: session, update } = useSession()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState('profile')
  const [accounts, setAccounts]   = useState<any[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(true)
  const [connecting, setConnecting] = useState<string | null>(null)
  const [apiStatus, setApiStatus]   = useState<Record<string, boolean>>({})
  const [profile, setProfile]       = useState({ name: '', email: '' })
  const [password, setPassword]     = useState({ current: '', newPass: '', confirm: '' })
  const [savingProfile, setSavingProfile]   = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    if (session?.user) setProfile({ name: session.user.name || '', email: session.user.email || '' })
  }, [session])

  useEffect(() => {
    if (activeTab === 'social') { loadAccounts(); checkApiStatus() }
  }, [activeTab])

  // Handle OAuth redirect feedback
  useEffect(() => {
    const connected = searchParams.get('connected')
    const error     = searchParams.get('error')
    if (connected) { toast.success(`Akun ${connected} berhasil dihubungkan!`); loadAccounts() }
    if (error)     toast.error(`Gagal menghubungkan: ${error}`)
  }, [searchParams])

  async function loadAccounts() {
    try {
      const res  = await fetch('/api/social-accounts')
      const data = await res.json()
      setAccounts(data.accounts || [])
    } catch { toast.error('Gagal memuat akun.') }
    finally  { setLoadingAccounts(false) }
  }

  async function checkApiStatus() {
    try {
      const res  = await fetch('/api/oauth/status')
      const data = await res.json()
      setApiStatus(data.configured || {})
    } catch {}
  }

  function connectPlatform(platformId: string) {
    setConnecting(platformId)
    window.location.href = `/api/oauth/${platformId}`
  }

  async function disconnectAccount(accountId: string) {
    if (!confirm('Putuskan koneksi akun ini?')) return
    try {
      await fetch(`/api/social-accounts/${accountId}`, { method: 'DELETE' })
      setAccounts(prev => prev.filter(a => a.id !== accountId))
      toast.success('Akun diputus.')
    } catch { toast.error('Gagal memutus akun.') }
  }

  async function saveProfile() {
    setSavingProfile(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })
      if (!res.ok) throw new Error()
      await update({ name: profile.name })
      toast.success('Profil berhasil disimpan!')
    } catch { toast.error('Gagal menyimpan profil.') }
    finally   { setSavingProfile(false) }
  }

  async function savePassword() {
    if (password.newPass !== password.confirm) { toast.error('Password baru tidak cocok.'); return }
    if (password.newPass.length < 6)           { toast.error('Password minimal 6 karakter.'); return }
    setSavingPassword(true)
    try {
      const res = await fetch('/api/user/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current: password.current, newPassword: password.newPass }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      setPassword({ current: '', newPass: '', confirm: '' })
      toast.success('Password berhasil diubah!')
    } catch (err: any) { toast.error(err.message || 'Gagal mengubah password.') }
    finally             { setSavingPassword(false) }
  }

  const tabs = [
    { id: 'profile',  label: 'Profil',       icon: User },
    { id: 'social',   label: 'Sosial Media',  icon: Link2 },
    { id: 'security', label: 'Keamanan',      icon: Lock },
  ]

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pengaturan</h1>
          <p className="text-gray-500 mt-1">Kelola profil, keamanan, dan koneksi sosial media Anda.</p>
        </div>
        <PlanBadge plan={session?.user?.plan || 'free'} />
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <nav className="w-48 flex-shrink-0 space-y-1">
          {tabs.map(t => (
            <button key={t.id} id={t.id} onClick={() => setActiveTab(t.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left',
                activeTab === t.id ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              )}>
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">

          {/* ── Profile ── */}
          {activeTab === 'profile' && (
            <div className="card p-6 space-y-5">
              <h2 className="font-semibold text-gray-900">Informasi Profil</h2>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center">
                  <span className="text-brand-700 font-bold text-2xl">{profile.name[0]?.toUpperCase() || 'U'}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{profile.name}</p>
                  <p className="text-sm text-gray-400">{profile.email}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <CheckCircle2 size={12} className="text-green-500" />
                    <span className="text-xs text-green-600">Email terverifikasi</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="label">Nama Lengkap</label>
                <input type="text" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} className="input" />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} className="input" />
              </div>
              <button onClick={saveProfile} disabled={savingProfile} className="btn-primary flex items-center gap-2">
                {savingProfile ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Simpan Profil
              </button>
            </div>
          )}

          {/* ── Social Media ── */}
          {activeTab === 'social' && (
            <div className="space-y-4">
              {/* Connected accounts */}
              {accounts.length > 0 && (
                <div className="card p-5">
                  <h3 className="font-semibold text-gray-900 mb-4">Akun Terhubung ({accounts.length})</h3>
                  <div className="space-y-2">
                    {accounts.map(acc => {
                      const plt = PLATFORMS.find(p => p.id === acc.platform)
                      return (
                        <div key={acc.id} className="flex items-center gap-3 p-3 rounded-xl bg-green-50 border border-green-100">
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${plt?.color || 'from-gray-400 to-gray-600'} flex items-center justify-center text-white text-lg flex-shrink-0`}>
                            {plt?.icon || '📱'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-gray-900">{acc.accountName}</p>
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                              <CheckCircle2 size={10} className="text-green-500" /> {plt?.name} — Terhubung
                            </p>
                          </div>
                          <button onClick={() => disconnectAccount(acc.id)}
                            className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                            title="Putuskan koneksi">
                            <Unlink size={15} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Platform list */}
              <div className="card p-5">
                <h3 className="font-semibold text-gray-900 mb-1">Tambah Platform</h3>
                <p className="text-xs text-gray-400 mb-4">
                  Klik "Hubungkan" untuk login OAuth ke platform. Pastikan API keys sudah diisi di file .env.
                </p>
                <div className="space-y-3">
                  {PLATFORMS.map(plt => {
                    const connectedAccts = accounts.filter(a => a.platform === plt.id)
                    const isConfigured   = apiStatus[plt.id]
                    const isConnecting   = connecting === plt.id

                    return (
                      <div key={plt.id} className="border border-gray-200 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${plt.color} flex items-center justify-center text-white text-lg flex-shrink-0`}>
                            {plt.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900 text-sm">{plt.name}</p>
                              {connectedAccts.length > 0 && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                                  {connectedAccts.length} terhubung
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400">
                              {plt.envKeys.join(' · ')}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            {!isConfigured && (
                              <a href={plt.guide} target="_blank" rel="noreferrer"
                                className="text-xs text-brand-600 hover:underline flex items-center gap-1">
                                <ExternalLink size={11} /> Cara dapat key
                              </a>
                            )}
                            <button
                              onClick={() => connectPlatform(plt.id)}
                              disabled={isConnecting || !isConfigured}
                              title={!isConfigured ? `Isi ${plt.envKeys[0]} di .env terlebih dahulu` : ''}
                              className={cn(
                                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                                isConfigured
                                  ? 'bg-brand-600 hover:bg-brand-700 text-white'
                                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              )}>
                              {isConnecting
                                ? <Loader2 size={12} className="animate-spin" />
                                : isConfigured ? <Link2 size={12} /> : <AlertCircle size={12} />}
                              {isConfigured ? 'Hubungkan' : 'Belum dikonfigurasi'}
                            </button>
                          </div>
                        </div>

                        {/* Connected accounts per platform */}
                        {connectedAccts.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
                            {connectedAccts.map(acc => (
                              <div key={acc.id} className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-1.5">
                                <span className="flex items-center gap-1.5">
                                  <CheckCircle2 size={10} className="text-green-500" />
                                  {acc.accountName}
                                </span>
                                <button onClick={() => disconnectAccount(acc.id)}
                                  className="text-gray-400 hover:text-red-500 transition-colors">
                                  <Unlink size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Setup guide */}
                <div className="mt-5 bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-amber-800 mb-2">⚙️ Cara mengaktifkan koneksi platform:</p>
                  <ol className="text-xs text-amber-700 space-y-1 list-decimal list-inside">
                    <li>Buka file <code className="bg-amber-100 px-1 rounded">.env</code> di folder project</li>
                    <li>Isi API key sesuai platform yang ingin dihubungkan</li>
                    <li>Restart server dengan <code className="bg-amber-100 px-1 rounded">npm run dev</code></li>
                    <li>Klik tombol "Hubungkan" untuk login OAuth</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* ── Security ── */}
          {activeTab === 'security' && (
            <div className="card p-6 space-y-5">
              <h2 className="font-semibold text-gray-900">Ubah Password</h2>
              <div>
                <label className="label">Password Saat Ini</label>
                <input type="password" value={password.current} onChange={e => setPassword(p => ({ ...p, current: e.target.value }))} className="input" placeholder="Password saat ini" />
              </div>
              <div>
                <label className="label">Password Baru</label>
                <input type="password" value={password.newPass} onChange={e => setPassword(p => ({ ...p, newPass: e.target.value }))} className="input" placeholder="Min. 6 karakter" />
              </div>
              <div>
                <label className="label">Konfirmasi Password Baru</label>
                <input type="password" value={password.confirm} onChange={e => setPassword(p => ({ ...p, confirm: e.target.value }))} className="input" placeholder="Ulangi password baru" />
              </div>
              <button onClick={savePassword} disabled={savingPassword} className="btn-primary flex items-center gap-2">
                {savingPassword ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
                Ubah Password
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
