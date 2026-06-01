'use client'

import { useEffect, useState } from 'react'
import { Users, UserPlus, Crown, Shield, User, Trash2, Loader2, Mail, Check } from 'lucide-react'
import { toast } from '@/components/ui/Toaster'
import { cn } from '@/lib/utils'

const roleConfig = {
  owner: { label: 'Pemilik', icon: Crown,  color: 'text-yellow-600 bg-yellow-50' },
  admin: { label: 'Admin',   icon: Shield, color: 'text-purple-600 bg-purple-50' },
  editor:{ label: 'Editor',  icon: User,   color: 'text-blue-600 bg-blue-50' },
  member:{ label: 'Anggota', icon: User,   color: 'text-gray-600 bg-gray-100' },
  viewer:{ label: 'Penonton',icon: User,   color: 'text-gray-500 bg-gray-50' },
}

export default function TeamPage() {
  const [team, setTeam] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [inviting, setInviting] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [teamName, setTeamName] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => { loadTeam() }, [])

  async function loadTeam() {
    try {
      const res = await fetch('/api/team')
      const data = await res.json()
      setTeam(data.team)
      setMembers(data.members || [])
    } catch {
      toast.error('Gagal memuat data tim.')
    } finally {
      setLoading(false)
    }
  }

  async function createTeam() {
    if (!teamName.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: teamName }),
      })
      if (!res.ok) throw new Error()
      toast.success('Tim berhasil dibuat!')
      setShowCreate(false)
      loadTeam()
    } catch {
      toast.error('Gagal membuat tim.')
    } finally {
      setCreating(false)
    }
  }

  async function inviteMember() {
    if (!inviteEmail.trim()) return
    setInviting(true)
    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      })
      if (!res.ok) throw new Error()
      toast.success(`Undangan dikirim ke ${inviteEmail}`)
      setInviteEmail('')
      setShowInvite(false)
    } catch {
      toast.error('Gagal mengirim undangan.')
    } finally {
      setInviting(false)
    }
  }

  async function removeMember(memberId: string) {
    if (!confirm('Hapus anggota ini dari tim?')) return
    try {
      await fetch(`/api/team/members/${memberId}`, { method: 'DELETE' })
      setMembers(prev => prev.filter(m => m.id !== memberId))
      toast.success('Anggota dihapus.')
    } catch {
      toast.error('Gagal menghapus anggota.')
    }
  }

  async function updateRole(memberId: string, role: string) {
    try {
      await fetch(`/api/team/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role } : m))
      toast.success('Role diperbarui.')
    } catch {
      toast.error('Gagal memperbarui role.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <Loader2 size={32} className="animate-spin text-brand-600" />
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tim</h1>
          <p className="text-gray-500 mt-1">Kelola anggota tim dan izin akses.</p>
        </div>
        {team && (
          <button
            onClick={() => setShowInvite(true)}
            className="btn-primary flex items-center gap-2"
          >
            <UserPlus size={16} /> Undang Anggota
          </button>
        )}
      </div>

      {!team ? (
        <div className="card p-12 text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users size={28} className="text-brand-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Buat Tim Anda</h2>
          <p className="text-gray-500 text-sm mb-6">
            Buat tim untuk berkolaborasi dengan rekan dalam mengelola akun sosial media bersama.
          </p>
          {showCreate ? (
            <div className="space-y-3">
              <input
                type="text"
                value={teamName}
                onChange={e => setTeamName(e.target.value)}
                placeholder="Nama tim Anda"
                className="input"
              />
              <div className="flex gap-2">
                <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Batal</button>
                <button onClick={createTeam} disabled={creating} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {creating ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  Buat Tim
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 mx-auto">
              <Users size={16} /> Buat Tim Baru
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Team Info */}
          <div className="card p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                {team.name[0]}
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">{team.name}</h2>
                <p className="text-sm text-gray-400">{members.length} anggota</p>
              </div>
            </div>
          </div>

          {/* Members */}
          <div className="card">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Anggota Tim</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {members.map(member => {
                const roleCfg = roleConfig[member.role as keyof typeof roleConfig] || roleConfig.member
                const RoleIcon = roleCfg.icon
                return (
                  <div key={member.id} className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-brand-700 font-semibold text-sm">
                        {member.user?.name?.[0]?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">{member.user?.name}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Mail size={10} /> {member.user?.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {member.role !== 'owner' ? (
                        <select
                          value={member.role}
                          onChange={e => updateRole(member.id, e.target.value)}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        >
                          <option value="admin">Admin</option>
                          <option value="editor">Editor</option>
                          <option value="member">Anggota</option>
                          <option value="viewer">Penonton</option>
                        </select>
                      ) : (
                        <span className={`badge ${roleCfg.color} flex items-center gap-1`}>
                          <RoleIcon size={11} /> {roleCfg.label}
                        </span>
                      )}
                      {member.role !== 'owner' && (
                        <button
                          onClick={() => removeMember(member.id)}
                          className="text-gray-300 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-bold text-gray-900 text-lg mb-4">Undang Anggota</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="input"
                />
              </div>
              <div>
                <label className="label">Role</label>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value)}
                  className="input"
                >
                  <option value="admin">Admin - Akses penuh kecuali hapus tim</option>
                  <option value="editor">Editor - Buat & edit konten</option>
                  <option value="member">Anggota - Buat konten saja</option>
                  <option value="viewer">Penonton - Hanya lihat</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowInvite(false)} className="btn-secondary flex-1">Batal</button>
              <button
                onClick={inviteMember}
                disabled={inviting}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {inviting ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                Kirim Undangan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
