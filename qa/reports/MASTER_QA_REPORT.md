# MASTER QA & SECURITY AUDIT REPORT — AURA INVENTORY NODEJS

**Audit Date:** 2026-09-07  
**Lead Auditor:** Independent Senior QA & Adversarial Security Engineer  
**Scope:** Complete Project Audit (`server.js`, `backend/index.js`, `dist/`, `package.json`, SQLite persistence, dependencies, deployment)  
**Target Environment Tested:** Node.js v24.12.0 (win32-x64), Express REST API, SQLite Document Store, React SPA Bundle  
**Audit Mode:** Non-Destructive Empirical Adversarial Testing & Code Audit  

---

## 1. Executive Summary

This independent quality assurance and security audit evaluates whether the **Aura Furniture Management System** codebase is production-ready.

**Verdict: BLOCKED**  
The software cannot be certified for production deployment. The system suffers from catastrophic security, data-integrity, and architectural vulnerabilities, including:
1. **Unauthenticated Complete Database Wipe (`POST /api/reset`)**: An unauthenticated HTTP request will permanently truncate all 10 SQLite database tables.
2. **Zero Authentication & Authorization**: All sensitive financial records, sales transactions, customer debt ledgers, and supplier procurement data are exposed openly without credentials, tokens, or sessions.
3. **Inventory Inflation via Negative Sales Quantities**: `POST /api/sales` accepts negative item quantities (`quantity = -25`), inverting the deduction logic (`stock - (-25) = stock + 25`) and arbitrarily inflating physical stock.
4. **Binary Architecture Incompatibility**: The project's committed `node_modules` contains Linux ELF 64-bit binaries for `sqlite3`, causing an instant fatal crash (`ERR_DLOPEN_FAILED`) when deployed on Windows servers.
5. **No Automated Test Coverage & Dependency Vulnerabilities**: Zero test scripts exist (`npm test` missing), no CI/CD pipeline, and 12 known npm vulnerabilities (1 Critical, 6 High).

---

## 2. Architecture Map

```
                           SYSTEM ARCHITECTURE MAP
  
  [Client Web Browser] 
          │
          ├── (HTTP Requests / Static SPA Assets)
          ▼
  [server.js] (Hostinger Passenger Startup Wrapper)
          │
          ▼
  [backend/index.js] (Express 4.18.2 Application, Port 7860)
          │
          ├── Middleware:
          │     ├── cors() [Wildcard Origin *]
          │     ├── bodyParser.json()
          │     └── Request Logger
          │
          ├── Static Asset Engine:
          │     └── express.static('dist') + Catch-all 'GET *' -> dist/index.html
          │
          ├── REST API Controllers (20+ Endpoints):
          │     ├── /api/products (CRUD + multi-shop stock transfer)
          │     ├── /api/sales (Billing, stock deduction, returns)
          │     ├── /api/customers & /api/payments (Debtor ledgers)
          │     ├── /api/suppliers & /api/purchases (Vendor procurement)
          │     ├── /api/expenses (Expense accounting)
          │     ├── /api/recalculate-balances (Journal reconciliation)
          │     └── /api/reset (Database truncation)
          │
          └── Storage Layer (SQLite3 Document-Store Pattern):
                ├── Primitives: getAll, getById, insert, update, remove
                ├── Schema: (id TEXT PRIMARY KEY, data TEXT)
                └── File: database.sqlite (10 tables + counters)
```

---

## 3. Test Environment & Methodology

- **Host OS:** Windows x64
- **Runtime:** Node.js v24.12.0
- **Isolation:** QA Test instance executed on port `7861` using an isolated copy of the database (`qa/test_data/database.sqlite`) to prevent production data corruption.
- **Empirical Runner:** Custom HTTP test harness (`qa/audit_runner.js`) executing live adversarial requests against running server endpoints.
- **Audit Rules:** No production source code was modified or weakened.

---

## 4. Test Statistics

| Metric | Count |
|---|---|
| **Total Automated Tests Executed** | 14 |
| **Passed** | 3 (21.4%) |
| **Failed** | 11 (78.6%) |
| **Skipped** | 0 |
| **P0 (Critical Vulnerabilities)** | 4 |
| **P1 (High Severity)** | 3 |
| **P2 (Medium Severity)** | 6 |
| **P3 (Low Severity)** | 2 |

