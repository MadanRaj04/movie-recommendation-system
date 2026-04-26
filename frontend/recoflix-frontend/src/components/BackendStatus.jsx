import { useState, useEffect } from 'react'

export default function BackendStatus() {
  const [status, setStatus] = useState('checking') // checking | ok | error

  useEffect(() => {
    check()
    const t = setInterval(check, 30000)
    return () => clearInterval(t)
  }, [])

  async function check() {
    try {
      const res = await fetch('/api/')
      if (res.ok) setStatus('ok')
      else setStatus('error')
    } catch {
      setStatus('error')
    }
  }

  const configs = {
    checking: { color: '#fbbf24', label: 'Checking...', dot: '#fbbf24' },
    ok: { color: '#34d399', label: 'Backend Online', dot: '#34d399' },
    error: { color: '#f87171', label: 'Backend Offline', dot: '#f87171' },
  }

  const c = configs[status]

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: 6,
      background: `${c.dot}11`, border: `1px solid ${c.dot}33`,
      fontSize: 11, color: c.color, fontWeight: 600,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: c.dot,
        animation: status === 'ok' ? 'pulse 2s ease infinite' : 'none',
        display: 'inline-block',
      }} />
      {c.label}
    </div>
  )
}
