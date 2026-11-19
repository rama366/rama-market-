# Crafted Men

Crafted Men is a full-stack marketplace for discovering products and services, connecting registered buyers with registered sellers, and getting help from an AI shopping guide. The experience is designed around thoughtful discovery: broad search, category browsing, nearby seller discovery, wishlists, seller tools, and a premium-interest path called Crafted+.

## What is included

- Public marketplace home page and universal listing search.
- Categories for clothing, cars, homes, electronics, and services.
- Buyer and seller onboarding backed by Manus OAuth.
- Seller profiles with editable business details, city, phone, bio, and geocoded coordinates.
- Seller listing creation, editing, archiving, publishing, and multi-photo uploads.
- Buyer wishlists with price-drop and availability notifications.
- Nearby discovery with browser geolocation, distance filters, and map view.
- AI-powered Crafted Men Guide with marketplace help and suggested prompt chips.
- Enquiry flow for buyers to contact sellers without exposing payment details.
- Crafted+ interest registration and premium seller membership fields for future ranking/badge experiences. Stripe checkout is intentionally not enabled in the current build.
- Vitest coverage for core marketplace, authentication, branding, and utility behavior.

## Technology stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS 4, Wouter, Radix UI, Lucide icons.
- **Backend:** Node.js, Express 4, tRPC 11, Zod.
- **Data:** MySQL/TiDB through Drizzle ORM and SQL migrations.
- **Authentication:** Manus OAuth and server-side session cookies.
- **Storage:** Project storage/S3-compatible storage for listing images.
- **AI and integrations:** Manus built-in LLM, map/geocoding proxy, and storage services.
- **Testing:** Vitest and TypeScript strict checking.

## Requirements

- Node.js 20 or newer.
- pnpm 10 or newer.
- A MySQL or TiDB database for production-like development.
- Manus project environment variables for OAuth, database, storage, maps, and built-in AI services.

The hosted Manus WebDev environment supplies the required service credentials automatically. For a standalone deployment, configure equivalent values securely through the deployment platform rather than committing them to the repository.

## Quick start

```bash
git clone https://github.com/rama366/rama-market-.git
cd rama-market-
pnpm install
pnpm run dev
```

Open the local preview at `http://localhost:3000` unless the development server reports a different port.

## Environment configuration

Do not commit `.env` files or real credentials. The application reads server-side values through `server/_core/env.ts`. The main variables used by the template are:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | MySQL/TiDB connection string. |
| `JWT_SECRET` | Secret used to sign session cookies. Use a long random value. |
| `VITE_APP_ID` | Manus OAuth application ID. |
| `OAUTH_SERVER_URL` | Manus OAuth backend URL. |
| `VITE_OAUTH_PORTAL_URL` | Browser-facing Manus login portal. |
| `OWNER_OPEN_ID` | Open ID of the project owner/admin. |
| `OWNER_NAME` | Display name of the project owner. |
| `BUILT_IN_FORGE_API_URL` | Server-side Manus built-in API endpoint. |
| `BUILT_IN_FORGE_API_KEY` | Server-only credential for built-in services. Never expose it to the browser. |
| `VITE_FRONTEND_FORGE_API_URL` | Browser-safe built-in API endpoint when required by the client. |
| `VITE_FRONTEND_FORGE_API_KEY` | Browser-scoped credential, only when explicitly required by a frontend integration. |

The server should fail closed when required secrets are missing. Use the platform secret manager or deployment environment settings to provide them.

## Database setup

The schema is defined in `drizzle/schema.ts`, with generated migrations in `drizzle/`. Use the project database workflow to keep the schema and database synchronized:

```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

The convenience script is:

```bash
pnpm run db:push
```

Run migrations only against the intended database. Never use production credentials during local experiments, and do not insert sample or test data into a shared production database.

## Development commands

| Command | Description |
| --- | --- |
| `pnpm run dev` | Start the Vite/Express development server with watch mode. |
| `pnpm run check` | Run TypeScript without emitting files. |
| `pnpm test` | Run the Vitest test suite once. |
| `pnpm run build` | Build the browser bundle and bundled production server. |
| `pnpm start` | Start the bundled production server from `dist/`. |
| `pnpm run format` | Format project files with Prettier. |
| `pnpm run db:push` | Generate and apply Drizzle migrations. |
| `pnpm audit --prod` | Audit production dependencies against the current advisory database. |

A recommended pre-commit check is:

```bash
pnpm run check && pnpm test && pnpm run build
```

## Project structure

```text
client/
  index.html                 Browser entry point and metadata.
  src/
    App.tsx                  Routes and application providers.
    components/              Shared marketplace, dashboard, map, upload, and UI components.
    pages/                   Home, listing, onboarding, account, and alert pages.
    lib/                     tRPC client, marketplace helpers, and nearby-map utilities.
    index.css                Global design tokens and Tailwind styles.

