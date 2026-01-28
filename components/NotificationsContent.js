'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, formatDistanceToNow } from 'date-fns'
import {
  Bell,
  Clock,
  Users,
  FileText,
  CheckCircle,
  AlertTriangle,
  Trash2,
  Check
} from 'lucide-react'

export default function NotificationsContent({ notifications: initialNotifications, userId }) {
  const [notifications, setNotifications] = useState(initialNotifications)
  const supabase = createClient()

  const getIcon = (type) => {
    switch (type) {
      case 'deadline': return AlertTriangle
      case 'reminder': return Clock
      case 'team_invite': return Users
      case 'status_change': return FileText
      case 'new_grant': return Bell
      default: return Bell
    }
  }

  const getIconColor = (type) => {
    switch (type) {
      case 'deadline': return 'text-red-500 bg-red-100'
      case 'reminder': return 'text-blue-500 bg-blue-100'
      case 'team_invite': return 'text-purple-500 bg-purple-100'
      case 'status_change': return 'text-green-500 bg-green-100'
      case 'new_grant': return 'text-sacred-500 bg-sacred-100'
      default: return 'text-earth-500 bg-earth-100'
    }
  }

  const markAsRead = async (id) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)

    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  const markAllAsRead = async () => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)

    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    )
  }

  const deleteNotification = async (id) => {
    await supabase
      .from('notifications')
      .delete()
      .eq('id', id)

    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-earth-900">Notifications</h1>
          <p className="text-earth-600 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 text-sacred-600 hover:bg-sacred-50 rounded-lg transition-colors"
          >
            <CheckCircle className="w-5 h-5" />
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-earth-200">
          <Bell className="w-12 h-12 text-earth-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-earth-900 mb-2">No notifications yet</h3>
          <p className="text-earth-600">
            You'll see deadline reminders and updates here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(notification => {
            const Icon = getIcon(notification.type)
            const iconColor = getIconColor(notification.type)

            return (
              <div
                key={notification.id}
                className={`bg-white rounded-xl p-4 border transition-colors ${
                  notification.read
                    ? 'border-earth-200'
                    : 'border-sacred-200 bg-sacred-50/30'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${iconColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className={`font-semibold ${notification.read ? 'text-earth-700' : 'text-earth-900'}`}>
                          {notification.title}
                        </h3>
                        {notification.message && (
                          <p className="text-earth-600 text-sm mt-1">
                            {notification.message}
                          </p>
                        )}
                        <p className="text-earth-400 text-xs mt-2">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-2 text-earth-400 hover:text-sacred-600 hover:bg-earth-100 rounded-lg transition-colors"
                            title="Mark as read"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="p-2 text-earth-400 hover:text-red-600 hover:bg-earth-100 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
