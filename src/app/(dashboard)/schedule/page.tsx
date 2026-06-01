'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import {
  Calendar, Clock, CheckCircle2, AlertCircle, Loader2,
  RefreshCw, Trash2, Play, FileText, Filter,
} from 'lucide-react'
import { PLATFORM_ICONS, PLATFORMS, cn, formatNumber } from '@/lib/utils'
import { toast } from '@/components/ui/Toaster'

const statusConfig = {
  draft:      { label: 'Draft',      color: 'text-gray-600 bg-gray-100',    icon: FileText },
  scheduled:  { label: 'Terjadwal',  color: 'text-blue-600 bg-blue-100',    icon: Clock },
  publishing: { label: 'Memproses',  color: 'text-yellow-600 bg-yellow-100', icon: Loader2 },
  published:  { label: 'Tayang',     color: 'text-green-600 bg-green-100',   icon: CheckCircle2 },
  failed:     { label: 'Gagal',      color: 'text-red-600 bg-red-100',       icon: AlertCircle },
}

export default function SchedulePage() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [retrying, setRetrying] = useState<string | null>(null)

  async function loadPosts() {
    try {
      const res = await fetch(`/api/posts?status=${filter === 'all' ? '' : filter}`)
      const data = await res.json()
      setPosts(data.posts || [])
    } catch {
      toast.error('Gagal memuat posts.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadPosts() }, [filter])

  async function retryPost(postId: string) {
    setRetrying(postId)
    try {
      const res = await fetch(`/api/posts/${postId}/retry`, { method: 'POST' })
      if (!res.ok) throw new Error()
      toast.success('Post sedang diproses ulang.')
      loadPosts()
    } catch {
      toast.error('Gagal mencoba ulang.')
    } finally {
      setRetrying(null)
    }
  }

  async function deletePost(postId: string) {
    if (!confirm('Hapus post ini?')) return
    try {
      await fetch(`/api/posts/${postId}`, { method: 'DELETE' })
      setPosts(prev => prev.filter(p => p.id !== postId))
      toast.success('Post dihapus.')
    } catch {
      toast.error('Gagal menghapus.')
    }
  }

  const filters = [
    { value: 'all',       label: 'Semua' },
    { value: 'scheduled', label: 'Terjadwal' },
    { value: 'published', label: 'Tayang' },
    { value: 'failed',    label: 'Gagal' },
    { value: 'draft',     label: 'Draft' },
  ]

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jadwal & Antrian</h1>
          <p className="text-gray-500 mt-1">Kelola semua konten yang dijadwalkan.</p>
        </div>
        <button onClick={loadPosts} className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {filters.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
              filter === f.value
                ? 'bg-brand-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-brand-300'
            )}
          >
            {f.label}
            {f.value !== 'all' && (
              <span className="ml-1.5 text-xs opacity-70">
                ({posts.filter(p => f.value === 'all' || p.status === f.value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-brand-600" />
        </div>
      ) : posts.length === 0 ? (
        <div className="card p-16 text-center">
          <Calendar size={40} className="text-gray-300 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-700 mb-2">Tidak ada post</h3>
          <p className="text-gray-400 text-sm">
            {filter === 'all' ? 'Buat konten pertama Anda sekarang.' : `Tidak ada post dengan status "${filters.find(f => f.value === filter)?.label}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post: any) => {
            const cfg = statusConfig[post.status as keyof typeof statusConfig] || statusConfig.draft
            const StatusIcon = cfg.icon
            return (
              <div key={post.id} className="card overflow-hidden hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4 p-5">
                  {/* Media Thumbnail */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    {post.media?.[0]?.media?.url ? (
                      <img src={post.media[0].media.url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileText size={20} className="text-gray-400" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 line-clamp-2 mb-2">
                          {post.caption || '(Tanpa caption)'}
                        </p>
                        {/* Platform status */}
                        <div className="flex flex-wrap gap-2">
                          {post.platforms?.map((pp: any) => {
                            const ppCfg = statusConfig[pp.status as keyof typeof statusConfig] || statusConfig.draft
                            const PpIcon = ppCfg.icon
                            const plt = PLATFORMS[pp.socialAccount?.platform as keyof typeof PLATFORMS]
                            return (
                              <div key={pp.id} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${ppCfg.color}`}>
                                <span>{PLATFORM_ICONS[pp.socialAccount?.platform as keyof typeof PLATFORM_ICONS] || '📱'}</span>
                                <span>{pp.socialAccount?.accountName}</span>
                                <PpIcon size={11} className={pp.status === 'publishing' ? 'animate-spin' : ''} />
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`badge ${cfg.color} flex items-center gap-1`}>
                          <StatusIcon size={11} className={post.status === 'publishing' ? 'animate-spin' : ''} />
                          {cfg.label}
                        </span>
                        {post.status === 'failed' && (
                          <button
                            onClick={() => retryPost(post.id)}
                            disabled={retrying === post.id}
                            className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100"
                          >
                            {retrying === post.id ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
                            Coba Lagi
                          </button>
                        )}
                        <button
                          onClick={() => deletePost(post.id)}
                          className="text-gray-300 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {post.scheduledAt && (
                      <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                        <Clock size={11} />
                        Dijadwalkan: {format(new Date(post.scheduledAt), "d MMM yyyy 'pukul' HH:mm", { locale: id })}
                      </p>
                    )}
                    {post.publishedAt && (
                      <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                        <CheckCircle2 size={11} className="text-green-500" />
                        Tayang: {format(new Date(post.publishedAt), "d MMM yyyy 'pukul' HH:mm", { locale: id })}
                      </p>
                    )}
                    {post.platforms?.some((p: any) => p.error) && (
                      <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                        <AlertCircle size={11} />
                        {post.platforms.find((p: any) => p.error)?.error}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
