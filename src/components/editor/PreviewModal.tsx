'use client'

import { useState } from 'react'
import { X, Eye, ChevronLeft, ChevronRight, Move } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FilterSettings, OverlaySettings } from './MediaEditor'

interface MediaFile {
  id: string
  preview: string
  type: 'image' | 'video'
  filters?: FilterSettings
  overlays?: OverlaySettings
}

interface Props {
  mediaFiles: MediaFile[]
  caption?: string
  hashtags?: string
  userName?: string
  onClose: () => void
}

type PreviewMode = 'story' | 'feed-square' | 'feed-portrait' | 'feed-landscape' | 'reel'

const modes: { id: PreviewMode; label: string; ratio: string; desc: string; icon: string }[] = [
  { id: 'story',          label: 'Story',          ratio: '9/16', desc: '1080 × 1920', icon: '📱' },
  { id: 'reel',           label: 'Reel / TikTok',  ratio: '9/16', desc: '1080 × 1920', icon: '🎬' },
  { id: 'feed-portrait',  label: 'Feed Portrait',  ratio: '4/5',  desc: '1080 × 1350', icon: '🖼️' },
  { id: 'feed-square',    label: 'Feed Square',    ratio: '1/1',  desc: '1080 × 1080', icon: '⬜' },
  { id: 'feed-landscape', label: 'Feed Landscape', ratio: '16/9', desc: '1080 × 566',  icon: '🖥️' },
]

const platforms: { id: string; label: string; color: string; supportedModes: PreviewMode[] }[] = [
  { id: 'instagram', label: 'Instagram', color: 'from-purple-500 via-pink-500 to-orange-400', supportedModes: ['story','reel','feed-portrait','feed-square','feed-landscape'] },
  { id: 'tiktok',    label: 'TikTok',    color: 'from-gray-800 to-gray-900',                  supportedModes: ['story','reel'] },
  { id: 'facebook',  label: 'Facebook',  color: 'from-blue-600 to-blue-800',                  supportedModes: ['story','feed-square','feed-landscape','feed-portrait'] },
  { id: 'twitter',   label: 'Twitter/X', color: 'from-sky-400 to-sky-600',                    supportedModes: ['feed-square','feed-landscape'] },
  { id: 'youtube',   label: 'YouTube',   color: 'from-red-500 to-red-700',                    supportedModes: ['reel','feed-landscape'] },
  { id: 'linkedin',  label: 'LinkedIn',  color: 'from-blue-700 to-blue-900',                  supportedModes: ['feed-square','feed-landscape','feed-portrait'] },
]

