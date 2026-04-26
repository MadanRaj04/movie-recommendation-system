import { useState, useRef, useEffect, useCallback } from 'react'
import { searchMovies, loadSearchIndex } from '../data/moviesData'
import { useStore } from '../store/useStore'
import { useEventTracker } from '../hooks/useEventTracker'
import { parseGenres } from '../utils/poster'

export default function SearchBar() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [highlighted, setHighlighted] = useState(-1)

  const inputRef = useRef()
  const containerRef = useRef()
  const debounceRef = useRef()

  const setSelectedMovie = useStore(s => s.setSelectedMovie)
  const { track } = useEventTracker()

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Close on Escape
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur() }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  const runSearch = useCallback(async (q) => {
    if (q.trim().length === 0) { setResults([]); return }
    const found = await searchMovies(q, 8)
    setResults(found)
    setHighlighted(-1)
  }, [])

  function handleChange(e) {
    const q = e.target.value
    setQuery(q)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => runSearch(q), 120)
  }

  function handleFocus() {
    setOpen(true)
    // Pre-fetch the search index on first focus so subsequent keystrokes are instant
    loadSearchIndex()
    if (query.trim()) runSearch(query)
  }

  function handleKeyDown(e) {
    if (!results.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted(h => Math.min(h + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted(h => Math.max(h - 1, -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const idx = highlighted >= 0 ? highlighted : 0
      if (results[idx]) selectMovie(results[idx])
    }
  }

  function selectMovie(movie) {
    track('click', movie)
    setSelectedMovie(movie)
    setOpen(false)
    setQuery('')
    setResults([])
  }

  function clearSearch() {
    setQuery('')
    setResults([])
    setHighlighted(-1)
    inputRef.current?.focus()
  }

  const showDropdown = open && (results.length > 0 || query.trim().length > 0)

  return (
    <div ref={containerRef} style={{ position: 'relative', flex: 1, maxWidth: 520 }}>
      {/* Search input bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: open ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.07)',
        border: open ? '1px solid rgba(255,255,255,0.25)' : '1px solid var(--border)',
        borderRadius: open && showDropdown ? '10px 10px 0 0' : 10,
        padding: '7px 14px',
        transition: 'all 0.2s',
        borderBottom: open && showDropdown ? '1px solid rgba(255,255,255,0.08)' : undefined,
      }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ color: open ? '#fff' : 'var(--muted)', flexShrink: 0, transition: 'color 0.2s' }}>
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          ref={inputRef}
          value={query}
          onChange={handleChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder="Search movies..."
          style={{
            flex: 1, background: 'none', border: 'none', outline: 'none',
            color: '#fff', fontSize: 13, fontFamily: 'var(--font)',
            minWidth: 0,
          }}
        />
        {query && (
          <button onClick={clearSearch} style={{
            background: 'none', border: 'none', color: 'var(--muted)',
            cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 2px',
            display: 'flex', alignItems: 'center',
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#fff'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
          >✕</button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 800,
          background: 'rgba(18,18,18,0.98)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.12)', borderTop: 'none',
          borderRadius: '0 0 12px 12px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
          overflow: 'hidden',
          animation: 'fadeIn 0.15s ease',
        }}>
          {results.length === 0 && query.trim().length > 0 ? (
            <div style={{
              padding: '20px 16px', color: 'var(--muted)', fontSize: 13,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: 20 }}>🎬</span>
              No movies found for "<strong style={{ color: '#fff' }}>{query}</strong>"
            </div>
          ) : (
            <>
              {/* Text suggestion list (title only rows) */}
              {results.slice(0, 4).map((movie, i) => (
                <div
                  key={`suggestion-${movie.tmdb_id}`}
                  onClick={() => selectMovie(movie)}
                  onMouseEnter={() => setHighlighted(i)}
                  style={{
                    padding: '10px 16px', cursor: 'pointer',
                    background: highlighted === i ? 'rgba(255,255,255,0.08)' : 'transparent',
                    display: 'flex', alignItems: 'center', gap: 12,
                    borderBottom: i < Math.min(results.length, 4) - 1
                      ? '1px solid rgba(255,255,255,0.04)'
                      : 'none',
                    transition: 'background 0.1s',
                  }}
                >
                  {/* Small search icon */}
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    style={{ color: 'var(--muted)', flexShrink: 0 }}>
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <span style={{ fontSize: 13, color: '#e5e5e5', flex: 1 }}>
                    {highlightMatch(movie.title, query)}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                    {movie.release_year}
                  </span>
                </div>
              ))}

              {/* Divider */}
              {results.length > 0 && (
                <div style={{
                  padding: '10px 16px 6px',
                  fontSize: 10, color: 'var(--muted)',
                  letterSpacing: '0.08em', fontWeight: 600,
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                }}>
                  MOVIES
                </div>
              )}

              {/* Movie card grid — poster + info */}
              <div style={{
                display: 'flex', gap: 10, padding: '6px 16px 16px',
                overflowX: 'auto', scrollbarWidth: 'none',
              }}>
                {results.map((movie, i) => (
                  <SearchResultCard
                    key={`card-${movie.tmdb_id}`}
                    movie={movie}
                    highlighted={highlighted === i}
                    onSelect={() => selectMovie(movie)}
                    onHover={() => setHighlighted(i)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// Highlights the matched portion of the title in bold
function highlightMatch(title, query) {
  const idx = title.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return title
  return (
    <>
      {title.slice(0, idx)}
      <strong style={{ color: '#fff', fontWeight: 700 }}>
        {title.slice(idx, idx + query.length)}
      </strong>
      {title.slice(idx + query.length)}
    </>
  )
}

function SearchResultCard({ movie, highlighted, onSelect, onHover }) {
  const [imgError, setImgError] = useState(false)
  const genres = parseGenres(movie.genres)

  return (
    <div
      onClick={onSelect}
      onMouseEnter={onHover}
      style={{
        flexShrink: 0, width: 110, cursor: 'pointer',
        transform: highlighted ? 'translateY(-3px)' : 'translateY(0)',
        transition: 'transform 0.18s ease',
      }}
    >
      {/* Poster */}
      <div style={{
        width: 110, height: 160, borderRadius: 7, overflow: 'hidden',
        border: highlighted ? '2px solid rgba(229,9,20,0.6)' : '2px solid transparent',
        background: '#1a1a1a', position: 'relative',
        transition: 'border 0.15s',
        boxShadow: highlighted ? '0 8px 24px rgba(0,0,0,0.7)' : '0 2px 8px rgba(0,0,0,0.4)',
      }}>
        {movie.poster_url && !imgError ? (
          <img
            src={movie.poster_url}
            alt={movie.title}
            onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#1f1f1f', padding: 8,
          }}>
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: 13,
              color: '#555', textAlign: 'center', lineHeight: 1.2,
            }}>{movie.title}</span>
          </div>
        )}
        {/* Rating badge */}
        {movie.rating > 0 && (
          <div style={{
            position: 'absolute', top: 5, right: 5,
            background: 'rgba(0,0,0,0.8)', borderRadius: 3,
            padding: '1px 5px', fontSize: 9,
            color: '#fbbf24', fontWeight: 700,
          }}>★ {movie.rating.toFixed(1)}</div>
        )}
      </div>
      {/* Title */}
      <div style={{
        marginTop: 6, fontSize: 11, color: highlighted ? '#fff' : '#aaa',
        fontWeight: 500, lineHeight: 1.3,
        overflow: 'hidden', display: '-webkit-box',
        WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        transition: 'color 0.15s',
      }}>
        {movie.title}
      </div>
      {/* Year */}
      {movie.release_year && (
        <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>
          {movie.release_year}
          {genres[0] ? ` · ${genres[0]}` : ''}
        </div>
      )}
    </div>
  )
}
