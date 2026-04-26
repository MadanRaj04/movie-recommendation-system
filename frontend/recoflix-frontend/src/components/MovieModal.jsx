import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store/useStore'
import { useEventTracker } from '../hooks/useEventTracker'
import { getPosterStyle, parseGenres } from '../utils/poster'

const MILESTONES = [25, 50, 75, 100]

export default function MovieModal() {
  const movie = useStore(s => s.selectedMovie)
  const setSelectedMovie = useStore(s => s.setSelectedMovie)
  const { track } = useEventTracker()

  const [playing, setPlaying]         = useState(false)
  const [watchProgress, setWatchProgress] = useState(0)
  const [imgError, setImgError]       = useState(false)

  // Use refs for interval and milestone tracking so React StrictMode
  // double-invocation of state updaters never causes duplicate events.
  const timerRef       = useRef(null)
  const progressRef    = useRef(0)       // plain counter, not React state
  const firedRef       = useRef(new Set()) // milestones fired this session

  useEffect(() => {
    if (movie) {
      document.body.style.overflow = 'hidden'
      setPlaying(false)
      setWatchProgress(0)
      setImgError(false)
      progressRef.current = 0
      firedRef.current    = new Set()
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [movie])

  // Cleanup on unmount
  useEffect(() => () => clearInterval(timerRef.current), [])

  if (!movie) return null

  const genres     = parseGenres(movie.genres)
  const { gradient, accent } = getPosterStyle({ ...movie, genres })
  const backdropUrl = movie.backdrop_url || movie.poster_url

  function handleClose() {
    clearInterval(timerRef.current)
    setSelectedMovie(null)
  }

  function handlePlay() {
    if (playing) {
      clearInterval(timerRef.current)
      setPlaying(false)
      return
    }

    setPlaying(true)
    track('play', movie)

    timerRef.current = setInterval(() => {
      // Mutate the ref — no React state, so no double-invoke risk
      progressRef.current = Math.min(progressRef.current + 1, 100)
      const p = progressRef.current

      // Update display via React state (pure — no side effects here)
      setWatchProgress(p)

      // Fire milestone events exactly once per milestone per session
      if (MILESTONES.includes(p) && !firedRef.current.has(p)) {
        firedRef.current.add(p)
        track('watch', { ...movie, watchProgress: p })
      }

      if (p >= 100) {
        clearInterval(timerRef.current)
        setPlaying(false)
      }
    }, 180)
  }

  return (
    <div
      onClick={e => e.target === e.currentTarget && handleClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20, animation: 'fadeIn 0.2s ease',
      }}
    >
      <div style={{
        background: 'var(--surface)', borderRadius: 14, width: '100%', maxWidth: 760,
        overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.85)',
        border: '1px solid var(--border)', animation: 'scaleIn 0.25s ease',
        maxHeight: '90vh', overflowY: 'auto',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Hero image */}
        <div style={{ position: 'relative', height: 300, background: gradient, flexShrink: 0 }}>
          {backdropUrl && !imgError && (
            <img
              src={backdropUrl}
              alt={movie.title}
              onError={() => setImgError(true)}
              style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                objectFit: 'cover', objectPosition: 'center top',
              }}
            />
          )}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(24,24,24,1) 0%, rgba(24,24,24,0.3) 50%, rgba(0,0,0,0.2) 100%)',
          }} />

          <button onClick={handleClose} style={{
            position: 'absolute', top: 12, right: 12,
            background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff', width: 36, height: 36, borderRadius: '50%',
            fontSize: 15, cursor: 'pointer', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>

          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 28px 20px',
          }}>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontSize: 40, color: '#fff',
              lineHeight: 1.1, textShadow: '0 2px 8px rgba(0,0,0,0.5)', letterSpacing: '0.02em',
            }}>{movie.title}</h2>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 6 }}>
              {movie.rating > 0 && (
                <span style={{ color: '#fbbf24', fontWeight: 700 }}>★ {Number(movie.rating).toFixed(1)}</span>
              )}
              {movie.release_year && (
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{movie.release_year}</span>
              )}
              {movie.runtime && (
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{movie.runtime} min</span>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '20px 28px 28px', flex: 1 }}>
          {/* Genre tags */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
            {genres.map(g => (
              <span key={g} style={{
                fontSize: 11, padding: '3px 10px',
                background: `${accent}22`, color: accent,
                borderRadius: 20, border: `1px solid ${accent}44`, fontWeight: 600,
              }}>{g}</span>
            ))}
          </div>

          {/* Cast */}
          {movie.cast?.length > 0 && (
            <div style={{ marginBottom: 14, fontSize: 12, color: 'var(--muted)' }}>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginRight: 6 }}>Cast:</span>
              {(Array.isArray(movie.cast) ? movie.cast : movie.cast.split(',')).join(', ')}
            </div>
          )}

          {/* Overview */}
          {movie.overview && (
            <p style={{
              fontSize: 14, color: 'var(--text)', lineHeight: 1.75,
              marginBottom: 18, opacity: 0.85,
            }}>
              {movie.overview}
            </p>
          )}

          {/* AI reason */}
          {movie.reason && (
            <div style={{
              background: 'rgba(229,9,20,0.08)', border: '1px solid rgba(229,9,20,0.25)',
              borderRadius: 8, padding: '10px 14px', marginBottom: 18,
              fontSize: 13, color: '#fca5a5',
            }}>
              🎯 <strong>Why recommended:</strong> {movie.reason}
            </div>
          )}

          {/* Play + progress */}
          <div style={{ marginBottom: 18 }}>
            <button onClick={handlePlay} style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '11px 26px', borderRadius: 8, fontSize: 14, fontWeight: 700,
              background: playing ? 'rgba(255,255,255,0.1)' : '#fff',
              color: playing ? '#fff' : '#000',
              border: playing ? '1px solid var(--border)' : 'none',
              cursor: 'pointer', marginBottom: 10, transition: 'all 0.2s',
            }}>
              {playing ? '⏸ Pause' : '▶ Play'}
            </button>

            {watchProgress > 0 && (
              <div>
                <div style={{
                  height: 4, background: 'rgba(255,255,255,0.1)',
                  borderRadius: 2, overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', width: `${watchProgress}%`,
                    background: watchProgress === 100 ? '#34d399' : 'var(--red)',
                    borderRadius: 2, transition: 'width 0.18s ease',
                  }} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                  {watchProgress}% watched
                  {watchProgress === 100
                    ? ' · completed — embedding updated ✓'
                    : ' · tracking → POST /events/'}
                </div>
              </div>
            )}
          </div>

          {/* Details grid */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
            background: 'var(--surface2)', borderRadius: 8, padding: '14px 16px',
          }}>
            {[
              ['Movie ID', `#${movie.id || movie.tmdb_id}`],
              ['Rating', movie.rating > 0 ? `${Number(movie.rating).toFixed(1)} / 10` : '—'],
              ['Year', movie.release_year || '—'],
              ['Runtime', movie.runtime ? `${movie.runtime} min` : '—'],
            ].map(([label, val]) => (
              <div key={label}>
                <div style={{
                  fontSize: 10, color: 'var(--muted)',
                  letterSpacing: '0.08em', marginBottom: 2,
                }}>
                  {label.toUpperCase()}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>
                  {val}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
