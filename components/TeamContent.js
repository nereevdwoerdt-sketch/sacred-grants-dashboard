'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Users,
  Plus,
  Mail,
  Crown,
  Shield,
  User,
  Eye,
  Trash2,
  Copy,
  Check
} from 'lucide-react'

export default function TeamContent({ teams: initialTeams, userId, userEmail }) {
  const [teams, setTeams] = useState(initialTeams)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(null)
  const [newTeamName, setNewTeamName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [creating, setCreating] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [copied, setCopied] = useState(false)

  const supabase = createClient()

  const getRoleIcon = (role) => {
    switch (role) {
      case 'owner': return Crown
      case 'admin': return Shield
      case 'member': return User
      case 'viewer': return Eye
      default: return User
    }
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'owner': return 'text-yellow-600 bg-yellow-100'
      case 'admin': return 'text-purple-600 bg-purple-100'
      case 'member': return 'text-blue-600 bg-blue-100'
      case 'viewer': return 'text-earth-600 bg-earth-100'
      default: return 'text-earth-600 bg-earth-100'
    }
  }

  const createTeam = async () => {
    if (!newTeamName.trim()) return

    setCreating(true)
    const slug = newTeamName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

    const { data: team, error } = await supabase
      .from('teams')
      .insert({
        name: newTeamName,
        slug: slug,
        created_by: userId
      })
      .select()
      .single()

    if (!error && team) {
      // Add creator as owner
      await supabase
        .from('team_members')
        .insert({
          team_id: team.id,
          user_id: userId,
          role: 'owner',
          invited_by: userId
        })

      setTeams(prev => [...prev, {
        ...team,
        role: 'owner',
        members: [{
          user_id: userId,
          role: 'owner',
          profile: { email: userEmail }
        }]
      }])
    }

    setNewTeamName('')
    setShowCreateModal(false)
    setCreating(false)
  }

  const inviteMember = async (teamId) => {
    if (!inviteEmail.trim()) return

    setInviting(true)

    // In a real implementation, this would send an email invitation
    // For now, we'll just show a placeholder

    // Check if user exists
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', inviteEmail)
      .single()

    if (profile) {
      // Add directly if user exists
      const { error } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: profile.id,
          role: inviteRole,
          invited_by: userId
        })

      if (!error) {
        // Refresh team members
        const { data: members } = await supabase
          .from('team_members')
          .select('*, profile:profiles(*)')
          .eq('team_id', teamId)

        setTeams(prev => prev.map(t =>
          t.id === teamId ? { ...t, members: members || [] } : t
        ))
      }
    } else {
      // In production, send invitation email
      alert(`Invitation would be sent to ${inviteEmail}`)
    }

    setInviteEmail('')
    setShowInviteModal(null)
    setInviting(false)
  }

  const copyInviteLink = (teamSlug) => {
    const link = `${window.location.origin}/join/${teamSlug}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-earth-900">Team</h1>
          <p className="text-earth-600 mt-1">
            Collaborate with your team on grant applications
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-sacred-600 text-white rounded-lg hover:bg-sacred-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Team
        </button>
      </div>

      {teams.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-earth-200">
          <Users className="w-12 h-12 text-earth-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-earth-900 mb-2">No teams yet</h3>
          <p className="text-earth-600 mb-6">
            Create a team to collaborate with others on grant applications
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-sacred-600 text-white rounded-lg hover:bg-sacred-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create your first team
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {teams.map(team => {
            const RoleIcon = getRoleIcon(team.role)
            return (
              <div key={team.id} className="bg-white rounded-xl p-6 border border-earth-200">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-earth-900">{team.name}</h3>
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium mt-2 ${getRoleColor(team.role)}`}>
                      <RoleIcon className="w-3 h-3" />
                      {team.role}
                    </div>
                  </div>
                  {(team.role === 'owner' || team.role === 'admin') && (
                    <button
                      onClick={() => setShowInviteModal(team.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-sacred-600 hover:bg-sacred-50 rounded-lg transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                      Invite
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-earth-500 font-medium">Members ({team.members.length})</p>
                  {team.members.map(member => {
                    const MemberIcon = getRoleIcon(member.role)
                    return (
                      <div key={member.user_id} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-earth-100 flex items-center justify-center text-earth-600 text-sm font-medium">
                            {member.profile?.full_name?.charAt(0) || member.profile?.email?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-earth-900">
                              {member.profile?.full_name || 'Unknown'}
                            </p>
                            <p className="text-xs text-earth-500">{member.profile?.email}</p>
                          </div>
                        </div>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${getRoleColor(member.role)}`}>
                          <MemberIcon className="w-3 h-3" />
                          {member.role}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="mt-4 pt-4 border-t border-earth-200">
                  <button
                    onClick={() => copyInviteLink(team.slug)}
                    className="flex items-center gap-2 text-sm text-earth-600 hover:text-sacred-600 transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy invite link'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowCreateModal(false)} />
          <div className="relative bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold text-earth-900 mb-4">Create Team</h2>
            <input
              type="text"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="Team name"
              className="w-full px-4 py-2 border border-earth-300 rounded-lg focus:ring-2 focus:ring-sacred-500 focus:border-sacred-500 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-earth-300 rounded-lg hover:bg-earth-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createTeam}
                disabled={creating || !newTeamName.trim()}
                className="flex-1 px-4 py-2 bg-sacred-600 text-white rounded-lg hover:bg-sacred-700 disabled:opacity-50 transition-colors"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowInviteModal(null)} />
          <div className="relative bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold text-earth-900 mb-4">Invite Team Member</h2>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Email address"
              className="w-full px-4 py-2 border border-earth-300 rounded-lg focus:ring-2 focus:ring-sacred-500 focus:border-sacred-500 mb-4"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="w-full px-4 py-2 border border-earth-300 rounded-lg focus:ring-2 focus:ring-sacred-500 focus:border-sacred-500 mb-4"
            >
              <option value="member">Member - Can edit progress</option>
              <option value="admin">Admin - Can manage team</option>
              <option value="viewer">Viewer - Read only</option>
            </select>
            <div className="flex gap-3">
              <button
                onClick={() => setShowInviteModal(null)}
                className="flex-1 px-4 py-2 border border-earth-300 rounded-lg hover:bg-earth-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => inviteMember(showInviteModal)}
                disabled={inviting || !inviteEmail.trim()}
                className="flex-1 px-4 py-2 bg-sacred-600 text-white rounded-lg hover:bg-sacred-700 disabled:opacity-50 transition-colors"
              >
                {inviting ? 'Inviting...' : 'Send Invite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
