import { useState } from 'react'
import { useStore, USERS } from '../store/useStore'
import { api } from '../api/client'

export default function LoginScreen() {
  const setUser = useStore(s => s.setUser)
  const [loading, setLoading] = useState(false)
  const [hovered, setHovered] = useState(null)

  async function handleSelect(user) {
    setLoading(true)
    try {
      const { token } = await api.login()
      setUser(user, token)
    } catch {
      setUser(user, 'dummy-token')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--dark)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 20px',
    }}>
      {/* Background grid */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        backgroundImage: 'linear-gradient(rgba(229,9,20,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(229,9,20,0.04) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', animation: 'fadeUp 0.6s ease' }}>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 'clamp(48px, 8vw, 80px)',
          color: 'var(--red)', letterSpacing: '0.05em', marginBottom: 4,
          textShadow: '0 0 40px rgba(229,9,20,0.5)',
        }}>
          RECOFLIX
        </div>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 48, letterSpacing: '0.1em' }}>
          AI-POWERED DYNAMIC MOVIE RECOMMENDATIONS
        </p>

        <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 32, color: 'var(--text)' }}>
          Who's watching?
        </p>

        <div style={{
          display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center',
          maxWidth: 680,
        }}>
          {USERS.map(user => (
            <button
              key={user.id}
              onClick={() => handleSelect(user)}
              onMouseEnter={() => setHovered(user.id)}
              onMouseLeave={() => setHovered(null)}
              disabled={loading}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                opacity: loading ? 0.5 : 1,
                transform: hovered === user.id ? 'translateY(-6px)' : 'translateY(0)',
                transition: 'transform 0.25s ease',
              }}
            >
              <div style={{
                width: 120, height: 120, borderRadius: 12,
                background: hovered === user.id
                  ? user.color
                  : `color-mix(in srgb, ${user.color} 70%, black)`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                border: hovered === user.id ? '3px solid white' : '3px solid transparent',
                transition: 'all 0.25s ease',
                boxShadow: hovered === user.id ? `0 8px 32px ${user.color}66` : 'none',
              }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 52, color: '#fff', lineHeight: 1 }}>
                  {user.letter}
                </span>
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 16, color: hovered === user.id ? '#fff' : 'var(--muted)' }}>
                  {user.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                  {user.preferences.join(' · ')}
                </div>
              </div>
            </button>
          ))}
        </div>

        <div style={{
          marginTop: 48, padding: '14px 20px',
          background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
          borderRadius: 10, maxWidth: 420, margin: '48px auto 0',
          fontSize: 12, color: 'var(--muted)', lineHeight: 1.7,
        }}>
          ⚡ Interactions (clicks, plays, watches) are tracked in real-time and sent to the backend to adapt your recommendations dynamically.
        </div>
      </div>
    </div>
  )
}
