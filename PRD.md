# Product Requirements Document (PRD)
## Aura Furniture Management & POS System (Shan-e-Aziz POS)

**Document Version:** 2.2  
**Status:** Approved / Active Production Release  
**Target Environment:** Node.js (v20+ / v24), Express, SQLite3 Document Store, React 18 Vite SPA  
**Production URL:** `https://cms.multiplebusinesscompany.com`  
**Primary Domain:** Retail Furniture & Multi-Shop Inventory Management  

---

## 1. Executive Summary & Problem Statement

### 1.1 Executive Summary
The **Aura Furniture Management System** (operating commercially as **Shan-e-Aziz POS**) is an enterprise Point of Sale (POS), inventory management, customer credit ledger, cash-flow accounting, and mistake recovery platform designed for multi-branch retail furniture operations. The platform enables multi-shop stock tracking across **Shop 1**, **Shop 2**, and **Shop 3**, real-time counter sales, customer debit/credit balance management, procurement receiving, supplier payment accounting, expense tracking, ACID transaction reversals, and continuous automated data protection with 1-click mistake undo.

### 1.2 Problem Statement
Traditional retail management software suffers from critical friction points in furniture and physical retail environments:
1. **Multi-Location Stock Fragmentation:** Disconnected tracking between multiple showrooms/warehouses (Shop 1, Shop 2, and Shop 3) leads to duplicate product entries, stock miscounts, and accidental overselling.
2. **Complex Credit & Ledger Accounting:** High-ticket furniture items frequently involve upfront down payments, partial bill settlements, and extended customer debt ledgers. Manual book entries create severe cash discrepancies.
3. **Vendor Procurement Dues:** Retailers procure items on credit from multiple suppliers. Without real-time debt tracking, overpayment blocks, and FIFO bill clearing, untracked liabilities occur.
4. **Data Loss & Accidental Human Mistakes:** Fast counter checkouts inevitably lead to occasional mistakes (wrong items, incorrect amounts, accidental clicks). Without surgical undo and rolling hourly snapshots, fixing mistakes requires manual database intervention.

### 1.3 Vision & Objectives
Provide an ultra-responsive, lightweight, zero-latency desktop and cloud-hosted POS solution that combines intuitive counter checkout with strict financial ledger reconciliation, surgical mistake recovery, and continuous automated data protection.

---

## 2. User Personas & Use Cases

### 2.1 User Personas

| Persona | Role | Key Needs & Pain Points | Primary Modules Used |
|---|---|---|---|
| **Store Owner / Executive** | Business Principal | Wants consolidated daily sales totals, real-time cash balance, debtor receivables, supplier liabilities, and zero risk of data loss. | Dashboard, Cashbook, Settings (Backups), Reports |
| **Cashier / Sales Clerk** | Front-Desk Checkout | Requires rapid product search, fast cart additions, flexible down-payment handling, instant invoice generation, and customer phone lookups across any of the 3 shop branches. | Point of Sale (POS), Invoices, Customers |
| **Warehouse / Inventory Manager** | Stock Controller | Needs clear visibility of stock by branch (Shop 1, Shop 2, and Shop 3), effortless inter-shop transfers, and duplicate product consolidation. | Products, Stock Transfers, Purchases |
| **Accountant / Bookkeeper** | Financial Auditor | Audits daily cash registers, reconciles supplier payments with vendor bills, logs operational expenses, and tracks customer credit balances. | Cashbook, Ledger, Expenses, Supplier Payments |

### 2.2 Key User Journeys

#### Customer Credit Sale Workflow
```
[Customer arrives at POS]
         │
         ▼
[Cashier adds furniture items to Cart]
         │
         ▼
[Selects "Partial" or "Pending" Payment]
         │
         ▼
[System enforces mandatory Customer Name & Phone Number]
         │
         ▼
[Cashier enters Down Payment amount (e.g., 20,000 PKR of 50,000 PKR total)]
         │
         ▼
[System records Sale: status="Partial", paid=20000, remaining=30000]
         │
         ├── Deducts product stock immediately
         ├── Creates linked Payment record for down payment
         ├── Increments Customer's debt balance by remaining 30,000
         └── Logs Cashbook entry: Type="Sale", Amount=+20,000, Remaining=+30,000
```

#### Supplier Procurement & Payment Workflow
```
[New Stock Received from Vendor]
         │
         ▼
[Manager enters Purchase: Supplier, Items, Cost, Upfront Payment]
         │
         ├── Increments Product physical inventory
         ├── Adds remaining cost to Supplier balance (Accounts Payable)
         └── Logs Cashbook entry: Type="Purchase", Amount=Upfront Paid
         │
         ▼
[Subsequent Settlement of Supplier Dues]
         │
         ├── Manager opens Supplier profile
         ├── System verifies Supplier Balance > 0 (Locks button if Balance <= 0)
         ├── Manager enters payment amount
         ├── Deducts Supplier Balance
         └── Logs Cashbook entry: Type="Supplier Payment", Amount=Paid
```

