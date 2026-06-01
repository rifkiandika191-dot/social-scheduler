import Link from 'next/link'
import {
  Calendar, BarChart2, Users, Zap, Shield, Bell,
  ArrowRight, Sparkles, Check, Star,
} from 'lucide-react'

const features = [
  {
    icon: Calendar,
    title: 'Penjadwalan Otomatis',
    desc: 'Jadwalkan konten ke semua platform sekaligus dengan antrian pintar.',
    grad: 'from-violet-500 to-purple-600',
  },
  {
    icon: BarChart2,
    title: 'Analitik Lengkap',
    desc: 'Pantau performa konten, engagement, dan jangkauan di setiap platform.',
    grad: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Users,
    title: 'Kolaborasi Tim',
    desc: 'Kelola akun bersama tim dengan peran dan izin yang terstruktur.',
    grad: 'from-emerald-500 to-green-600',
  },
  {
    icon: Zap,
    title: 'Editor Bawaan',
    desc: 'Edit foto & video langsung di platform dengan filter dan overlay story.',
    grad: 'from-amber-500 to-orange-500',
  },
  {
    icon: Shield,
    title: 'Aman & Andal',
    desc: 'Koneksi OAuth yang aman ke semua platform media sosial populer.',
    grad: 'from-rose-500 to-red-500',
  },
  {
    icon: Bell,
    title: 'Notifikasi Cerdas',
    desc: 'Dapatkan pemberitahuan otomatis jika unggahan gagal dipublikasikan.',
    grad: 'from-pink-500 to-fuchsia-600',
  },
]

const platforms = ['Instagram', 'Twitter/X', 'TikTok', 'Facebook', 'YouTube', 'LinkedIn']

const stats = [
  { value: '6+', label: 'Platform Terintegrasi' },
  { value: '∞', label: 'Penjadwalan Konten' },
  { value: '1', label: 'Dashboard Terpusat' },
  { value: '24/7', label: 'Antrian Otomatis' },
]

