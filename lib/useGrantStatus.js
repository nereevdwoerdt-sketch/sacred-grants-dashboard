'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useGrantStatus(userId) {
  const [grantStatuses, setGrantStatuses] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const supabase = createClient()

  // Fetch all grant statuses for the user
  const fetchStatuses = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('user_grant_status')
        .select('*')
        .eq('user_id', userId)

      if (fetchError) throw fetchError

      // Convert to a map for easy lookup
      const statusMap = {}
      data?.forEach(item => {
        statusMap[item.grant_id] = item
      })
      setGrantStatuses(statusMap)
    } catch (err) {
      console.error('Error fetching grant statuses:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [userId, supabase])

  useEffect(() => {
    fetchStatuses()
  }, [fetchStatuses])

  // Archive a grant
  const archiveGrant = async (grantId, reason = '') => {
    if (!userId) return { error: 'Not logged in' }

    try {
      const { data, error: upsertError } = await supabase
        .from('user_grant_status')
        .upsert({
          user_id: userId,
          grant_id: grantId,
          status: 'archived',
          reason,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,grant_id'
        })
        .select()
        .single()

      if (upsertError) throw upsertError

      setGrantStatuses(prev => ({
        ...prev,
        [grantId]: data
      }))

      return { success: true, data }
    } catch (err) {
      console.error('Error archiving grant:', err)
      return { error: err.message }
    }
  }

  // Permanently delete (mark as deleted)
  const deleteGrant = async (grantId, reason = '') => {
    if (!userId) return { error: 'Not logged in' }

    try {
      const { data, error: upsertError } = await supabase
        .from('user_grant_status')
        .upsert({
          user_id: userId,
          grant_id: grantId,
          status: 'deleted',
          reason,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,grant_id'
        })
        .select()
        .single()

      if (upsertError) throw upsertError

      setGrantStatuses(prev => ({
        ...prev,
        [grantId]: data
      }))

      return { success: true, data }
    } catch (err) {
      console.error('Error deleting grant:', err)
      return { error: err.message }
    }
  }

  // Restore a grant (set back to active)
  const restoreGrant = async (grantId) => {
    if (!userId) return { error: 'Not logged in' }

    try {
      // Remove the status entry entirely
      const { error: deleteError } = await supabase
        .from('user_grant_status')
        .delete()
        .eq('user_id', userId)
        .eq('grant_id', grantId)

      if (deleteError) throw deleteError

      setGrantStatuses(prev => {
        const updated = { ...prev }
        delete updated[grantId]
        return updated
      })

      return { success: true }
    } catch (err) {
      console.error('Error restoring grant:', err)
      return { error: err.message }
    }
  }

  // Check if a grant is archived
  const isArchived = (grantId) => {
    return grantStatuses[grantId]?.status === 'archived'
  }

  // Check if a grant is deleted
  const isDeleted = (grantId) => {
    return grantStatuses[grantId]?.status === 'deleted'
  }

  // Check if a grant is hidden (archived or deleted)
  const isHidden = (grantId) => {
    const status = grantStatuses[grantId]?.status
    return status === 'archived' || status === 'deleted'
  }

  // Get grant status
  const getStatus = (grantId) => {
    return grantStatuses[grantId]?.status || 'active'
  }

  // Filter grants by visibility
  const filterGrants = (grants, showArchived = false, showDeleted = false) => {
    return grants.filter(grant => {
      const status = getStatus(grant.id)
      if (status === 'active') return true
      if (status === 'archived' && showArchived) return true
      if (status === 'deleted' && showDeleted) return true
      return false
    })
  }

  // Get archived grants
  const getArchivedGrants = (grants) => {
    return grants.filter(grant => isArchived(grant.id))
  }

  // Get deleted grants
  const getDeletedGrants = (grants) => {
    return grants.filter(grant => isDeleted(grant.id))
  }

  // Count archived/deleted
  const archivedCount = Object.values(grantStatuses).filter(s => s.status === 'archived').length
  const deletedCount = Object.values(grantStatuses).filter(s => s.status === 'deleted').length

  return {
    grantStatuses,
    loading,
    error,
    archiveGrant,
    deleteGrant,
    restoreGrant,
    isArchived,
    isDeleted,
    isHidden,
    getStatus,
    filterGrants,
    getArchivedGrants,
    getDeletedGrants,
    archivedCount,
    deletedCount,
    refresh: fetchStatuses
  }
}