---

## 3. Product Scope & Functional Requirements

### 3.1 Point of Sale (POS) & Checkout Engine (FR-POS)
* **FR-POS-01: Multi-Shop Context Switching:** Cashier can toggle between **Shop 1**, **Shop 2**, and **Shop 3** contexts. Product availability, invoice series, and cashbooks adapt to the selected store location.
* **FR-POS-02: Fast Item Search & Cart:** Search items by name, category, SKU, size, or unit. Support dynamic quantity adjustments, inline discounts, and custom pricing overrides.
* **FR-POS-03: Payment Status Modes:**
  * **Paid:** Full invoice total paid immediately.
  * **Partial:** Upfront down-payment accepted; remaining balance automatically debited to the customer's ledger.
  * **Pending:** Zero upfront payment; full bill debited to the customer's ledger.
  * **Quotation:** Non-binding price quote; does not decrement inventory or alter ledgers.
* **FR-POS-04: Mandatory Customer Validation on Credit:** If payment status is `Partial` or `Pending`, the system strictly mandates a non-empty `customerName` (rejecting generic "Walk-in Customer") and a valid `customerPhone`.
* **FR-POS-05: Sequential Invoice Numbering:** Each committed sale automatically receives an incremental human-readable invoice number via the `counters` table (e.g., `#1001`, `#1002`).
* **FR-POS-06: Sales Returns & Refund Reversals:** Support item returns with negative stock adjustment inversions, refund calculations, and ledger reversals.
* **FR-POS-07: Live Return Invoice Auto-Population:** When processing a return in POS, selecting or entering an original invoice # auto-loads customer details and invoiced items. Cashiers specify return quantities; returned items decrement `returnedQuantity` on the original sale and restore product physical stock.
* **FR-POS-08: Dynamic Counter Pricing:** Flexible counter checkout pricing allowing sales staff to adjust unit rates dynamically without rigid catalog constraints.

### 3.2 Inventory & Multi-Branch Stock Control (FR-INV)
* **FR-INV-01: Product Catalog Management:** Maintain product records with fields: `name`, `category`, `size`, `unit` (Piece, Set, Meter, Box, etc.), `purchasePrice` (Cost Price), `salePrice` (defaulting to 0/open), `stock`, and `shopId` (`shop-1`, `shop-2`, `shop-3`).
* **FR-INV-02: Streamlined Product Creation:** Creation interface captures Cost Price and Initial Quantity, removing redundant pre-set retail prices to accommodate flexible furniture pricing.
* **FR-INV-03: Inter-Shop Stock Transfers:** Transfer inventory between any permutation of branches (Shop 1, Shop 2, and Shop 3). Automatically decreases source branch stock, increments target branch stock, and generates an auditable `stockTransfers` record.
* **FR-INV-04: Automated Startup Duplicate Reconciliation:** On server boot, `mergeDuplicateProducts()` detects matching entities (`${shopId}::${name}::${size}::${unit}`), combines their stock balances into the primary SKU, and purges duplicate records.
* **FR-INV-05: Absolute Three-Shop Parity:** Complete functional symmetry across **Shop 1**, **Shop 2**, and **Shop 3** across inventory catalog, POS counter switching, procurement receiving, stock transfers, and financial cashbooks.

### 3.3 Customer Debt & Credit Ledger (FR-CUST)
* **FR-CUST-01: Customer Directory:** Manage customer identities including `name`, `phone`, `address`, and computed running `balance`.
* **FR-CUST-02: Automated Debt Accumulation:** Unpaid invoice balances (`totalAmount - paidAmount`) automatically increment customer debt.
* **FR-CUST-03: Subsequent Invoice Settlements:** Customers can submit payments against their outstanding debt via cash, card, or bank transfer. Each payment reduces their balance and creates a linked `payments` audit record.
* **FR-CUST-04: Ledger Journal Reconciliation:** Endpoint `POST /api/recalculate-balances` provides on-demand mathematical reconciliation of customer balances:
  $$\text{Balance} = (\text{Total Purchases} - \text{Total Returns}) - \text{Total Payments}$$
* **FR-CUST-05: Detailed Ledger Linking & Highlight:** In Customer Detailed Ledger, payments feature a clickable `🔗 Linked Inv #...` badge; clicking either smoothly scrolls and highlights the matching invoice row in light blue.

