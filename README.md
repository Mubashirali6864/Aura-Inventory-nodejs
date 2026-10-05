# Aura Furniture Management & POS System (Shan-e-Aziz POS)

A lightweight, high-reliability Point of Sale (POS), multi-shop inventory control, customer credit ledger, and cashbook management system built with **Node.js**, **Express**, **SQLite3**, and **React 18** (Vite + TailwindCSS).

Designed for multi-showroom furniture retail operations with zero-configuration embedded document storage, continuous automated disaster recovery, and dual desktop / cloud hosting support.

---

## 📑 Core Documentation Index

This repository maintains comprehensive engineering and product documentation:

| Document | Purpose & Contents |
|---|---|
| 📄 **[PRD.md](file:///e:/Softwares/Aura%20Inventory%20nodejs/PRD.md)** | **Product Requirements Document**: Business requirements, user personas, POS checkout workflows, credit ledger rules, procurement flows, multi-shop support, and future roadmap. |
| 🏗️ **[architecture.md](file:///e:/Softwares/Aura%20Inventory%20nodejs/architecture.md)** | **System Architecture Document**: System tier breakdown (React SPA, Hostinger Gateway, Express API Core, DAO layer, SQLite document store, backup engine), complete REST API catalog, security models, and data flows. |
| 📊 **[architecture.html](file:///e:/Softwares/Aura%20Inventory%20nodejs/architecture.html)** | **Interactive Visual Architecture Map**: Generated and validated via **Archify**, featuring interactive layer tracing, dark/light modes, and end-to-end component flows. |
| 📋 **[task.md](file:///e:/Softwares/Aura%20Inventory%20nodejs/task.md)** | **Task Tracking & Engineering Roadmap**: Comprehensive tracking of completed security & UX patches, active P0/P1 release blockers, and verification testing procedures. |
| 🧠 **[memory.md](file:///e:/Softwares/Aura%20Inventory%20nodejs/memory.md)** | **Project Memory & Operational Context**: Architectural Decision Records (ADRs), critical gotchas (native binaries, `stripUndefined`, credit validation, supplier locks), environment variables, and runbooks. |
| 🛡️ **[qa/reports/MASTER_QA_REPORT.md](file:///e:/Softwares/Aura%20Inventory%20nodejs/qa/reports/MASTER_QA_REPORT.md)** | **Master QA & Security Audit Report**: In-depth empirical audit assessing vulnerabilities, test statistics, and release gate criteria. |
| 🕸️ **[graphify-out/](file:///e:/Softwares/Aura%20Inventory%20nodejs/graphify-out/GRAPH_REPORT.md)** | **Codebase Knowledge Graph**: Structural AST graph with community detection, god nodes, and architectural dependencies. |

---

## 🚀 Key Features

* **Multi-Shop Point of Sale:** Instant counter checkout with support for Shop 1 and Shop 2, real-time stock deductions, cart calculation, and sequential invoice numbering (`#1001`, `#1002`).
* **Customer Debt & Credit Ledger:** Built-in credit management supporting `Paid`, `Partial`, and `Pending` sales with mandatory phone/name verification for debtor traceability.
* **Supplier Procurement & Payables:** Vendor supply shipments, balance accumulation, and locked payment buttons when supplier dues reach zero to prevent overpayments.
* **Consolidated Cashbook:** Unified chronological cash journal combining sales, customer payments, supplier disbursements, procurement outlays, expenses, and returns.
* **Automated Disaster Recovery:** Background scheduler automatically captures complete SQLite database snapshots every 6 hours into `backend/backups/`, with in-app one-click restoration and safety snapshot protection.
* **Startup Product Reconciler:** Automatically identifies, combines stock, and purges duplicate product records on server initialization.

---

## 🛠️ Quick Start

### 1. Installation
```bash
# Clone repository and enter directory
cd "Aura Inventory nodejs"

# Install dependencies
npm install
```

### 2. Environment Configuration
Verify or configure `.env`:
```ini
PORT=7860
ADMIN_RESET_TOKEN=your-strong-random-admin-secret-token
ALLOW_DB_RESET=false
ALLOWED_ORIGINS=https://yourdomain.com
```

### 3. Launching Application
```bash
# Production server (Express hosts backend API and frontend SPA on port 7860)
npm start

# Development mode
npm run dev
```

Open your browser to `http://localhost:7860` to access the Shan-e-Aziz POS interface.

---

## 🧪 Verification & Quality Assurance

The `qa/` directory contains automated verification scripts testing all business logic and security features:

```bash
# Run the complete empirical audit
node qa/audit_runner.js

# Verify customer credit validation guards (Partial & Pending bills)
node qa/verify_partial_pending_validation.js

# Verify zero-balance supplier payment lock
node qa/verify_pay_supplier_lock.js

# Verify automated backup & restore engine
node qa/verify_backup_feature.js

# Verify Cashbook transaction integration
node qa/verify_cashbook_patch.js

# Validate interactive Archify architecture diagram
node .agents/skills/archify/bin/archify.mjs validate architecture qa/architecture.json --quality showcase --json
```

---

## 📁 Repository Directory Structure

```
.
├── backend/
│   ├── backups/               # Automated & manual .sqlite snapshot archives
│   ├── database.sqlite        # Active SQLite3 database (10 JSON document tables)
│   └── index.js               # Express 4.18 REST API core & business logic controllers
├── dist/                      # Production React 18 frontend bundle (Vite + Tailwind)
│   ├── assets/                # Minified scripts, styles, and libraries
│   └── index.html             # Single-page application entry HTML
├── graphify-out/              # Graphify knowledge graph (graph.json, graph.html, report)
├── qa/                        # QA audit suite, verification scripts, and architecture specs
│   ├── architecture.json      # Typed Archify system architecture specification
│   ├── audit_runner.js        # Live empirical HTTP audit test harness
│   └── reports/               # Master QA and security audit reports
├── .agents/                   # ECC agent workflows, skills, and rule sets
├── architecture.html          # Interactive visual system architecture viewer
├── architecture.md            # Comprehensive architecture documentation
├── memory.md                  # System memory, ADRs, gotchas, and operational runbooks
├── package.json               # Package manifest and dependency declarations
├── PRD.md                     # Product Requirements Document
├── README.md                  # Project overview & documentation index
├── server.js                  # Root entry point wrapper for Hostinger Passenger hosting
└── task.md                    # Task backlog, completed patches, and release roadmap
```
