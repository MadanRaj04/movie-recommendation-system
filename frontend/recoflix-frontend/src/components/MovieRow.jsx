import { useRef } from 'react'
import MovieCard from './MovieCard'

export default function MovieRow({ title, movies = [], loading = false, badge, compact = false }) {
  const rowRef = useRef()

  function scroll(dir) {
    if (!rowRef.current) return
    rowRef.current.scrollBy({ left: dir * 500, behavior: 'smooth' })
  }

  return (
    <section style={{ marginBottom: 40 }}>
      {/* Row header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, padding: '0 48px' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: '0.02em' }}>
          {title}
        </h2>
        {badge && (
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 8px',
            background: 'var(--red)', color: '#fff', borderRadius: 4,
            letterSpacing: '0.08em',
          }}>
            {badge}
          </span>
        )}
        <div style={{ flex: 1 }} />
        <button
          onClick={() => scroll(-1)}
          style={{
            background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border)',
            color: '#fff', borderRadius: 6, padding: '4px 10px', fontSize: 14,
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
        >←</button>
        <button
          onClick={() => scroll(1)}
          style={{
            background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border)',
            color: '#fff', borderRadius: 6, padding: '4px 10px', fontSize: 14,
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
        >→</button>
      </div>

      {/* Scroll container */}
      <div
        ref={rowRef}
        style={{
          display: 'flex', gap: 12, overflowX: 'auto',
          padding: '8px 48px 12px',
          scrollbarWidth: 'none',
        }}
      >
        {loading
          ? Array.from({ length: compact ? 8 : 6 }).map((_, i) => (
              <div
                key={i}
                className="skeleton"
                style={{
                  flexShrink: 0,
                  width: compact ? 140 : 180,
                  height: compact ? 210 : 270,
                  borderRadius: 8,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))
          : movies.length === 0
          ? (
            <div style={{
              padding: '40px 0', color: 'var(--muted)', fontSize: 14,
            }}>
              No movies found.
            </div>
          )
          : movies.map(movie => (
              <MovieCard
                key={movie.id || movie.tmdb_id || movie.title}
                movie={movie}
                reason={movie.reason}
                compact={compact}
              />
            ))
        }
      </div>
    </section>
  )
}
