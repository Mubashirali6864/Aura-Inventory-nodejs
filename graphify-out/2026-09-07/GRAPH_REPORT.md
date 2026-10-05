# Graph Report - Aura Inventory nodejs  (2026-09-07)

## Corpus Check
- 10 files · ~150,000 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 100 nodes · 118 edges · 9 communities
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Server Core & Startup Deduplication Engine
- Transactional Write & POST Routers
- Live SQLite Database & State Engine
- Package Manifest & System Constraints
- Express Application Lifecycle & Dashboard
- External NPM Dependencies
- Frontend UI Views & Read Dispatcher
- Resource Removal & Deletion Handlers
- POS Billing, Thermal Receipts & XSS Sanitizer

## God Nodes (most connected - your core abstractions)
1. `Frontend HTTP API Client` - 18 edges
2. `db` - 17 edges
3. `getAll(table)` - 10 edges
4. `insert(table, id, data)` - 9 edges
5. `mergeDuplicateProducts()` - 6 edges
6. `app` - 5 edges
7. `update()` - 4 edges
8. `update(table, id, data)` - 4 edges
9. `remove(table, id)` - 4 edges
10. `POST /api/sales` - 3 edges

## Surprising Connections (you probably didn't know these)
- `app` --references--> `Config: PORT (7860)`  [EXTRACTED]
  backend/index.js → .env
- `POST /api/products/transfer` --calls--> `Frontend HTTP API Client`  [EXTRACTED]
  backend/index.js → dist/assets/index-BQlSbgAO.js
- `Frontend HTTP API Client` --calls--> `POST /api/payments`  [EXTRACTED]
  dist/assets/index-BQlSbgAO.js → backend/index.js
- `Frontend HTTP API Client` --calls--> `POST /api/products`  [EXTRACTED]
  dist/assets/index-BQlSbgAO.js → backend/index.js
- `Frontend HTTP API Client` --calls--> `POST /api/purchases`  [EXTRACTED]
  dist/assets/index-BQlSbgAO.js → backend/index.js

## Import Cycles
- None detected.

## Communities (9 total, 0 thin omitted)

### Community 2 - "Server Core & Startup Deduplication Engine"
Cohesion: 0.15
Nodes (13): getAll(), getById(), mergeDuplicateProducts(), remove(), stripUndefined(), update(), bodyParser, cors (+5 more)

### Community 4 - "Transactional Write & POST Routers"
Cohesion: 0.20
Nodes (10): getNextInvoiceNumber(), insert(table, id, data), POST /api/customers, POST /api/expenses, POST /api/payments, POST /api/products, POST /api/purchases, POST /api/sales (+2 more)

### Community 0 - "Live SQLite Database & State Engine"
Cohesion: 0.11
Nodes (18): db, getById(table, id), update(table, id, data), GET /api/sales/next-invoice, PUT /api/customers/:id, PUT /api/products/:id, PUT /api/suppliers/:id, POST /api/reset (+10 more)

### Community 3 - "Package Manifest & System Constraints"
Cohesion: 0.13
Nodes (14): description, engines, node, main, name, scripts, start, version (+6 more)

### Community 5 - "Express Application Lifecycle & Dashboard"
Cohesion: 0.25
Nodes (8): app, SQLite Schema Initializer, Request Logger Middleware, View: Dashboard, GET * (SPA Catch-all), Config: FIREBASE_SERVICE_ACCOUNT_PATH, Config: PORT (7860), .env Configuration

### Community 6 - "External NPM Dependencies"
Cohesion: 0.29
Nodes (7): dependencies, body-parser, cors, dotenv, express, sqlite, sqlite3

### Community 1 - "Frontend UI Views & Read Dispatcher"
Cohesion: 0.13
Nodes (18): getAll(table), Frontend HTTP API Client, View: Customer Ledger, View: Inventory & Products, View: Sales & Profit Reports, View: System Settings & Reset, View: Multi-Shop Stock Transfer, View: Supplier Procurement (+10 more)

### Community 7 - "Resource Removal & Deletion Handlers"
Cohesion: 0.50
Nodes (4): remove(table, id), DELETE /api/customers/:id, DELETE /api/products/:id, DELETE /api/suppliers/:id

### Community 8 - "POS Billing, Thermal Receipts & XSS Sanitizer"
Cohesion: 0.67
Nodes (3): Library: DOMPurify (XSS Sanitizer), Library: html2canvas (Receipt PDF Generator), View: POS Billing & Sales

## Knowledge Gaps
- **58 isolated node(s):** `bodyParser`, `cors`, `crypto`, `dbPath`, `express` (+53 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 61 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `db` connect `Live SQLite Database & State Engine` to `Frontend UI Views & Read Dispatcher`, `Server Core & Startup Deduplication Engine`, `Transactional Write & POST Routers`, `Resource Removal & Deletion Handlers`?**
  _High betweenness centrality (0.543) - this node is a cross-community bridge._
- **Why does `Frontend HTTP API Client` connect `Frontend UI Views & Read Dispatcher` to `Live SQLite Database & State Engine`, `POS Billing, Thermal Receipts & XSS Sanitizer`, `Transactional Write & POST Routers`, `Express Application Lifecycle & Dashboard`?**
  _High betweenness centrality (0.226) - this node is a cross-community bridge._
- **Why does `getAll(table)` connect `Frontend UI Views & Read Dispatcher` to `Live SQLite Database & State Engine`?**
  _High betweenness centrality (0.175) - this node is a cross-community bridge._
- **What connects `bodyParser`, `cors`, `crypto` to the rest of the system?**
  _58 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Live SQLite Database & State Engine` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._
- **Should `Package Manifest & System Constraints` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._
- **Should `Frontend UI Views & Read Dispatcher` be split into smaller, more focused modules?**
  _Cohesion score 0.13071895424836602 - nodes in this community are weakly interconnected._