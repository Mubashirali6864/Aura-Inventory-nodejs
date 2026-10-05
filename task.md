# Task & Development Roadmap
## Aura Furniture Management & POS System (Shan-e-Aziz POS)

**Status:** Living Task Board & Engineering Roadmap  
**Last Updated:** 2026-09-21  
**Baseline Audit:** [qa/reports/MASTER_QA_REPORT.md](file:///e:/Softwares/Aura%20Inventory%20nodejs/qa/reports/MASTER_QA_REPORT.md)  
**System Architecture:** [architecture.md](file:///e:/Softwares/Aura%20Inventory%20nodejs/architecture.md) | [architecture.html](file:///e:/Softwares/Aura%20Inventory%20nodejs/architecture.html)  

---

## 1. Task Status Overview

```
┌────────────────────────────────────────────────────────┐
│                   TASK PROGRESSION                     │
│                                                        │
│  [ Phase 1: Critical Bugfixes & Patches ]  ████████ 100%
│  [ Phase 2: High-Priority Release Tasks ]  ██████░░  68%
│  [ Phase 3: Planned Platform Backlog    ]  ░░░░░░░░   0%
└────────────────────────────────────────────────────────┘
```

| Category | Completed | In Progress | Planned | Total |
|---|---|---|---|---|
| **Security & Resilience** | 4 | 2 | 2 | 8 |
| **Financial & Ledger Integrity** | 6 | 0 | 0 | 6 |
| **Inventory & POS Features** | 3 | 0 | 1 | 4 |
| **Testing & CI/CD** | 2 | 0 | 2 | 4 |
| **Total** | **15** | **2** | **5** | **22** |

---

## 2. Phase 1: Completed Security & Stability Patches

The following critical defects, security vulnerabilities, and UX issues identified during empirical testing and the Master QA Audit have been resolved and verified.

### ✅ TASK-SEC-01: Administrative Reset Route Token Guard
* **Origin:** `FINDING-P0-01` (`SEC-WIPE-01`)
* **Description:** Protect `POST /api/reset` against unauthenticated database wipes.
* **Solution:** Added dual-guard verification requiring `ALLOW_DB_RESET=true` in `.env` and matching `ADMIN_RESET_TOKEN` header (`x-admin-token` or `authorization`). Unauthenticated calls return `HTTP 401 Unauthorized`.
* **Files Modified:** `backend/index.js:L1079-1105`, `.env`
* **Status:** Verified ✅

### ✅ TASK-SEC-02: Defensive Security Headers & CORS Policy
* **Origin:** `FINDING-P2-01`, `FINDING-P2-02`
* **Description:** Mitigate cross-site scripting, clickjacking, and unauthorized cross-origin requests.
* **Solution:** Injected `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, and strict `Content-Security-Policy`. Implemented origin whitelist parsing via `process.env.ALLOWED_ORIGINS`.
* **Files Modified:** `backend/index.js:L13-36`
* **Status:** Verified ✅

### ✅ TASK-SEC-03: Inventory Stock Inflation Guard (Negative Sales Exploit)
* **Origin:** `FINDING-P0-03` (`BIZ-EXPLOIT-01`)
* **Description:** In `POST /api/sales`, negative line item quantities (`quantity: -25`) mathematically inverted deduction logic (`stock - (-25) = stock + 25`), arbitrarily fabricating inventory.
* **Solution:** Enforced strict positive integer validation on all sales line items. Quantities $\le 0$ are rejected with `HTTP 400 Bad Request`.
* **Files Modified:** `backend/index.js:L695-720`
* **Status:** Verified ✅

### ✅ TASK-FIN-01: Customer Credit Validation on Partial & Pending Invoices
* **Origin:** Ledger Integrity Audit
* **Description:** Customers could checkout on credit using generic "Walk-in Customer" with no phone number, causing anonymous unrecoverable debt balances.
* **Solution:** Patched frontend POS checkout (`dist/assets/index-BQlSbgAO.js`) and backend validation. For `Partial` or `Pending` sales, `Customer Name` (rejecting "Walk-in") and `Phone Number` are strictly mandated.
* **Files Modified:** `dist/assets/index-BQlSbgAO.js`, `backend/index.js`
* **Verification Script:** `node qa/verify_partial_pending_validation.js`
* **Status:** Verified ✅

### ✅ TASK-FIN-02: Zero-Balance Supplier Payment Lock
* **Origin:** Vendor Ledger Audit
* **Description:** Users could click "Pay Supplier" on vendors with zero outstanding balance, creating negative accounts payable and corrupting the cashbook.
* **Solution:** Hard-disabled the "Pay Supplier" button in the UI when `supplier.balance <= 0`. Added guard checks in payment submission handler `$t` and backend controller.
* **Files Modified:** `dist/assets/index-BQlSbgAO.js`, `backend/index.js`
* **Verification Script:** `node qa/verify_pay_supplier_lock.js`
* **Status:** Verified ✅

### ✅ TASK-FIN-03: Cashbook Procurement & Supplier Payment Journal Integration
* **Origin:** Financial Reporting Gap
* **Description:** Cashbook previously tracked only sales, customer debt payments, and expenses, omitting procurement expenditures and supplier payments.
* **Solution:** Unified purchases (`ee`) and supplier payments (`te_sup`) into the Cashbook transaction stream `pe`. Added dropdown filtering for `Purchase` and `Supplier Payment` with distinct visual badges.
* **Files Modified:** `dist/assets/index-BQlSbgAO.js`
* **Verification Script:** `node qa/verify_cashbook_patch.js`, `node qa/verify_cashbook_live.js`
* **Status:** Verified ✅

### ✅ TASK-INV-01: Product Creation Pricing UX Optimization
* **Origin:** Retail Workflow Refinement
* **Description:** Cashiers negotiate furniture sale prices at the counter; pre-setting fixed retail prices during inventory intake created redundant friction.
* **Solution:** Removed the `Sale Price` input from product creation, defaulting `salePrice` to 0. Prioritized `Cost Price` and `Initial Qty` in a clean 2-column input grid.
* **Files Modified:** `dist/assets/index-BQlSbgAO.js`
* **Status:** Verified ✅

### ✅ TASK-DR-01: Automated Database Backup & In-App Restoration Engine
* **Origin:** `FINDING-P3-03` / Reliability Audit
* **Description:** System lacked any automated snapshotting or disaster recovery mechanisms.
* **Solution:**
  1. Built backend backup engine (`ensureDailyBackup()` every 6 hours into `backend/backups/`).
  2. Implemented `GET /api/backups`, `POST /api/backups/create`, `GET /api/backups/download/:filename`, and `POST /api/backups/restore`.
  3. Integrated a complete Settings UI with backup selector dropdown, download button, and confirmation modal featuring automated pre-restore safety snapshots.
* **Files Modified:** `backend/index.js:L117-163, 971-1077`, `dist/assets/index-BQlSbgAO.js`
* **Verification Script:** `node qa/verify_backup_feature.js`
* **Status:** Verified ✅

### ✅ TASK-DR-02: Startup Duplicate Product Reconciler
* **Origin:** Database Sanitization
* **Description:** Duplicate products created with matching name, size, unit, and shop accumulated across branches.
* **Solution:** Created `mergeDuplicateProducts()` on server startup to detect identical items, combine physical stock, and delete redundant records.
* **Files Modified:** `backend/index.js:L221-270`
* **Status:** Verified ✅

### ✅ TASK-ARCH-01: Interactive Visual Architecture Specification
* **Origin:** Documentation & System Clarity
* **Description:** Provide interactive visual architectural models for developers and stakeholders.
* **Solution:** Authored typed Archify specification `qa/architecture.json`, validated against the `showcase` profile (0 errors, 0 warnings), and delivered standalone `architecture.html`.
* **Files Modified:** `qa/architecture.json`, `architecture.html`
* **Status:** Verified ✅

### ✅ TASK-DAT-01: SQLite ACID Transaction Queue Serializer
* **Origin:** `FINDING-P1-03` (`DB-TXN-01`)
* **Description:** Concurrent multi-table operations (`POST /api/sales`, `POST /api/purchases`, `POST /api/products/transfer`, `POST /api/payments`) needed atomicity and queue serialization to prevent SQLite lock contention.
* **Solution:** Implemented `executeTransaction` queue serializer in `backend/index.js` running all steps inside `BEGIN IMMEDIATE TRANSACTION` / `COMMIT` / `ROLLBACK`.
* **Files Modified:** `backend/index.js`
* **Status:** Verified ✅

### ✅ TASK-FIN-04: Floating-Point Ledger Precision Hardening
* **Origin:** `FINDING-P2-04` (`BIZ-FLOAT-01`)
* **Description:** Javascript IEEE-754 floating point arithmetic caused sub-cent ledger drift on running balances.
* **Solution:** Standardized financial values via `roundMoney(val) = Math.round(Number(val) * 100) / 100` across all API controllers and database calculations.
* **Files Modified:** `backend/index.js`
* **Status:** Verified ✅

### ✅ TASK-FIN-05: Supplier Payment Decoupling & Purchase Initial Paid Isolation
* **Origin:** Cashbook Audit
* **Description:** Supplier settlements did not appear as their own Cashbook rows; instead, the original purchase row inflated from initial payment to cumulative payment.
* **Solution:** Decoupled `initialPaid` for purchases in both backend and frontend. Removed `!he.purchaseId` filter so FIFO-linked vendor payments appear as dedicated `Supplier Payment` rows.
* **Files Modified:** `backend/index.js`, `dist/assets/index-BQlSbgAO.js`
* **Status:** Verified ✅

### ✅ TASK-LOC-01: Pakistani Timezone Standardization (`Asia/Karachi` / UTC+5)
* **Origin:** Operational Localization Requirement
* **Description:** UTC date filtering caused late-night or early-morning transactions in Pakistan to drop out of `Today`, `Yesterday`, `This Week`, and `This Month` date filters.
* **Solution:** Standardized all period filtering and date/time displays in Cashbook and global UI formatters to evaluate using `Asia/Karachi` (UTC+5).
* **Files Modified:** `dist/assets/index-BQlSbgAO.js`
* **Status:** Verified ✅

### ✅ TASK-TRX-01: In-Settings Transaction Manager with Real-Time Search & ACID Reversal
* **Origin:** Administrative Operations
* **Description:** Provide a centralized search and voiding panel in Settings to review and delete errant sales, purchases, or payments with complete stock and ledger reversals.
* **Solution:**
  1. Built REST deletion endpoints with full inventory and financial rollbacks: `DELETE /api/sales/:id`, `DELETE /api/purchases/:id`, `DELETE /api/supplier-payments/:id`, `DELETE /api/payments/:id`.
  2. Integrated a responsive **Transaction Management & Void** panel in Settings featuring live search by invoice #, entity, details, and amount with category filters and confirmation prompts.
* **Files Modified:** `backend/index.js`, `dist/assets/index-BQlSbgAO.js`
* **Status:** Verified ✅

---

## 3. Phase 2: High-Priority Release Blockers (Immediate Action Required)

The following items are required before production certification can be granted.

### 🔴 TASK-SEC-04: Full Authentication & Role-Based Access Control (RBAC)
* **Priority:** P0 (Release Blocker)
* **Finding Reference:** `FINDING-P0-02` (`SEC-AUTH-01`)
* **Problem:** All REST API endpoints currently execute without authentication tokens or sessions. Anyone with network access can read or alter financial ledgers.
* **Proposed Implementation:**
  1. Add `users` table to SQLite (`id`, `username`, `passwordHash`, `role`, `shopId`).
  2. Implement `POST /api/auth/login` returning signed JWT with configurable expiration.
  3. Create `authMiddleware` verifying JWT on all `/api/*` routes (except login and health checks).
  4. Enforce roles: `Admin` (full access), `Manager` (purchases, inventory, reports), `Cashier` (sales counter only).
* **Target Milestone:** v2.0 Release

### 🔴 TASK-CONC-01: Concurrency Protection on Stock Deductions
* **Priority:** P0 (Critical)
* **Finding Reference:** `FINDING-P0-04` (`CONC-STOCK-01`)
* **Problem:** In-memory read-modify-write pattern causes lost updates when two terminals simultaneously sell the last remaining unit of an item.
* **Proposed Implementation:** Use conditional atomic SQL updates:
  ```sql
  UPDATE products 
  SET data = json_set(data, '$.stock', json_extract(data, '$.stock') - ?)
  WHERE id = ? AND CAST(json_extract(data, '$.stock') AS INTEGER) >= ?;
  ```
* **Target Milestone:** v2.0 Release

### 🟡 TASK-DEP-01: Platform-Agnostic Dependency Hygiene
* **Priority:** P1 (High)
* **Finding Reference:** `FINDING-P1-01` (`DEP-ARCH-01`)
* **Problem:** Committed Linux ELF binary `node_modules/sqlite3/build/Release/node_sqlite3.node` crashes on Windows workstations with `ERR_DLOPEN_FAILED`.
* **Proposed Implementation:**
  1. Add `node_modules/` to `.gitignore`.
  2. Delete tracked `node_modules` from Git repository index: `git rm -r --cached node_modules`.
  3. Provide npm rebuild script or Docker container definition for unified deployments.
* **Target Milestone:** v2.0 Release

---

## 4. Phase 3: Backlog & Enhancements

* **TASK-LOG-01 (P3): Structured Logging Pipeline:** Replace `console.log` with `pino` or `winston` providing JSON-formatted outputs and log levels (`info`, `warn`, `error`).
* **TASK-TEST-01 (P2): CI/CD Automated Test Suite:** Establish GitHub Actions pipeline running Supertest API integration tests and Playwright E2E tests against headless instances.
* **TASK-HW-01 (P3): Thermal Receipt Printer Driver:** Add raw ESC/POS network/USB socket printing support for 80mm/58mm receipt printers.
* **TASK-HW-02 (P3): Cash Drawer Kick Pulse:** Transmit RJ11 cash drawer trigger pulse on committed cash checkout.
* **TASK-SYNC-01 (P3): Offline Resilience:** Implement IndexedDB client cache allowing counter checkout during temporary broadband outages with background replay synchronization.

---

## 5. Verification & Testing Matrix

Run the following test scripts from project root to verify system integrity:

```bash
# 1. Run empirical security & functionality audit
node qa/audit_runner.js

# 2. Verify customer credit validation guards (Partial & Pending bills)
node qa/verify_partial_pending_validation.js

# 3. Verify zero-balance supplier payment lock
node qa/verify_pay_supplier_lock.js

# 4. Verify automated backup engine & restore functionality
node qa/verify_backup_feature.js

# 5. Verify Cashbook transactions integration
node qa/verify_cashbook_patch.js

# 6. Re-validate Archify architecture diagram
node .agents/skills/archify/bin/archify.mjs validate architecture qa/architecture.json --quality showcase --json
```
