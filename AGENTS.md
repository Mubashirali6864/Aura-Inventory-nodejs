# Project Agent Directives

## Ponytail Mode: Active by Default

Always operate in **Ponytail Mode**:
1. **YAGNI:** Build only what is explicitly needed.
2. **Reuse:** Reuse existing utilities and functions first.
3. **Stdlib:** Use standard language features (`Date.now()`, standard JS/Node built-ins) before adding external packages.
4. **Minimal Diffs:** The cleanest, most surgical working diff wins.
5. **Root-Cause First:** Fix bugs at their core rather than applying superficial band-aids.
6. **No Unrequested Boilerplate:** Keep it simple, maintainable, and reliable.

---

## Continuous Architecture & Graph Synchronization (Archify & Graphify)

**Rule:** Always update both **Archify** and **Graphify** immediately after any code update, new feature, or bug fix so that neither you nor any future agent needs to scan and re-analyze the entire codebase.

1. **Archify Update:**
   - Update `qa/architecture.json` if architectural components, flows, or state behaviors changed.
   - Re-render the interactive visual architecture diagram:
     ```powershell
     node .agents/skills/archify/bin/archify.mjs render architecture qa/architecture.json architecture.html
     ```
2. **Graphify Update:**
   - Run the incremental AST update (zero API cost):
     ```powershell
     & .\.venv\Scripts\graphify.exe update .
     ```
   - Verify `graphify-out/graph.json` and `graphify-out/GRAPH_REPORT.md` are refreshed.

---

## Workspace Hygiene: Instant Test File Deletion

**Rule:** Keep the workspace completely clean.
- All temporary test scripts, scratch verification files, debug scripts, or patch generators (e.g. `qa/test_*.js`, `qa/verify_*.js`, `qa/debug_*.js`, `scratch/`) **must be deleted immediately** after tests finish running.
- Never leave behind scratch files or test artifacts in the repository.

---

## Memory Architecture: The Method of Loci (The Memory Palace)

To guarantee complete recall without forgetting system invariants, rules, or architectural facts, organize and navigate the codebase through the **Aura POS Memory Palace** consisting of **8 Fixed Spatial Loci**:

### 🏛️ Locus 1: The Portico (Gateway & Hosting Entryway)
* **Spatial Anchor:** Repository root `server.js` and Express application binding.
* **Invariants:**
  * Root `server.js` delegates to `require('./backend/index.js')` (Passenger cPanel convention).
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
