'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { PlusCircle, Calendar, BarChart2, TrendingUp, Eye, Heart, Clock, CheckCircle2, AlertCircle, FileText } from 'lucide-react'
import { PLATFORMS, PLATFORM_ICONS, formatNumber } from '@/lib/utils'

interface Props {
  stats: {
    postsTotal: number
    postsScheduled: number
    postsPublished: number
    totalEngagement: number
    totalViews: number
  }
  socialAccounts: Array<{ id: string; platform: string; accountName: string; isActive: boolean }>
  recentPosts: any[]
  userName: string
}

const statusConfig = {
  draft:      { color: 'text-gray-500 bg-gray-50', icon: FileText,     label: 'Draft' },
  scheduled:  { color: 'text-blue-600 bg-blue-50',  icon: Clock,        label: 'Terjadwal' },
  publishing: { color: 'text-yellow-600 bg-yellow-50', icon: TrendingUp, label: 'Memproses' },
  published:  { color: 'text-green-600 bg-green-50', icon: CheckCircle2, label: 'Tayang' },
  failed:     { color: 'text-red-600 bg-red-50',    icon: AlertCircle,  label: 'Gagal' },
}

export function DashboardClient({ stats, socialAccounts, recentPosts, userName }: Props) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Selamat pagi' : hour < 17 ? 'Selamat siang' : 'Selamat malam'

  const statCards = [
    { label: 'Total Post', value: stats.postsTotal,      icon: FileText,   color: 'text-brand-600 bg-brand-50' },
    { label: 'Terjadwal',  value: stats.postsScheduled,  icon: Calendar,   color: 'text-blue-600 bg-blue-50' },
    { label: 'Tayang',     value: stats.postsPublished,  icon: CheckCircle2, color: 'text-green-600 bg-green-50' },
    { label: 'Engagement', value: formatNumber(stats.totalEngagement), icon: Heart, color: 'text-pink-600 bg-pink-50' },
    { label: 'Total Views', value: formatNumber(stats.totalViews), icon: Eye, color: 'text-purple-600 bg-purple-50' },
  ]

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{greeting}, {userName}! 👋</h1>
          <p className="text-gray-500 mt-1">Berikut ringkasan aktivitas sosial media Anda hari ini.</p>
        </div>
        <Link href="/create" className="btn-primary flex items-center gap-2">
          <PlusCircle size={18} />
          Buat Konten
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {statCards.map(s => (
          <div key={s.label} className="card p-5">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${s.color}`}>
              <s.icon size={18} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Posts */}
        <div className="lg:col-span-2 card">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Post Terbaru</h2>
            <Link href="/schedule" className="text-sm text-brand-600 hover:underline">Lihat semua</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentPosts.length === 0 ? (
              <div className="p-8 text-center">
                <FileText size={32} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Belum ada post. Mulai buat konten pertama Anda!</p>
                <Link href="/create" className="btn-primary text-sm mt-4 inline-flex items-center gap-2">
                  <PlusCircle size={15} /> Buat Post
                </Link>
              </div>
            ) : (
              recentPosts.map((post: any) => {
                const cfg = statusConfig[post.status as keyof typeof statusConfig] || statusConfig.draft
                const StatusIcon = cfg.icon
                return (
                  <div key={post.id} className="p-4 flex items-start gap-4 hover:bg-gray-50 transition-colors">
                    {post.media[0] ? (
                      <img
                        src={post.media[0].media.url}
                        alt=""
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <FileText size={18} className="text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 truncate">
                        {post.caption || '(Tanpa caption)'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`badge ${cfg.color} flex items-center gap-1`}>
                          <StatusIcon size={11} />
                          {cfg.label}
                        </span>
                        {post.platforms.map((pp: any) => (
                          <span key={pp.id} className="text-xs text-gray-400">
                            {PLATFORM_ICONS[pp.socialAccount.platform as keyof typeof PLATFORM_ICONS]} {pp.socialAccount.accountName}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 flex-shrink-0">
                      {format(new Date(post.createdAt), 'd MMM', { locale: id })}
                    </p>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Connected Accounts */}
        <div className="card">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Akun Terhubung</h2>
            <Link href="/settings" className="text-sm text-brand-600 hover:underline">Kelola</Link>
          </div>
          <div className="p-4 space-y-3">
            {socialAccounts.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-500 text-sm mb-3">Belum ada akun terhubung.</p>
                <Link href="/settings" className="btn-primary text-sm">Hubungkan Akun</Link>
              </div>
            ) : (
              socialAccounts.map(acc => {
                const plt = PLATFORMS[acc.platform as keyof typeof PLATFORMS]
                return (
                  <div key={acc.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${plt?.gradient || 'from-gray-400 to-gray-600'} flex items-center justify-center text-white text-xs`}>
                      {PLATFORM_ICONS[acc.platform as keyof typeof PLATFORM_ICONS] || '📱'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{acc.accountName}</p>
                      <p className="text-xs text-gray-400">{plt?.name || acc.platform}</p>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${acc.isActive ? 'bg-green-400' : 'bg-gray-300'}`} />
                  </div>
                )
              })
            )}
          </div>
          <div className="p-4 border-t border-gray-100">
            <Link href="/settings#social" className="btn-secondary w-full text-sm text-center block">
              + Tambah Platform
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <Link href="/create" className="card p-5 flex items-center gap-4 hover:shadow-md transition-shadow group">
          <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center group-hover:bg-brand-600 group-hover:text-white transition-colors">
            <PlusCircle size={20} />
          </div>
          <div>
            <p className="font-medium text-gray-900">Buat Post Baru</p>
            <p className="text-xs text-gray-500">Upload & jadwalkan konten</p>
          </div>
        </Link>
        <Link href="/schedule" className="card p-5 flex items-center gap-4 hover:shadow-md transition-shadow group">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <Calendar size={20} />
          </div>
          <div>
            <p className="font-medium text-gray-900">Kelola Antrian</p>
            <p className="text-xs text-gray-500">Lihat jadwal yang akan datang</p>
          </div>
        </Link>
        <Link href="/analytics" className="card p-5 flex items-center gap-4 hover:shadow-md transition-shadow group">
          <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center group-hover:bg-green-600 group-hover:text-white transition-colors">
            <BarChart2 size={20} />
          </div>
          <div>
            <p className="font-medium text-gray-900">Lihat Analitik</p>
            <p className="text-xs text-gray-500">Pantau performa konten</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
