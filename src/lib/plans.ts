export const PLANS = {
  free: {
    name:          'Free',
    price:         0,
    color:         'gray',
    badge:         'bg-gray-100 text-gray-700',
    limits: {
      socialAccounts:   3,    // max akun sosmed terhubung
      scheduledPosts:   10,   // max post terjadwal aktif
      teamMembers:      1,    // hanya diri sendiri
      analyticsHistory: 7,    // hari history analitik
      mediaStorage:     500,  // MB
      postsPerMonth:    30,
    },
    features: [
      '3 akun sosial media',
      '10 post terjadwal aktif',
      'Analitik 7 hari',
      'Editor dasar (filter & overlay)',
      '500MB penyimpanan media',
    ],
  },
  pro: {
    name:          'Pro',
    price:         99000,    // Rp 99.000/bulan
    color:         'brand',
    badge:         'bg-brand-100 text-brand-700',
    limits: {
      socialAccounts:   10,
      scheduledPosts:   100,
      teamMembers:      5,
      analyticsHistory: 90,
      mediaStorage:     5000,
      postsPerMonth:    500,
    },
    features: [
      '10 akun sosial media',
      '100 post terjadwal aktif',
      'Tim hingga 5 anggota',
      'Analitik 90 hari',
      'Semua filter & overlay kustom',
      '5GB penyimpanan media',
      'Notifikasi email prioritas',
      'Preview Story & Feed',
    ],
  },
  business: {
    name:          'Business',
    price:         299000,   // Rp 299.000/bulan
    color:         'yellow',
    badge:         'bg-yellow-100 text-yellow-700',
    limits: {
      socialAccounts:   -1,  // unlimited
      scheduledPosts:   -1,
      teamMembers:      -1,
      analyticsHistory: 365,
      mediaStorage:     50000,
      postsPerMonth:    -1,
    },
    features: [
      'Akun sosial media tak terbatas',
      'Post terjadwal tak terbatas',
      'Tim tak terbatas',
      'Analitik 1 tahun',
      'White-label (domain sendiri)',
      '50GB penyimpanan media',
      'Priority support',
      'API access',
      'Export laporan PDF',
    ],
  },
} as const

export type PlanName = keyof typeof PLANS

export function getPlanLimit(plan: PlanName, key: keyof typeof PLANS.free.limits): number {
  return PLANS[plan]?.limits[key] ?? PLANS.free.limits[key]
}

export function canUseFeature(plan: PlanName, feature: keyof typeof PLANS.free.limits, currentUsage: number): boolean {
  const limit = getPlanLimit(plan, feature)
  if (limit === -1) return true  // unlimited
  return currentUsage < limit
}

export function isUnlimited(plan: PlanName, feature: keyof typeof PLANS.free.limits): boolean {
  return getPlanLimit(plan, feature) === -1
}
