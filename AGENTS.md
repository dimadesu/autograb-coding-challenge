# AGENTS.md

Guidance for coding agents working in this repository.

## Project Structure & Dependencies

- Separate `client/` (React + Vite) and `server/` (Node.js + Express + Multer) packages in one repo — **not** npm workspaces. All packages use native ES modules (`"type": "module"`).
- Node.js version is pinned in `.nvmrc`.
- Root, `server/`, and `client/` each have their own `package.json` and `package-lock.json`:
  - Install all dependencies from the repo root: `npm install && npm run install:all`
  - Add runtime/package dependencies in the target package (`npm --prefix server install ...` or `npm --prefix client install ...`), not the root, unless it is a shared dev/lint/format tool.

## Architectural Conventions

- `server/src/app.js` exports the Express app separately from `server/src/index.js` so tests can bind an ephemeral port (`app.listen(0)`).
- `client/vite.config.js` proxies `/api` to `http://localhost:3001` in both `dev` (`:5173`) and `preview` (`:4173`) modes.

## Testing

- **Server** (`server/test/*.test.js`): Node's built-in `node:test`, `node:assert/strict`, and native `fetch`/`FormData` against `app.listen(0)`.
- **Client** (`client/src/*.test.jsx`): Vitest (`jsdom`), `@testing-library/react`, and `@testing-library/user-event` with `vi.stubGlobal('fetch', ...)`.
  - Gotcha: jsdom's native HTML constraint validation does not recognize files attached via `userEvent.upload` on `required` file inputs; trigger form submission with `fireEvent.submit(submitButton.form)`.

## Verification

- Prettier checks Markdown files as well as JS/CSS/JSON.
- Run the same checks as CI before finishing changes (see `package.json` for individual dev/test/lint/format scripts):
  ```bash
  npm run format:check && npm run lint && npm test && npm run build
  ```
