import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { useEventTracker } from '../hooks/useEventTracker'
import { getPosterStyle, parseGenres } from '../utils/poster'

export default function HeroBanner({ movies = [], loading }) {
  const [idx, setIdx] = useState(0)
  const [imgLoaded, setImgLoaded] = useState(false)
  const setSelectedMovie = useStore(s => s.setSelectedMovie)
  const { track } = useEventTracker()

  const featured = movies[idx]

  useEffect(() => {
    setImgLoaded(false)
    if (movies.length <= 1) return
    const t = setInterval(() => {
      setIdx(i => (i + 1) % Math.min(movies.length, 5))
      setImgLoaded(false)
    }, 8000)
    return () => clearInterval(t)
  }, [movies.length])

  if (loading) {
    return (
      <div style={{ height: 540, position: 'relative', overflow: 'hidden', background: '#0d0d0d' }}>
        <div className="skeleton" style={{ position: 'absolute', inset: 0, borderRadius: 0 }} />
      </div>
    )
  }

  if (!featured) {
    return (
      <div style={{
        height: 540, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #0a0a0a, #1a0a0a)',
        flexDirection: 'column', gap: 12,
      }}>
        <div style={{ fontSize: 48 }}>🎬</div>
        <p style={{ color: 'var(--muted)', fontSize: 16 }}>Connect the backend to get personalized recommendations</p>
      </div>
    )
  }

  const genres = parseGenres(featured.genres)
  const { gradient, accent } = getPosterStyle({ ...featured, genres })
  const backdropUrl = featured.backdrop_url || featured.poster_url

  function handlePlay() { track('play', featured); setSelectedMovie(featured) }
  function handleInfo() { track('click', featured); setSelectedMovie(featured) }

  return (
    <div style={{ height: 540, position: 'relative', overflow: 'hidden' }}>
      {/* Backdrop image */}
      {backdropUrl && (
        <img
          key={backdropUrl}
          src={backdropUrl}
          alt=""
          onLoad={() => setImgLoaded(true)}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center top',
            opacity: imgLoaded ? 1 : 0,
            transition: 'opacity 0.6s ease',
          }}
        />
      )}

      {/* Gradient fallback always underneath */}
      <div style={{
        position: 'absolute', inset: 0, background: gradient,
        opacity: imgLoaded ? 0 : 1, transition: 'opacity 0.6s ease',
      }} />

      {/* Dark vignette overlays */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to right, rgba(8,8,8,0.92) 0%, rgba(8,8,8,0.55) 50%, rgba(8,8,8,0.1) 100%)',
      }} />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%',
        background: 'linear-gradient(to top, var(--dark) 0%, rgba(8,8,8,0.6) 60%, transparent 100%)',
      }} />
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '20%',
        background: 'linear-gradient(to bottom, rgba(8,8,8,0.6) 0%, transparent 100%)',
      }} />

      {/* Content */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '0 56px 52px',
        animation: 'fadeUp 0.5s ease',
      }}>
        {featured.reason && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 12px', borderRadius: 20, marginBottom: 14,
            background: 'rgba(0,0,0,0.55)', border: `1px solid ${accent}66`,
            backdropFilter: 'blur(8px)', fontSize: 11, color: accent, fontWeight: 700,
            letterSpacing: '0.06em',
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%', background: accent,
              display: 'inline-block', animation: 'pulse 2s infinite',
            }} />
            AI RECOMMENDED
          </div>
        )}

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(36px, 5vw, 66px)',
          color: '#fff', lineHeight: 1.0, marginBottom: 10,
          textShadow: '0 2px 20px rgba(0,0,0,0.6)',
          letterSpacing: '0.02em', maxWidth: '55%',
        }}>
          {featured.title}
        </h1>

        <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
          {featured.rating > 0 && (
            <span style={{ color: '#fbbf24', fontWeight: 700, fontSize: 14 }}>
              ★ {Number(featured.rating).toFixed(1)}
            </span>
          )}
          {featured.release_year && (
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{featured.release_year}</span>
          )}
          {featured.runtime && (
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{featured.runtime}m</span>
          )}
          {genres.slice(0, 3).map(g => (
            <span key={g} style={{
              fontSize: 11, padding: '3px 10px', borderRadius: 20,
              background: `${accent}22`, color: accent,
              border: `1px solid ${accent}44`, fontWeight: 600,
            }}>{g}</span>
          ))}
        </div>

        {(featured.overview || featured.reason) && (
          <p style={{
            fontSize: 13, color: 'rgba(255,255,255,0.7)',
            marginBottom: 22, maxWidth: 460, lineHeight: 1.65,
          }}>
            {featured.reason || featured.overview}
          </p>
        )}

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={handlePlay}
            style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '12px 28px', borderRadius: 8,
              background: '#fff', color: '#000', border: 'none',
              fontSize: 15, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >▶ Play</button>
          <button
            onClick={handleInfo}
            style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '12px 22px', borderRadius: 8,
              background: 'rgba(255,255,255,0.15)', color: '#fff',
              border: '1px solid rgba(255,255,255,0.35)',
              fontSize: 15, fontWeight: 600, cursor: 'pointer',
              backdropFilter: 'blur(8px)',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.24)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
          >ⓘ More Info</button>
        </div>
      </div>

      {/* Dot indicators */}
      {movies.length > 1 && (
        <div style={{
          position: 'absolute', bottom: 24, right: 56,
          display: 'flex', gap: 6,
        }}>
          {movies.slice(0, 5).map((_, i) => (
            <button key={i} onClick={() => { setIdx(i); setImgLoaded(false) }}
              style={{
                width: i === idx ? 24 : 8, height: 8, borderRadius: 4,
                border: 'none', cursor: 'pointer', padding: 0,
                background: i === idx ? accent : 'rgba(255,255,255,0.3)',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
