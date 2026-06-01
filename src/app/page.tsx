import Link from 'next/link'
import { Calendar, BarChart2, Users, Zap, Shield, Bell } from 'lucide-react'

const features = [
  {
    icon: Calendar,
    title: 'Penjadwalan Otomatis',
    desc: 'Jadwalkan konten ke semua platform sekaligus dengan antrian pintar.',
    color: 'text-purple-600 bg-purple-50',
  },
  {
    icon: BarChart2,
    title: 'Analitik Lengkap',
    desc: 'Pantau performa konten, engagement, dan jangkauan di setiap platform.',
    color: 'text-blue-600 bg-blue-50',
  },
  {
    icon: Users,
    title: 'Kolaborasi Tim',
    desc: 'Kelola akun bersama tim dengan peran dan izin yang terstruktur.',
    color: 'text-green-600 bg-green-50',
  },
  {
    icon: Zap,
    title: 'Editor Bawaan',
    desc: 'Edit foto & video langsung di platform dengan filter dan overlay story.',
    color: 'text-yellow-600 bg-yellow-50',
  },
  {
    icon: Shield,
    title: 'Aman & Andal',
    desc: 'Koneksi OAuth yang aman ke semua platform media sosial populer.',
    color: 'text-red-600 bg-red-50',
  },
  {
    icon: Bell,
    title: 'Notifikasi Email',
    desc: 'Dapatkan pemberitahuan otomatis jika unggahan gagal.',
    color: 'text-pink-600 bg-pink-50',
  },
]

const platforms = ['Instagram', 'Twitter/X', 'TikTok', 'Facebook', 'YouTube', 'LinkedIn']

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600 to-pink-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="font-bold text-gray-900 text-lg">Social Scheduler</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
              Masuk
            </Link>
            <Link href="/register" className="btn-primary text-sm">
              Mulai Gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
          <Zap size={14} />
          Platform manajemen sosial media terlengkap
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
          Jadwalkan Semua Konten<br />
          <span className="bg-gradient-to-r from-brand-600 to-pink-500 bg-clip-text text-transparent">
            Dari Satu Tempat
          </span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
          Upload foto & video, sambungkan akun media sosial, jadwalkan otomatis ke semua platform,
          pantau analitik, dan kolaborasi bersama tim — semuanya dalam satu dashboard.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/register" className="btn-primary px-8 py-3 text-base">
            Coba Gratis Sekarang
          </Link>
          <Link href="/login" className="btn-secondary px-8 py-3 text-base">
            Sudah punya akun? Masuk
          </Link>
        </div>
        <div className="flex items-center justify-center gap-3 mt-8 flex-wrap">
          {platforms.map(p => (
            <span key={p} className="text-sm text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
              {p}
            </span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Semua yang Anda Butuhkan</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(f => (
            <div key={f.title} className="card p-6 hover:shadow-md transition-shadow">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${f.color}`}>
                <f.icon size={20} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-brand-600 to-pink-500 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Mulai Kelola Sosial Media Anda</h2>
          <p className="text-white/80 text-lg mb-8">Daftar sekarang dan mulai jadwalkan konten pertama Anda dalam menit.</p>
          <Link href="/register" className="bg-white text-brand-700 font-bold px-8 py-3 rounded-lg hover:bg-gray-50 transition-colors inline-block">
            Daftar Gratis
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-gray-400 text-sm">
          <p>&copy; 2024 Social Scheduler. Dibuat dengan penuh semangat.</p>
        </div>
      </footer>
    </div>
  )
}
