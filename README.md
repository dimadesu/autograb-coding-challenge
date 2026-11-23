# AutoGrab Coding Challenge

## Tech

- Front-end: React, Vite.
- Back-end: Node.js, Express + Multer.
- Single Git repository using separate `client/` and `server/` packages.
- Run scripts to start/stop both from top folder.

## Structure

- `client/` — React + Vite UI (proxies `/api` requests to `http://localhost:3001` in both dev and preview)
- `server/` — Pure Express API (`GET /api/health`, `GET /api/vehicles`, `POST /api/submissions` with `multer` for plain-text logbook uploads)

## Getting Started

Install root, server, and client dependencies:

```
npm install && npm run install:all
```

Run both frontend (`http://localhost:5173`) and backend (`http://localhost:3001`) in dev mode:

```bash
npm run dev
```

## Production Build & Local Preview

Build the React frontend into `client/dist`:

```bash
npm run build
```

Run the API server (`http://localhost:3001`) and serve the built frontend (`http://localhost:4173`) concurrently:

```bash
npm start
```

In deployment, `client/dist` can be hosted on any static host/CDN or behind a reverse proxy (e.g. Nginx) forwarding `/api/*` to the Express server.

## Testing

```bash
npm test
```
