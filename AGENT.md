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

Set these in Vercel → Project → Settings → Environment Variables (Production).

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
  OrderForm.tsx             # Multi-item lab order form
  ScanRequestForm.tsx       # Intraoral scan booking form
  SubmitBar.tsx             # Fixed bottom footer with submit button
  FileUpload.tsx            # Drag-and-drop file uploader
  ToothSelector.tsx         # FDI tooth number grid (18–11, 21–28, 31–38, 48–41)
  SearchableSelect.tsx      # Custom searchable dropdown (no external UI lib)

lib/
  products.ts               # Single source of truth for all products + categories
  counter.ts                # Stateless order ID generator (timestamp-based)
  submitOrder.ts            # Client-side: uploads files then POSTs to /api/order
  uploadthing.ts            # UploadThing file router (server)
  uploadthing-client.ts     # UploadThing client helper
  utils.ts                  # cn() utility (clsx + tailwind-merge)

config/
  products.ts               # Legacy file — superseded by lib/products.ts (kept for reference)
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
Previously used `fs.writeFileSync` on `data/counter.json` — removed because Vercel
filesystem is read-only. The timestamp approach is collision-safe for the expected
submission volume.

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
- Auth: `UPLOADTHING_TOKEN` (single env var — replaces the old `SECRET` + `APP_ID` pair)
- File URL: `r.ufsUrl` (not `r.url` — deprecated in v7)
- Accepted types: `image` + `blob` (blob handles `.stl` and `.zip`)
- Max per file: 64 MB | Max count: 20

---

## Product Catalogue (`lib/products.ts`)

Single source of truth. All dropdowns derive from `PRODUCTS`.

```ts
type UnitType = 'per_tooth' | 'per_arch' | 'per_unit';

interface Product {
  name: string;
  category: string;
  unitType: UnitType;
}
```

### UnitType → UI behaviour

| unitType | UI shown |
|---|---|
| `per_tooth` | FDI tooth selector grid + Bridge toggle |
| `per_arch` | Upper / Lower / Both button group |
| `per_unit` | Numeric stepper (− qty +) |

### Current catalogue

| Category | Product | UnitType |
|---|---|---|
| CAD Service | Crown Design | per_tooth |
| CAD Service | Full Arch Design | per_arch |
| Crowns and Bridges | Full Crown - Zirconia Economy | per_tooth |
| Crowns and Bridges | Full Crown - Zirconia Economy Plus | per_tooth |
| Crowns and Bridges | Full Crown - Zirconia Economy Premium | per_tooth |
| Crowns and Bridges | Full Crown - Zirconia Premium Plus | per_tooth |
| Implant | Custom Abutment | per_tooth |
| Implant | Implant Crown | per_tooth |
| Implant | Implant Bridge | per_tooth |
| Implant | Implant Full Arch (PMMA) | per_arch |
| Removable | Full Denture | per_arch |
| Removable | Partial Denture | per_unit |
| Removable | Flexi Partial | per_unit |
| Orthodontics | Clear Aligner | per_arch |
| Orthodontics | Retainer | per_arch |
| Orthodontics | Study Model | per_unit |

---

## Multi-Item Orders

Each order supports multiple items. Each item (`OrderItem`) has:

```ts
interface OrderItem {
  category: string;
  product: string;
  qty: number;
  unitType: 'per_tooth' | 'per_arch' | 'per_unit';
  toothNumbers: number[];
  isBridge: boolean;
  arch: string;          // 'Upper' | 'Lower' | 'Both' | ''
  shade: string;
  implantNotes: string;
}
```

Items are rendered as `ItemCard` sub-components inside `OrderForm`.
Minimum 1 item enforced. "+ Add Another Item" button appends and auto-scrolls.

The submit payload sent to `/api/order`:
```json
{
  "clinicName": "...",
  "email": "...",
  "contactName": "...",
  "contactNumber": "...",
  "patientName": "...",
  "items": [...],
  "generalInstructions": "...",
  "deliveryDate": "YYYY-MM-DD",
  "isRush": false,
  "files": [{ "url": "...", "name": "...", "size": 0 }]
}
```

---

## Email System (Resend)

Sender: `Accugen Dental Lab <orders@accugendental.com>`
Domain must be verified in Resend dashboard.

### Order emails (2 sent per submission)

| Email | To | Subject |
|---|---|---|
| Lab | `orders@accugendental.com` | `New Order: {ClinicName} - Pt. {PatientName} (Rush)` |
| Client | clinic email | `New Order Received for Pt. {PatientName} (Rush) — Accugen Digital Dental Lab` |

Lab email contains: Clinic Details, Case Details (with Request ID), items table,
Instructions, file links. `reply_to` is set to the clinic email.

Client email contains: Case Details, items table, support contact.
No Request ID shown to client.

### Scan Request emails (2 sent per submission)

| Email | To | Subject |
|---|---|---|
| Lab | `orders@accugendental.com` | `New Scan Request — {ClinicName}` |
| Client | clinic email | `New Scan Request Received` |

### Items table in email

Columns: `#` | `Category` | `Product` | `Qty / Teeth / Arch` | `Shade`

Qty/Teeth/Arch column:
- `per_tooth` → comma-separated tooth numbers (e.g. `14, 15, 16`)
- `per_arch` → arch label (e.g. `Upper`)
- `per_unit` → numeric qty (e.g. `2`)

Implant notes appear in an orange callout block beneath the table if present.

### Email failure handling
Both sends are wrapped in independent try/catch blocks. If an email fails, the API
still returns `success: true` so the order is never lost. The response includes:
```json
{
  "success": true,
  "requestId": "REQ-10042026-143022",
  "emailStatus": {
    "lab": "sent",
    "client": "failed: ..."
  }
}
```
Check Vercel function logs (`/api/order`) for `[order]` prefixed log lines.

---

## Form Flow

### Lab Order tab
1. Clinic Details (name, email, contact)
2. Case Details (patient name)
3. Items (one or more — category → product → unit UI → shade → implant notes)
4. Notes (general instructions)
5. Delivery (date + Rush toggle)
6. Files (drag-and-drop, up to 20 files × 64 MB)
7. Submit → files upload to UploadThing → POST to `/api/order` → emails sent

### Request Scan tab
1. Clinic Details
2. Preferred Appointment (date + time slot 10 AM–8 PM in 30-min intervals)
3. Submit → POST to `/api/scan-request` → emails sent

---

## FDI Tooth Layout (`ToothSelector.tsx`)

```
Upper Right: 18 17 16 15 14 13 12 11 | 21 22 23 24 25 26 27 28 :Upper Left
Lower Right: 48 47 46 45 44 43 42 41 | 31 32 33 34 35 36 37 38 :Lower Left
```

---

## Hooks Rule

All `useEffect` calls must appear **before** any early `return` statement in a
component. Both `OrderForm` and `ScanRequestForm` have a success-state early return —
the `useEffect` for `onStatusChange` is placed above it.

---

## Known Limitations

- Order IDs are timestamp-based — not sequential. Two submissions in the same second
  would get the same ID (extremely unlikely at current volume).
- No order persistence — if the API crashes after upload but before email, the order
  is lost (no retry mechanism).
- UploadThing free tier limits apply to file storage.
