import { create } from 'zustand'

const USERS = [
  { id: 1, name: 'Alex', letter: 'A', color: '#C0392B', preferences: ['Action', 'Sci-Fi', 'Thriller'] },
  { id: 2, name: 'Jordan', letter: 'J', color: '#1A5276', preferences: ['Drama', 'Crime', 'Romance'] },
  { id: 3, name: 'Sam', letter: 'S', color: '#1E8449', preferences: ['Horror', 'Thriller', 'Mystery'] },
  { id: 4, name: 'Morgan', letter: 'M', color: '#B7770D', preferences: ['Animation', 'Comedy', 'Adventure'] },
]

export { USERS }

export const useStore = create((set, get) => ({
  // Auth
  currentUser: null,
  token: null,

  // Data
  recommendations: [],
  chatMovies: [],
  chatResponse: '',
  events: [],

  // title (lowercase) → backend DB integer id
  // Populated whenever backend returns movies with real ids (recs, chat)
  titleToDbId: {},

  // UI state
  selectedMovie: null,
  chatOpen: false,
  chatQuery: '',
  loading: { recommendations: false, chat: false },
  error: null,

  // Actions
  setUser: (user, token) => set({ currentUser: user, token, recommendations: [], events: [], titleToDbId: {} }),
  logout: () => set({ currentUser: null, token: null, recommendations: [], events: [], titleToDbId: {} }),

  setRecommendations: (recs) => set({ recommendations: recs }),
  setChatResult: (movies, response) => set({ chatMovies: movies, chatResponse: response }),
  setSelectedMovie: (movie) => set({ selectedMovie: movie }),
  setChatOpen: (open) => set({ chatOpen: open }),
  setChatQuery: (q) => set({ chatQuery: q }),

  // Called after any backend response that includes {id, title} pairs.
  // Merges new entries into the map; never overwrites existing ones.
  registerDbIds: (movies) => set(s => {
    const additions = {}
    for (const m of movies) {
      if (m.id && m.title) {
        const key = m.title.toLowerCase()
        if (!s.titleToDbId[key]) additions[key] = m.id
      }
    }
    if (Object.keys(additions).length === 0) return s
    return { titleToDbId: { ...s.titleToDbId, ...additions } }
  }),

  setLoading: (key, val) => set(s => ({ loading: { ...s.loading, [key]: val } })),
  setError: (err) => set({ error: err }),

  addEvent: (event) => set(s => ({
    events: [event, ...s.events].slice(0, 50),
  })),
}))