const steps = [
  { n: '01', title: 'Sambungkan Akun', desc: 'Hubungkan semua akun sosial media Anda lewat OAuth yang aman.' },
  { n: '02', title: 'Buat & Jadwalkan', desc: 'Upload konten, edit, lalu atur jadwal tayang ke beberapa platform sekaligus.' },
  { n: '03', title: 'Pantau Hasilnya', desc: 'Lihat analitik performa dan kelola semuanya dari satu tempat.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Nav */}
      <nav className="border-b border-gray-100 sticky top-0 bg-white/70 backdrop-blur-xl z-50">
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-pink-500 flex items-center justify-center shadow-lg shadow-brand-600/25">
              <span className="text-white font-bold">S</span>
            </div>
            <span className="font-bold text-gray-900 text-lg tracking-tight">Social Scheduler</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
              Masuk
            </Link>
            <Link href="/register" className="btn-primary text-sm shadow-lg shadow-brand-600/25 flex items-center gap-1.5">
              Mulai Gratis <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background dekoratif */}
        <div className="absolute inset-0 bg-grid mask-fade" />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-400/30 rounded-full blur-3xl animate-blob" />
        <div className="absolute top-10 -right-24 w-96 h-96 bg-pink-400/30 rounded-full blur-3xl animate-blob [animation-delay:3s]" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl animate-blob [animation-delay:6s]" />

        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 bg-white border border-brand-100 text-brand-700 rounded-full px-4 py-1.5 text-sm font-medium mb-7 shadow-sm animate-fade-up">
            <Sparkles size={14} className="text-brand-500" />
            Platform manajemen sosial media terlengkap
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-[1.05] tracking-tight animate-fade-up [animation-delay:75ms]">
            Jadwalkan Semua Konten<br />
            <span className="text-gradient">Dari Satu Tempat</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-9 animate-fade-up [animation-delay:150ms]">
            Upload foto &amp; video, sambungkan akun, jadwalkan otomatis ke semua platform,
            pantau analitik, dan kolaborasi bersama tim — semuanya dalam satu dashboard.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap animate-fade-up [animation-delay:225ms]">
            <Link href="/register" className="btn-primary px-8 py-3.5 text-base shadow-xl shadow-brand-600/30 flex items-center gap-2 hover:scale-[1.02] transition-transform">
              Coba Gratis Sekarang <ArrowRight size={18} />
            </Link>
            <Link href="/login" className="btn-secondary px-8 py-3.5 text-base">
              Sudah punya akun? Masuk
            </Link>
          </div>
          <div className="flex items-center justify-center gap-5 mt-6 text-sm text-gray-400 animate-fade-up [animation-delay:300ms]">
            <span className="flex items-center gap-1.5"><Check size={15} className="text-green-500" /> Tanpa kartu kredit</span>
            <span className="flex items-center gap-1.5"><Check size={15} className="text-green-500" /> Langsung pakai</span>
          </div>

          {/* Mockup dashboard */}
          <div className="relative mt-16 animate-fade-up [animation-delay:375ms]">
            <div className="absolute inset-x-0 -top-6 h-40 bg-gradient-to-b from-brand-100/40 to-transparent blur-2xl" />
            <div className="relative max-w-4xl mx-auto rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-gray-900/10 overflow-hidden">
              {/* Title bar */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50">
                <span className="w-3 h-3 rounded-full bg-red-400" />
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="w-3 h-3 rounded-full bg-green-400" />
                <div className="ml-3 h-5 w-64 rounded-md bg-white border border-gray-200" />
              </div>
              {/* Body */}
              <div className="flex">
                {/* Sidebar */}
                <div className="hidden sm:flex flex-col gap-2 w-44 p-4 border-r border-gray-100 bg-gray-50/50">
                  <div className="h-8 rounded-lg bg-gradient-to-r from-brand-600 to-pink-500" />
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-7 rounded-lg bg-gray-100" />
                  ))}
                </div>
                {/* Main */}
                <div className="flex-1 p-5 text-left">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-5 w-32 rounded bg-gray-200" />
                    <div className="h-7 w-24 rounded-lg bg-gradient-to-r from-brand-600 to-pink-500" />
                  </div>
                  {/* Kartu statistik */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { c: 'from-violet-50 to-purple-50 border-violet-100', b: 'bg-violet-200' },
                      { c: 'from-blue-50 to-cyan-50 border-blue-100', b: 'bg-blue-200' },
                      { c: 'from-emerald-50 to-green-50 border-emerald-100', b: 'bg-emerald-200' },
                    ].map((s, i) => (
                      <div key={i} className={`rounded-xl border bg-gradient-to-br ${s.c} p-3`}>
                        <div className={`h-2.5 w-10 rounded ${s.b} mb-2`} />
                        <div className="h-5 w-14 rounded bg-white/70" />
                      </div>
                    ))}
                  </div>
                  {/* Grafik bar */}
                  <div className="rounded-xl border border-gray-100 p-4">
                    <div className="h-3 w-24 rounded bg-gray-200 mb-4" />
                    <div className="flex items-end gap-2 h-24">
                      {[40, 65, 50, 80, 60, 95, 70].map((h, i) => (
                        <div key={i} className="flex-1 rounded-t-md bg-gradient-to-t from-brand-500 to-pink-400" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Kartu mengambang */}
            <div className="hidden md:flex absolute -left-6 top-1/3 items-center gap-2 bg-white rounded-xl border border-gray-100 shadow-xl px-3.5 py-2.5 animate-float">
              <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                <Check size={16} className="text-green-600" />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-gray-900">Terjadwal!</p>
                <p className="text-[10px] text-gray-400">6 platform</p>
              </div>
            </div>
            <div className="hidden md:flex absolute -right-4 top-2/3 items-center gap-2 bg-white rounded-xl border border-gray-100 shadow-xl px-3.5 py-2.5 animate-float [animation-delay:2s]">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <Star size={16} className="text-amber-500" />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-gray-900">+24% engagement</p>
                <p className="text-[10px] text-gray-400">minggu ini</p>
              </div>
            </div>
          </div>

          {/* Platform pills */}
          <div className="mt-16">
            <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-5">Terhubung dengan platform favorit Anda</p>
            <div className="flex items-center justify-center gap-2.5 flex-wrap">
              {platforms.map(p => (
                <span key={p} className="text-sm font-medium text-gray-600 bg-gray-50 px-4 py-1.5 rounded-full border border-gray-100">
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-gray-100 bg-gray-50/60">
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map(s => (
            <div key={s.label} className="text-center">
              <div className="text-3xl md:text-4xl font-extrabold text-gradient">{s.value}</div>
              <div className="text-sm text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-sm font-semibold text-brand-600 uppercase tracking-wider">Fitur Unggulan</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-3 tracking-tight">Semua yang Anda Butuhkan</h2>
          <p className="text-gray-500">Satu platform lengkap untuk mengelola seluruh kehadiran sosial media Anda.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(f => (
            <div
              key={f.title}
              className="group relative card p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br ${f.grad} shadow-lg`}>
                <f.icon size={22} className="text-white" />
              </div>
              <h3 className="font-semibold text-lg text-gray-900 mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Cara Kerja */}
      <section className="bg-gray-50/60 border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-sm font-semibold text-brand-600 uppercase tracking-wider">Cara Kerja</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2 tracking-tight">Mulai dalam 3 Langkah</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <div key={s.n} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-7 left-[calc(50%+2rem)] right-0 h-px bg-gradient-to-r from-brand-200 to-transparent" />
                )}
                <div className="w-14 h-14 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center text-xl font-bold text-gradient mb-5">
                  {s.n}
                </div>
                <h3 className="font-semibold text-lg text-gray-900 mb-2">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-violet-600 to-pink-500 px-8 py-16 text-center shadow-2xl shadow-brand-600/30">
          <div className="absolute -top-16 -right-10 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-16 -left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">Mulai Kelola Sosial Media Anda</h2>
            <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
              Daftar sekarang dan jadwalkan konten pertama Anda dalam hitungan menit.
            </p>
            <Link
              href="/register"
              className="bg-white text-brand-700 font-bold px-8 py-3.5 rounded-xl hover:bg-gray-50 hover:scale-[1.02] transition-all inline-flex items-center gap-2 shadow-lg"
            >
              Daftar Gratis <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600 to-pink-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="font-bold text-gray-900">Social Scheduler</span>
          </div>
          <p className="text-gray-400 text-sm">&copy; 2026 Social Scheduler. Kelola semua sosial media dari satu tempat.</p>
        </div>
      </footer>
    </div>
  )
}
