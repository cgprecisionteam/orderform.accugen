# Accugen Digital Dental Lab — Order Portal

Next.js 14 (App Router) + TypeScript project for dental lab case submissions.
No database. Stateless. Deployed on Vercel.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 App Router |
| Language | TypeScript |
| Styling | Tailwind CSS |
| File uploads | UploadThing v7 (TOKEN-based auth) |
| Email | Resend SDK (`orders@accugendental.com`) |
| Deployment | Vercel |

---

## Environment Variables

Set in Vercel → Project → Settings → Environment Variables (Production).

```
UPLOADTHING_TOKEN=...
RESEND_API_KEY=...
```

---

## Project Structure

```
app/
  page.tsx                  # Root page — tab switcher (Lab Order / Request Scan)
  api/
    order/route.ts          # POST — handles lab order submission + emails
    scan-request/route.ts   # POST — handles scan request submission + emails
    uploadthing/route.ts    # UploadThing file router handler

components/
  Header.tsx                # Fixed top header with logo + contact info
  OrderForm.tsx             # Restoration-based lab order form
  ScanRequestForm.tsx       # Intraoral scan booking form
  SubmitBar.tsx             # Fixed bottom footer with submit button
  FileUpload.tsx            # Drag-and-drop file uploader (64 MB / file, 200 MB total)
  ToothSelector.tsx         # FDI tooth number grid — mobile-responsive (quadrant rows)
  SearchableSelect.tsx      # Custom searchable dropdown (no external UI lib)

lib/
  products.ts               # Single source of truth: PRODUCT_TYPES, resolveProductName, getRestorationCategory
  counter.ts                # Stateless order ID generator (timestamp-based)
  submitOrder.ts            # Client-side: uploads files then POSTs to /api/order
  uploadthing.ts            # UploadThing file router (server) — 64 MB max per file
  uploadthing-client.ts     # UploadThing client helper
  utils.ts                  # cn() utility (clsx + tailwind-merge)
```

---

## Key Architecture Decisions

### No Database
The system is fully stateless. Order IDs are derived from the current timestamp.
No Firebase, no Postgres, no Redis.

### Order ID Format
Generated in `lib/counter.ts`:
```
REQ-DDMMYYYY-HHMMSS
Example: REQ-10042026-143022
```
Timestamp is server-local (UTC on Vercel). Two submissions in the same second
would get the same ID — extremely unlikely at the expected submission volume.

### Sticky Footer Architecture
`SubmitBar` lives in `app/page.tsx` at the React tree root — **outside** both form
components and outside `<main>`. This prevents any CSS containing-block or
`overflow:hidden` ancestor from trapping `position: fixed`.

The button uses the HTML `form` attribute to submit the active form:
```tsx
<button type="submit" form="order-form" />   // or "scan-form"
```

Each form exposes its stage + summary via an `onStatusChange` callback prop so the
footer can show the spinner and summary text.

### UploadThing v7
- Auth: `UPLOADTHING_TOKEN` (single env var)
- File URL: `r.ufsUrl` (not `r.url` — deprecated in v7)
- Accepted types: `image` + `blob` (blob handles `.stl` and `.zip`)
- Max per file: **64 MB** (both client and server — `FileUpload.tsx` and `uploadthing.ts` must stay in sync)
- Max count: 20

---

## Product Catalogue (`lib/products.ts`)

**Single source of truth.** All form dropdowns and email output are derived from `PRODUCT_TYPES`.
To add/remove products, edit only the `PRODUCT_TYPES` array at the top of `lib/products.ts`.
If adding a new product name pattern, also update `resolveProductName()` and `getRestorationCategory()`.

### Types

```ts
type UnitType     = 'per_tooth' | 'per_arch' | 'per_unit';
type Material     = 'Zirconia' | 'Lithium Disilicate' | 'PMMA' | 'G-CAM';
type ZirconiaTier = 'Economy' | 'Economy Plus' | 'Premium' | 'Premium Plus';
type RestGroup    = 'restoration' | 'implant' | 'fullarch';

interface ProductTypeConfig {
  label: string;
  group: RestGroup;
  unitType: UnitType;
  isImplant: boolean;
  availableMaterials: Material[];
  availableTiers?: ZirconiaTier[];   // if absent, all 4 tiers are shown for Zirconia
  noMaterial?: boolean;              // hides material/tier/shade selectors
  variants?: string[];               // e.g. Immediate Implant Full Arch sub-types
  siteCounts?: string[];             // e.g. Titanium Bar site counts
}
```