---

## 5. Vulnerabilities & Findings by Severity

### P0 — Critical Findings (Immediate Release Blockers)

#### FINDING-P0-01: Unauthenticated Complete Database Deletion
- **ID:** `SEC-WIPE-01`
- **Severity:** P0
- **Affected Component:** `backend/index.js:L728-736` (`POST /api/reset`)
- **Reproduction Steps:**
  1. Send `POST /api/reset` to the server with an empty body and no authentication headers.
  2. Inspect response.
- **Expected:** `HTTP 401 Unauthorized` or `403 Forbidden`.
- **Actual:** `HTTP 200 OK` with body `{"message":"Database reset successfully"}`.
- **Evidence:** Test `AUTH-03` failed. Server log confirmed: `[2026-09-07T12:00:14.973Z] POST /api/reset` followed by `DELETE FROM products`, `DELETE FROM customers`, etc.
- **Root Cause:** Zero authentication or authorization middleware protects administrative endpoints.
- **Impact:** Total catastrophic data loss. Anyone with network access can erase the company's entire historical sales, customer ledgers, and inventory.
- **Remediation:** Remove `/api/reset` from production code or require multi-factor admin authentication with environment guards (`process.env.NODE_ENV !== 'production'`).

#### FINDING-P0-02: Complete Absence of Authentication & Authorization
- **ID:** `SEC-AUTH-01`
- **Severity:** P0
- **Affected Component:** All routes in `backend/index.js`
- **Reproduction Steps:**
  1. Send `GET /api/customers`, `GET /api/sales`, `GET /api/suppliers` from any browser or curl client without credentials.
- **Expected:** Access denied (`HTTP 401`).
- **Actual:** Full JSON dump of customer phone numbers, addresses, sales revenue, payment methods, and supplier debt balances.
- **Evidence:** Test `AUTH-01` and `AUTH-02` dumped all customer and financial data directly.
- **Root Cause:** No authentication framework (JWT, session cookies, Passport, OAuth) implemented.
- **Impact:** Massive PII data breach, violation of data protection laws, unrestricted unauthorized modifications.
- **Remediation:** Implement JWT or session-based authentication and role-based access control (RBAC).

#### FINDING-P0-03: Inventory Stock Inflation via Negative Sales Quantities
- **ID:** `BIZ-EXPLOIT-01`
- **Severity:** P0
- **Affected Component:** `backend/index.js:L551-555` (`POST /api/sales`)
- **Reproduction Steps:**
  1. Query stock for product `X` (e.g. stock = 10).
  2. Submit `POST /api/sales` with item: `[{ id: X, quantity: -25, price: 100 }]` and `total: -2500`.
- **Expected:** `HTTP 400 Bad Request` ("Quantity must be positive integer").
- **Actual:** Order accepted (`HTTP 201`). Product stock updated to `10 - (-25) = 35`.
- **Evidence:** Test `VAL-SALE-01` confirmed stock inflated from -10 to 15.
- **Root Cause:** The validation check `if (type !== 'Return' && product.stock < item.quantity)` evaluates `10 < -25` as `false`. The update logic `stock - item.quantity` performs an addition.
- **Impact:** Rogue users or cashier error can arbitrarily fabricate inventory, corrupting accounting and physical inventory synchronization.
- **Remediation:** Enforce strict input validation: `if (!Number.isInteger(item.quantity) || item.quantity <= 0) throw new BadRequestError()`.

#### FINDING-P0-04: Concurrency Lost-Updates in Stock Deduction
- **ID:** `CONC-STOCK-01`
- **Severity:** P0
- **Affected Component:** `backend/index.js:L546-557` (`POST /api/sales`)
- **Reproduction Steps:**
  1. Product has `stock = 1`.
  2. Two concurrent sales requests arrive simultaneously, each purchasing 1 item.
  3. Both asynchronous handlers execute `getById('products', pid)`, both receive `stock = 1`.
  4. Both subtract 1 and call `update('products', pid, { stock: 0 })`.
