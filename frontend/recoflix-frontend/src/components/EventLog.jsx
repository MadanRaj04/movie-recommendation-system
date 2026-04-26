import { useState } from 'react'
import { useStore } from '../store/useStore'

const EVENT_COLORS = {
  click: '#60a5fa',
  play: '#34d399',
  watch: '#a78bfa',
}

export default function EventLog() {
  const events = useStore(s => s.events)
  const currentUser = useStore(s => s.currentUser)
  const [open, setOpen] = useState(false)

  if (!currentUser) return null

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        title="Event Log"
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 100,
          width: 52, height: 52, borderRadius: '50%',
          background: open ? 'var(--red)' : 'var(--surface)',
          border: '1px solid var(--border)',
          color: '#fff', fontSize: 20, cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s',
        }}
      >
        {open ? '✕' : '📡'}
        {events.length > 0 && !open && (
          <div style={{
            position: 'absolute', top: -4, right: -4,
            width: 18, height: 18, borderRadius: '50%',
            background: 'var(--red)', fontSize: 10, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid var(--dark)',
          }}>
            {Math.min(events.length, 9)}
          </div>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 90, right: 24, zIndex: 100,
          width: 320, maxHeight: 440, background: 'var(--surface)',
          border: '1px solid var(--border)', borderRadius: 12,
          boxShadow: '0 8px 40px rgba(0,0,0,0.7)', overflow: 'hidden',
          animation: 'fadeUp 0.25s ease',
        }}>
          <div style={{
            padding: '12px 16px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>📡 Event Log</span>
            <span style={{
              fontSize: 10, padding: '2px 7px',
              background: 'var(--red-dim)', color: 'var(--red)',
              borderRadius: 4, border: '1px solid rgba(229,9,20,0.3)',
            }}>
              LIVE → /events/
            </span>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--muted)' }}>
              User #{currentUser.id}
            </span>
          </div>

          <div style={{ overflowY: 'auto', maxHeight: 360 }}>
            {events.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>👁️</div>
                No events yet — click or play a movie!
              </div>
            ) : events.map(ev => (
              <div key={ev.id} style={{
                padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)',
                display: 'flex', gap: 10, alignItems: 'flex-start',
                animation: 'fadeUp 0.2s ease',
                opacity: ev.pending ? 0.6 : 1,
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 4,
                  background: ev.pending ? '#888' : (EVENT_COLORS[ev.type] || '#888'),
                  boxShadow: ev.pending ? 'none' : `0 0 6px ${EVENT_COLORS[ev.type] || '#888'}`,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: ev.pending ? '#888' : (EVENT_COLORS[ev.type] || '#fff') }}>
                    {ev.label}
                    {ev.pending && (
                      <span style={{
                        marginLeft: 6, fontSize: 9, padding: '1px 5px',
                        background: 'rgba(255,255,255,0.08)', borderRadius: 3,
                        color: '#666', fontWeight: 500, verticalAlign: 'middle',
                      }}>local only</span>
                    )}
                  </div>
                  <div style={{
                    fontSize: 11, color: 'var(--text)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    marginTop: 1,
                  }}>
                    {ev.movieTitle}
                  </div>
                  {ev.genres && ev.genres.length > 0 && (
                    <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>
                      {(Array.isArray(ev.genres) ? ev.genres : ev.genres.split(',')).slice(0, 2).join(' · ')}
                    </div>
                  )}
                  {ev.pending && (
                    <div style={{ fontSize: 9, color: '#555', marginTop: 2 }}>
                      No DB id yet — will fire once seen in recs/search
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 10, color: 'var(--muted)', flexShrink: 0 }}>
                  {ev.ts}
                </div>
              </div>
            ))}
          </div>

          <div style={{
            padding: '8px 16px', borderTop: '1px solid var(--border)',
            fontSize: 10, color: 'var(--muted)',
          }}>
            Events sent to backend → update user embedding → better recs
          </div>
        </div>
      )}
    </>
  )
}
