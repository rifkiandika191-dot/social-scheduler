import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
  return num.toString()
}

export const PLATFORMS = {
  instagram: { name: 'Instagram', color: '#E1306C', gradient: 'from-purple-500 via-pink-500 to-orange-400' },
  twitter:   { name: 'Twitter/X',  color: '#1DA1F2', gradient: 'from-sky-400 to-sky-600' },
  tiktok:    { name: 'TikTok',     color: '#000000', gradient: 'from-gray-800 to-gray-900' },
  facebook:  { name: 'Facebook',   color: '#1877F2', gradient: 'from-blue-600 to-blue-800' },
  youtube:   { name: 'YouTube',    color: '#FF0000', gradient: 'from-red-500 to-red-700' },
  linkedin:  { name: 'LinkedIn',   color: '#0A66C2', gradient: 'from-blue-700 to-blue-900' },
} as const

export type Platform = keyof typeof PLATFORMS

export const PLATFORM_ICONS: Record<Platform, string> = {
  instagram: '📸',
  twitter:   '🐦',
  tiktok:    '🎵',
  facebook:  '👥',
  youtube:   '▶️',
  linkedin:  '💼',
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
