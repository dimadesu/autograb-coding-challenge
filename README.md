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

### Node version

This project uses `.nvmrc` (`v26.13.1`). If you use [nvm](https://github.com/nvm-sh/nvm), switch to the expected Node.js version first:

```
nvm use
```

### Install dependencies

Install root, server, and client dependencies:

```
npm install && npm run install:all
```

### Run in dev mode

This will auto refresh / hot reload on source file changes.

```
npm run dev
```

Frontend `http://localhost:5173`.
Backend `http://localhost:3001`

### Production build

Builds the React frontend into `client/dist`. Serves frontend on port 4173.

```
npm start
```

Frontend "preview" (`http://localhost:4173`).
Backend API server (`http://localhost:3001`).

### Deloyment ideas

To build the frontend alone without starting the servers:

```
npm run build
```

`client/dist` can be hosted on any static host/CDN or behind a reverse proxy (e.g. Nginx) forwarding `/api/*` to the Express server.

### Testing

```
npm test
```
