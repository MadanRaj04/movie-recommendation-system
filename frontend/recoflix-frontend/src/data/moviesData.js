// This import is resolved by vite-plugin-movies.js at build/dev time.
// It reads ../backend/data/raw/movies_clean.jsonl, buckets movies by genre,
// and exposes them as a plain JS module — no fetch, no async, instant access.
import { catalog, titleMap, genres as ALL_GENRES } from 'virtual:movies-catalog'

export { catalog, ALL_GENRES }

// searchIndex is fetched lazily from /search-index.json on first search focus.
// This keeps the main bundle small (~440KB gzip) instead of 2.5MB.
let _searchIndexPromise = null
let _searchIndex = null

export async function loadSearchIndex() {
  if (_searchIndex) return _searchIndex
  if (!_searchIndexPromise) {
    _searchIndexPromise = fetch('/search-index.json')
      .then(r => r.json())
      .then(data => { _searchIndex = data; return data })
  }
  return _searchIndexPromise
}

/**
 * Fast local title search. Resolves after the first fetch (cached after that).
 */
export async function searchMovies(query, limit = 8) {
  const index = await loadSearchIndex()
  if (!query || query.trim().length < 1) return []
  const q = query.trim().toLowerCase()

  const prefixMatches = []
  const substringMatches = []

  for (const m of index) {
    const t = m.title.toLowerCase()
    if (t.startsWith(q)) prefixMatches.push(m)
    else if (t.includes(q)) substringMatches.push(m)
  }

  const byPop = (a, b) => b.popularity - a.popularity
  return [
    ...prefixMatches.sort(byPop),
    ...substringMatches.sort(byPop),
  ].slice(0, limit)
}

export function enrichMovie(movie) {
  if (movie.poster_url) return movie
  const extra = titleMap[(movie.title || '').toLowerCase()]
  return extra ? { ...movie, ...extra } : movie
}

export function enrichMovies(movies) {
  return movies.map(enrichMovie)
}

export function lookupByTitle(title) {
  return titleMap[(title || '').toLowerCase()] || null
}
