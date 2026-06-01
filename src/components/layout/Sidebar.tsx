'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  LayoutDashboard, PlusCircle, Calendar, BarChart2,
  Users, Settings, Bell, LogOut, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/dashboard',      icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/create',         icon: PlusCircle,      label: 'Buat Konten' },
  { href: '/schedule',       icon: Calendar,        label: 'Jadwal & Antrian' },
  { href: '/analytics',      icon: BarChart2,       label: 'Analitik' },
  { href: '/team',           icon: Users,           label: 'Tim' },
  { href: '/notifications',  icon: Bell,            label: 'Notifikasi' },
  { href: '/settings',       icon: Settings,        label: 'Pengaturan' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col h-screen sticky top-0 overflow-y-auto">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-pink-500 flex items-center justify-center flex-shrink-0">
            <span className="font-bold text-sm">S</span>
          </div>
          <div>
            <p className="font-bold text-sm leading-tight">Social Scheduler</p>
            <p className="text-gray-400 text-xs">Manage your content</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {nav.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                active
                  ? 'bg-brand-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              )}
            >
              <item.icon size={18} className="flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight size={14} className="opacity-50" />}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-semibold">
              {session?.user?.name?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{session?.user?.name || 'User'}</p>
            <p className="text-xs text-gray-400 truncate">{session?.user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-2 text-gray-400 hover:text-red-400 text-sm w-full px-2 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <LogOut size={15} />
          Keluar
        </button>
      </div>
    </aside>
  )
}
