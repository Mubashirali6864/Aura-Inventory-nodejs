# Project Memory & Operational Context
## Aura Furniture Management & POS System (Shan-e-Aziz POS)

**Status:** Living Engineering Memory & Durable Context  
**System Type:** Retail POS, Multi-Shop Inventory, Customer/Vendor Ledger  
**Primary Tech Stack:** Node.js, Express 4.18.2, SQLite3, React 18 (Vite, TailwindCSS)  
**Related Documents:**
* Agent Directives: [AGENTS.md](file:///e:/Softwares/Aura%20Inventory%20nodejs/AGENTS.md)
* Product Requirements: [PRD.md](file:///e:/Softwares/Aura%20Inventory%20nodejs/PRD.md)
* Architecture Document: [architecture.md](file:///e:/Softwares/Aura%20Inventory%20nodejs/architecture.md)
* Task & Roadmap Board: [task.md](file:///e:/Softwares/Aura%20Inventory%20nodejs/task.md)
* Interactive Architecture Diagram: [architecture.html](file:///e:/Softwares/Aura%20Inventory%20nodejs/architecture.html)
* Security Audit Findings: [qa/reports/MASTER_QA_REPORT.md](file:///e:/Softwares/Aura%20Inventory%20nodejs/qa/reports/MASTER_QA_REPORT.md)

---

## 1. System Identity & Mission

Aura Furniture Management System (commercially deployed as **Shan-e-Aziz POS**) is a single-process retail management suite designed for physical furniture showrooms and warehouses. It unifies:
1. **Multi-Shop Point of Sale (POS):** Fast counter billing across **Shop 1** and **Shop 2**.
2. **Accounts Receivable / Customer Credit Ledger:** Full tracking of partial payments, pending debt, and settlement histories.
3. **Accounts Payable / Supplier Ledger:** Vendor procurement shipments, upfront cash disbursements, running debt balances, and locked payouts when balances reach zero.
4. **Cashbook:** Single aggregated cash-flow journal tracking all financial movements.
5. **Automated Disaster Recovery:** 6-hour automated SQLite filesystem snapshots and in-app historical database restoration.

---

## 2. Memory Architecture: The Method of Loci (The Memory Palace)

To prevent cognitive drift and guarantee immediate, structured recall without re-reading the entire codebase, all architectural components, business invariants, and workflows are anchored to **8 Spatial Loci** in the **Aura POS Memory Palace**:

```
                       ┌────────────────────────────────────────┐
                       │        Locus 1: The Portico            │
                       │     (server.js / Express 7860)         │
                       └──────────────────┬─────────────────────┘
                                          │
        ┌─────────────────────────────────┼────────────────────────────────┐
        ▼                                 ▼                                ▼
┌─────────────────────┐       ┌───────────────────────┐       ┌────────────────────────┐
│ Locus 2: The Vault  │       │ Locus 3: The Counter  │       │ Locus 4: Loading Dock  │
│ (SQLite / DAO Core) │       │ (POS / Credit Checkout)│       │ (Purchases / Suppliers)│
└─────────────────────┘       └───────────┬───────────┘       └────────────────────────┘
                                          │
        ┌─────────────────────────────────┴────────────────────────────────┐
        ▼                                 ▼                                ▼
┌─────────────────────┐       ┌───────────────────────┐       ┌────────────────────────┐
│ Locus 5: The Ledger │       │ Locus 6: Cust. Lounge │       │ Locus 7: Observatory   │
│ (Cashbook Journal)  │       │ (AR / Debt Ledger)    │       │ (Archify & Graphify)   │
└─────────────────────┘       └───────────────────────┘       └────────────────────────┘
                                          │
                                          ▼
                              ┌───────────────────────┐
                              │ Locus 8: Clean Sweep  │
                              │ (Test Deletion & Clean)│
                              └───────────────────────┘
```

### 🏛️ Locus 1: The Portico (Gateway & Hosting Entryway)
* **Spatial Anchor:** Repository root `server.js` and Express application binding.
* **Invariants:**
  * Root `server.js` delegates to `require('./backend/index.js')` for Passenger cPanel compatibility on Hostinger.
  * Express 4.18.2 runs on port `7860`.
  * Pre-built React SPA in `dist/` is statically hosted with HTML5 history fallback (`GET * -> dist/index.html`).

### 🏛️ Locus 2: The Vault (Storage & Integrity Core)
* **Spatial Anchor:** `backend/database.sqlite` and `backend/backups/`.
* **Invariants:**
  * Minimal document store table `(id TEXT PRIMARY KEY, data TEXT)` serialized/deserialized by application DAO.
  * **Mandatory DAO Rule:** All updates must use `stripUndefined(data)` before merging (`{ ...existing, ...cleanData }`) to prevent `undefined` overwriting valid keys.
  * **Multi-Table ACID Transactions & Reversals:** Multi-table writes and transaction deletions (`DELETE /api/sales/:id`, `DELETE /api/purchases/:id`, `DELETE /api/supplier-payments/:id`, `DELETE /api/payments/:id`) execute through serialized SQLite transaction wrapper `executeTransaction` to guarantee zero partial states and complete inventory/ledger rollbacks.
  * **Product Update Propagation:** Editing product attributes (name, size, unit, category, sku) via `PUT /api/products/:id` automatically cascades and updates all historical and open transaction line items (`sales`, `purchases`, `stockTransfers`).
  * Automatic 6-hour and daily SQLite snapshots in `backend/backups/`.
  * Unconditional pre-restore safety copy (`pre-restore-safety-*.sqlite`) before any database overwrite.
  * **Dynamic Sale Pricing & Inventory Catalog:** In Inventory -> Edit Product, the fixed "Sale Price" input field is removed since sales are priced dynamically at POS counter checkout; only purchase/cost price is maintained.

### 🏛️ Locus 3: The Sales Counter (POS & Billing Station)
* **Spatial Anchor:** `POST /api/sales` and Checkout UI in `dist/assets/index-BQlSbgAO.js`.
* **Invariants:**
  * Invoice numbering increments atomically via the `counters` table row `invoiceNumber`.
  * Credit sales (`Partial`, `Pending`, or `due > 0`) **strictly forbid** "Walk-in Customer" and require valid customer name and phone number.
  * Preserves exact `Date.now()` timestamps for same-day checkout submissions (never default to UTC midnight `05:00 AM`).
  * On sale completion, records `initialPaid = amountPaid` so Cashbook reflects checkout cash without double-counting later debt settlements.
  * **Reports Recent Sales Clarity:** In Reports -> Recent Sales, displays exact item names, dimensions, individual quantities (e.g., `[ 10x ] RED WOOD (8X4)`), total pieces summary, a dedicated **Sale Price** column for dynamic custom item rates, and a compact **Print** button.

### 🏛️ Locus 4: The Loading Dock (Procurement & Supplier Inflow)
* **Spatial Anchor:** `POST /api/purchases` and Supplier Management.
* **Invariants:**
  * Supplier procurement adds to item inventory (reverted if purchase deleted).
  * Preserves exact `Date.now()` timestamps for purchases.
  * On purchase completion, preserves `initialPaid = paidAmount` so Cashbook reflects initial checkout cash without inflating when subsequent dues are paid.
  * **Zero-Balance Lock:** Supplier payment can only be submitted if `supplier.balance > 0`. Locked if zero or negative.
  * **Auto-Fill & Overpay Protection:** Clicking "Pay Supplier" automatically pre-fills the amount field with the outstanding dues (`supplier.balance`), and strictly blocks overpaying (`amount > supplier.balance`) with an alert and disabled action.
  * **FIFO Purchase Allocation & Auto-Linking:** When paying supplier dues, payments automatically allocate across open purchases in chronological (FIFO) order, clearing the purchase dues (`remainingAmount`) and linking `purchaseId`.
  * **Detailed Ledger Link & Highlight:** In the Supplier Detailed Ledger, payments feature a clickable `🔗 Linked Inv #...` badge; clicking either the payment or purchase smoothly scrolls and highlights the linked transaction in theme light blue.

### 🏛️ Locus 5: The Ledger Room (Cashbook & Reconciliation)
* **Spatial Anchor:** Cashbook journal rendering in `dist/assets/index-BQlSbgAO.js`.
* **Invariants:**
  * Chronological sorting breaks same-day timestamp ties using `createdAt` (newest transactions at the top).
  * Cashbook `Sale` row shows `initialPaid` (cash collected at checkout).
  * Cashbook `Purchase` row shows `initialPaid` (cash paid at procurement).
  * Cashbook `Supplier Payment` rows show subsequent payments to vendors as dedicated entries (even when linked to purchases via FIFO).
  * **Pakistani Timezone Enforcement:** All period filters (`Today`, `Yesterday`, `This Week`, `This Month`, `Specific Date`) and row timestamps strictly evaluate and display in Pakistani Time (`Asia/Karachi` / UTC+5).
  * Cashbook `Payment` settlement row displays customer name, purchased items summary, invoice ID, and green `Settled` badge.
  * Clicking a settled payment row smoothly scrolls and highlights the original credit invoice row (`tx-row-INV-...`) in theme-matched light blue. Full payment sales are never clickable or highlighted.

### 🏛️ Locus 6: The Customer Lounge (Accounts Receivable & CRM)
* **Spatial Anchor:** `customers` table and customer debt ledger.
* **Invariants:**
  * Tracks customer balance, payment history, and credit limit.
  * Customer settlements deposit cash into Cashbook with reference to invoice.
  * **Detailed Ledger Link & Highlight:** In the Customer Detailed Ledger, payments feature a clickable `🔗 Linked Inv #...` badge; clicking either the payment or sale invoice smoothly scrolls and highlights the linked transaction in theme light blue.

### 🏛️ Locus 7: The Control Tower (Settings & Transaction Management)
* **Spatial Anchor:** Settings tab (`Hee` in `dist/assets/index-BQlSbgAO.js`).
* **Invariants:**
  * Provides in-app automated database backup selector, local copy download, and zero-loss switch modal.
  * **Transaction Management & Void:** Real-time search bar across all historical sales, purchases, supplier payments, and customer payments with immediate Void/Delete buttons executing full stock and financial ledger rollbacks.

### 🏛️ Locus 8: The Observatory (Living Archify & Graphify Models)
* **Spatial Anchor:** `qa/architecture.json` -> `architecture.html`, and `graphify-out/`.
* **Invariants:**
  * Living architectural map and AST knowledge graph are kept synchronized after any code change.
  * Consult `graphify query` / `architecture.html` first instead of running full codebase scans.

### 🏛️ Locus 9: The Clean Sweep (Workspace Sanitation)
* **Spatial Anchor:** `qa/` directory and test runners.
* **Invariants:**
  * All test files and temporary scratch runners are deleted immediately after test completion.
  * The workspace remains pristine at all times.

---

## 3. Architectural Decision Records (ADRs)

### ADR-001: SQLite JSON Document-Store Pattern over Relational Schemas
* **Date:** Project Inception
* **Context:** Retail inventory frequently introduces variable item attributes (dimensions, wood types, fabric variants, multi-shop flags, custom invoice notes). Rigid SQL migration scripts create high friction on local desktop installations.
* **Decision:** Implement a document-store pattern on top of SQLite3. Tables use a minimal schema: `(id TEXT PRIMARY KEY, data TEXT)`. Application-level DAO (`getAll`, `getById`, `insert`, `update`, `remove`) serializes/deserializes JSON objects.
* **Trade-offs:** 
  * *Pros:* Zero database migration friction; documents mirror React state directly; schema flexibility.
  * *Cons:* Lack of foreign key cascade constraints at the SQL layer; multi-table transactions require explicit application-level choreography.

### ADR-002: Root `server.js` Passenger Wrapper for Hostinger Deployment
* **Date:** Production Deployment Milestone
* **Context:** Cloud hosting on Hostinger cPanel Node.js Passenger expects an application entry point located strictly at the root level (`server.js`).
* **Decision:** Maintain `server.js` at the repository root containing `require('./backend/index.js')`. This keeps backend code organized within `backend/` while adhering to Hostinger's hosting convention.

### ADR-003: Pre-Bundled Frontend Assets in `dist/` Served via Express
* **Date:** Project Architecture
* **Context:** Counter terminals require an instant, zero-build setup without requiring Vite dev servers or separate reverse proxy daemons (like Nginx) on local Windows machines.
* **Decision:** Compile the React 18 SPA into `dist/`. The Express backend statically hosts `dist/` with an HTML5 history fallback `GET * -> dist/index.html`. Single command `node server.js` runs both frontend and backend on port `7860`.

### ADR-004: In-Place JavaScript Bundle Patching for Live Hotfixes
* **Date:** 2026-09-07 (Quality & Stabilization Sprint)
* **Context:** In scenarios where full frontend source code build tooling was unavailable or hotfixes needed immediate production deployment without touching build caches, critical bugfixes had to be applied to `dist/assets/index-BQlSbgAO.js`.
* **Decision:** Automated Node.js patch scripts surgically replace minified JS code fragments while preserving baseline backups (`*.bak`, `*.pre-backup-feature`).
* **Constraint:** Whenever modifying bundle logic, verify ES module syntax using Node `vm.Script` and test UI state thoroughly.

### ADR-005: 6-Hour Automated Database Snapshots & Pre-Restore Safety Copies
* **Date:** 2026-09-07
* **Context:** Master QA Audit highlighted total absence of database backups, creating severe vulnerability to disk failure or administrative error.
* **Decision:** Implement automated daily and 6-hour interval SQLite snapshots saved to `backend/backups/`. For restoration, before overwriting `database.sqlite`, the system unconditionally creates a safety copy (`pre-restore-safety-*.sqlite`), guaranteeing zero unrecoverable states.

### ADR-006: Dual-Token Authorization Guard on Database Factory Reset
* **Date:** 2026-09-07
* **Context:** Security finding `FINDING-P0-01` reported unauthenticated total database truncation via `POST /api/reset`.
* **Decision:** Require both `ALLOW_DB_RESET=true` in `.env` and a matching `x-admin-token` header matching `ADMIN_RESET_TOKEN`. In production environments, `ALLOW_DB_RESET` should be set to `false`.

### ADR-007: Cashbook Settlement Disambiguation & Click-to-Highlight Linkage
* **Date:** 2026-09-28
* **Context:** Credit settlements produced duplicate revenue entries when the `Sale` row read mutable `amountPaid` and the `Payment` settlement row also logged the collected amount. Furthermore, cashiers could not easily identify which customer or sale the settlement belonged to.
* **Decision:**
  1. Cashbook `Sale` row reads `initialPaid` (cash taken at checkout), ensuring cash intake is logged once at time of sale.
  2. Cashbook `Payment` settlement row displays the customer name, item summary, invoice ID, and a green `Settled` tag.
  3. Clicking a settled payment row triggers an interactive smooth scroll and theme-matched light blue glow highlight (`#dbeafe` with `#60a5fa` inset border ring) jumping directly to the original credit sale row.
  4. Highlighting and click-linkage are strictly restricted to **Partial** and **Pending** credit sales; full payment sales are never clickable or highlighted.

### ADR-008: Detailed Ledger Bidirectional Link Badges & Interactive Highlight
* **Date:** 2026-09-28
* **Context:** In both the Supplier and Customer Detailed Ledgers, accountants could not clearly see which purchase or sale invoice a payment was linked with, leading to confusion when reviewing running balances.
* **Decision:**
  1. In the Supplier Detailed Ledger (`sn`), payment rows display an interactive `🔗 Linked Inv #...` badge; clicking either the payment row or the purchase row scrolls smoothly and flashes a theme-matched light blue highlight (`#dbeafe` / `#60a5fa`) on the corresponding linked transaction.
  2. In the Customer Detailed Ledger (`Oe`), payments similarly display a clickable `🔗 Linked Inv #...` badge; clicking either the payment row or the invoice row scrolls smoothly and highlights the partner transaction in light blue.
  3. Full payments and completed invoices display a clean `✓ Paid` / `✓ Settled` indicator tag.
  4. When recording payments against supplier dues, the backend performs FIFO allocation across open purchases, clearing purchase dues (`remainingAmount`) and binding `purchaseId`. The frontend ledger also features resilient auto-matching so both legacy and newly settled transactions display linked badges and interactive highlights.

### ADR-009: Reports Recent Sales Item and Quantity Breakdown
* **Date:** 2026-09-28
* **Context:** In Reports -> Recent Sales, the "Items" column only displayed raw line-item counts (`X items`), hiding the actual product names, units, and quantities sold.
* **Decision:**
  1. The column header is renamed to "Items & Qty".
  2. Each item displays its individual quantity badge (e.g. `[ 10x ]`), product name, and size attributes.
  3. When an invoice contains multiple items, a summary line shows total pieces (`Total: X pcs`).
  4. Added a dedicated "Sale Price" column displaying the dynamic custom rate per product sold (`customUnitPrice` / `salePrice`).
  5. Compacted the "Print Invoice" action button to a sleek "Print" button to optimize table space and keep all columns balanced.

### ADR-010: Product Update Propagation Across Historical Records
* **Date:** 2026-09-28
* **Context:** When a product's name, size, unit, or SKU was edited in the inventory catalog, existing historical invoices, purchases, and stock transfers preserved old snapshots without reflecting the updated name.
* **Decision:**
  1. `PUT /api/products/:id` invokes `propagateProductUpdates` to automatically update product attributes across all historical sales, purchases, and stock transfers in SQLite document storage.
  2. The database startup reconciler includes `syncProductNamesWithHistoricalRecords` to guarantee transaction line items remain synchronized with the product catalog across server restarts.

### ADR-011: Removal of Sale Price Field in Edit Product Modal
* **Date:** 2026-09-28
* **Context:** Showroom operations determine selling price dynamically at the sales counter during checkout based on dimensions, wood quality, and customer negotiation. Requiring or displaying a static "Sale Price" during product editing created friction and redundant data entry.
* **Decision:**
  1. The "Sale (Rs)" input field is removed from the "Edit Product" modal in `dist/assets/index-BQlSbgAO.js`.
  2. The update validation was relaxed so `salePrice` is no longer a mandatory required field during product editing.
  3. Only the `Purchase (Rs)` (cost) is configured in inventory, while sale prices remain fully dynamic at point of sale.

### ADR-012: Supplier Payment Decoupling & Purchase Initial Paid Isolation in Cashbook
* **Date:** 2026-10-05
* **Context:** In Cashbook, when paying supplier dues (e.g. Rs. 60,000), no "Supplier Payment" row was created because FIFO allocation linked `purchaseId`, which was filtered out by `!he.purchaseId`. Concurrently, the original purchase row's outflow inflated to include subsequent settlements, obscuring the audit trail.
* **Decision:**
  1. Purchases store `initialPaid` (the upfront cash recorded at procurement). The Cashbook `Purchase` row strictly reads `initialPaid`.
  2. The Cashbook filter for later supplier payments removes `!he.purchaseId` check, ensuring all non-immediate payments to vendors appear as dedicated `Supplier Payment` rows.

### ADR-013: Pakistani Timezone Standardization (Asia/Karachi / UTC+5)
* **Date:** 2026-10-05
* **Context:** Business operations are situated in Pakistan (UTC+5). Comparing UTC timestamps against local midnight caused transactions logged late at night or early morning to be dropped or misclassified in `Today`, `Yesterday`, `This Week`, and `This Month` date filters.
* **Decision:**
  1. All date grouping and range filters in Cashbook evaluate against timestamps converted using `toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' })`.
  2. Date formatting primitives throughout the application use `timeZone: 'Asia/Karachi'` to guarantee consistent display.

### ADR-014: In-Settings Transaction Manager with Real-Time Search & ACID Reversal Endpoints
* **Date:** 2026-10-05
* **Context:** In retail management, accidental entries, cancelled sales, or voided purchases require a centralized, safe voiding mechanism with full ledger and stock restoration.
* **Decision:**
  1. Created a dedicated **Transaction Management & Void** module inside the Settings tab featuring real-time search across invoice #, entity names, details, and amounts.
  2. Implemented atomic deletion endpoints: `DELETE /api/sales/:id`, `DELETE /api/purchases/:id`, `DELETE /api/supplier-payments/:id`, and `DELETE /api/payments/:id`.
  3. All operations run within the serialized `executeTransaction` queue to guarantee consistent stock restoration and balance reversals without race conditions.

---

## 4. Environment Variables Reference

| Variable | Default Value | Purpose | Production Setting |
|---|---|---|---|
| `PORT` | `7860` | Express HTTP server listen port | Set by Hostinger / Cloud environment |
| `APP_DATA_PATH` | `backend/` | Directory where `database.sqlite` and `backups/` reside | Local filesystem path |
| `ADMIN_RESET_TOKEN` | *(Defined in .env)* | Secret authorization key required for `POST /api/reset` | Set to a strong 32+ char random string |
| `ALLOW_DB_RESET` | `true` | Master feature flag enabling or disabling factory reset route | Set to `false` in production |
| `ALLOWED_ORIGINS` | `*` (or null) | Comma-separated list of allowed CORS domains | `https://your-domain.com` |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | `./serviceAccountKey.json` | Firebase configuration credentials (if enabled) | Absolute path to credentials |

---

## 5. Operational Runbooks

### 5.1 Starting the Application Locally
```bash
# Production mode (serves frontend + backend on port 7860)
npm start

# Dev mode
npm run dev
```

### 5.2 Archify & Graphify Sync (Run After Every Code Change)
```powershell
# 1. Update Archify interactive visual diagram
node .agents/skills/archify/bin/archify.mjs render architecture qa/architecture.json architecture.html

# 2. Update Graphify AST Knowledge Graph
& .\.venv\Scripts\graphify.exe update .
```

### 5.3 Test Sanitation Policy
```powershell
# All test runners or scratch scripts must be deleted immediately after verification:
# Never leave qa/test_*.js or debug scripts in the repository.
```