### 3.4 Supplier Procurement & Accounts Payable (FR-SUP)
* **FR-SUP-01: Supplier Directory:** Maintain vendor profiles with `name`, `contactPerson`, `phone`, `email`, `address`, and running accounts payable `balance`.
* **FR-SUP-02: Purchase Invoicing:** Record vendor supply shipments with line items, cost prices, upfront cash disbursements, receiving store (`Shop 1`, `Shop 2`, `Shop 3`), and remaining vendor liabilities.
* **FR-SUP-03: Zero-Balance Payment Lock:** If a supplier's balance is $\le 0$, the "Pay Supplier" action is hard-disabled across both UI and API to prevent accidental negative debt balances and phantom cash disbursements.
* **FR-SUP-04: Auto-Fill Outstanding Dues & Overpay Protection:** Clicking "Pay Supplier" automatically pre-fills the payment field with outstanding dues (`supplier.balance`) and strictly blocks overpaying (`amount > supplier.balance`) with an alert and disabled action.
* **FR-SUP-05: FIFO Purchase Allocation & Auto-Linking:** When paying supplier dues, payments automatically allocate across open purchases in chronological (FIFO) order, clearing purchase dues (`remainingAmount`) and linking `purchaseId`.

### 3.5 Cashbook & Cash-Flow Auditing (FR-CASH)
* **FR-CASH-01: Unified Financial Journal:** A single chronological ledger aggregating all business cash inflows and outflows:
  * **Inflows (+):** Cash Sales, Down Payments, Subsequent Customer Debt Settlements.
  * **Outflows (-):** Operating Expenses, Procurement Upfront Payments, Supplier Debt Settlements, Sales Returns Refunds.
* **FR-CASH-02: Multi-Dimension Filtering:** Filter journal transactions by Store Location (`All Shops`, `Shop 1`, `Shop 2`, `Shop 3`), Date Range (Today, Week, Month, Custom), and Transaction Type (`Sale`, `Payment`, `Expense`, `Purchase`, `Supplier Payment`, `Return`, `Transfer`).
* **FR-CASH-03: Receivables & Payables Badging:** Visual indicators distinguish settled transactions from sales/purchases with outstanding debtor or creditor balances.
* **FR-CASH-04: Pakistani Timezone Enforcement:** All period filters (`Today`, `Yesterday`, `This Week`, `This Month`, `Specific Date`) and row timestamps strictly evaluate and display in Pakistani Time (`Asia/Karachi` / UTC+5).
* **FR-CASH-05: Settlement Deep Linking:** Clicking a settled payment row smoothly scrolls and highlights the original credit invoice row (`tx-row-INV-...`) in theme-matched light blue.

### 3.6 Backup, Disaster Recovery & Mistake Recovery (FR-ADMIN)
* **FR-ADMIN-01: Automated Daily & 6-Hour Snapshots:** Background scheduler automatically saves dated SQLite copies (`backup-YYYY-MM-DD.sqlite`) into `backend/backups/`.
* **FR-ADMIN-02: Rolling Hourly Auto-Snapshots:** Background scheduler checks every 15 minutes and generates rolling hourly snapshots (`backup-hourly-YYYY-MM-DD-HH00.sqlite`), retaining the last 24 snapshots.
* **FR-ADMIN-03: One-Click Manual Backup Creation:** Operators can trigger an instantaneous database snapshot on demand from the Settings panel.
* **FR-ADMIN-04: In-App Database Restoration:** Operators can select any historical snapshot and restore it as the live database. The system automatically creates an unconditional safety copy (`pre-restore-safety-...`) before switching.
* **FR-ADMIN-05: Quick Undo & Mistake Recovery:**
  * **⚡ Surgical Undo:** 1-click reversal of the most recent sale, purchase, customer payment, or supplier payment, automatically rolling back product inventory and financial balances.
  * **⏪ Time Machine Rollback:** 1-click restore to the snapshot from ~1 hour ago with automatic pre-undo safety snapshot protection.
* **FR-ADMIN-06: ACID Multi-Table Transaction Management & Void:** Serialized `executeTransaction` SQLite transaction wrapper guarantees zero partial states. Comprehensive real-time transaction search allows voiding sales, purchases, customer payments, and supplier payments with immediate inventory and ledger rollbacks.
* **FR-ADMIN-07: Guarded Administrative Factory Reset:** `POST /api/reset` is strictly guarded by `ADMIN_RESET_TOKEN` and `ALLOW_DB_RESET=true` environment configuration with mandatory pre-reset safety snapshots.

---

## 4. Non-Functional Requirements (NFR)

