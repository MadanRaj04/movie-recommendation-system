const BASE = '/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  login: () =>
    request('/auth/login', { method: 'POST' }),

  getRecommendations: (userId) =>
    request(`/recommend/${userId}`),

  trackEvent: (userId, movieId, eventType) =>
    request('/events/', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, movie_id: movieId, event_type: eventType }),
    }),

  chat: (query) =>
    request('/chat/', {
      method: 'POST',
      body: JSON.stringify({ query }),
    }),

  getMovies: () =>
    request('/movies/'),
}
