'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { Bell, CheckCheck, Loader2, AlertCircle, CheckCircle2, Info, Users } from 'lucide-react'
import { toast } from '@/components/ui/Toaster'
import { cn } from '@/lib/utils'

const notifConfig = {
  post_failed:   { icon: AlertCircle,   color: 'text-red-500',   bg: 'bg-red-50' },
  post_published:{ icon: CheckCircle2,  color: 'text-green-500', bg: 'bg-green-50' },
  team_invite:   { icon: Users,         color: 'text-blue-500',  bg: 'bg-blue-50' },
  info:          { icon: Info,          color: 'text-gray-500',  bg: 'bg-gray-50' },
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadNotifs() }, [])

  async function loadNotifs() {
    try {
      const res = await fetch('/api/notifications')
      const data = await res.json()
      setNotifications(data.notifications || [])
    } catch {
      toast.error('Gagal memuat notifikasi.')
    } finally {
      setLoading(false)
    }
  }

  async function markAllRead() {
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' })
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      toast.success('Semua notifikasi ditandai dibaca.')
    } catch {
      toast.error('Gagal memperbarui notifikasi.')
    }
  }

  async function markRead(id: string) {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'POST' })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    } catch {
      // silent
    }
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifikasi</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500 mt-1">{unreadCount} belum dibaca</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn-secondary flex items-center gap-2 text-sm">
            <CheckCheck size={15} /> Tandai semua dibaca
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={32} className="animate-spin text-brand-600" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="card p-16 text-center">
          <Bell size={40} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Tidak ada notifikasi.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(notif => {
            const cfg = notifConfig[notif.type as keyof typeof notifConfig] || notifConfig.info
            const Icon = cfg.icon
            return (
              <button
                key={notif.id}
                onClick={() => !notif.isRead && markRead(notif.id)}
                className={cn(
                  'w-full card p-4 flex items-start gap-4 text-left hover:shadow-md transition-all',
                  !notif.isRead && 'ring-1 ring-brand-200'
                )}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                  <Icon size={18} className={cfg.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn('text-sm font-medium', notif.isRead ? 'text-gray-700' : 'text-gray-900')}>
                      {notif.title}
                    </p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!notif.isRead && (
                        <div className="w-2 h-2 rounded-full bg-brand-500" />
                      )}
                      <p className="text-xs text-gray-400">
                        {format(new Date(notif.createdAt), 'd MMM HH:mm', { locale: id })}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{notif.message}</p>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
