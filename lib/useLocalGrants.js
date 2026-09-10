'use client'

import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEYS = {
  favorites: 'sacred-grant-favorites',
  notes: 'sacred-grant-notes',
  labels: 'sacred-grant-labels',
}

const DEFAULT_LABELS = [
  { id: 'priority', name: 'Prioriteit', emoji: '🔥', color: 'red' },
  { id: 'applying', name: 'Aanvragen', emoji: '📝', color: 'blue' },
  { id: 'later', name: 'Later bekijken', emoji: '⏰', color: 'yellow' },
  { id: 'discuss', name: 'Bespreken', emoji: '💬', color: 'purple' },
  { id: 'not-relevant', name: 'Niet relevant', emoji: '❌', color: 'gray' },
]

function safeGetItem(key) {
  try {
    const val = localStorage.getItem(key)
    return val ? JSON.parse(val) : null
  } catch {
    return null
  }
}

function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage full or unavailable
  }
}

export const labels = DEFAULT_LABELS

export function useLocalGrants() {
  const [favorites, setFavorites] = useState([])
  const [notesMap, setNotesMap] = useState({})
  const [labelsMap, setLabelsMap] = useState({})
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setFavorites(safeGetItem(STORAGE_KEYS.favorites) || [])
    setNotesMap(safeGetItem(STORAGE_KEYS.notes) || {})
    setLabelsMap(safeGetItem(STORAGE_KEYS.labels) || {})
    setLoaded(true)
  }, [])

  const isFavorite = useCallback((grantId) => favorites.includes(grantId), [favorites])

  const toggleFavorite = useCallback((grantId) => {
    setFavorites(prev => {
      const next = prev.includes(grantId)
        ? prev.filter(id => id !== grantId)
        : [...prev, grantId]
      safeSetItem(STORAGE_KEYS.favorites, next)
      return next
    })
  }, [])

  const getNote = useCallback((grantId) => notesMap[grantId] || '', [notesMap])

  const setNote = useCallback((grantId, text) => {
    setNotesMap(prev => {
      const next = { ...prev }
      if (text.trim()) {
        next[grantId] = text
      } else {
        delete next[grantId]
      }
      safeSetItem(STORAGE_KEYS.notes, next)
      return next
    })
  }, [])

  const getLabels = useCallback((grantId) => labelsMap[grantId] || [], [labelsMap])

  const toggleLabel = useCallback((grantId, labelId) => {
    setLabelsMap(prev => {
      const current = prev[grantId] || []
      const next = {
        ...prev,
        [grantId]: current.includes(labelId)
          ? current.filter(id => id !== labelId)
          : [...current, labelId]
      }
      if (next[grantId].length === 0) delete next[grantId]
      safeSetItem(STORAGE_KEYS.labels, next)
      return next
    })
  }, [])

  const getGrantsWithLabel = useCallback((labelId) => {
    return Object.entries(labelsMap)
      .filter(([_, labels]) => labels.includes(labelId))
      .map(([grantId]) => grantId)
  }, [labelsMap])

  return {
    favorites,
    isFavorite,
    toggleFavorite,
    getNote,
    setNote,
    notesMap,
    getLabels,
    toggleLabel,
    getGrantsWithLabel,
    labelsMap,
    loaded,
  }
}
