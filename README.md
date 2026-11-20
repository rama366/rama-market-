# Crafted Men

A classic-meets-modern marketplace for **clothes, cars and nearby shops**, built for Tanzania and priced in TZS by default (USD optional).

Buyers can search, filter, save favourites and message sellers on WhatsApp. Sellers get a studio to publish listings and a shop profile. Shop owners appear in a directory with a map, opening hours, reviews and distance sorting. Admins can approve or remove listings and shops.

---

## What's inside

**Design**
- Serif headings (Playfair Display) over Inter body text, in a deep navy / cream / gold palette.
- Sticky glass header, light/dark toggle that is remembered, animated page loader.
- Scroll reveals, hero parallax, counting stats, card lift + image zoom on hover, quick view.
- Mobile-first responsive layout, and all motion respects `prefers-reduced-motion`.

**Buying**
- Search, category / price / location / condition filters, and sorting.
- Listing pages with photo lightbox, seller details, ratings and a report button.
- Wishlist (favourites), saved-listing alerts for price drops and availability.
- "Chat on WhatsApp" with a pre-filled message, plus a call button.

**Selling**
- Buyer/seller onboarding, seller profile editing, shop creation with opening hours.
- Add, edit, delete, mark-as-sold and multi-photo listings.
- Category-aware fields: cars get make/model/year/mileage/transmission, clothes get size/colour/gender.

**Shops & trust**
- Shop directory, shop profile pages and a Leaflet + OpenStreetMap map view.
- "Shops near me" using browser geolocation, sorted by distance.
- Seller ratings and reviews, verified-seller badge, report-listing flow.
- Admin console at `/admin` to approve or remove listings and shops.

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, Wouter |
| Backend | Node.js, Express 4, tRPC 11, Zod |
| Database | MySQL (or TiDB) through Drizzle ORM |
| Auth | Manus OAuth with server-side session cookies |
| Storage | Project storage through the S3-compatible upload helper |
| Maps | Leaflet + OpenStreetMap (no API key needed) |
| Tests | Vitest, `tsc --noEmit` |

---

## Quick start

```bash
git clone https://github.com/rama366/rama-market-.git
cd rama-market-
pnpm install
pnpm run dev
```

Open `http://localhost:3000`.

```bash
pnpm run check     # TypeScript
pnpm test          # Vitest
pnpm run build     # client bundle + bundled server
pnpm start         # run the production build
```

---

## Environment variables

Create a `.env` file locally. **Never commit it** — `.gitignore` already excludes `.env*`.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | MySQL/TiDB connection string, e.g. `mysql://user:pass@host:3306/db` |
| `JWT_SECRET` | Long random string used to sign session cookies |
| `VITE_APP_ID` | OAuth application ID |
| `OAUTH_SERVER_URL` | OAuth backend URL |
| `VITE_OAUTH_PORTAL_URL` | Browser-facing login portal URL |
| `OWNER_OPEN_ID` | Open ID of the project owner (gets admin access) |
| `OWNER_NAME` | Owner display name |
| `BUILT_IN_FORGE_API_URL` | Server-side built-in API endpoint |
| `BUILT_IN_FORGE_API_KEY` | Server-only credential — never expose to the browser |
| `VITE_FRONTEND_FORGE_API_URL` | Browser-safe API endpoint, only if needed |
| `VITE_FRONTEND_FORGE_API_KEY` | Browser-scoped key, only if explicitly required |

Without OAuth configured the app still runs locally and public pages work; sign-in is disabled.

---

## Database

The schema lives in `drizzle/schema.ts`. Migrations are numbered SQL files in `drizzle/`.
The marketplace upgrade (shops, reviews, reports, listing attributes, coordinates, sold state) is
`drizzle/0005_marketplace_upgrade.sql`.