- **Expected:** One request succeeds, second request receives `HTTP 400 Insufficient stock`.
- **Actual:** Both sales complete, 2 items sold, stock ends at 0 instead of -1 (or physical overselling occurred).
- **Root Cause:** Read-Modify-Write pattern executed outside of database transactions (`BEGIN IMMEDIATE TRANSACTION`).
- **Impact:** Overselling, stock drift, and discrepancies between physical store goods and recorded balances.
- **Remediation:** Use atomic SQL update queries with conditional guard: `UPDATE products SET data = json_set(...) WHERE id = ? AND json_extract(data, '$.stock') >= ?`.

---

### P1 — High Severity Findings

#### FINDING-P1-01: Linux ELF Native Binary Committed in Repository
- **ID:** `DEP-ARCH-01`
- **Severity:** P1
- **Affected Component:** `node_modules/sqlite3/build/Release/node_sqlite3.node`
- **Evidence:** Node.js crash log: `Error: node_sqlite3.node is not a valid Win32 application. code: 'ERR_DLOPEN_FAILED'`. Inspection confirmed header `\x7fELF`.
- **Root Cause:** `node_modules` was checked into source control or copied directly from a Linux deployment (Hostinger), packaging compiled Linux `.node` shared libraries.
- **Impact:** Cannot boot on Windows workstations without manual native rebuilds. `node_modules` must not be version-controlled.
- **Remediation:** Add `node_modules/` to `.gitignore`. Use clean `npm ci` on target deployment hosts with build tools.

#### FINDING-P1-02: Zero Schema Input Validation on Entity Creation
- **ID:** `VAL-SCHEMA-01`
- **Severity:** P1
- **Affected Component:** `POST /api/products`, `POST /api/customers`, `POST /api/suppliers`
- **Evidence:** Test `VAL-PROD-01` accepted `{ stock: -10, purchasePrice: -500, retailPrice: -1000 }` with missing `name` and created a product entity with `HTTP 201`.
- **Root Cause:** Express endpoints unpack `req.body` directly into storage without schema validation libraries (e.g. Zod, Joi).
- **Impact:** Database pollution with corrupt, incomplete, or negative financial data.
- **Remediation:** Introduce a schema validator like Zod to validate all request bodies before persistence.

#### FINDING-P1-03: Lack of Database Transactions Across Multi-Table Writes
- **ID:** `DB-TXN-01`
- **Severity:** P1
- **Affected Component:** `POST /api/sales` (lines 544-585), `POST /api/products/transfer` (lines 385-407)
- **Evidence:** In `POST /api/products/transfer`, the source product stock is deducted, target product stock is incremented, and transfer record is inserted in 3 independent queries.
- **Root Cause:** Code uses separate `db.run()` calls without wrapping in `db.run('BEGIN TRANSACTION')` and `COMMIT`.
- **Impact:** If the server crashes or an unhandled exception occurs midway, source stock is lost with no transfer record and no target increment.
- **Remediation:** Wrap multi-table operations in SQLite transactions.

---

### P2 — Medium Severity Findings

#### FINDING-P2-01: Wildcard CORS Configuration
- **ID:** `SEC-CORS-01`
- **Severity:** P2
- **Affected Component:** `backend/index.js:L12` (`app.use(cors())`)
- **Evidence:** Response header: `Access-Control-Allow-Origin: *`.
- **Impact:** Any malicious website running in an authenticated user's browser can perform cross-origin requests to read and modify inventory.
- **Remediation:** Configure `cors({ origin: ['https://yourdomain.com'] })`.

#### FINDING-P2-02: Missing Critical Security Headers
- **ID:** `SEC-HDR-01`
- **Severity:** P2
- **Affected Component:** `backend/index.js`
- **Evidence:** Missing `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`.
- **Impact:** Susceptible to MIME sniffing, clickjacking, and inline script injection.
- **Remediation:** Install and configure `helmet` middleware: `app.use(helmet())`.

#### FINDING-P2-03: Known Vulnerabilities in Dependencies
- **ID:** `DEP-VULN-01`
- **Severity:** P2
- **Affected Component:** `package.json`
- **Evidence:** `npm audit` reported 12 vulnerabilities: 1 Critical (`tar` DoS via unlimited input), 6 High (`sqlite3`, `qs` DoS), 3 Moderate, 2 Low.
- **Impact:** Denial of Service and prototype pollution risks in older dependency trees.
- **Remediation:** Upgrade dependencies to secure patched versions.