/* Render satu media dengan semua filter + overlay dari editor */
function EditedMedia({ mf, className }: { mf: MediaFile; className?: string }) {
  const f = mf.filters
  const o = mf.overlays

  const cssFilter = f
    ? `brightness(${f.brightness}%) contrast(${f.contrast}%) saturate(${f.saturation}%) blur(${f.blur}px) grayscale(${f.grayscale}%) sepia(${f.sepia}%) hue-rotate(${f.hueRotate}deg) opacity(${f.opacity}%)`
    : undefined

  const gradientMap: Record<string, string> = {
    top: 'to bottom', bottom: 'to top', left: 'to right', right: 'to left',
  }

  return (
    <div className={cn('relative w-full h-full', className)}>
      {/* Media + filter */}
      <div className="w-full h-full" style={{ filter: cssFilter }}>
        {mf.type === 'image'
          ? <img src={mf.preview} alt="" className="w-full h-full object-cover" />
          : <video src={mf.preview} className="w-full h-full object-cover" autoPlay muted loop playsInline />
        }
      </div>

      {/* Overlay layers */}
      {o && (
        <>
          {/* Border */}
          {o.borderEnabled && (
            <div className="absolute inset-0 pointer-events-none" style={{
              border: `${o.borderWidth}px ${o.borderStyle === 'rounded' ? 'solid' : o.borderStyle} ${o.borderColor}`,
              borderRadius: o.borderStyle === 'rounded' ? '12px' : undefined,
            }} />
          )}

          {/* Vignette */}
          {o.vignette && (
            <div className="absolute inset-0 pointer-events-none" style={{
              background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.6) 100%)',
            }} />
          )}

          {/* Gradient */}
          {o.gradientEnabled && (
            <div className="absolute inset-0 pointer-events-none" style={{
              background: `linear-gradient(${gradientMap[o.gradientDirection]}, ${o.gradientFrom}88, ${o.gradientTo}88)`,
            }} />
          )}

          {/* Custom overlay images */}
          {o.customOverlays?.map(co => (
            <div key={co.id} className="absolute pointer-events-none" style={{
              left: `${co.x}%`,
              top:  `${co.y}%`,
              width: `${co.width}%`,
              opacity: co.opacity / 100,
              mixBlendMode: co.blendMode as any,
            }}>
              <img src={co.url} alt="" draggable={false} className="w-full h-auto" />
            </div>
          ))}

          {/* Teks */}
          {o.textEnabled && o.textContent && (
            <div className={cn(
              'absolute left-0 right-0 px-3 pointer-events-none flex items-center justify-center',
              o.textPosition === 'top'    && 'top-4',
              o.textPosition === 'center' && 'top-1/2 -translate-y-1/2',
              o.textPosition === 'bottom' && 'bottom-4',
            )}>
              <p className="font-bold text-center drop-shadow-lg leading-tight"
                style={{ color: o.textColor, fontSize: o.textSize }}>
                {o.textContent}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export function PreviewModal({ mediaFiles, caption, hashtags, userName = 'username', onClose }: Props) {
  const [mode, setMode]         = useState<PreviewMode>('feed-square')
  const [platform, setPlatform] = useState('instagram')
  const [mediaIndex, setMediaIndex] = useState(0)

  const current         = mediaFiles[mediaIndex]
  const currentMode     = modes.find(m => m.id === mode)!
  const currentPlatform = platforms.find(p => p.id === platform)!
  const isStory         = mode === 'story' || mode === 'reel'

  const hasEdits = mediaFiles.some(mf => mf.filters || mf.overlays)

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Eye size={20} className="text-brand-600" />
            <h2 className="font-bold text-gray-900">Preview Konten</h2>
            {hasEdits && (
              <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-medium">
                ✨ Dengan hasil edit
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar kiri */}
          <div className="w-52 border-r border-gray-100 p-4 space-y-5 overflow-y-auto flex-shrink-0">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Format</p>
              <div className="space-y-1">
                {modes.map(m => (
                  <button key={m.id} onClick={() => setMode(m.id)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all text-sm',
                      mode === m.id ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                    )}>
                    <span className="text-base leading-none">{m.icon}</span>
                    <div>
                      <p className="font-medium leading-tight">{m.label}</p>
                      <p className={cn('text-xs leading-tight', mode === m.id ? 'text-brand-200' : 'text-gray-400')}>
                        {m.ratio} · {m.desc}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Platform</p>
              <div className="space-y-1">
                {platforms.map(p => (
                  <button key={p.id}
                    onClick={() => { setPlatform(p.id); if (!p.supportedModes.includes(mode)) setMode(p.supportedModes[0]) }}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all text-sm',
                      platform === p.id ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'
                    )}>
                    <div className={`w-5 h-5 rounded-md bg-gradient-to-br ${p.color} flex-shrink-0`} />
                    <span className="font-medium">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Thumbnail semua media */}
            {mediaFiles.length > 1 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Media ({mediaFiles.length})
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {mediaFiles.map((mf, i) => (
                    <button key={mf.id} onClick={() => setMediaIndex(i)}
                      className={cn(
                        'aspect-square rounded-lg overflow-hidden border-2 transition-all',
                        i === mediaIndex ? 'border-brand-500 scale-95' : 'border-transparent hover:border-gray-300'
                      )}>
                      <div className="w-full h-full relative">
                        <div style={{
                          filter: mf.filters
                            ? `brightness(${mf.filters.brightness}%) contrast(${mf.filters.contrast}%) saturate(${mf.filters.saturation}%) grayscale(${mf.filters.grayscale}%) sepia(${mf.filters.sepia}%)`
                            : undefined,
                        }} className="w-full h-full">
                          <img src={mf.preview} alt="" className="w-full h-full object-cover" />
                        </div>
                        {(mf.filters || mf.overlays) && (
                          <div className="absolute bottom-0.5 right-0.5 bg-brand-600 rounded text-white text-[8px] px-1">✨</div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Area preview */}
          <div className="flex-1 flex flex-col items-center justify-start overflow-y-auto bg-gray-50 p-6 gap-4">
            {/* Badge */}
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${currentPlatform.color} text-white`}>
                {currentPlatform.label}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                {currentMode.icon} {currentMode.label} · {currentMode.ratio}
              </span>
              {current?.filters && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-brand-100 text-brand-700">
                  ✨ Filter aktif
                </span>
              )}
              {current?.overlays && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-700">
                  🎨 Overlay aktif
                </span>
              )}
            </div>

            {isStory ? (
              <StoryPreview
                current={current}
                allMedia={mediaFiles}
                mediaIndex={mediaIndex}
                setMediaIndex={setMediaIndex}
                platform={platform}
                caption={caption}
                userName={userName}
                isReel={mode === 'reel'}
                platformColor={currentPlatform.color}
              />
            ) : (
              <FeedPreview
                current={current}
                allMedia={mediaFiles}
                mediaIndex={mediaIndex}
                setMediaIndex={setMediaIndex}
                platform={platform}
                caption={caption}
                hashtags={hashtags}
                userName={userName}
                mode={mode}
                platformColor={currentPlatform.color}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Story / Reel Preview ─── */
function StoryPreview({ current, allMedia, mediaIndex, setMediaIndex, platform, caption, userName, isReel, platformColor }: any) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative bg-black rounded-[40px] p-2 shadow-2xl" style={{ width: 240 }}>
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-5 bg-black rounded-full z-20" />
        <div className="relative bg-gray-900 rounded-[32px] overflow-hidden" style={{ aspectRatio: '9/16' }}>

          {/* Media dengan edits */}
          {current && <EditedMedia mf={current} className="absolute inset-0" />}

          {/* UI overlay */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none z-10">
            <div className="px-3 pt-10 space-y-2">
              <div className="flex gap-1">
                {allMedia.map((_: any, i: number) => (
                  <div key={i} className="flex-1 h-0.5 rounded-full bg-white/30 overflow-hidden">
                    <div className={cn('h-full bg-white rounded-full', i <= mediaIndex ? 'w-full' : 'w-0')} />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${platformColor} flex-shrink-0`} />
                <span className="text-white text-xs font-semibold drop-shadow">{userName}</span>
                <span className="text-white/60 text-xs">3 jam</span>
              </div>
            </div>

            {isReel ? (
              <div className="px-3 pb-4 space-y-2">
                {caption && <p className="text-white text-xs drop-shadow line-clamp-2">{caption}</p>}
                <div className="flex items-end justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${platformColor}`} />
                      <span className="text-white text-xs font-semibold">@{userName}</span>
                    </div>
                    <p className="text-white/70 text-xs mt-0.5">🎵 Original sound</p>
                  </div>
                  <div className="flex flex-col items-center gap-3 ml-3">
                    {[['❤️','12K'],['💬','234'],['↗️','567'],['🔖','89']].map(([icon, count]) => (
                      <div key={icon} className="flex flex-col items-center gap-0.5">
                        <span className="text-lg leading-none drop-shadow">{icon}</span>
                        <span className="text-white text-[9px] drop-shadow">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="px-3 pb-4 flex items-center gap-2">
                <div className="flex-1 border border-white/50 rounded-full px-3 py-1">
                  <span className="text-white/60 text-xs">Kirim pesan...</span>
                </div>
                <span className="text-white text-base">↗️</span>
                <span className="text-white text-base">❤️</span>
              </div>
            )}
          </div>

          {/* Nav media */}
          {allMedia.length > 1 && (
            <>
              <button onClick={() => setMediaIndex((i: number) => Math.max(0, i - 1))}
                className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/30 text-white rounded-full p-0.5 z-20 pointer-events-auto">
                <ChevronLeft size={14} />
              </button>
              <button onClick={() => setMediaIndex((i: number) => Math.min(allMedia.length - 1, i + 1))}
                className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/30 text-white rounded-full p-0.5 z-20 pointer-events-auto">
                <ChevronRight size={14} />
              </button>
            </>
          )}
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-3">
        {isReel ? 'Reel / TikTok — 9:16' : 'Story — 9:16'}
      </p>
    </div>
  )
}

/* ─── Feed Preview ─── */
function FeedPreview({ current, allMedia, mediaIndex, setMediaIndex, platform, caption, hashtags, userName, mode, platformColor }: any) {
  const ratioMap: Record<string, string> = {
    'feed-square':    '1/1',
    'feed-portrait':  '4/5',
    'feed-landscape': '16/9',
  }
  const ratio = ratioMap[mode] || '1/1'
  const isTwitter  = platform === 'twitter'
  const isLinkedIn = platform === 'linkedin'

  return (
    <div className="w-full max-w-sm">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="flex items-center gap-2.5 px-4 py-3">
          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${platformColor} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
            {userName[0]?.toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 text-sm leading-tight">@{userName}</p>
            <p className="text-gray-400 text-xs">Baru saja</p>
          </div>
          <span className="text-gray-400 text-xl">···</span>
        </div>

        {/* Media */}
        <div className="relative bg-gray-900 overflow-hidden" style={{ aspectRatio: ratio }}>
          {current && <EditedMedia mf={current} />}

          {allMedia.length > 1 && (
            <>
              <div className="absolute top-2.5 right-2.5 bg-black/60 text-white text-xs rounded-full px-2 py-0.5 font-medium z-10">
                {mediaIndex + 1}/{allMedia.length}
              </div>
              <button onClick={() => setMediaIndex((i: number) => Math.max(0, i - 1))}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-700 rounded-full p-1 shadow z-10 transition-colors">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setMediaIndex((i: number) => Math.min(allMedia.length - 1, i + 1))}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-700 rounded-full p-1 shadow z-10 transition-colors">
                <ChevronRight size={16} />
              </button>
              <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 z-10">
                {allMedia.map((_: any, i: number) => (
                  <button key={i} onClick={() => setMediaIndex(i)}
                    className={cn('w-1.5 h-1.5 rounded-full transition-all', i === mediaIndex ? 'bg-white scale-125' : 'bg-white/50')} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        {!isTwitter && !isLinkedIn ? (
          <div className="px-4 py-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-xl cursor-pointer">❤️</span>
                <span className="text-xl cursor-pointer">💬</span>
                <span className="text-xl cursor-pointer">↗️</span>
              </div>
              <span className="text-xl cursor-pointer">🔖</span>
            </div>
            <p className="text-sm font-semibold text-gray-900">1.234 suka</p>
            {caption && (
              <p className="text-sm text-gray-800 leading-snug line-clamp-3">
                <span className="font-semibold">@{userName}</span>{' '}{caption}
              </p>
            )}
            {hashtags && <p className="text-sm text-blue-500 line-clamp-1">{hashtags}</p>}
            <p className="text-xs text-gray-400 uppercase tracking-wide">2 jam yang lalu</p>
          </div>
        ) : isTwitter ? (
          <div className="px-4 py-3 space-y-2">
            {caption && (
              <p className="text-sm text-gray-800 leading-snug">
                {caption}{' '}{hashtags && <span className="text-blue-500">{hashtags}</span>}
              </p>
            )}
            <div className="flex items-center gap-5 text-gray-400 text-xs pt-1">
              {[['💬','24'],['🔁','56'],['❤️','234'],['📊','5.6K']].map(([icon, n]) => (
                <span key={icon} className="flex items-center gap-1 cursor-pointer hover:text-blue-500">
                  {icon} <span>{n}</span>
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="px-4 py-3 space-y-2">
            {caption && <p className="text-sm text-gray-800 leading-snug line-clamp-3">{caption}</p>}
            <div className="flex items-center gap-4 text-xs text-gray-400 pt-1">
              <span className="cursor-pointer hover:text-blue-600">👍 Suka</span>
              <span className="cursor-pointer hover:text-blue-600">💬 Komentar</span>
              <span className="cursor-pointer hover:text-blue-600">↗️ Bagikan</span>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 text-center mt-3">
        {mode === 'feed-square' ? 'Feed Square 1:1 · 1080×1080'
          : mode === 'feed-portrait' ? 'Feed Portrait 4:5 · 1080×1350'
          : 'Feed Landscape 16:9 · 1080×566'}
      </p>
    </div>
  )
}
