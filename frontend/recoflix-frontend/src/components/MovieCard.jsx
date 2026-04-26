import { useState } from 'react'
import { getPosterStyle, parseGenres } from '../utils/poster'
import { useEventTracker } from '../hooks/useEventTracker'
import { useStore } from '../store/useStore'

export default function MovieCard({ movie, reason, compact = false }) {
  const [hovered, setHovered] = useState(false)
  const [imgError, setImgError] = useState(false)
  const setSelectedMovie = useStore(s => s.setSelectedMovie)
  const { track } = useEventTracker()

  const genres = parseGenres(movie.genres)
  const { gradient, accent } = getPosterStyle({ ...movie, genres })
  const posterUrl = movie.poster_url || movie.thumbnail_url

  function handleClick() {
    track('click', movie)
    setSelectedMovie(movie)
  }

  const w = compact ? 140 : 175
  const h = compact ? 210 : 262

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flexShrink: 0, width: w, cursor: 'pointer',
        transform: hovered ? 'scale(1.05) translateY(-6px)' : 'scale(1)',
        transition: 'transform 0.22s ease',
        zIndex: hovered ? 2 : 1, position: 'relative',
      }}
    >
      <div style={{
        width: w, height: h, borderRadius: 8,
        overflow: 'hidden', position: 'relative',
        border: hovered ? `2px solid ${accent}88` : '2px solid transparent',
        transition: 'border 0.2s, box-shadow 0.2s',
        boxShadow: hovered ? `0 16px 48px rgba(0,0,0,0.8), 0 0 0 1px ${accent}33` : '0 4px 16px rgba(0,0,0,0.5)',
        background: gradient,
      }}>
        {posterUrl && !imgError ? (
          <img
            src={posterUrl}
            alt={movie.title}
            onError={() => setImgError(true)}
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
              display: 'block',
              transition: 'opacity 0.3s',
              opacity: hovered ? 0.82 : 1,
            }}
            loading="lazy"
          />
        ) : (
          <>
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.02) 20px, rgba(255,255,255,0.02) 21px)`,
            }} />
            <div style={{
              position: 'absolute', inset: 0, display: 'flex',
              alignItems: 'center', justifyContent: 'center', padding: 12,
            }}>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: compact ? 16 : 20,
                color: '#fff', textAlign: 'center', lineHeight: 1.2,
                textShadow: '0 2px 8px rgba(0,0,0,0.8)', letterSpacing: '0.03em',
              }}>
                {movie.title}
              </div>
            </div>
          </>
        )}

        {hovered && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'fadeIn 0.15s ease',
          }}>
            <div style={{
              width: 46, height: 46, borderRadius: '50%',
              background: 'rgba(255,255,255,0.92)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, paddingLeft: 3,
              boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
            }}>▶</div>
          </div>
        )}

        <div style={{
          position: 'absolute', bottom: 8, left: 6, right: 6,
          display: 'flex', gap: 4, flexWrap: 'wrap',
          opacity: hovered ? 1 : 0, transition: 'opacity 0.2s',
        }}>
          {genres.slice(0, 2).map(g => (
            <span key={g} style={{
              fontSize: 9, padding: '2px 6px',
              background: 'rgba(0,0,0,0.85)', color: '#ccc',
              borderRadius: 4, backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255,255,255,0.15)', fontWeight: 600,
            }}>{g}</span>
          ))}
        </div>

        {movie.rating > 0 && (
          <div style={{
            position: 'absolute', top: 7, right: 7,
            background: 'rgba(0,0,0,0.75)', borderRadius: 4,
            padding: '2px 6px', fontSize: 10,
            color: '#fbbf24', fontWeight: 700,
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(251,191,36,0.2)',
          }}>
            ★ {Number(movie.rating).toFixed(1)}
          </div>
        )}
      </div>

      <div style={{ marginTop: 7, padding: '0 2px' }}>
        <div style={{
          fontSize: compact ? 11 : 12, fontWeight: 600,
          color: hovered ? '#fff' : 'var(--text)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          transition: 'color 0.15s',
        }}>
          {movie.title}
        </div>
        {reason ? (
          <div style={{
            fontSize: 10, color: accent, marginTop: 2,
            overflow: 'hidden', textOverflow: 'ellipsis',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            lineHeight: 1.4,
          }}>{reason}</div>
        ) : movie.release_year ? (
          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>
            {movie.release_year}
          </div>
        ) : null}
      </div>
    </div>
  )
}
