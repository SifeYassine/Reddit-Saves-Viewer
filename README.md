# Reddit Saves Viewer

A fast, searchable web app for browsing your **saved Reddit posts**. Load a CSV of saved post URLs and get a masonry feed of cards with titles, text, images, galleries, and videos, with fuzzy search, subreddit filters, and pagination. A small **Fastify** backend fetches post data from Reddit in batches and caches it in **SQLite**, so each post is only downloaded once.

## Features

- **Masonry feed** with responsive columns (1–4 depending on screen width)
- **Rich media**: images, multi-image galleries (carousel), Reddit-hosted videos, Redgifs embeds, and crossposts
- **Dead-link fallback**: Imgur/Gfycat media is resolved through the Internet Archive (Wayback Machine)
- **Fuzzy title search** (Fuse.js) with debounced input
- **Multi-select subreddit filter** with per-subreddit post counts
- **Pagination** (20 posts per page) with first/last and jump-to-page
- **Batching & caching**: missing posts are fetched 60 at a time via Reddit's `/api/info.json` with rate-limit handling and retries, then stored in a local SQLite cache
- **Cache controls**: view the number of cached posts and clear the cache from the UI
- Dark UI built with shadcn/ui components and Tailwind CSS

## Tech Stack

| Layer     | Technology |
| --------- | ---------- |
| Frontend  | React 18, Vite 5, Tailwind CSS, shadcn/ui (Radix UI), lucide-react, Embla Carousel |
| Data      | PapaParse (CSV), Fuse.js (fuzzy search), Axios |
| Backend   | Node.js, Fastify 4 (`@fastify/cors`, `@fastify/static`) |
| Cache DB  | SQLite via better-sqlite3 + Drizzle ORM |

## Project Structure

```
reddit-saves-viewer/
├── server/
│   ├── server.js        # Fastify API (fetch posts, cache stats, clear cache)
│   ├── reddit.js        # Reddit fetching, media resolution, rate limiting
│   ├── cache.js         # SQLite cache helpers
│   └── schema.js        # Drizzle table schema (posts)
├── src/
│   ├── App.jsx          # Layout, filters, feed, cache controls
│   ├── hooks/
│   │   └── useRedditData.js   # CSV loading, search, filtering, pagination
│   ├── components/      # PostCard, MediaCarousel, SearchBar, SubredditFilter, ...
│   │   └── ui/          # shadcn/ui primitives
│   └── lib/
│       ├── loadCSV.js       # Loads public/db.csv
│       └── prepareCSV.js    # Derives subreddit/title from URLs and sorts by date
├── public/              # Put your db.csv here (git-ignored)
├── drizzle.config.js
└── package.json
```

## Getting Started

### Prerequisites

- Node.js **20.11+** (uses `import.meta.dirname` and `--env-file`)
- [pnpm](https://pnpm.io/) (or npm)
- A Reddit account

### Installation

```bash
git clone https://github.com/SifeYassine/reddit-saves-viewer.git
cd reddit-saves-viewer
pnpm install
```

### Configuration

Create a `.env` file in the project root:

```env
REDDIT_COOKIE=your_reddit_session_cookie_value
CLIENT_URL=http://localhost:5173
```

| Variable        | Description |
| --------------- | ----------- |
| `REDDIT_COOKIE` | Value of your `reddit_session` cookie (browser DevTools → Application → Cookies → reddit.com). Used to fetch post data. |
| `CLIENT_URL`    | Origin of the frontend, allowed by CORS. |

> ⚠️ Your session cookie grants access to your Reddit account. Keep `.env` private; it's already git-ignored.

### Prepare your data

1. Export your saved posts to a CSV with a `url` column of Reddit post links (e.g. `https://www.reddit.com/r/<sub>/comments/<id>/<slug>/`) and save it as `public/db.csv`.
2. Derive the subreddit and title from each URL and sort newest-first:

   ```bash
   node src/lib/prepareCSV.js
   ```

   This writes `public/db.sorted.csv`. Rename it to `public/db.csv`, which is the file the app loads.

### Create the cache database

```bash
pnpm db
```

### Run

Start the backend (port **3000**) and the frontend (Vite, port **5173**) in two terminals:

```bash
pnpm server
```

```bash
pnpm dev
```

Then open <http://localhost:5173>.

## API

| Method | Endpoint            | Description |
| ------ | ------------------- | ----------- |
| POST   | `/api/fetch-posts`  | Body `{ "urls": [...] }`. Returns post data in the requested order, from cache or Reddit. |
| GET    | `/api/cache-stats`  | Number of cached posts |
| DELETE | `/api/cache`        | Clear the cache |

## Scripts

| Script         | Description |
| -------------- | ----------- |
| `pnpm dev`     | Start the Vite dev server |
| `pnpm build`   | Build the frontend for production |
| `pnpm preview` | Preview the production build |
| `pnpm server`  | Start the Fastify backend with `.env` loaded |
| `pnpm db`      | Push the Drizzle schema to `server/cache.db` |

## Author

**Sifeddine Yassine** · [@SifeYassine](https://github.com/SifeYassine)
