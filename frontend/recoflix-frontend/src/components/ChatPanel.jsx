import { useState, useRef, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { api } from '../api/client'
import { enrichMovies } from '../data/moviesData'
import MovieCard from './MovieCard'

export default function ChatPanel() {
  const chatOpen = useStore(s => s.chatOpen)
  const setChatOpen = useStore(s => s.setChatOpen)
  const setChatResult = useStore(s => s.setChatResult)
  const registerDbIds = useStore(s => s.registerDbIds)

  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])
  const inputRef = useRef()
  const bottomRef = useRef()

  useEffect(() => {
    if (chatOpen) setTimeout(() => inputRef.current?.focus(), 100)
  }, [chatOpen])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history])

  async function handleSearch(e) {
    e?.preventDefault()
    if (!query.trim()) return
    const q = query.trim()
    setQuery('')
    setLoading(true)
    setHistory(h => [...h, { role: 'user', text: q }])

    try {
      const data = await api.chat(q)
      const raw = (data.movies || []).map(m => ({
        ...m,
        genres: typeof m.genres === 'string' ? m.genres.split(',').map(g => g.trim()) : (m.genres || []),
      }))
      // Register real DB ids — chat endpoint returns {id, title, genres} from DB
      registerDbIds(raw)
      // Enrich synchronously with poster URLs from bundled title map
      const enriched = enrichMovies(raw)
      setChatResult(enriched, data.response || '')
      setHistory(h => [...h, {
        role: 'assistant',
        text: data.response || 'Here are some movies matching your search:',
        movies: enriched,
      }])
    } catch (err) {
      setHistory(h => [...h, {
        role: 'assistant',
        text: 'Could not connect to backend. Make sure the FastAPI server is running.',
        error: true,
      }])
    } finally {
      setLoading(false)
    }
  }

  const SUGGESTIONS = [
    'action movies with great heist scenes',
    'feel-good comedy films',
    'sci-fi space exploration',
    'psychological thrillers',
    'romantic classics',
  ]

  if (!chatOpen) return null

  return (
    <>
      <div
        onClick={() => setChatOpen(false)}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.5)', animation: 'fadeIn 0.2s ease',
        }}
      />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 201,
        width: 'min(520px, 100vw)', background: 'var(--surface)',
        borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.6)',
        animation: 'slideRight 0.3s ease',
      }}>
        {/* Header */}
        <div style={{
          padding: '15px 20px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'var(--red-dim)', border: '1px solid rgba(229,9,20,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
          }}>🔍</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>AI Movie Search</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>
              Semantic search via <code>POST /chat/</code>
            </div>
          </div>
          <button
            onClick={() => setChatOpen(false)}
            style={{
              marginLeft: 'auto', background: 'rgba(255,255,255,0.06)',
              border: '1px solid var(--border)', color: 'var(--text)',
              width: 32, height: 32, borderRadius: 6, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >✕</button>
        </div>

        {/* Chat history */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '16px 20px',
          display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          {history.length === 0 && (
            <div style={{ textAlign: 'center', paddingTop: 32 }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🎬</div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Semantic Movie Search</div>
              <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 16 }}>
                Describe what you want — genres, moods, plot themes, or vibes.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                {SUGGESTIONS.map(s => (
                  <button key={s}
                    onClick={() => { setQuery(s); setTimeout(() => inputRef.current?.focus(), 0) }}
                    style={{
                      padding: '6px 12px', borderRadius: 20, fontSize: 11,
                      background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)',
                      color: 'var(--muted)', cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#fff' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'var(--muted)' }}
                  >{s}</button>
                ))}
              </div>
            </div>
          )}

          {history.map((msg, i) => (
            <div key={i} style={{ animation: 'fadeUp 0.3s ease' }}>
              <div style={{
                display: 'flex', gap: 8, alignItems: 'flex-start',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: msg.role === 'user' ? 'var(--red)' : 'rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
                }}>
                  {msg.role === 'user' ? 'U' : '🤖'}
                </div>
                <div style={{
                  maxWidth: '80%', padding: '10px 14px', borderRadius: 10,
                  background: msg.role === 'user' ? 'rgba(229,9,20,0.15)' : 'var(--surface2)',
                  border: `1px solid ${msg.role === 'user' ? 'rgba(229,9,20,0.3)' : 'var(--border)'}`,
                  fontSize: 13, lineHeight: 1.6,
                  color: msg.error ? '#f87171' : 'var(--text)',
                }}>
                  {msg.text}
                </div>
              </div>

              {msg.movies?.length > 0 && (
                <div style={{
                  marginTop: 12, overflowX: 'auto',
                  display: 'flex', gap: 10, paddingBottom: 8,
                  scrollbarWidth: 'none',
                }}>
                  {msg.movies.map(m => (
                    <MovieCard key={m.id || m.tmdb_id || m.title} movie={m} compact />
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--muted)', fontSize: 13 }}>
              <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
              Searching with vector embeddings...
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSearch} style={{
          padding: '14px 20px', borderTop: '1px solid var(--border)', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Action movies with twists, romantic comedies..."
              style={{
                flex: 1, background: 'rgba(255,255,255,0.06)',
                border: '1px solid var(--border)', borderRadius: 8,
                padding: '10px 14px', color: 'var(--text)', fontSize: 13, outline: 'none',
                transition: 'border 0.15s',
              }}
              onFocus={e => e.currentTarget.style.borderColor = 'rgba(229,9,20,0.5)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
            />
            <button type="submit" disabled={loading || !query.trim()} style={{
              padding: '10px 18px', borderRadius: 8, fontSize: 15,
              background: !query.trim() || loading ? 'rgba(255,255,255,0.06)' : 'var(--red)',
              color: '#fff', fontWeight: 700,
              cursor: !query.trim() || loading ? 'not-allowed' : 'pointer',
              opacity: !query.trim() ? 0.5 : 1, transition: 'all 0.2s',
              border: 'none',
            }}>→</button>
          </div>
        </form>
      </div>
    </>
  )
}