#### FINDING-P2-04: Floating-Point Inaccuracies in Financial Accounting
- **ID:** `BIZ-FLOAT-01`
- **Severity:** P2
- **Affected Component:** `backend/index.js:L765` (`balance = (totalPurchased - totalReturned) - totalPaid`)
- **Evidence:** Code performs raw JavaScript float arithmetic: `0.1 + 0.2 = 0.30000000000000004`.
- **Impact:** Over time, rounding errors compound into discrepancies in customer debt ledgers.
- **Remediation:** Store financial amounts in minor currency units (cents/paisa as integers) or use `decimal.js`.

---

### P3 — Low Severity Findings

#### FINDING-P3-01: Unused Dependency in `package.json`
- **ID:** `DEP-UNUSED-01`
- **Severity:** P3
- **Affected Component:** `package.json:L17` (`"sqlite": "^5.1.1"`)
- **Evidence:** `backend/index.js` requires only `sqlite3`. The `sqlite` async wrapper package is never imported.
- **Remediation:** Remove `"sqlite"` from `package.json`.

#### FINDING-P3-02: Console Log Information Noise
- **ID:** `OBS-LOG-01`
- **Severity:** P3
- **Affected Component:** `backend/index.js:L23`
- **Evidence:** Every single HTTP request is logged via unformatted `console.log`.
- **Remediation:** Use a structured logging library (e.g. Pino or Winston) with log levels and JSON output.

---

## 6. Backup & Recovery Audit

- **Backup mechanism:** NONE.
- **Automated snapshot schedule:** NONE.
- **Offsite backup:** NONE.
- **Restore procedure tested:** `RESTORE = FAILED / UNKNOWN` (No backup files exist; database consists solely of a single local file `database.sqlite`).

---

## 7. Test Integrity & Verification Status

- **Unit Tests in Project:** 0
- **Integration Tests in Project:** 0
- **E2E Tests in Project:** 0
- **Linter / Typechecker:** None (Plain JS without JSDoc or TypeScript).
- **QA Automated Tests Added:** 14 empirical verification tests in `qa/audit_runner.js`.

---

## 8. Release Gate Decision

# ⛔ FINAL DECISION: BLOCKED

### Release Blockers:
1. Complete lack of authentication/authorization on all endpoints.
2. Unprotected database wipe route (`POST /api/reset`).
3. Business logic flaw allowing inventory inflation via negative sales line-item quantities.
4. Non-transactional multi-table database operations leading to data corruption and overselling under concurrent load.
5. Incompatible Linux ELF binary in `node_modules/sqlite3` breaking Windows environments.

---

## 9. Top 10 Required Actions Before Production

1. **Implement Authentication Middleware**: Require JWT or session authentication for all `/api/*` endpoints.
2. **Decommission or Protect `POST /api/reset`**: Remove this route from production or guard it with master administrative authorization.
3. **Add Input Validation (Zod/Joi)**: Enforce positive integers for quantities, positive numbers for prices, and required strings for product/customer names.
4. **Wrap Multi-Table Operations in SQLite Transactions**: Use `BEGIN IMMEDIATE TRANSACTION` and `COMMIT` on all sales, transfers, and procurement updates.
5. **Atomic Stock Updates**: Change stock deduction from in-memory subtract-and-replace to atomic conditional SQL updates (`WHERE stock >= requestedQty`).
6. **Apply Security Headers (`helmet`)**: Enforce CSP, HSTS, `nosniff`, and frame protection.
7. **Restrict CORS**: Replace `app.use(cors())` with an explicit whitelist of trusted frontend domains.
8. **Resolve Dependency Vulnerabilities & Native Binaries**: Run `npm audit fix`, remove `node_modules` from Git, and build native bindings per platform.
9. **Implement Automated Database Backups**: Set up a daily cron job copying `database.sqlite` with SQLite vacuum backup (`VACUUM INTO ...`) to an offsite secure storage.
10. **Add Unit & Integration Test Suite**: Establish a permanent Jest/Mocha test pipeline in CI/CD before any deployment to production.