### 4.1 Performance & Latency
* **NFR-PERF-01:** API response times for read operations (`GET /api/*`) must resolve in $< 50\text{ ms}$ under local network conditions.
* **NFR-PERF-02:** Cart checkout and inventory deduction (`POST /api/sales`) must complete in $< 150\text{ ms}$.
* **NFR-PERF-03:** Client bundle size should remain lightweight ($< 1.5\text{ MB}$ uncompressed assets) to allow rapid initial loading on low-spec counter terminals.

### 4.2 Data Integrity & Resilience
* **NFR-DATA-01:** Stock quantities must strictly be positive numbers; negative quantity submissions must return `HTTP 400 Bad Request`.
* **NFR-DATA-02:** Financial figures must be rounded to 2 decimal places to prevent JavaScript IEEE-754 floating point accumulation drift.
* **NFR-DATA-03:** Database file writes must use synchronous WAL or atomic copy mechanics during snapshots to prevent SQLite file corruption.
* **NFR-DATA-04:** All multi-table updates must use `stripUndefined(data)` before merging to prevent `undefined` values from wiping existing fields.

### 4.3 Security & Boundaries
* **NFR-SEC-01:** HTTP Security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Content-Security-Policy`) must be enforced on all responses.
* **NFR-SEC-02:** CORS must restrict cross-origin access to explicitly declared domains (`ALLOWED_ORIGINS`).
* **NFR-SEC-03:** Destructive operations (`/api/reset`) must require administrative authorization tokens.

### 4.4 Deployment & Portability
* **NFR-DEP-01:** System supports seamless dual execution: local Windows desktop workstations (via Node.js) and Linux Cloud environments (Hostinger Phusion Passenger on `cms.multiplebusinesscompany.com` via root `server.js`).

---

## 5. Entity Relationship & Data Model

The application employs a document-store pattern built on SQLite. Each core table contains:
```sql
CREATE TABLE <table_name> (
    id TEXT PRIMARY KEY,
    data TEXT  -- JSON stringified payload
);
```

### Core Entities Summary

```
   ┌────────────────┐         1:N          ┌────────────────┐
   │   CUSTOMERS    │─────────────────────▶│     SALES      │
   │ id, name,      │                      │ id, invNo,     │
   │ phone, balance │                      │ items, total   │
   └───────┬────────┘                      └───────┬────────┘
           │                                       │
           │ 1:N                                   │ 1:N
           ▼                                       ▼
   ┌────────────────┐                      ┌────────────────┐
   │    PAYMENTS    │                      │    PRODUCTS    │
   │ id, custId,    │◀─────────────────────│ id, sku, name, │
   │ saleId, amount │                      │ stock, shopId  │
   └────────────────┘                      └───────▲────────┘
                                                   │
   ┌────────────────┐         1:N                  │ 1:N
   │   SUPPLIERS    │──────────────────────┐       │
   │ id, name,      │                      │       │
   │ phone, balance │                      │       │
   └───────┬────────┘                      ▼       │
           │ 1:N                   ┌────────────────┐
           │                       │   PURCHASES    │
           │                       │ id, supplierId,│
           ▼                       │ items, total   │
   ┌────────────────┐              └────────────────┘
   │SUPPLIERPAYMENTS│
   │ id, supplierId,│
   │ amount, date   │
   └────────────────┘
```

---

## 6. Release Milestones & Feature Roadmap

| Milestone | Target | Description | Status |
|---|---|---|---|
| **v1.0 Baseline** | Initial Build | Multi-shop POS, product catalog, sales billing, customer directory, basic SQLite storage. | Delivered |
| **v1.1 Security Audit** | Hardening Phase | Adversarial QA audit, identified P0-P3 vulnerabilities (reset route, negative sales, missing headers). | Completed |
| **v1.2 Ledger & Stability** | Accounting Phase | Cashbook procurement integration, customer validation guards, pay-supplier lock, automated backup & restore engine. | Delivered |
| **v2.0 ACID & Transactions** | Reliability Phase | ACID `executeTransaction` transactions, Transaction Management & Void with stock/ledger rollback, Pakistani timezone. | **Delivered / Live** |
| **v2.1 Shop 3 & Live Returns** | Scale Phase | Full Shop-3 parity across all modules, inter-shop transfers (6 permutations), live Return invoice auto-population. | **Delivered / Live** |
| **v2.2 Quick Undo & Recovery** | Safety Phase | 1-Click Surgical Undo of last transaction, rolling hourly snapshots (24h retention), Time Machine rollback, Hostinger deploy. | **Active Production Baseline** |
| **v3.0 Authentication & RBAC** | Future Release | JWT user authentication, cashier vs manager role-based permissions, comprehensive audit trail. | Planned |
| **v3.1 Hardware Integrations** | Future Release | Thermal receipt ESC/POS printer driver, USB barcode scanner input, cash drawer kick pulse. | Roadmap |
