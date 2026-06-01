import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PLANS } from '@/lib/plans'
import { Check, Zap, Crown } from 'lucide-react'

export default async function UpgradePage() {
  const session = await getServerSession(authOptions)
  const currentPlan = (session?.user as any)?.plan || 'free'

  const plans = [
    { id: 'free',     ...PLANS.free,     icon: null,  popular: false },
    { id: 'pro',      ...PLANS.pro,      icon: Zap,   popular: true },
    { id: 'business', ...PLANS.business, icon: Crown, popular: false },
  ]

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Pilih Plan yang Tepat</h1>
        <p className="text-gray-500 text-lg">Mulai gratis, upgrade kapan saja sesuai kebutuhan.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map(plan => {
          const Icon = plan.icon
          const isCurrent = currentPlan === plan.id
          const isPro = plan.id === 'pro'

          return (
            <div key={plan.id} className={`card p-6 flex flex-col relative ${isPro ? 'ring-2 ring-brand-500 shadow-lg' : ''}`}>
              {isPro && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-brand-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                    ⭐ Paling Populer
                  </span>
                </div>
              )}

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  {Icon && <Icon size={20} className={isPro ? 'text-brand-600' : 'text-yellow-500'} />}
                  <h2 className="text-xl font-bold text-gray-900">{plan.name}</h2>
                </div>
                {plan.price === 0 ? (
                  <p className="text-3xl font-bold text-gray-900">Gratis</p>
                ) : (
                  <div>
                    <span className="text-3xl font-bold text-gray-900">
                      Rp {plan.price.toLocaleString('id-ID')}
                    </span>
                    <span className="text-gray-400 text-sm">/bulan</span>
                  </div>
                )}
              </div>

              <ul className="space-y-2.5 flex-1 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600">
                    <Check size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div className="w-full py-2.5 rounded-lg bg-gray-100 text-gray-500 font-semibold text-sm text-center">
                  Plan Anda Saat Ini
                </div>
              ) : (
                <button
                  disabled={plan.id === 'free'}
                  className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-colors ${
                    isPro
                      ? 'bg-brand-600 hover:bg-brand-700 text-white'
                      : plan.id === 'business'
                      ? 'bg-gray-900 hover:bg-gray-800 text-white'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {plan.price === 0 ? 'Plan Gratis' : `Pilih ${plan.name}`}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Stripe integration note */}
      <div className="mt-10 bg-amber-50 border border-amber-200 rounded-2xl p-6">
        <h3 className="font-bold text-amber-900 mb-2">🔧 Cara Mengaktifkan Pembayaran</h3>
        <p className="text-amber-800 text-sm mb-3">
          Untuk mengaktifkan sistem pembayaran premium, integrasikan Stripe:
        </p>
        <ol className="text-amber-700 text-sm space-y-1.5 list-decimal list-inside">
          <li>Buat akun di <strong>stripe.com</strong> dan buat produk/harga</li>
          <li>Tambahkan <code className="bg-amber-100 px-1 rounded">STRIPE_SECRET_KEY</code> dan <code className="bg-amber-100 px-1 rounded">STRIPE_WEBHOOK_SECRET</code> ke .env</li>
          <li>Pasang Stripe Checkout di endpoint <code className="bg-amber-100 px-1 rounded">/api/stripe/checkout</code></li>
          <li>Buat webhook handler di <code className="bg-amber-100 px-1 rounded">/api/stripe/webhook</code> untuk update plan user</li>
        </ol>
      </div>
    </div>
  )
}
