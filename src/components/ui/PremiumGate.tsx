'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Lock, Zap } from 'lucide-react'
import { canUseFeature, type PlanName, PLANS } from '@/lib/plans'
import { cn } from '@/lib/utils'

interface Props {
  feature:      keyof typeof PLANS.free.limits
  currentUsage: number
  requiredPlan?: PlanName
  children:     React.ReactNode
  fallback?:    React.ReactNode
}

export function PremiumGate({ feature, currentUsage, requiredPlan = 'pro', children, fallback }: Props) {
  const { data: session } = useSession()
  const plan = (session?.user?.plan || 'free') as PlanName
  const allowed = canUseFeature(plan, feature, currentUsage)

  if (allowed) return <>{children}</>

  if (fallback) return <>{fallback}</>

  const requiredPlanData = PLANS[requiredPlan]

  return (
    <div className="relative">
      <div className="pointer-events-none opacity-40 select-none">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-white border border-brand-200 rounded-2xl p-5 shadow-lg text-center max-w-xs mx-4">
          <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Lock size={18} className="text-brand-600" />
          </div>
          <p className="font-semibold text-gray-900 text-sm mb-1">Fitur {requiredPlanData.name}</p>
          <p className="text-gray-500 text-xs mb-4">
            Upgrade ke plan {requiredPlanData.name} untuk menggunakan fitur ini.
          </p>
          <Link href="/upgrade" className="btn-primary text-sm flex items-center justify-center gap-1.5">
            <Zap size={13} /> Upgrade ke {requiredPlanData.name}
          </Link>
        </div>
      </div>
    </div>
  )
}

export function PremiumBanner({ plan, className }: { plan: string; className?: string }) {
  if (plan !== 'free') return null
  return (
    <div className={cn('bg-gradient-to-r from-brand-600 to-pink-500 rounded-xl p-4 text-white flex items-center justify-between', className)}>
      <div>
        <p className="font-semibold text-sm">Upgrade ke Pro</p>
        <p className="text-xs opacity-80">Buka semua fitur — 10 akun, tim, analitik 90 hari</p>
      </div>
      <Link href="/upgrade" className="bg-white text-brand-700 font-bold text-xs px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex-shrink-0">
        Upgrade
      </Link>
    </div>
  )
}
