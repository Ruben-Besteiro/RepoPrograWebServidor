# AGENTS.md

## Project Structure

Monorepo with multiple Node.js/Express projects:
- **Root** (`/`) - Express API with Zod validation
- **Practica** (`/Practica`) - Express + MongoDB/Mongoose + JWT auth + Multer file uploads
- **T5, T8, T9, ejsupabase** - Similar Express projects with Jest tests + Swagger

All use ES modules (`"type": "module"`).

## Commands

Root project:
```bash
npm run dev    # node --watch --env-file=.env src/index.js
npm run start  # node --env-file=.env src/index.js
```

Practica (and other subfolders):
```bash
cd Practica
npm run dev    # node --watch src/app.js
npm run start  # node src/app.js
```

## Testing (T5, T8, T9, ejsupabase)

```bash
npm test                          # Run all tests
npm run test:watch               # Watch mode
npm run test:coverage           # With coverage
```

Jest requires `--experimental-vm-modules` flag.

## Key Details

- Node >= 20.11.0 required
- Root uses Node's native `--env-file` flag (no dotenv package needed)
- Practica and subfolders use `dotenv` package explicitly (loads via code)
- `--watch` flag enables auto-restart on file changes

## Entrypoints

- Root: `src/index.js` → loads `src/app.js`
- Subfolders: `src/index.js` → loads `src/app.js`

## Environment Variables

- Root: `.env` at root (loaded via `--env-file`)
- Subfolders: `.env` in respective folder (loaded via `dotenv` in code)

## Other

- Each subfolder has an `index.http` file for VS Code REST Client testing