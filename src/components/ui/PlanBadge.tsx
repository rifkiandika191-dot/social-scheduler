import { cn } from '@/lib/utils'
import { PLANS, type PlanName } from '@/lib/plans'
import { Crown, Zap } from 'lucide-react'

export function PlanBadge({ plan, className }: { plan: string; className?: string }) {
  const p = PLANS[plan as PlanName] || PLANS.free
  const Icon = plan === 'business' ? Crown : plan === 'pro' ? Zap : null
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold', p.badge, className)}>
      {Icon && <Icon size={12} />}
      {p.name}
    </span>
  )
}
