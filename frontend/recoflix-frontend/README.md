# RecoFlix Frontend

A Vite + React frontend for the dynamic movie recommendation backend.

## Project Structure

```
src/
├── api/
│   └── client.js          # All backend API calls (fetch wrapper)
├── store/
│   └── useStore.js         # Zustand global state
├── hooks/
│   └── useEventTracker.js  # Sends events to POST /events/
├── utils/
│   └── poster.js           # Genre-based gradient poster art
├── components/
│   ├── LoginScreen.jsx     # User profile selection
│   ├── Navbar.jsx          # Top navigation bar
│   ├── HeroBanner.jsx      # Hero banner with featured movie
│   ├── MovieRow.jsx        # Horizontal scrollable movie row
│   ├── MovieCard.jsx       # Individual movie card with hover
│   ├── MovieModal.jsx      # Movie detail + watch simulation
│   ├── ChatPanel.jsx       # AI search via POST /chat/
│   ├── EventLog.jsx        # Live event tracking panel (📡 button)
│   └── BackendStatus.jsx   # Backend health indicator
├── App.jsx                 # Main page layout
├── main.jsx                # React entry point
└── index.css               # Global styles + animations
```

## Backend API Endpoints Used

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/auth/login` | Login (returns dummy token) |
| `GET` | `/recommend/{user_id}` | Personalized recommendations |
| `POST` | `/events/` | Track user interactions |
| `POST` | `/chat/` | Semantic movie search |
| `GET` | `/movies/` | Browse movies |

### Event types sent to `/events/`:
- `click` — user clicked on a movie card
- `play` — user pressed the Play button
- `watch` — user reached 25/50/75/100% watch milestone

## Setup

### 1. Start the backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Make sure PostgreSQL is running and `DATABASE_URL` is set in `.env`.
Make sure Ollama is running with `nomic-embed-text`:
```bash
ollama pull nomic-embed-text
ollama serve
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Run the dev server

```bash
npm run dev
```

Open http://localhost:5173

The Vite dev server proxies all `/api/*` requests to `http://localhost:8000`.

## Features

### 🎭 User Profiles
Select from 4 users (IDs 1–4). Each user has a color, preferences, and a unique viewing history that shapes their recommendations.

### 🤖 Personalized Recommendations
`GET /recommend/{user_id}` — The backend:
1. Looks up the user's stored embedding vector
2. Searches the FAISS index for similar movies
3. Returns personalized results (cold-start uses popularity ranking)

### 📡 Real-Time Event Tracking
Every interaction fires `POST /events/` immediately:
- Click on a card → `event_type: "click"`
- Press Play → `event_type: "play"`
- Watch 25/50/75/100% → `event_type: "watch"`

The backend's Redis worker processes these events to update the user's embedding vector, making recommendations smarter with each interaction.

### 🔍 Semantic Search
The Search panel uses `POST /chat/` which:
1. Embeds your query text via Ollama
2. Runs FAISS similarity search
3. Returns semantically matched movies + LLM explanation

### 📊 Event Log (📡 button)
The floating 📡 button shows a live feed of all events sent to the backend, confirming that tracking is working.

## Building for Production

```bash
npm run build
```

The `dist/` folder is the built app. Serve it behind a reverse proxy (nginx/caddy) that also proxies `/api/` to your FastAPI backend.