```bash
pnpm run db:push        # generate + apply migrations
# or separately
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

Categories are stored as a plain text key (not a database enum), so **adding a category never needs a migration**.

Tables: `users`, `marketplaceProfiles`, `listings`, `listingImages`, `wishlists`,
`listingEnquiries`, `buyerNotifications`, `premiumInterest`, `shops`, `reviews`, `listingReports`.

---

## How to add a category

Everything reads from one file: `client/src/lib/categories.ts`.

```ts
export const CATEGORIES: CategoryDefinition[] = [
  // …
  {
    key: "furniture",                      // stored in the database; keep it stable
    label: "Furniture",
    plural: "Furniture & home",
    tagline: "Pieces with a past, ready for a second home.",
    intro: "Desks, chairs and storage from sellers near you.",
    tone: "bg-amber-50 dark:bg-amber-950/30",   // soft tinted surface
    icon: "home",                          // "shirt" | "car" | "home" | "laptop" | "wrench"
    featured: true,                        // shows on the homepage grid
    fields: [
      { key: "material", label: "Material", type: "text", placeholder: "Teak" },
      { key: "dimensions", label: "Dimensions", type: "text", placeholder: "120 × 60 cm", optional: true },
    ],
  },
];
```

Then add the icon to `ICONS` in `client/src/lib/categories.ts` if you used a new icon name (the
union type already covers the five built-in options). Save and reload — the homepage grid, filters,
listing form and search all pick it up automatically.

---

## How to add a listing

**Through the UI (recommended)**
1. Sign in and choose *I'm here to sell* on `/onboarding`.
2. Open `/sell` and press **Create listing**.
3. Fill in title, price (TZS, optional USD), category, condition, description, location.
4. Add the category fields that appear (e.g. make/model/year for cars).
5. Upload up to six photos and publish.

**Directly in the database** (for seed data only):

```sql
INSERT INTO listings
  (sellerProfileId, title, description, priceCents, currency, category, condition, location, status, createdAt)
VALUES
  (1, 'Toyota Harrier 2018', 'One owner, full service history.', 8500000000, 'TZS',
   'cars', 'Like new', 'Dar es Salaam', 'active', NOW());
```

`priceCents` is an integer in the currency's minor units. For TZS, `85,000,000` is `8500000000`.

Edit and delete your own listings from `/sell`. Sellers can only ever modify their own rows —
ownership is checked server-side in `server/routers.ts`.

---

## Project structure

```text
client/
  index.html                  Metadata, OG tags, theme pre-paint script
  public/                     robots.txt, sitemap.xml, images
  src/
    App.tsx                   Routes
    components/               Header, footer, cards, map, editors, assistant
    hooks/                    useMotion (reveal/parallax/count-up), usePageMeta
    lib/categories.ts         Single source of truth for categories
    pages/                    Home, Listings, ListingDetail, Shops, ShopProfile,
                              Sell, Account, Alerts, Onboarding, Report, Admin
    index.css                 Design tokens, dark mode, animation utilities
drizzle/                      Schema + numbered migrations
server/
  db.ts                       Query layer
  routers.ts                  tRPC procedures and validation
  storage.ts                  Upload helper
scripts/verify.mjs            Playwright screenshot check
```

---

## Deployment

This app needs a **Node server and a MySQL database**, so **GitHub Pages will not work**
(it only serves static files). Use **Vercel** — the closest fit — or any Node host with MySQL.

**Vercel**
1. Import the GitHub repository.
2. Build command `pnpm run build`, output is served by `pnpm start`.
3. Add every environment variable above in the project settings.
4. Point `DATABASE_URL` at a hosted MySQL database (PlanetScale, Railway, Aiven or similar).
5. Apply migrations once against that database: `pnpm drizzle-kit migrate`.
6. Set the OAuth callback URL and cookie secret for the production domain.

**Alternatives:** Render or Railway (long-running Node + managed MySQL), or a VPS with PM2 and Nginx.

Neither GitHub Pages nor a static Netlify site can run the tRPC server, so treat them as unsupported.

---

## Publishing these changes to GitHub

The redesign was committed in seven steps on top of this repository's existing
history. If your local copy still needs to be pushed:

```bash
cd path/to/project
git log --oneline -8          # confirm the new commits are present
git push origin main
```

If the folder you downloaded does not include the `.git` directory, create a
fresh history and push once:

```bash
git init -b main
git add -A
git commit -m "feat: marketplace redesign with shops, seller studio and admin"
git remote add origin https://github.com/rama366/rama-market-.git
git push -u origin main --force-with-lease
```

Pushing with `--force-with-lease` replaces the remote branch, so only use it
after confirming the local tree is the one you want to keep.

## Security notes

- `pnpm audit --prod` before releases.
- All inputs are validated with Zod; ownership and role checks happen on the server.
- Image URLs are restricted to the project storage path; uploads are size- and type-checked.
- The admin role is read from the session, never from the client.
- AI output is treated as untrusted text, never as authorisation or pricing data.

---

## Known limitations

- Crafted+ is an interest list only; no payment is taken.
- Search covers the marketplace database, not the open web.
- "Shops near me" needs browser permission and shop coordinates.
- Two tests (`server/title.secret.test.ts`, `server/resend.secret.test.ts`) require environment
  secrets and fail on a bare checkout. That is expected; the rest of the suite passes.

## License

MIT, as declared in `package.json`. Confirm ownership terms before distributing.