drizzle/
  schema.ts                  Database tables and inferred types.
  *.sql                      Generated database migrations.

server/
  db.ts                      Database queries and marketplace persistence helpers.
  routers.ts                 tRPC procedures and validation contracts.
  storage.ts                 Project storage upload helper.
  _core/                     Manus OAuth, LLM, map, server, and runtime plumbing.

shared/                      Shared constants and error definitions.
patches/                     Package patches used by pnpm.
vitest.config.ts             Test configuration.
vite.config.ts              Frontend and development-server configuration.
```

Framework files under `server/_core/` are platform plumbing. Extend them only when the feature genuinely belongs to the runtime layer; marketplace behavior generally belongs in `server/db.ts`, `server/routers.ts`, and `client/src/`.

## Marketplace usage

### Buyers

1. Open the directory and search by product, service, category, or location.
2. Use **Use my location** to discover sellers within a chosen radius. Location is used for the query and is not stored by the marketplace UI.
3. Open a listing to review photos, description, seller details, and location.
4. Sign in and complete a buyer profile to save listings to a wishlist.
5. Use the account page to organize saved listings by recency, price, or Crafted+ seller status.
6. Send an enquiry directly from a listing page. Crafted Men introduces the buyer and seller; arrangements are completed directly between them.

### Sellers

1. Sign in and choose the seller journey during onboarding.
2. Add a public name, business name, city, phone number, and shop bio.
3. Create a listing with a title, detailed description, category, optional price, location, and up to six images.
4. Review and update listings from the seller studio.
5. Archive listings when they are no longer available. Buyers with the listing on their wishlist can receive status-change notifications.
6. Use the Crafted+ interest path to register interest in future premium seller benefits. Payment information is not collected by the current implementation.

### AI guide

The Crafted Men Guide is available from the floating assistant button. Prompt chips provide quick starting points such as finding a category, learning how to sell, or understanding Crafted+. AI responses are informational and must not invent availability, pricing, seller contact details, or payment capabilities.

## Authentication and authorization

- Public browsing uses `publicProcedure`.
- Profile, wishlist, enquiries, seller management, notifications, and premium-interest procedures use `protectedProcedure`.
- Seller-only operations verify the authenticated marketplace profile is a seller profile.
- Buyer-only operations verify the authenticated marketplace profile is a buyer profile.
- Admin authorization should use the user role from the authenticated session rather than client-provided role fields.
- The browser must not manually manage session cookies. Use the provided Manus auth hooks and OAuth flow.

## Storage and uploads

Listing image bytes are uploaded through the server and stored in project storage. The database stores storage URLs and listing metadata, not image blobs. Uploaded image URLs are validated to use the protected `/manus-storage/` path. Keep large media out of `client/public/` and `client/src/assets/`.

## Deployment

1. Install dependencies with `pnpm install --frozen-lockfile`.
2. Configure production environment variables through the hosting platform's secret manager.
3. Apply database migrations against the production database.
4. Run `pnpm run check`, `pnpm test`, and `pnpm run build`.
5. Start the server with `pnpm start` or use the platform's managed WebDev deployment flow.
6. Verify OAuth callback URLs, cookie settings, storage uploads, LLM calls, map discovery, and listing enquiries in the deployed environment.
7. Create a project checkpoint before publishing through Manus WebDev.

For the managed deployment, the current public domain is maintained by the WebDev project configuration. Custom domains and OAuth callback origins must be configured in the hosting and Manus OAuth settings together.

## Security checklist

- Keep all `.env*` files, API keys, database URLs, JWT secrets, and OAuth secrets out of Git.
- Use HTTPS in production and secure, HTTP-only session cookies.
- Validate all tRPC inputs with Zod and enforce authorization on the server.
- Keep uploaded files in project storage and validate MIME types, size limits, and storage URL prefixes.
- Do not trust browser-provided seller IDs, buyer IDs, roles, prices, status values, or ownership claims.
- Review `pnpm audit --prod` before releases and update transitive dependencies when patches are available.
- Treat AI output as untrusted text; do not use it as an authorization or pricing source.
- Review map, storage, OAuth, and built-in API logs for unexpected access or credential errors.

## Known limitations

- Crafted+ is currently an interest-only path; Stripe checkout is not configured.
- Listing search currently uses the marketplace database and does not crawl the entire web.
- Nearby discovery depends on browser permission and successful seller-city geocoding.
- Some advisory findings may come from transitive packages that require upstream releases or carefully tested package overrides.
- Production secrets and OAuth callback configuration are environment-specific and are not included in this repository.

## License

This project is currently marked `MIT` in `package.json`. Confirm the intended ownership and licensing terms before distributing the application or accepting external contributions.
