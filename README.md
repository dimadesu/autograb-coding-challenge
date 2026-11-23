# AutoGrab Coding Challenge

## Tech

- Front-end: React, Vite.
- Back-end: Node.js, Express + Multer.
- Single Git repository using separate `client/` and `server/` packages.
- Run scripts to start/stop both from top folder.

## Getting Started

Install root, server, and client dependencies:

```
npm install && npm run install:all
```

Run both frontend and backend concurrently in dev/watch mode:

```bash
npm run dev
```

Run both frontend and backend prod mode:

```bash
npm run build && npm start
```

- `npm run build` — build the React frontend into `client/dist`
- `npm start` — run the Express server (serves `client/dist` if built)

## Other Commands

- `npm test` — run backend API tests (`node --test`)
