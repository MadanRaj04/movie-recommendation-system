// Genre → gradient palette mapping
const GENRE_PALETTES = {
  Action: ['#1a0a0a', '#7f1d1d', '#E50914'],
  Thriller: ['#0a0a1a', '#1e1b4b', '#4f46e5'],
  Horror: ['#0a0010', '#2e1065', '#7c3aed'],
  Drama: ['#0a0a0a', '#1c1917', '#78716c'],
  Comedy: ['#0a0800', '#3f2000', '#f59e0b'],
  Romance: ['#0a001a', '#500724', '#ec4899'],
  'Science Fiction': ['#000a1a', '#0c1a3a', '#0ea5e9'],
  Animation: ['#001a0a', '#14532d', '#22c55e'],
  Adventure: ['#0a0600', '#431407', '#f97316'],
  Crime: ['#0a0a00', '#1a1200', '#ca8a04'],
  Fantasy: ['#000a10', '#0c2340', '#0d9488'],
  Mystery: ['#000010', '#0f172a', '#6366f1'],
  Default: ['#0a0a0a', '#1a1a2e', '#16213e'],
}

export function getPosterGradient(genres = []) {
  const genre = genres[0] || 'Default'
  const palette = GENRE_PALETTES[genre] || GENRE_PALETTES.Default
  return `linear-gradient(135deg, ${palette[0]} 0%, ${palette[1]} 50%, ${palette[2]} 100%)`
}

export function getPosterAccent(genres = []) {
  const genre = genres[0] || 'Default'
  const palette = GENRE_PALETTES[genre] || GENRE_PALETTES.Default
  return palette[2]
}

// Hash a string to a deterministic number
function hashStr(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0
  return Math.abs(h)
}

// Generate a unique visual pattern based on title
export function getPosterStyle(movie) {
  const genres = typeof movie.genres === 'string'
    ? movie.genres.split(',').map(g => g.trim())
    : (movie.genres || [])

  const gradient = getPosterGradient(genres)
  const accent = getPosterAccent(genres)
  const hash = hashStr(movie.title || 'movie')
  const angle = (hash % 180) + 'deg'
  const opacity = 0.3 + (hash % 40) / 100

  return { gradient, accent, angle, opacity }
}

export function parseGenres(genres) {
  if (!genres) return []
  if (Array.isArray(genres)) return genres
  return genres.split(',').map(g => g.trim()).filter(Boolean)
}
