import { useCallback } from 'react'
import { api } from '../api/client'
import { useStore } from '../store/useStore'

const EVENT_LABELS = {
  click: '🖱️ Clicked',
  play:  '▶️ Played',
  watch: '👁️ Watched',
}

export function useEventTracker() {
  const currentUser  = useStore(s => s.currentUser)
  const addEvent     = useStore(s => s.addEvent)
  const titleToDbId  = useStore(s => s.titleToDbId)

  const track = useCallback(async (eventType, movie) => {
    if (!currentUser) return

    // Resolve the backend DB integer id.
    // Priority: movie.id (from backend recs/chat) → titleToDbId lookup → tmdb_id
    const dbId =
      movie.id ||
      titleToDbId[(movie.title || '').toLowerCase()] ||
      movie.tmdb_id

    // Always record in the local event log regardless of whether we have a DB id
    addEvent({
      id:         Date.now(),
      type:       eventType,
      label:      EVENT_LABELS[eventType] || eventType,
      movieTitle: movie.title,
      movieId:    dbId,
      genres:     movie.genres,
      ts:         new Date().toLocaleTimeString(),
      // Flag catalog-only movies where we can't resolve a DB id yet
      pending:    !dbId,
    })

    if (!dbId) {
      // Can't send to backend without a valid movie_id FK — log and skip
      console.info(
        `[events] No DB id for "${movie.title}" (tmdb_id=${movie.tmdb_id}) — ` +
        `event logged locally only. It will fire once this movie appears in recommendations.`
      )
      return
    }

    try {
      await api.trackEvent(currentUser.id, dbId, eventType)
    } catch (err) {
      console.warn('[events] Track failed:', err.message)
    }
  }, [currentUser, addEvent, titleToDbId])

  return { track }
}
