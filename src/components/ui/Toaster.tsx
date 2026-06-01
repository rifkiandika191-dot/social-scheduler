'use client'

import { useEffect, useState } from 'react'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

let toastListeners: Array<(toast: Toast) => void> = []

export function toast(message: string, type: ToastType = 'info') {
  const id = Math.random().toString(36).slice(2)
  toastListeners.forEach(fn => fn({ id, message, type }))
}

toast.success = (msg: string) => toast(msg, 'success')
toast.error = (msg: string) => toast(msg, 'error')
toast.info = (msg: string) => toast(msg, 'info')

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const listener = (t: Toast) => {
      setToasts(prev => [...prev, t])
      setTimeout(() => {
        setToasts(prev => prev.filter(x => x.id !== t.id))
      }, 4000)
    }
    toastListeners.push(listener)
    return () => { toastListeners = toastListeners.filter(fn => fn !== listener) }
  }, [])

  const icons = { success: CheckCircle, error: AlertCircle, info: Info }
  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error:   'bg-red-50 border-red-200 text-red-800',
    info:    'bg-blue-50 border-blue-200 text-blue-800',
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(t => {
        const Icon = icons[t.type]
        return (
          <div
            key={t.id}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg animate-slide-up max-w-sm',
              colors[t.type]
            )}
          >
            <Icon size={16} className="flex-shrink-0" />
            <span className="text-sm font-medium">{t.message}</span>
            <button
              onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
              className="ml-auto"
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
