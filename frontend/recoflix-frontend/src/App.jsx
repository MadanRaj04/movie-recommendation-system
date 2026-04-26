import { useEffect, useState, useCallback } from 'react'
import { useStore } from './store/useStore'
import { api } from './api/client'
import { catalog as staticCatalog, enrichMovies } from './data/moviesData'

import LoginScreen from './components/LoginScreen'
import Navbar from './components/Navbar'
import HeroBanner from './components/HeroBanner'
import MovieRow from './components/MovieRow'
import MovieModal from './components/MovieModal'
import ChatPanel from './components/ChatPanel'
import EventLog from './components/EventLog'

const GENRE_ROWS = [
  'Action',
  'Thriller',
  'Drama',
  'Crime',
  'Comedy',
  'Science Fiction',
  'Horror',
  'Romance',
  'Adventure',
  'Animation',
  'Family',
]

export default function App() {
  const currentUser       = useStore(s => s.currentUser)
  const recommendations   = useStore(s => s.recommendations)
  const setRecommendations = useStore(s => s.setRecommendations)
  const registerDbIds     = useStore(s => s.registerDbIds)
  const chatMovies        = useStore(s => s.chatMovies)
  const chatResponse      = useStore(s => s.chatResponse)

  const [loadingRecs, setLoadingRecs] = useState(false)
  const [refreshCount, setRefreshCount] = useState(0)

  const fetchRecs = useCallback(async () => {
    if (!currentUser) return
    setLoadingRecs(true)
    try {
      const data = await api.getRecommendations(currentUser.id)
      const raw = (data.recommendations || []).map(m => ({
        ...m,
        genres: typeof m.genres === 'string'
          ? m.genres.split(',').map(g => g.trim())
          : (m.genres || []),
      }))
      registerDbIds(raw)
      setRecommendations(enrichMovies(raw))
    } catch (err) {
      console.warn('Recommendations unavailable:', err.message)
      if (staticCatalog.Trending) setRecommendations(staticCatalog.Trending.slice(0, 12))
    } finally {
      setLoadingRecs(false)
    }
  }, [currentUser, setRecommendations])

  useEffect(() => {
    if (currentUser) fetchRecs()
  }, [currentUser, refreshCount])

  if (!currentUser) return <LoginScreen />

  const hasRecs       = recommendations.length > 0
  const hasChatResults = chatMovies.length > 0

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark)', paddingBottom: 80 }}>
      <Navbar onRefresh={() => setRefreshCount(c => c + 1)} refreshing={loadingRecs} />

      <HeroBanner
        movies={hasRecs ? recommendations : (staticCatalog.Trending || [])}
        loading={loadingRecs && !hasRecs}
      />

      <div style={{ paddingTop: 28 }}>
        {/* Personalized recommendations */}
        <MovieRow
          title={`Recommended for ${currentUser.name}`}
          movies={recommendations}
          loading={loadingRecs && !hasRecs}
          badge="AI PICKS"
        />

        {/* AI Chat search results */}
        {hasChatResults && (
          <>
            <MovieRow title="AI Search Results" movies={chatMovies} badge="SEARCH" />
            {chatResponse && (
              <div style={{
                margin: '-20px 48px 28px',
                padding: '10px 14px',
                background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)',
                borderRadius: 8, fontSize: 13, color: '#c4b5fd', lineHeight: 1.6,
              }}>
                ✨ {chatResponse}
              </div>
            )}
          </>
        )}

        {/* Trending */}
        <MovieRow
          title="Trending Now"
          movies={staticCatalog.Trending || []}
          badge="HOT"
        />

        {/* Genre rows */}
        {GENRE_ROWS.map(genre => (
          <MovieRow
            key={genre}
            title={
              genre === 'Science Fiction' ? 'Sci-Fi & Fantasy' :
              genre === 'Family' ? 'Family & Animation' :
              genre
            }
            movies={staticCatalog[genre] || []}
          />
        ))}
      </div>

      <MovieModal />
      <ChatPanel />
      <EventLog />
    </div>
  )
}
