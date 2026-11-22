# AutoGrab Coding Challenge

React (Vite) frontend and Node.js (Express + Multer) backend in a single Git repository using separate `client/` and `server/` packages (no npm workspaces).

## Structure

- `client/` — React + Vite UI (proxies `/api` requests to `http://localhost:3001` in dev)
- `server/` — Express API with `multer` for multipart form + file uploads

## Getting Started

Install root, server, and client dependencies:

```bash
npm install && npm run install:all
```

Run both frontend (`http://localhost:5173`) and backend (`http://localhost:3001`) concurrently:

```bash
npm run dev
```

## Other Commands

- `npm test` — run backend API tests (`node --test`)
- `npm run build` — build the React frontend into `client/dist`
- `npm start` — run the Express server (serves `client/dist` if built)
