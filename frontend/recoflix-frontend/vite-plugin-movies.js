import fs from 'fs'
import path from 'path'

const VIRTUAL_ID = 'virtual:movies-catalog'
const RESOLVED_ID = '\0' + VIRTUAL_ID

// All genre buckets to expose — matches movies_clean.jsonl genre strings exactly
const GENRES = [
  'Action',
  'Thriller',
  'Drama',
  'Crime',
  'Comedy',
  'Family',
  'Science Fiction',
  'Horror',
  'Romance',
  'Adventure',
  'Animation',
  'Mystery',
  'History',
  'War',
  'Music',
  'Western',
  'Documentary',
  'Fantasy',
]

const TOP_PER_GENRE = 25   // cards shown per genre row
const TITLE_MAP_LIMIT = 2000 // entries in the lookup map (for enriching backend recs)

function buildCatalog(jsonlPath) {
  const raw = fs.readFileSync(jsonlPath, 'utf-8')
  const lines = raw.split('\n').filter(Boolean)

  const genreBuckets = {}
  GENRES.forEach(g => (genreBuckets[g] = []))

  const allMovies = []

  for (const line of lines) {
    let m
    try { m = JSON.parse(line) } catch { continue }

    // Slim down fields we need — keep bundle small
    const slim = {
      tmdb_id:      String(m.tmdb_id),
      title:        m.title,
      overview:     (m.overview || '').slice(0, 180),
      genres:       Array.isArray(m.genres) ? m.genres.slice(0, 4) : [],
      rating:       Math.round((m.rating || 0) * 10) / 10,
      popularity:   m.popularity || 0,
      release_year: m.release_year || null,
      runtime:      m.runtime || null,
      cast:         Array.isArray(m.cast) ? m.cast.slice(0, 4) : [],
      director:     m.director || null,
      poster_url:   m.poster_url || null,
      backdrop_url: m.backdrop_url || null,
    }

    allMovies.push(slim)

    for (const g of slim.genres) {
      if (genreBuckets[g]) genreBuckets[g].push(slim)
    }
  }

  // Sort each genre bucket by popularity desc, take top N
  const catalog = {}
  for (const g of GENRES) {
    catalog[g] = genreBuckets[g]
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, TOP_PER_GENRE)
  }

  // Trending = top movies across all genres by popularity
  catalog['Trending'] = [...allMovies]
    .filter(m => m.poster_url)
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 25)

  // Title lookup map for enriching backend recommendation results
  // Key: lowercased title → { poster_url, backdrop_url, overview, cast, release_year, runtime }
  const titleMap = {}
  const topByPop = [...allMovies]
    .filter(m => m.poster_url)
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, TITLE_MAP_LIMIT)

  for (const m of topByPop) {
    titleMap[m.title.toLowerCase()] = {
      poster_url:   m.poster_url,
      backdrop_url: m.backdrop_url,
      overview:     m.overview,
      cast:         m.cast,
      release_year: m.release_year,
      runtime:      m.runtime,
    }
  }

  // Search index: ALL movies with poster — slim fields only for fast filtering
  // Fields: tmdb_id, title, release_year, rating, poster_url, backdrop_url,
  //         genres (array), overview, cast, runtime, director
  const searchIndex = allMovies
    .filter(m => m.poster_url)
    .map(m => ({
      tmdb_id:      m.tmdb_id,
      title:        m.title,
      release_year: m.release_year,
      rating:       m.rating,
      popularity:   m.popularity,
      poster_url:   m.poster_url,
      backdrop_url: m.backdrop_url,
      genres:       m.genres,
      overview:     m.overview,
      cast:         m.cast,
      runtime:      m.runtime,
      director:     m.director,
    }))

  return { catalog, titleMap, genres: GENRES, searchIndex }
}

export default function moviesPlugin(options = {}) {
  // Default: look for the JSONL relative to the project root
  const defaultPath = path.resolve(
    process.cwd(),
    '../../backend/data/raw/movies_clean.jsonl'
  )
  const jsonlPath = '../../backend/data/raw/movies_clean.jsonl'

  let catalogData = null

  return {
    name: 'vite-plugin-movies',

    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID
    },

    load(id) {
      if (id !== RESOLVED_ID) return

      if (!catalogData) {
        if (!fs.existsSync(jsonlPath)) {
          console.warn(
            `[vite-plugin-movies] JSONL not found at: ${jsonlPath}\n` +
            `  → Falling back to empty catalog. ` +
            `  Set options.jsonlPath to the correct path.`
          )
          catalogData = { catalog: {}, titleMap: {}, genres: GENRES, searchIndex: [] }
        } else {
          console.log(`[vite-plugin-movies] Parsing ${jsonlPath} …`)
          const t0 = Date.now()
          catalogData = buildCatalog(jsonlPath)
          const counts = Object.entries(catalogData.catalog)
            .map(([g, ms]) => `${g}:${ms.length}`)
            .join('  ')
          console.log(`[vite-plugin-movies] Done in ${Date.now() - t0}ms`)
          console.log(`[vite-plugin-movies] ${counts}`)

          // Write searchIndex to public/ so it loads lazily (not bundled)
          const publicDir = path.resolve(process.cwd(), 'public')
          if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true })
          const outPath = path.join(publicDir, 'search-index.json')
          fs.writeFileSync(outPath, JSON.stringify(catalogData.searchIndex))
          console.log(`[vite-plugin-movies] Wrote public/search-index.json (${catalogData.searchIndex.length} movies)`)
        }
      }

      // Only catalog + titleMap go into the bundle — searchIndex is fetched lazily
      return `export const catalog = ${JSON.stringify(catalogData.catalog)};
export const titleMap = ${JSON.stringify(catalogData.titleMap)};
export const genres = ${JSON.stringify(catalogData.genres)};
`
    },

    // In dev mode, watch the JSONL for changes and hot-reload
    configureServer(server) {
      if (fs.existsSync(jsonlPath)) {
        server.watcher.add(jsonlPath)
        server.watcher.on('change', file => {
          if (file === jsonlPath) {
            console.log('[vite-plugin-movies] JSONL changed — rebuilding catalog')
            catalogData = null
            const mod = server.moduleGraph.getModuleById(RESOLVED_ID)
            if (mod) server.moduleGraph.invalidateModule(mod)
            server.ws.send({ type: 'full-reload' })
          }
        })
      }
    },
  }
}
