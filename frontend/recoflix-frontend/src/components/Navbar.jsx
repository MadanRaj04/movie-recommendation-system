import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import SearchBar from './SearchBar'

export default function Navbar({ onRefresh, refreshing }) {
  const currentUser = useStore(s => s.currentUser)
  const logout      = useStore(s => s.logout)
  const setChatOpen = useStore(s => s.setChatOpen)
  const chatOpen    = useStore(s => s.chatOpen)
  const events      = useStore(s => s.events)
  const [scrolled, setScrolled]   = useState(false)
  const [menuOpen, setMenuOpen]   = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 500,
      height: 'var(--nav-h)',
      background: scrolled
        ? 'rgba(8,8,8,0.97)'
        : 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, transparent 100%)',
      backdropFilter: scrolled ? 'blur(14px)' : 'none',
      borderBottom: scrolled ? '1px solid var(--border)' : 'none',
      display: 'flex', alignItems: 'center', padding: '0 40px', gap: 20,
      transition: 'all 0.3s ease',
    }}>

      {/* Logo */}
      <div style={{
        fontFamily: 'var(--font-display)', fontSize: 26, color: 'var(--red)',
        letterSpacing: '0.06em', flexShrink: 0,
        textShadow: '0 0 20px rgba(229,9,20,0.4)',
      }}>RECOFLIX</div>

      {/* Nav links */}
      <div style={{ display: 'flex', gap: 18, flexShrink: 0 }}>
        {['Home', 'For You', 'Trending'].map(label => (
          <button key={label} style={{
            background: 'none', border: 'none',
            color: label === 'Home' ? '#fff' : 'var(--muted)',
            fontSize: 13, fontWeight: label === 'Home' ? 600 : 400,
            cursor: 'pointer', padding: '4px 0', transition: 'color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#fff'}
          onMouseLeave={e => e.currentTarget.style.color = label === 'Home' ? '#fff' : 'var(--muted)'}
          >{label}</button>
        ))}
      </div>

      {/* ── Inline Search Bar ── */}
      <SearchBar />

      {/* Right-side actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>

        {/* AI Search button — now secondary */}
        <button
          onClick={() => setChatOpen(!chatOpen)}
          title="AI Semantic Search"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
            background: chatOpen ? 'rgba(167,139,250,0.18)' : 'rgba(255,255,255,0.07)',
            border: chatOpen ? '1px solid rgba(167,139,250,0.5)' : '1px solid var(--border)',
            color: chatOpen ? '#a78bfa' : 'var(--muted)',
            cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0,
          }}
          onMouseEnter={e => {
            if (!chatOpen) {
              e.currentTarget.style.background = 'rgba(255,255,255,0.12)'
              e.currentTarget.style.color = '#fff'
            }
          }}
          onMouseLeave={e => {
            if (!chatOpen) {
              e.currentTarget.style.background = 'rgba(255,255,255,0.07)'
              e.currentTarget.style.color = 'var(--muted)'
            }
          }}
        >
          <span>✨</span>
          <span>AI</span>
        </button>

        {/* Refresh */}
        <button
          onClick={onRefresh}
          disabled={refreshing}
          title="Refresh Recommendations"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500,
            background: 'rgba(255,255,255,0.07)', border: '1px solid var(--border)',
            color: 'var(--muted)', cursor: refreshing ? 'not-allowed' : 'pointer',
            opacity: refreshing ? 0.6 : 1, transition: 'all 0.2s', flexShrink: 0,
          }}
          onMouseEnter={e => !refreshing && (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
        >
          <span style={{ display: 'inline-block', animation: refreshing ? 'spin 0.7s linear infinite' : 'none' }}>⟳</span>
          <span>{refreshing ? 'Updating...' : 'Refresh'}</span>
        </button>

        {/* Events pill */}
        {events.length > 0 && (
          <div style={{
            fontSize: 11, padding: '4px 9px', flexShrink: 0,
            background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)',
            borderRadius: 6, color: '#34d399', fontWeight: 600, whiteSpace: 'nowrap',
          }}>
            {events.length} tracked
          </div>
        )}

        {/* Avatar + dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuOpen(m => !m)}
            style={{
              width: 34, height: 34, borderRadius: 8, border: 'none',
              background: currentUser?.color || 'var(--red)',
              color: '#fff', fontFamily: 'var(--font-display)', fontSize: 17,
              cursor: 'pointer', transition: 'transform 0.15s',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            {currentUser?.letter}
          </button>

          {menuOpen && (
            <div style={{
              position: 'absolute', top: 42, right: 0,
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 10, minWidth: 200, boxShadow: 'var(--shadow)',
              overflow: 'hidden', animation: 'fadeUp 0.2s ease', zIndex: 600,
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{currentUser?.name}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                  User ID: #{currentUser?.id}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                  {currentUser?.preferences?.join(' · ')}
                </div>
              </div>
              <div style={{ padding: 8 }}>
                <button
                  onClick={() => { setMenuOpen(false); logout() }}
                  style={{
                    width: '100%', padding: '8px 12px', textAlign: 'left',
                    background: 'none', border: 'none', color: '#f87171',
                    fontSize: 13, cursor: 'pointer', borderRadius: 6,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  ← Switch Profile
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
