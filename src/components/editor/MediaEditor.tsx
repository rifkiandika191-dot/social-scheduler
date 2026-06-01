'use client'

import { useRef, useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Sliders, Square, Type, RotateCcw, Upload, X, Move, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface FilterSettings {
  brightness: number
  contrast: number
  saturation: number
  blur: number
  grayscale: number
  sepia: number
  hueRotate: number
  opacity: number
}

export interface CustomOverlayImage {
  id: string
  url: string        // object URL
  x: number          // % dari kiri (0-100)
  y: number          // % dari atas (0-100)
  width: number      // % lebar (10-100)
  opacity: number    // 0-100
  blendMode: string
}

export interface OverlaySettings {
  borderEnabled: boolean
  borderColor: string
  borderWidth: number
  borderStyle: 'solid' | 'dashed' | 'double' | 'rounded'
  gradientEnabled: boolean
  gradientFrom: string
  gradientTo: string
  gradientDirection: 'top' | 'bottom' | 'left' | 'right'
  textEnabled: boolean
  textContent: string
  textColor: string
  textSize: number
  textPosition: 'top' | 'center' | 'bottom'
  vignette: boolean
  customOverlays: CustomOverlayImage[]
}

const defaultFilters: FilterSettings = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  blur: 0,
  grayscale: 0,
  sepia: 0,
  hueRotate: 0,
  opacity: 100,
}

const defaultOverlay: OverlaySettings = {
  borderEnabled: false,
  borderColor: '#7c3aed',
  borderWidth: 8,
  borderStyle: 'solid',
  gradientEnabled: false,
  gradientFrom: '#7c3aed',
  gradientTo: '#ec4899',
  gradientDirection: 'bottom',
  textEnabled: false,
  textContent: 'Your Story',
  textColor: '#ffffff',
  textSize: 32,
  textPosition: 'bottom',
  vignette: false,
  customOverlays: [],
}

const presetFilters = [
  { name: 'Normal',  settings: { ...defaultFilters } },
  { name: 'Vivid',   settings: { ...defaultFilters, brightness: 110, contrast: 115, saturation: 130 } },
  { name: 'Matte',   settings: { ...defaultFilters, brightness: 105, contrast: 90,  saturation: 85 } },
  { name: 'Drama',   settings: { ...defaultFilters, contrast: 130,  saturation: 80,  brightness: 95 } },
  { name: 'Warm',    settings: { ...defaultFilters, hueRotate: 15,  saturation: 120 } },
  { name: 'Cool',    settings: { ...defaultFilters, hueRotate: -15, saturation: 110 } },
  { name: 'Vintage', settings: { ...defaultFilters, sepia: 40,      brightness: 105, contrast: 95 } },
  { name: 'B&W',     settings: { ...defaultFilters, grayscale: 100, contrast: 110 } },
  { name: 'Soft',    settings: { ...defaultFilters, brightness: 108, contrast: 85,   saturation: 90, blur: 0.5 } },
  { name: 'Sharp',   settings: { ...defaultFilters, contrast: 125,  brightness: 100, saturation: 105 } },
]

const blendModes = [
  { value: 'normal',      label: 'Normal' },
  { value: 'multiply',    label: 'Multiply' },
  { value: 'screen',      label: 'Screen' },
  { value: 'overlay',     label: 'Overlay' },
  { value: 'soft-light',  label: 'Soft Light' },
  { value: 'hard-light',  label: 'Hard Light' },
  { value: 'color-dodge', label: 'Dodge' },
  { value: 'color-burn',  label: 'Burn' },
  { value: 'darken',      label: 'Darken' },
  { value: 'lighten',     label: 'Lighten' },
  { value: 'luminosity',  label: 'Luminosity' },
]

interface Props {
  mediaUrl: string
  mediaType: 'image' | 'video'
  onSave: (filters: FilterSettings, overlays: OverlaySettings) => void
  initialFilters?: FilterSettings
  initialOverlays?: OverlaySettings
}