### UnitType → UI behaviour

| unitType | UI shown |
|---|---|
| `per_tooth` | FDI tooth selector grid |
| `per_arch` | Upper / Lower / Both button group |

### RestGroup → form behaviour

| group | Tooth/Arch | Implant detail fields |
|---|---|---|
| `restoration` | tooth selector | hidden |
| `implant` | tooth selector | shown (System, Platform/Size) |
| `fullarch` | arch selector | shown (System, Platform/Size) |

### Current product list

| Label | Group | Materials | Notes |
|---|---|---|---|
| Full Crown | restoration | Zirconia · e.max · PMMA · G-CAM | All 4 Zirconia tiers |
| Bridge | restoration | Zirconia · e.max · PMMA · G-CAM | All 4 Zirconia tiers |
| Inlay/Onlay | restoration | Zirconia · e.max | All 4 Zirconia tiers |
| Veneer | restoration | e.max · Zirconia | Premium / Premium Plus only |
| Implant Crown (Ti Base by Dentist) | implant | Zirconia · e.max · PMMA · G-CAM | All 4 Zirconia tiers |
| Implant Bridge | implant | Zirconia · PMMA | All 4 Zirconia tiers |
| Implant Crown + Custom Abutment | implant | Zirconia · PMMA | All 4 Zirconia tiers |
| iBar (Implant Full Arch) | fullarch | Zirconia | All 4 Zirconia tiers |
| Malo Framework + Crowns (Implant Full Arch) | fullarch | Zirconia | All 4 Zirconia tiers |
| Immediate Implant Full Arch | fullarch | PMMA | Variants: Standard · On Titanium Bar · With Ti Base |
| Milled Titanium Bar | fullarch | *(no material)* | Site counts: 2 · 3 · 4-6 · 7+ |
| Milled Malo Framework | fullarch | *(no material)* | Site counts: 2 · 3 · 4-6 · 7+ |

---

## Restoration-Based Form (`components/OrderForm.tsx`)

### State model

Each order contains one or more `Restoration` objects:

```ts
interface Restoration {
  id: string;
  toothNumbers: number[];
  arch: 'Upper' | 'Lower' | 'Both' | '';
  productType: string;
  material: Material | '';
  zirconiaTier: ZirconiaTier | '';
  variant: string;
  siteCount: string;
  implantSystem: string;
  implantPlatform: string;
  shade: string;
}
```

Form-level state (not per-restoration):
- `dataType: 'scan' | 'pickup'`
- `files: File[]`
- `isRush: boolean`
- `requireTryIn: boolean`

### Form card order

1. **Clinic Details** — clinic name, email, contact name, contact number
2. **Case Details** — patient name
3. **Restorations** — one or more `RestorationCard` blocks
4. **Data Input** — Digital Scan / Impression Pickup toggle + file upload
5. **Notes** — general instructions
6. **Delivery** — required-by date + Rush toggle + Require Try-in toggle

### RestorationCard field order

1. Tooth selector (or arch buttons for full-arch products)
2. Product dropdown (`SearchableSelect` over `PRODUCT_TYPES` labels)
3. Material dropdown (shown unless `noMaterial: true`)
4. Variant dropdown (shown if `pt.variants` exists)
5. Site count dropdown (shown if `pt.siteCounts` exists)
6. Zirconia Tier dropdown (shown if `material === 'Zirconia'`)
7. Implant details (shown if `pt.isImplant`) — System + Platform/Size text inputs
8. Shade (shown unless `noMaterial: true`)

### Resolved product name (sent in email)

`resolveProductName(productType, material, tier, variant, siteCount)` in `lib/products.ts`
maps each combination to the canonical name string. Examples:

| Inputs | Resolved name |
|---|---|
| Full Crown + Zirconia + Economy | `Full Crown \| Zirconia Economy` |
| Bridge + Lithium Disilicate | `Bridge \| IPS e.max CAD` |
| Veneer + Zirconia + Premium | `Veneer \| Zirconia Premium` |
| Implant Crown + Custom Abutment + Zirconia + Premium | `Implant Crown + Custom Abutment \| Zr Premium` |
| iBar + Zirconia + Economy Plus | `iBar (Implant Full Arch) \| Zirconia Economy Plus` |
| Malo Framework + Crowns + Zirconia + Premium Plus | `Malo Framework + Zirconia Crowns Premium Plus` |
| Immediate Implant Full Arch + On Titanium Bar | `Immediate Implant Full Arch \| PMMA on Titanium Bar` |
| Milled Titanium Bar + 4-6 sites | `Milled Titanium Bar (4-6 Implant Sites)` |

---

## Submit Flow

### `lib/submitOrder.ts`

1. Collect `files` from form state
2. Upload via UploadThing → get `{ url (ufsUrl), name, size }` per file
3. Map each `Restoration` → API item via `buildApiItem()` (resolves productType → name, category, unitType)
4. POST to `/api/order`

### `/api/order` (route)

1. Validates required fields (`clinicName`, `email`, `patientName`, `deliveryDate`, `items`)
2. Generates `requestId` via `generateRequestId()`
3. Sends two emails (lab + client) via Resend — each in independent try/catch
4. Always returns `{ success: true, requestId, emailStatus }` — email failures are logged, not surfaced to user

---

## Email System (Resend)

Sender: `Accugen Dental Lab <orders@accugendental.com>`
Domain must be verified in Resend dashboard.

### Order emails

| Email | To | Subject pattern |
|---|---|---|
| Lab | `orders@accugendental.com` | `New Order: {Clinic} - Pt. {Patient} (Digital Scan|Impression Pickup) (Rush)` |
| Client | clinic email | `New Order Received for Pt. {Patient} (Digital Scan|Impression Pickup) (Rush) — Accugen Digital Dental Lab` |

Lab email: Clinic Details, Case Details (with Request ID), items table, Instructions, file links. `reply_to` is set to the clinic email.

Client email: Case Details, items table, support contact. No Request ID shown.

### Items table columns

`#` | `Product` | `Material` | `Tier / Option` | `Teeth / Arch` | `Shade`

- **Product** — `item.productType` (human label, e.g. "Full Crown")
- **Material** — `item.material`; Lithium Disilicate renders as "Lithium Disilicate (e.max)"
- **Tier / Option** — `item.zirconiaTier` OR `item.variant` OR `item.siteCount`
- **Teeth / Arch** — comma-separated tooth numbers (per_tooth) or arch label (per_arch)

Implant notes (System + Platform) appear in an orange callout block beneath the table.

File attachments appear as download links (UploadThing URL with `?download=1`).

### Email failure handling

Both sends are wrapped in independent try/catch. If an email fails, the API still returns
`success: true` so the order is not lost. Check Vercel function logs (`[order]` prefix) for details.

---

## Scan Request Form (`components/ScanRequestForm.tsx`)

Fields: clinic name, email, contact name, contact number, preferred date, preferred time slot.
Time slots: 10:00 AM – 8:00 PM in 30-min intervals.

Two emails sent: lab notification + client confirmation.
No files, no order ID. Form resets on success.

---

## FDI Tooth Layout (`ToothSelector.tsx`)

```
Upper Right: 18 17 16 15 14 13 12 11 | 21 22 23 24 25 26 27 28 :Upper Left
Lower Right: 48 47 46 45 44 43 42 41 | 31 32 33 34 35 36 37 38 :Lower Left
```

**Mobile (`< sm`)**: Each arch split into two separate rows (one per quadrant, 8 teeth each).
Fits comfortably on 375 px screens without horizontal scrolling.

**Desktop (`sm+`)**: Classic single-row per arch with a midline divider.

---

## Hooks Rule

All `useEffect` calls must appear **before** any early `return` statement in a component.
Both `OrderForm` and `ScanRequestForm` have a success-state early return — the `useEffect`
for `onStatusChange` is placed above it.

---

## Known Limitations

- Order IDs are timestamp-based — not sequential. Two submissions in the same second
  would get the same ID (extremely unlikely at current volume).
- No order persistence — if the API crashes after file upload but before email, the order
  is lost (no retry mechanism).
- UploadThing free tier limits apply to file storage duration.
- `package-lock.json` still references `@radix-ui/react-label`, `@radix-ui/react-select`,
  and `class-variance-authority` (removed from `package.json`). Run `npm install` to
  prune the lock file.
