'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Upload, X, ChevronRight, ChevronLeft, Image, Video,
  Calendar, Clock, Globe, Loader2, Plus, Trash2, Eye,
} from 'lucide-react'
import { format } from 'date-fns'
import { MediaEditor, FilterSettings, OverlaySettings } from '@/components/editor/MediaEditor'
import { PreviewModal } from '@/components/editor/PreviewModal'
import { toast } from '@/components/ui/Toaster'
import { PLATFORMS, PLATFORM_ICONS, cn } from '@/lib/utils'

type Step = 'upload' | 'edit' | 'compose' | 'schedule'

const VIDEO_EXTS = new Set([
  'mp4','mov','avi','mkv','webm','flv','wmv','m4v','3gp','3g2',
  'ts','mts','m2ts','mxf','vob','ogv','f4v','divx','xvid','rmvb','rm',
])

function detectMediaType(file: File): 'image' | 'video' {
  if (file.type.startsWith('video')) return 'video'
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  return VIDEO_EXTS.has(ext) ? 'video' : 'image'
}

interface MediaFile {
  id: string
  file: File
  preview: string
  type: 'image' | 'video'
  filters?: FilterSettings
  overlays?: OverlaySettings
  uploadedUrl?: string
}

export default function CreatePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [step, setStep] = useState<Step>('upload')
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [editingIndex, setEditingIndex] = useState(0)
  const [caption, setCaption] = useState('')
  const [hashtags, setHashtags] = useState('')
  const [isStory, setIsStory] = useState(false)
  const [scheduledAt, setScheduledAt] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [socialAccounts, setSocialAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [accountsLoaded, setAccountsLoaded] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const onDrop = useCallback((accepted: File[]) => {
    const newFiles: MediaFile[] = accepted.map(file => ({
      id: Math.random().toString(36).slice(2),
      file,
      preview: URL.createObjectURL(file),
      type: detectMediaType(file),
    }))
    setMediaFiles(prev => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected: (rejected) => {
      rejected.forEach(r => {
        if (r.errors[0]?.code === 'file-too-large') {
          toast.error(`${r.file.name}: File terlalu besar (maks 200MB)`)
        } else {
          toast.error(`${r.file.name}: Tidak bisa diupload.`)
        }
      })
    },
    maxSize: 200 * 1024 * 1024,
    multiple: true,
  })

  async function loadAccounts() {
    if (accountsLoaded) return
    try {
      const res = await fetch('/api/social-accounts')
      const data = await res.json()
      setSocialAccounts(data.accounts || [])
      setAccountsLoaded(true)
    } catch {
      toast.error('Gagal memuat akun sosial media.')
    }
  }

  function handleEditorSave(idx: number, filters: FilterSettings, overlays: OverlaySettings) {
    setMediaFiles(prev => prev.map((f, i) => i === idx ? { ...f, filters, overlays } : f))
    if (idx < mediaFiles.length - 1) {
      setEditingIndex(idx + 1)
    } else {
      setStep('compose')
    }
  }

  async function uploadMedia(mf: MediaFile): Promise<string> {
    const formData = new FormData()
    formData.append('file', mf.file)
    if (mf.filters) formData.append('filters', JSON.stringify(mf.filters))
    if (mf.overlays) formData.append('overlays', JSON.stringify(mf.overlays))
    const res = await fetch('/api/media/upload', { method: 'POST', body: formData })
    if (!res.ok) throw new Error('Upload gagal')
    const data = await res.json()
    return data.url
  }

  async function handlePublish() {
    if (selectedPlatforms.length === 0) {
      toast.error('Pilih minimal satu platform.')
      return
    }
    if (mediaFiles.length === 0) {
      toast.error('Upload minimal satu media.')
      return
    }
    setLoading(true)
    try {
      const uploadedUrls = await Promise.all(mediaFiles.map(uploadMedia))

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caption,
          hashtags,
          isStory,
          scheduledAt: scheduledAt || null,
          platformAccountIds: selectedPlatforms,
          mediaUrls: uploadedUrls,
          mediaFilters: mediaFiles.map((f, i) => ({ url: uploadedUrls[i], filters: f.filters, overlays: f.overlays })),
        }),
      })

      if (!res.ok) throw new Error('Gagal membuat post')
      toast.success(scheduledAt ? 'Post berhasil dijadwalkan!' : 'Post berhasil dipublikasikan!')
      router.push('/schedule')
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan.')
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    { id: 'upload',   label: '1. Upload' },
    { id: 'edit',     label: '2. Edit' },
    { id: 'compose',  label: '3. Tulis' },
    { id: 'schedule', label: '4. Jadwalkan' },
  ]

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Preview Modal */}
      {showPreview && mediaFiles.length > 0 && (
        <PreviewModal
          mediaFiles={mediaFiles.map(mf => ({
            id:      mf.id,
            preview: mf.preview,
            type:    mf.type,
            filters: mf.filters,
            overlays: mf.overlays,
          }))}
          caption={caption}
          hashtags={hashtags}
          userName="username"
          onClose={() => setShowPreview(false)}
        />
      )}

      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Buat Konten Baru</h1>
          <p className="text-gray-500 mt-1">Upload media, edit, tulis caption, dan jadwalkan ke berbagai platform.</p>
        </div>
        {mediaFiles.length > 0 && (
          <button
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-brand-200 text-brand-700 hover:bg-brand-50 font-semibold text-sm transition-all"
          >
            <Eye size={16} />
            Preview
          </button>
        )}
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <button
              onClick={() => {
                if (s.id === 'upload') setStep('upload')
                if (s.id === 'edit' && mediaFiles.length > 0) setStep('edit')
                if (s.id === 'compose' && mediaFiles.length > 0) setStep('compose')
                if (s.id === 'schedule' && mediaFiles.length > 0) { setStep('schedule'); loadAccounts() }
              }}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                step === s.id
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-gray-500 border border-gray-200 hover:border-brand-300'
              )}
            >
              {s.label}
            </button>
            {i < steps.length - 1 && <ChevronRight size={16} className="text-gray-300" />}
          </div>
        ))}
      </div>

      {/* Step: Upload */}
      {step === 'upload' && (
        <div className="space-y-6">
          {/* Drop Zone */}
          <div
            {...getRootProps()}
            className={cn(
              'relative border-2 border-dashed rounded-2xl transition-all cursor-pointer select-none',
              'min-h-[320px] flex flex-col items-center justify-center',
              isDragActive  && 'border-brand-500 bg-brand-50 scale-[1.01]',
              !isDragActive && 'border-gray-200 bg-white hover:border-brand-400 hover:bg-brand-50/40'
            )}
          >
            <input {...getInputProps()} />

            {/* Animasi saat drag aktif */}
            {isDragActive && (
              <div className="absolute inset-0 rounded-2xl bg-brand-500/5 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-20 h-20 rounded-2xl bg-brand-100 border-2 border-brand-400 border-dashed flex items-center justify-center animate-bounce">
                    <Upload size={32} className="text-brand-600" />
                  </div>
                  <p className="text-brand-700 font-bold text-xl">Lepaskan file di sini!</p>
                </div>
              </div>
            )}

            {!isDragActive && (
              <div className="flex flex-col items-center gap-5 px-8 py-4 text-center">
                {/* Ikon upload animasi */}
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-50 to-pink-50 border-2 border-brand-200 flex items-center justify-center">
                    <Upload size={32} className="text-brand-600" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-brand-600 rounded-full flex items-center justify-center">
                    <Plus size={14} className="text-white" />
                  </div>
                </div>

                <div>
                  <p className="text-xl font-bold text-gray-800">Drag & Drop Foto atau Video</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Seret file langsung ke area ini, atau klik untuk browse
                  </p>
                </div>

                {/* Format yang didukung */}
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {[
                    { label: 'JPG',  color: 'bg-orange-50 text-orange-600 border-orange-200' },
                    { label: 'PNG',  color: 'bg-blue-50 text-blue-600 border-blue-200' },
                    { label: 'WebP', color: 'bg-green-50 text-green-600 border-green-200' },
                    { label: 'GIF',  color: 'bg-purple-50 text-purple-600 border-purple-200' },
                    { label: 'HEIC', color: 'bg-yellow-50 text-yellow-600 border-yellow-200' },
                    { label: 'TIFF', color: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
                    { label: 'MP4',  color: 'bg-red-50 text-red-600 border-red-200' },
                    { label: 'MOV',  color: 'bg-pink-50 text-pink-600 border-pink-200' },
                    { label: 'AVI',  color: 'bg-gray-50 text-gray-600 border-gray-200' },
                    { label: 'MKV',  color: 'bg-teal-50 text-teal-600 border-teal-200' },
                    { label: 'WebM', color: 'bg-cyan-50 text-cyan-600 border-cyan-200' },
                    { label: '+ lainnya', color: 'bg-gray-50 text-gray-500 border-gray-200' },
                  ].map(f => (
                    <span key={f.label} className={`text-xs font-medium px-2.5 py-1 rounded-full border ${f.color}`}>
                      {f.label}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-6 text-xs text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <Image size={13} className="text-gray-400" />
                    Semua format gambar
                  </span>
                  <span className="w-px h-3 bg-gray-200" />
                  <span className="flex items-center gap-1.5">
                    <Video size={13} className="text-gray-400" />
                    Semua format video
                  </span>
                  <span className="w-px h-3 bg-gray-200" />
                  <span>Maks. 200MB per file</span>
                </div>

                {/* Tombol browse */}
                <div className="mt-1 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold text-sm transition-colors">
                  Pilih File
                </div>
              </div>
            )}
          </div>

          {/* Preview Grid */}
          {mediaFiles.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-700">
                  Media dipilih ({mediaFiles.length} file)
                </p>
                <button
                  onClick={(e) => { e.stopPropagation(); setMediaFiles([]) }}
                  className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
                >
                  <Trash2 size={12} /> Hapus semua
                </button>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {mediaFiles.map((mf, i) => (
                  <div key={mf.id} className="relative group rounded-xl overflow-hidden aspect-square bg-gray-100 shadow-sm">
                    {mf.type === 'image' ? (
                      <img src={mf.preview} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <video src={mf.preview} className="w-full h-full object-cover" muted />
                    )}
                    {/* Type badge */}
                    <div className="absolute top-1.5 left-1.5">
                      <span className={cn(
                        'text-xs font-medium px-1.5 py-0.5 rounded-md text-white',
                        mf.type === 'image' ? 'bg-blue-500' : 'bg-red-500'
                      )}>
                        {mf.type === 'image' ? '📷' : '🎥'}
                      </span>
                    </div>
                    {/* Overlay hover */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      <button
                        onClick={(e) => { e.stopPropagation(); setMediaFiles(prev => prev.filter((_, idx) => idx !== i)) }}
                        className="bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    {mf.filters && (
                      <div className="absolute bottom-1 right-1 bg-brand-600 text-white text-xs rounded-md px-1.5 py-0.5 font-medium">
                        ✨ Edited
                      </div>
                    )}
                  </div>
                ))}
                {/* Tombol tambah lebih banyak */}
                <div
                  {...getRootProps()}
                  onClick={(e) => e.stopPropagation()}
                  className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-brand-400 hover:bg-brand-50 transition-all"
                >
                  <input {...getInputProps()} />
                  <Plus size={20} className="text-gray-400" />
                  <span className="text-xs text-gray-400 mt-1">Tambah</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center gap-3">
            <button
              onClick={() => setShowPreview(true)}
              disabled={mediaFiles.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-brand-200 text-brand-700 hover:bg-brand-50 font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Eye size={16} /> Preview Story / Feed
            </button>
            <button
              onClick={() => { setStep('edit'); setEditingIndex(0) }}
              disabled={mediaFiles.length === 0}
              className="btn-primary flex items-center gap-2"
            >
              Lanjut ke Editor <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step: Edit */}
      {step === 'edit' && mediaFiles.length > 0 && (
        <div>
          {mediaFiles.length > 1 && (
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {mediaFiles.map((mf, i) => (
                <button
                  key={mf.id}
                  onClick={() => setEditingIndex(i)}
                  className={cn(
                    'relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all',
                    editingIndex === i ? 'border-brand-500' : 'border-transparent'
                  )}
                >
                  <img src={mf.preview} alt="" className="w-full h-full object-cover" />
                  {mf.filters && <div className="absolute inset-0 bg-brand-600/30" />}
                </button>
              ))}
            </div>
          )}
          <MediaEditor
            mediaUrl={mediaFiles[editingIndex].preview}
            mediaType={mediaFiles[editingIndex].type}
            onSave={(filters, overlays) => handleEditorSave(editingIndex, filters, overlays)}
            initialFilters={mediaFiles[editingIndex].filters}
            initialOverlays={mediaFiles[editingIndex].overlays}
          />
          <div className="flex justify-between mt-6">
            <button onClick={() => setStep('upload')} className="btn-secondary flex items-center gap-2">
              <ChevronLeft size={16} /> Kembali
            </button>
            <button onClick={() => setStep('compose')} className="btn-primary flex items-center gap-2">
              Lewati Edit <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step: Compose */}
      {step === 'compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-5">
            <div>
              <label className="label">Caption</label>
              <textarea
                value={caption}
                onChange={e => setCaption(e.target.value)}
                className="input resize-none"
                rows={5}
                placeholder="Tulis caption yang menarik..."
              />
              <p className="text-xs text-gray-400 mt-1">{caption.length} karakter</p>
            </div>
            <div>
              <label className="label">Hashtag</label>
              <input
                type="text"
                value={hashtags}
                onChange={e => setHashtags(e.target.value)}
                className="input"
                placeholder="#konten #sosialMedia #viral"
              />
            </div>
            <div className="flex items-center justify-between p-4 card">
              <div>
                <p className="font-medium text-gray-900 text-sm">Post sebagai Story</p>
                <p className="text-xs text-gray-400">Gunakan format vertical 9:16</p>
              </div>
              <button
                onClick={() => setIsStory(!isStory)}
                className={cn(
                  'relative w-11 h-6 rounded-full transition-colors',
                  isStory ? 'bg-brand-600' : 'bg-gray-200'
                )}
              >
                <div className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform', isStory ? 'translate-x-5' : 'translate-x-0.5')} />
              </button>
            </div>
          </div>

          {/* Preview */}
          <div>
            <p className="label">Preview</p>
            <div className="card p-4">
              {mediaFiles[0] && (
                <img src={mediaFiles[0].preview} alt="" className="w-full rounded-lg object-cover max-h-64" />
              )}
              {caption && <p className="text-sm text-gray-700 mt-3">{caption}</p>}
              {hashtags && <p className="text-sm text-brand-600 mt-1">{hashtags}</p>}
            </div>
          </div>

          <div className="lg:col-span-2 flex justify-between">
            <button onClick={() => setStep('edit')} className="btn-secondary flex items-center gap-2">
              <ChevronLeft size={16} /> Kembali
            </button>
            <button
              onClick={() => { setStep('schedule'); loadAccounts() }}
              className="btn-primary flex items-center gap-2"
            >
              Pilih Platform & Jadwal <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step: Schedule */}
      {step === 'schedule' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <p className="label mb-3">Pilih Platform Tujuan</p>
              {socialAccounts.length === 0 ? (
                <div className="card p-6 text-center">
                  <p className="text-gray-500 text-sm mb-3">Belum ada akun terhubung.</p>
                  <a href="/settings" className="btn-primary text-sm">Hubungkan Akun Dulu</a>
                </div>
              ) : (
                <div className="space-y-2">
                  {socialAccounts.map((acc: any) => {
                    const plt = PLATFORMS[acc.platform as keyof typeof PLATFORMS]
                    const selected = selectedPlatforms.includes(acc.id)
                    return (
                      <button
                        key={acc.id}
                        onClick={() => setSelectedPlatforms(prev =>
                          selected ? prev.filter(id => id !== acc.id) : [...prev, acc.id]
                        )}
                        className={cn(
                          'w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left',
                          selected ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'
                        )}
                      >
                        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${plt?.gradient || 'from-gray-400 to-gray-600'} flex items-center justify-center text-white text-base flex-shrink-0`}>
                          {PLATFORM_ICONS[acc.platform as keyof typeof PLATFORM_ICONS] || '📱'}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm text-gray-900">{acc.accountName}</p>
                          <p className="text-xs text-gray-400">{plt?.name || acc.platform}</p>
                        </div>
                        <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all', selected ? 'border-brand-500 bg-brand-500' : 'border-gray-300')}>
                          {selected && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div>
              <p className="label mb-2">Waktu Publikasi</p>
              <div className="space-y-2">
                <button
                  onClick={() => setScheduledAt('')}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all',
                    !scheduledAt ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <Globe size={18} className="text-green-500" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">Publikasikan Sekarang</p>
                    <p className="text-xs text-gray-400">Langsung tayang di semua platform terpilih</p>
                  </div>
                </button>
                <button
                  onClick={() => {
                    const dt = new Date()
                    dt.setMinutes(dt.getMinutes() + 60)
                    setScheduledAt(format(dt, "yyyy-MM-dd'T'HH:mm"))
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all',
                    scheduledAt ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <Calendar size={18} className="text-blue-500" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">Jadwalkan</p>
                    <p className="text-xs text-gray-400">Pilih waktu publikasi</p>
                  </div>
                </button>
              </div>
              {scheduledAt && (
                <div className="mt-3">
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={e => setScheduledAt(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="input"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          <div>
            <p className="label mb-3">Ringkasan</p>
            <div className="card p-5 space-y-4">
              {mediaFiles[0] && (
                <div className="relative rounded-xl overflow-hidden">
                  <img src={mediaFiles[0].preview} alt="" className="w-full object-cover max-h-48 rounded-xl" />
                  {mediaFiles.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs rounded-full px-2 py-1">
                      +{mediaFiles.length - 1} lagi
                    </div>
                  )}
                </div>
              )}
              {caption && <p className="text-sm text-gray-700 line-clamp-3">{caption}</p>}
              <div className="flex flex-wrap gap-1">
                {selectedPlatforms.map(id => {
                  const acc = socialAccounts.find(a => a.id === id)
                  if (!acc) return null
                  return (
                    <span key={id} className="badge bg-gray-100 text-gray-600">
                      {PLATFORM_ICONS[acc.platform as keyof typeof PLATFORM_ICONS]} {acc.accountName}
                    </span>
                  )
                })}
              </div>
              {scheduledAt && (
                <p className="text-sm text-blue-600 flex items-center gap-2">
                  <Clock size={14} /> {format(new Date(scheduledAt), 'dd MMM yyyy HH:mm')}
                </p>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 flex justify-between">
            <button onClick={() => setStep('compose')} className="btn-secondary flex items-center gap-2">
              <ChevronLeft size={16} /> Kembali
            </button>
            <button
              onClick={handlePublish}
              disabled={loading || selectedPlatforms.length === 0}
              className="btn-primary flex items-center gap-2 min-w-36 justify-center"
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Memproses...</>
              ) : scheduledAt ? (
                <><Calendar size={16} /> Jadwalkan</>
              ) : (
                <><Globe size={16} /> Publikasikan</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