export function MediaEditor({ mediaUrl, mediaType, onSave, initialFilters, initialOverlays }: Props) {
  const [tab, setTab] = useState<'filters' | 'overlays' | 'text'>('filters')
  const [filters, setFilters] = useState<FilterSettings>(initialFilters || defaultFilters)
  const [overlay, setOverlay] = useState<OverlaySettings>({
    ...(initialOverlays || defaultOverlay),
    customOverlays: initialOverlays?.customOverlays || [],
  })
  const [activePreset, setActivePreset] = useState(0)
  const [selectedCustomId, setSelectedCustomId] = useState<string | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null)

  const cssFilter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%) blur(${filters.blur}px) grayscale(${filters.grayscale}%) sepia(${filters.sepia}%) hue-rotate(${filters.hueRotate}deg) opacity(${filters.opacity}%)`

  const gradientMap: Record<string, string> = {
    top: 'to bottom', bottom: 'to top', left: 'to right', right: 'to left',
  }

  // Upload custom overlay
  const onDropCustom = useCallback((accepted: File[]) => {
    accepted.forEach(file => {
      const url = URL.createObjectURL(file)
      const newOverlay: CustomOverlayImage = {
        id: Math.random().toString(36).slice(2),
        url,
        x: 10,
        y: 10,
        width: 50,
        opacity: 100,
        blendMode: 'normal',
      }
      setOverlay(prev => ({
        ...prev,
        customOverlays: [...prev.customOverlays, newOverlay],
      }))
      setSelectedCustomId(newOverlay.id)
    })
  }, [])

  const { getRootProps: getCustomRootProps, getInputProps: getCustomInputProps, isDragActive: isCustomDrag } = useDropzone({
    onDrop: onDropCustom,
    accept: { 'image/*': [] },
    multiple: true,
  })

  function updateCustomOverlay(id: string, patch: Partial<CustomOverlayImage>) {
    setOverlay(prev => ({
      ...prev,
      customOverlays: prev.customOverlays.map(o => o.id === id ? { ...o, ...patch } : o),
    }))
  }

  function removeCustomOverlay(id: string) {
    setOverlay(prev => ({
      ...prev,
      customOverlays: prev.customOverlays.filter(o => o.id !== id),
    }))
    if (selectedCustomId === id) setSelectedCustomId(null)
  }

  // Drag overlay di preview
  function handleOverlayMouseDown(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    e.preventDefault()
    const rect = previewRef.current?.getBoundingClientRect()
    if (!rect) return
    const cur = overlay.customOverlays.find(o => o.id === id)
    if (!cur) return
    setSelectedCustomId(id)
    draggingRef.current = { id, startX: e.clientX, startY: e.clientY, origX: cur.x, origY: cur.y }

    function onMouseMove(ev: MouseEvent) {
      if (!draggingRef.current || !rect) return
      const dx = ((ev.clientX - draggingRef.current.startX) / rect.width)  * 100
      const dy = ((ev.clientY - draggingRef.current.startY) / rect.height) * 100
      updateCustomOverlay(draggingRef.current.id, {
        x: Math.min(90, Math.max(0, draggingRef.current.origX + dx)),
        y: Math.min(90, Math.max(0, draggingRef.current.origY + dy)),
      })
    }
    function onMouseUp() {
      draggingRef.current = null
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  const selectedCustom = overlay.customOverlays.find(o => o.id === selectedCustomId)

  const tabs = [
    { id: 'filters', label: 'Filter',  icon: Sliders },
    { id: 'overlays',label: 'Overlay', icon: Square },
    { id: 'text',    label: 'Teks',    icon: Type },
  ] as const

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* ── Preview ── */}
      <div className="flex-1 flex flex-col items-center">
        <div
          ref={previewRef}
          className="relative rounded-2xl overflow-hidden shadow-xl bg-gray-900 select-none"
          style={{ maxWidth: 400, width: '100%', aspectRatio: '9/16' }}
        >
          {/* Media dengan filter */}
          <div className="w-full h-full" style={{ filter: cssFilter }}>
            {mediaType === 'image'
              ? <img src={mediaUrl} alt="preview" className="w-full h-full object-cover" />
              : <video src={mediaUrl} className="w-full h-full object-cover" autoPlay muted loop />
            }
          </div>

          {/* Border */}
          {overlay.borderEnabled && (
            <div className="absolute inset-0 pointer-events-none" style={{
              border: `${overlay.borderWidth}px ${overlay.borderStyle === 'rounded' ? 'solid' : overlay.borderStyle} ${overlay.borderColor}`,
              borderRadius: overlay.borderStyle === 'rounded' ? '16px' : undefined,
            }} />
          )}

          {/* Vignette */}
          {overlay.vignette && (
            <div className="absolute inset-0 pointer-events-none" style={{
              background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.6) 100%)',
            }} />
          )}

          {/* Gradient */}
          {overlay.gradientEnabled && (
            <div className="absolute inset-0 pointer-events-none" style={{
              background: `linear-gradient(${gradientMap[overlay.gradientDirection]}, ${overlay.gradientFrom}88, ${overlay.gradientTo}88)`,
            }} />
          )}

          {/* Custom overlay images */}
          {overlay.customOverlays.map(co => (
            <div
              key={co.id}
              onMouseDown={e => handleOverlayMouseDown(e, co.id)}
              className={cn(
                'absolute cursor-move',
                selectedCustomId === co.id && 'ring-2 ring-brand-400 ring-offset-1'
              )}
              style={{
                left: `${co.x}%`,
                top:  `${co.y}%`,
                width: `${co.width}%`,
                opacity: co.opacity / 100,
                mixBlendMode: co.blendMode as any,
                userSelect: 'none',
              }}
            >
              <img
                src={co.url}
                alt="overlay"
                draggable={false}
                className="w-full h-auto pointer-events-none"
              />
              {/* Tombol hapus */}
              {selectedCustomId === co.id && (
                <button
                  onMouseDown={e => { e.stopPropagation(); removeCustomOverlay(co.id) }}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow"
                >
                  <X size={11} />
                </button>
              )}
            </div>
          ))}

          {/* Teks */}
          {overlay.textEnabled && overlay.textContent && (
            <div className={cn(
              'absolute left-0 right-0 px-4 pointer-events-none flex items-center justify-center',
              overlay.textPosition === 'top'    && 'top-6',
              overlay.textPosition === 'center' && 'top-1/2 -translate-y-1/2',
              overlay.textPosition === 'bottom' && 'bottom-6',
            )}>
              <p className="font-bold text-center drop-shadow-lg leading-tight"
                style={{ color: overlay.textColor, fontSize: overlay.textSize }}>
                {overlay.textContent}
              </p>
            </div>
          )}

          {/* Hint drag */}
          {overlay.customOverlays.length > 0 && (
            <div className="absolute bottom-2 left-0 right-0 flex justify-center pointer-events-none">
              <span className="bg-black/50 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                <Move size={10} /> Seret overlay untuk memindahkan
              </span>
            </div>
          )}
        </div>

        <button onClick={() => onSave(filters, overlay)} className="btn-primary mt-4 px-8">
          Simpan & Lanjutkan
        </button>
      </div>

      {/* ── Controls ── */}
      <div className="w-full lg:w-80 flex flex-col gap-4">
        {/* Tab bar */}
        <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1 py-2 rounded-md text-xs font-medium transition-all',
                tab === t.id ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <t.icon size={14} />
              {t.label}
              {t.id === 'overlays' && overlay.customOverlays.length > 0 && (
                <span className="bg-brand-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center leading-none">
                  {overlay.customOverlays.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Tab: Filters ── */}
        {tab === 'filters' && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Preset Filter</p>
              <div className="grid grid-cols-5 gap-2">
                {presetFilters.map((p, i) => (
                  <button
                    key={p.name}
                    onClick={() => { setFilters(p.settings); setActivePreset(i) }}
                    className={cn(
                      'flex flex-col items-center gap-1 p-1 rounded-lg border-2 transition-all text-xs',
                      activePreset === i
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-transparent text-gray-500 hover:border-gray-200'
                    )}
                  >
                    <div className="w-full aspect-square rounded overflow-hidden" style={{
                      background: `url(${mediaUrl}) center/cover`,
                      filter: `brightness(${p.settings.brightness}%) contrast(${p.settings.contrast}%) saturate(${p.settings.saturation}%) grayscale(${p.settings.grayscale}%) sepia(${p.settings.sepia}%)`,
                    }} />
                    <span>{p.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {([
              { key: 'brightness', label: 'Kecerahan', min: 50,   max: 200 },
              { key: 'contrast',   label: 'Kontras',   min: 50,   max: 200 },
              { key: 'saturation', label: 'Saturasi',  min: 0,    max: 200 },
              { key: 'blur',       label: 'Blur',      min: 0,    max: 10,  step: 0.1 },
              { key: 'grayscale',  label: 'Grayscale', min: 0,    max: 100 },
              { key: 'sepia',      label: 'Sepia',     min: 0,    max: 100 },
              { key: 'hueRotate',  label: 'Hue',       min: -180, max: 180 },
            ] as Array<{ key: keyof FilterSettings; label: string; min: number; max: number; step?: number }>).map(({ key, label, min, max, step }) => (
              <div key={key}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-medium text-gray-600">{label}</span>
                  <span className="text-xs text-gray-400">{filters[key]}{key === 'blur' ? 'px' : key === 'hueRotate' ? '°' : '%'}</span>
                </div>
                <input type="range" min={min} max={max} step={step || 1}
                  value={filters[key]}
                  onChange={e => { setFilters(p => ({ ...p, [key]: Number(e.target.value) })); setActivePreset(-1) }}
                  className="w-full accent-brand-600"
                />
              </div>
            ))}

            <button onClick={() => { setFilters(defaultFilters); setActivePreset(0) }}
              className="btn-secondary w-full text-sm flex items-center justify-center gap-2">
              <RotateCcw size={14} /> Reset Filter
            </button>
          </div>
        )}

        {/* ── Tab: Overlays ── */}
        {tab === 'overlays' && (
          <div className="space-y-4">
            {/* Border */}
            <div className="card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">Border Tepi</p>
                <Toggle value={overlay.borderEnabled} onChange={v => setOverlay(p => ({ ...p, borderEnabled: v }))} />
              </div>
              {overlay.borderEnabled && (
                <>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 mb-1 block">Warna</label>
                      <input type="color" value={overlay.borderColor}
                        onChange={e => setOverlay(p => ({ ...p, borderColor: e.target.value }))}
                        className="w-full h-9 rounded-lg border border-gray-200 cursor-pointer" />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 mb-1 block">Tebal: {overlay.borderWidth}px</label>
                      <input type="range" min={2} max={30} value={overlay.borderWidth}
                        onChange={e => setOverlay(p => ({ ...p, borderWidth: Number(e.target.value) }))}
                        className="w-full accent-brand-600 mt-2" />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {(['solid','dashed','double','rounded'] as const).map(s => (
                      <button key={s} onClick={() => setOverlay(p => ({ ...p, borderStyle: s }))}
                        className={cn('py-1.5 text-xs rounded border transition-colors capitalize',
                          overlay.borderStyle === s ? 'border-brand-500 text-brand-600 bg-brand-50' : 'border-gray-200 text-gray-500')}>
                        {s}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Gradient */}
            <div className="card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">Gradient</p>
                <Toggle value={overlay.gradientEnabled} onChange={v => setOverlay(p => ({ ...p, gradientEnabled: v }))} />
              </div>
              {overlay.gradientEnabled && (
                <>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 mb-1 block">Dari</label>
                      <input type="color" value={overlay.gradientFrom}
                        onChange={e => setOverlay(p => ({ ...p, gradientFrom: e.target.value }))}
                        className="w-full h-9 rounded-lg border border-gray-200 cursor-pointer" />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 mb-1 block">Ke</label>
                      <input type="color" value={overlay.gradientTo}
                        onChange={e => setOverlay(p => ({ ...p, gradientTo: e.target.value }))}
                        className="w-full h-9 rounded-lg border border-gray-200 cursor-pointer" />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {(['top','bottom','left','right'] as const).map(d => (
                      <button key={d} onClick={() => setOverlay(p => ({ ...p, gradientDirection: d }))}
                        className={cn('py-1.5 text-xs rounded border transition-colors',
                          overlay.gradientDirection === d ? 'border-brand-500 text-brand-600 bg-brand-50' : 'border-gray-200 text-gray-500')}>
                        {d === 'top' ? '↑ Atas' : d === 'bottom' ? '↓ Bawah' : d === 'left' ? '← Kiri' : '→ Kanan'}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Vignette */}
            <div className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Vignette</p>
                  <p className="text-xs text-gray-400">Tepi gelap dramatis</p>
                </div>
                <Toggle value={overlay.vignette} onChange={v => setOverlay(p => ({ ...p, vignette: v }))} />
              </div>
            </div>

            {/* ── Custom Overlay (dipindah ke dalam Overlay) ── */}
            <div className="card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Overlay Kustom</p>
                  <p className="text-xs text-gray-400">Unggah gambar sebagai overlay</p>
                </div>
                {overlay.customOverlays.length > 0 && (
                  <span className="bg-brand-100 text-brand-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                    {overlay.customOverlays.length} aktif
                  </span>
                )}
              </div>

              {/* Upload area */}
              <div
                {...getCustomRootProps()}
                className={cn(
                  'border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all',
                  isCustomDrag ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-brand-400 hover:bg-gray-50'
                )}
              >
                <input {...getCustomInputProps()} />
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center">
                    <Upload size={18} className="text-brand-600" />
                  </div>
                  <p className="text-xs font-semibold text-gray-800">
                    {isCustomDrag ? 'Lepaskan di sini!' : 'Upload gambar overlay'}
                  </p>
                  <p className="text-xs text-gray-400">PNG transparan direkomendasikan</p>
                  <div className="flex gap-1 mt-0.5">
                    {['PNG', 'SVG', 'WebP', 'GIF'].map(f => (
                      <span key={f} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{f}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Daftar overlay */}
              {overlay.customOverlays.length > 0 && (
              <div className="space-y-2">
                {overlay.customOverlays.map(co => (
                  <div
                    key={co.id}
                    onClick={() => setSelectedCustomId(co.id === selectedCustomId ? null : co.id)}
                    className={cn(
                      'rounded-xl border transition-all cursor-pointer p-3',
                      selectedCustomId === co.id ? 'border-brand-400 bg-brand-50' : 'border-gray-200 hover:border-gray-300 bg-white'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <img src={co.url} alt="" className="w-10 h-10 rounded-lg object-contain bg-gray-100 border border-gray-200 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-700">Overlay #{overlay.customOverlays.indexOf(co) + 1}</p>
                        <p className="text-xs text-gray-400">{selectedCustomId === co.id ? 'Klik untuk tutup' : 'Klik untuk edit'}</p>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); removeCustomOverlay(co.id) }}
                        className="text-gray-300 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {selectedCustomId === co.id && (
                      <div className="space-y-3 pt-2 border-t border-gray-100">
                        {/* Ukuran */}
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-xs text-gray-500">Ukuran</span>
                            <span className="text-xs text-gray-400">{co.width}%</span>
                          </div>
                          <input type="range" min={5} max={100}
                            value={co.width}
                            onChange={e => updateCustomOverlay(co.id, { width: Number(e.target.value) })}
                            className="w-full accent-brand-600"
                          />
                        </div>

                        {/* Opacity */}
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-xs text-gray-500">Opacity</span>
                            <span className="text-xs text-gray-400">{co.opacity}%</span>
                          </div>
                          <input type="range" min={5} max={100}
                            value={co.opacity}
                            onChange={e => updateCustomOverlay(co.id, { opacity: Number(e.target.value) })}
                            className="w-full accent-brand-600"
                          />
                        </div>

                        {/* Posisi X & Y */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-xs text-gray-500">Posisi X</span>
                              <span className="text-xs text-gray-400">{Math.round(co.x)}%</span>
                            </div>
                            <input type="range" min={0} max={90}
                              value={co.x}
                              onChange={e => updateCustomOverlay(co.id, { x: Number(e.target.value) })}
                              className="w-full accent-brand-600"
                            />
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-xs text-gray-500">Posisi Y</span>
                              <span className="text-xs text-gray-400">{Math.round(co.y)}%</span>
                            </div>
                            <input type="range" min={0} max={90}
                              value={co.y}
                              onChange={e => updateCustomOverlay(co.id, { y: Number(e.target.value) })}
                              className="w-full accent-brand-600"
                            />
                          </div>
                        </div>

                        {/* Blend mode */}
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Blend Mode</label>
                          <select
                            value={co.blendMode}
                            onChange={e => updateCustomOverlay(co.id, { blendMode: e.target.value })}
                            className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500"
                          >
                            {blendModes.map(b => (
                              <option key={b.value} value={b.value}>{b.label}</option>
                            ))}
                          </select>
                        </div>

                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <Move size={10} /> Seret langsung di preview untuk memindahkan
                        </p>
                      </div>
                    )}
                  </div>
                ))}

                <button
                  onClick={() => setOverlay(p => ({ ...p, customOverlays: [] }))}
                  className="w-full text-xs text-red-500 hover:text-red-600 flex items-center justify-center gap-1 py-1 mt-1"
                >
                  <Trash2 size={11} /> Hapus semua
                </button>
              </div>
              )}
            </div>
          </div>
        )}

        {/* ── Tab: Text ── */}
        {tab === 'text' && (
          <div className="space-y-4">
            <div className="card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">Teks Overlay</p>
                <Toggle value={overlay.textEnabled} onChange={v => setOverlay(p => ({ ...p, textEnabled: v }))} />
              </div>
              {overlay.textEnabled && (
                <>
                  <textarea value={overlay.textContent}
                    onChange={e => setOverlay(p => ({ ...p, textContent: e.target.value }))}
                    className="input text-sm resize-none" rows={2}
                    placeholder="Tulis teks Anda..." />
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 mb-1 block">Warna</label>
                      <input type="color" value={overlay.textColor}
                        onChange={e => setOverlay(p => ({ ...p, textColor: e.target.value }))}
                        className="w-full h-9 rounded-lg border border-gray-200 cursor-pointer" />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 mb-1 block">Ukuran: {overlay.textSize}px</label>
                      <input type="range" min={12} max={80} value={overlay.textSize}
                        onChange={e => setOverlay(p => ({ ...p, textSize: Number(e.target.value) }))}
                        className="w-full accent-brand-600 mt-2" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {(['top','center','bottom'] as const).map(pos => (
                      <button key={pos} onClick={() => setOverlay(p => ({ ...p, textPosition: pos }))}
                        className={cn('py-1.5 text-xs rounded border transition-colors capitalize',
                          overlay.textPosition === pos ? 'border-brand-500 text-brand-600 bg-brand-50' : 'border-gray-200 text-gray-500')}>
                        {pos === 'top' ? 'Atas' : pos === 'center' ? 'Tengah' : 'Bawah'}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={cn('relative w-10 h-5 rounded-full transition-colors flex-shrink-0', value ? 'bg-brand-600' : 'bg-gray-200')}
    >
      <div className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform', value ? 'translate-x-5' : 'translate-x-0.5')} />
    </button>
  )
}
