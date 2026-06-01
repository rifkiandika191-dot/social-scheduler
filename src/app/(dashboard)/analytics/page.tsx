'use client'

import { useEffect, useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { TrendingUp, Heart, MessageCircle, Share2, Eye, Loader2, BarChart2 } from 'lucide-react'
import { formatNumber, PLATFORMS, PLATFORM_ICONS, cn } from '@/lib/utils'

const COLORS = ['#7c3aed', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#6366f1']

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState('30')
  const [activePlatform, setActivePlatform] = useState('all')

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/analytics?days=${range}&platform=${activePlatform}`)
        const d = await res.json()
        setData(d)
      } catch {
        console.error('Failed to load analytics')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [range, activePlatform])

  const ranges = [
    { value: '7',  label: '7 Hari' },
    { value: '30', label: '30 Hari' },
    { value: '90', label: '3 Bulan' },
  ]

  const metrics = data ? [
    { label: 'Total Views',     value: formatNumber(data.totals?.views || 0),       icon: Eye,            color: 'text-purple-600 bg-purple-50' },
    { label: 'Likes',           value: formatNumber(data.totals?.likes || 0),       icon: Heart,          color: 'text-pink-600 bg-pink-50' },
    { label: 'Komentar',        value: formatNumber(data.totals?.comments || 0),    icon: MessageCircle,  color: 'text-blue-600 bg-blue-50' },
    { label: 'Dibagikan',       value: formatNumber(data.totals?.shares || 0),      icon: Share2,         color: 'text-green-600 bg-green-50' },
    { label: 'Jangkauan',       value: formatNumber(data.totals?.reach || 0),       icon: TrendingUp,     color: 'text-orange-600 bg-orange-50' },
    { label: 'Tayangan',        value: formatNumber(data.totals?.impressions || 0), icon: BarChart2,      color: 'text-indigo-600 bg-indigo-50' },
  ] : []

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analitik</h1>
          <p className="text-gray-500 mt-1">Pantau performa konten Anda di semua platform.</p>
        </div>
        <div className="flex gap-2">
          {ranges.map(r => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                range === r.value ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-300'
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-brand-600" />
        </div>
      ) : !data ? (
        <div className="card p-16 text-center">
          <BarChart2 size={40} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Belum ada data analitik. Hubungkan akun sosial media Anda.</p>
        </div>
      ) : (
        <>
          {/* Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
            {metrics.map(m => (
              <div key={m.label} className="card p-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${m.color}`}>
                  <m.icon size={16} />
                </div>
                <p className="text-xl font-bold text-gray-900">{m.value}</p>
                <p className="text-xs text-gray-500">{m.label}</p>
              </div>
            ))}
          </div>

          {/* Engagement Over Time */}
          <div className="card p-6 mb-6">
            <h2 className="font-semibold text-gray-900 mb-4">Engagement Harian</h2>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data.dailyData || []}>
                <defs>
                  <linearGradient id="likes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="views" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                  formatter={(val: any) => formatNumber(val)}
                />
                <Area type="monotone" dataKey="likes" stroke="#7c3aed" fill="url(#likes)" strokeWidth={2} name="Likes" />
                <Area type="monotone" dataKey="views" stroke="#ec4899" fill="url(#views)" strokeWidth={2} name="Views" />
                <Area type="monotone" dataKey="comments" stroke="#3b82f6" fill="none" strokeWidth={2} name="Komentar" strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Platform Breakdown */}
            <div className="card p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Per Platform</h2>
              {data.platformData?.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={data.platformData}
                        cx="50%" cy="50%"
                        innerRadius={50} outerRadius={80}
                        dataKey="value"
                        nameKey="name"
                      >
                        {data.platformData.map((_: any, i: number) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: any) => formatNumber(val)} />
                      <Legend formatter={(name) => name} iconType="circle" iconSize={10} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-4">
                    {data.platformData.map((p: any, i: number) => (
                      <div key={p.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                          <span className="text-gray-700">{PLATFORM_ICONS[p.platform as keyof typeof PLATFORM_ICONS] || '📱'} {p.name}</span>
                        </div>
                        <span className="font-medium text-gray-900">{formatNumber(p.value)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-gray-400 text-sm text-center py-12">Belum ada data platform.</p>
              )}
            </div>

            {/* Top Posts */}
            <div className="card p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Post Terbaik</h2>
              <div className="space-y-3">
                {(data.topPosts || []).length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-12">Belum ada data post.</p>
                ) : (
                  data.topPosts.map((post: any, i: number) => (
                    <div key={post.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50">
                      <span className="text-lg font-bold text-gray-200 w-6 text-center">{i + 1}</span>
                      {post.thumbnail ? (
                        <img src={post.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <BarChart2 size={14} className="text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-700 line-clamp-1">{post.caption || '(tanpa caption)'}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-400 flex items-center gap-0.5"><Heart size={10} /> {formatNumber(post.likes)}</span>
                          <span className="text-xs text-gray-400 flex items-center gap-0.5"><Eye size={10} /> {formatNumber(post.views)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
