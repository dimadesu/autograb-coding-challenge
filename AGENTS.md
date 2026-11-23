# AGENTS.md

Guidance for coding agents working in this repository.

## Project Overview

Full-stack Vehicle Service Logbook application in a single Git repository with separate `client/` and `server/` packages (not npm workspaces):

- **`server/`**: Node.js + Express 5 + Multer 2 API serving vehicle options and handling plain-text logbook uploads.
- **`client/`**: React 19 + Vite 6 single-page UI that proxies `/api/*` to `http://localhost:3001` in both dev and preview modes.

All packages use native ES modules (`"type": "module"`).

## Environment & Dependencies

- **Node.js**: Pinned in `.nvmrc` (`v26.13.1`). Use `nvm use` if available.
- **Dependencies**: Root, `server/`, and `client/` each have their own `package.json` and `package-lock.json`.
  - Install everything from the repo root:
    ```bash
    npm install && npm run install:all
    ```
  - When adding a package, install it in the specific package directory (`npm --prefix server install ...` or `npm --prefix client install ...`), not the root, unless it is a shared dev/lint/format tool.

## Commands

Run all commands from the repository root:

| Command                | Description                                                          |
| ---------------------- | -------------------------------------------------------------------- |
| `npm run dev`          | Start server (`:3001`, `node --watch`) and client (`:5173`) together |
| `npm start`            | Build `client/dist`, then run server (`:3001`) + preview (`:4173`)   |
| `npm run build`        | Build production client bundle into `client/dist`                    |
| `npm test`             | Run all server and client tests                                      |
| `npm run test:server`  | Run server tests (`node --test`)                                     |
| `npm run test:client`  | Run client tests (`vitest run`)                                      |
| `npm run lint`         | Run ESLint across the repo                                           |
| `npm run lint:fix`     | Auto-fix ESLint issues                                               |
| `npm run format`       | Format all files with Prettier                                       |
| `npm run format:check` | Check Prettier formatting without writing                            |

## Architecture & Key Files

### Server (`server/`)

- `server/src/app.js` — Configures Express routes and centralized JSON error handling (`multer.MulterError` and errors with `err.statusCode` return `{ error }`). Exported separately from `index.js` so tests can bind an ephemeral port.
- `server/src/index.js` — Starts the HTTP server on `process.env.PORT || 3001`.
- `server/src/data/vehicles.js` — In-memory `VEHICLES` catalog (`make -> model -> badges[]`) and `isValidVehicleSelection(make, model, badge)`.
- `server/src/routes/vehicles.js` — `GET /api/vehicles` returns `VEHICLES`.
- `server/src/routes/submissions.js` — `POST /api/submissions` accepts `multipart/form-data` (`make`, `model`, `badge`, and `logbook` file). Uses `multer.memoryStorage()`, enforces a 5 MB file size limit, and restricts uploads to `text/plain` or `.txt`.
- `GET /api/health` — Returns `{ status: 'ok' }`.

### Client (`client/`)

- `client/vite.config.js` — Configures React plugin, `/api` proxy to `http://localhost:3001` (for both `server` and `preview`), and Vitest (`jsdom` + `src/test/setup.js`).
- `client/src/App.jsx` — Loads `/api/vehicles` with `AbortController` cleanup, manages cascading Make -> Model -> Badge selects (resetting downstream selections and attached file on upstream changes), validates `.txt` client-side, and submits `FormData` to `POST /api/submissions`.
- `client/src/App.css` — Component styles.

## Testing Guidelines

- **Server tests** (`server/test/*.test.js`): Use Node's built-in `node:test`, `node:assert/strict`, and native `fetch` / `FormData` against `app.listen(0)`.
- **Client tests** (`client/src/*.test.jsx`): Use Vitest, `@testing-library/react`, and `@testing-library/user-event` with `vi.stubGlobal('fetch', ...)`.
  - Note: jsdom's native HTML constraint validation does not recognize files attached via `userEvent.upload` on `required` file inputs; submit the form via `fireEvent.submit(submitButton.form)` when testing form submission.

## Code Style & Verification

- Formatting is enforced by Prettier (`.prettierrc` uses `singleQuote: true`; `.prettierignore` excludes `node_modules`, `dist`, `package-lock.json` — Markdown files are checked too).
- Linting uses ESLint v10 flat config in `eslint.config.js` (Node globals for `server/` and config files with `_`-prefixed unused args allowed; browser globals + React Hooks/Refresh rules for `client/src/`).
- CI (`.github/workflows/ci.yml`) runs the following checks on pushes and PRs to `main`. Run them before completing changes:
  ```bash
  npm run format:check && npm run lint && npm test && npm run build
  ```
