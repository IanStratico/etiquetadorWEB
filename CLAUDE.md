# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Setup local (primera vez o después de clonar)

1. **Red**: estar conectado a la red `192.168.1.x` (misma que los servidores de La Nueva Textil). Sin eso, MySQL, la api de piezas y la LNT API no son alcanzables.

2. **Node.js**: verificar que está instalado con `node -v`. Si no, instalar desde https://nodejs.org.

3. **Variables de entorno**: los `.env` están gitignoreados — hay que crearlos manualmente en la raíz del proyecto:

   **`.env`** (credenciales MySQL):
   ```
   MYSQL_HOST=192.168.1.32
   MYSQL_PORT=3306
   MYSQL_USERNAME=admin
   MYSQL_PASSWORD=Cambiar123$
   MYSQL_DATABASE=pedidos_lnt
   ```

   **`.env.local`** (LNT API):
   ```
   LNT_API_URL=http://192.168.1.119:3000
   LNT_API_SYNC_KEY=<clave real — consultarla con el equipo>
   ```

4. **Instalar dependencias** (solo la primera vez o si cambiaron):
   ```bash
   npm install
   ```

5. **Levantar el servidor de desarrollo**:
   ```bash
   npm run dev
   ```
   Abrir `http://localhost:3040`.

---

## Commands

```bash
npm run dev      # Start dev server on port 3040 (Turbopack)
npm run build    # Production build (Turbopack)
npm start        # Run production server on port 3040
npm run lint     # ESLint
```

Docker:

```bash
docker compose up --build   # Build and run on port 3040
```

## Architecture

Single-page Next.js 15 app (App Router, TypeScript, Tailwind CSS) for scanning and printing garment labels at La Nueva Textil.

### Data sources

Two piece sources coexist in the same UI, toggled by tab:

- **CLADD**: REST API at `http://192.168.1.32:8010` — queried per-piece on demand (`/api/cladd/pieza`).
- **IMPORTADO**: SQL Server (`TANGO\AXSQLEXPRESS`, database `LA_NUEVA_TEXTIL`) — loaded in full on page load via `/api/importado/all`, then searched in-memory per scan via `/api/importado/pieza`. No server-side caching; every `/all` call opens a fresh MSSQL connection.

### Persistence

MySQL at `192.168.1.32:3306` (database `pedidos_lnt`) via TypeORM with `synchronize: true`. Two entities:

- `Lot` (`lots` table) — groups a batch of pieces saved together. `lotCode` is auto-generated as `LOT-YYYY-MM-DD-HH-mm-ss`.
- `Piece` (`pieces` table) — belongs to a Lot via `lot_id`. Supports soft-delete (`deletedDate`). Stores the full raw `data` JSON from the source API.

Connection singleton is kept in `globalThis.__typeormDataSource` to survive hot-reload in dev (`src/lib/typeorm.ts`).

### Save flow

`POST /api/pieces` → creates a Lot → saves all Pieces → calls the label printer HTTP API (`PRINTER_API_URL` env var, defaults to `http://192.168.1.119/etiquetador/apiWeb/testImpresora.php`) once per piece.

### Lot download

`GET /api/lots/[id]/download` generates an `.xlsx` file with piece data using the `xlsx` library, increments `downloadCount`, and streams it as an attachment.

### Environment variables

```
MYSQL_HOST / DB_HOST
MYSQL_PORT / DB_PORT
MYSQL_USERNAME / DB_USERNAME
MYSQL_PASSWORD / DB_PASSWORD
MYSQL_DATABASE / DB_DATABASE
PRINTER_API_URL          # optional, has a hardcoded default
NEXTAUTH_URL             # used by importado/pieza to self-call /api/importado/all (defaults to http://localhost:3040)
```
