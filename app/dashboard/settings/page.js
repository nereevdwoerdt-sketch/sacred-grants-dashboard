'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  User,
  Bell,
  Shield,
  Palette,
  Save,
  CheckCircle
} from 'lucide-react'

export default function SettingsPage() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [fullName, setFullName] = useState('')
  const [notifications, setNotifications] = useState({
    deadlineAlerts: true,
    weeklyDigest: true,
    teamUpdates: true
  })

  const supabase = createClient()

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        setProfile(profile)
        setFullName(profile.full_name || '')
      }
    }
    setLoading(false)
  }

  const saveProfile = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id)
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-sacred-200 border-t-sacred-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-serif font-bold text-earth-900">Settings</h1>
        <p className="text-earth-600 mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile Section */}
      <div className="bg-white rounded-xl shadow-sm border border-earth-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-sacred-100 rounded-lg">
            <User className="w-5 h-5 text-sacred-600" />
          </div>
          <h2 className="text-lg font-semibold text-earth-900">Profile</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-earth-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2 border border-earth-300 rounded-lg focus:ring-2 focus:ring-sacred-500 focus:border-sacred-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-earth-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={profile?.email || ''}
              disabled
              className="w-full px-4 py-2 border border-earth-200 rounded-lg bg-earth-50 text-earth-500"
            />
            <p className="text-xs text-earth-500 mt-1">Email cannot be changed</p>
          </div>

          <button
            onClick={saveProfile}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-sacred-600 text-white rounded-lg hover:bg-sacred-700 disabled:opacity-50 transition-colors"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : saved ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="bg-white rounded-xl shadow-sm border border-earth-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Bell className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold text-earth-900">Notifications</h2>
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-between p-3 bg-earth-50 rounded-lg cursor-pointer">
            <div>
              <p className="font-medium text-earth-900">Deadline Alerts</p>
              <p className="text-sm text-earth-500">Get notified before grant deadlines</p>
            </div>
            <input
              type="checkbox"
              checked={notifications.deadlineAlerts}
              onChange={(e) => setNotifications(prev => ({
                ...prev,
                deadlineAlerts: e.target.checked
              }))}
              className="w-5 h-5 text-sacred-600 rounded focus:ring-sacred-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 bg-earth-50 rounded-lg cursor-pointer">
            <div>
              <p className="font-medium text-earth-900">Weekly Digest</p>
              <p className="text-sm text-earth-500">Summary of upcoming deadlines each week</p>
            </div>
            <input
              type="checkbox"
              checked={notifications.weeklyDigest}
              onChange={(e) => setNotifications(prev => ({
                ...prev,
                weeklyDigest: e.target.checked
              }))}
              className="w-5 h-5 text-sacred-600 rounded focus:ring-sacred-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 bg-earth-50 rounded-lg cursor-pointer">
            <div>
              <p className="font-medium text-earth-900">Team Updates</p>
              <p className="text-sm text-earth-500">Notifications when team members update progress</p>
            </div>
            <input
              type="checkbox"
              checked={notifications.teamUpdates}
              onChange={(e) => setNotifications(prev => ({
                ...prev,
                teamUpdates: e.target.checked
              }))}
              className="w-5 h-5 text-sacred-600 rounded focus:ring-sacred-500"
            />
          </label>
        </div>
      </div>

      {/* Security Section */}
      <div className="bg-white rounded-xl shadow-sm border border-earth-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-100 rounded-lg">
            <Shield className="w-5 h-5 text-green-600" />
          </div>
          <h2 className="text-lg font-semibold text-earth-900">Security</h2>
        </div>

        <div className="space-y-4">
          <button className="w-full text-left p-3 bg-earth-50 rounded-lg hover:bg-earth-100 transition-colors">
            <p className="font-medium text-earth-900">Change Password</p>
            <p className="text-sm text-earth-500">Update your password</p>
          </button>

          <button className="w-full text-left p-3 bg-earth-50 rounded-lg hover:bg-earth-100 transition-colors">
            <p className="font-medium text-earth-900">Two-Factor Authentication</p>
            <p className="text-sm text-earth-500">Add an extra layer of security</p>
          </button>
        </div>
      </div>
    </div>
  )
}
