# TDD Evidence Report: Sales & Purchase Timestamp & Cashbook Ordering

## Overview
- **Issue**: Sales and Purchases were defaulting to `05:00 AM` (UTC midnight converted to PKT UTC+5). Newly created sales were sorting to the bottom (last) of the Cashbook instead of appearing at the top (first).
- **Ponytail Ladder Applied**:
  - Rung 1-2: Reused existing timestamp resolution logic.
  - Rung 3: Standard `Date.now()` without extra libraries.
  - Rung 7: Minimal, surgical changes to `POST /api/sales`, checkout frontend date handling, and Cashbook mapping.

## TDD Phase Evidence

### Phase 1: Test Specification & RED State
- **Test File**: `qa/test_purchase_timestamp_and_ordering.test.js`
- **Runner**: Node.js native test runner (`node --test`)
- **RED Evidence**:
  ```text
  # Subtest: Live Backend API: POST /api/sales captures current timestamp and createdAt
  not ok 3 - Live Backend API: POST /api/sales captures current timestamp and createdAt
    error: 'Sale createdAt (1790553600000) should be around current time (1790590646797), not midnight'
  ```

### Phase 2: Implementation & GREEN State
- **Backend Fix ([`backend/index.js`](file:///e:/Softwares/Aura%20Inventory%20nodejs/backend/index.js))**:
  - In `POST /api/sales`, set `createdAt: now`.
  - When a sale is recorded for today, used the real current timestamp (`Date.now()`).
- **Frontend Fix ([`dist/assets/index-BQlSbgAO.js`](file:///e:/Softwares/Aura%20Inventory%20nodejs/dist/assets/index-BQlSbgAO.js))**:
  - Updated Billing checkout `createSale` to pass `Date.now()` for today's sales.
  - Added `createdAt` to `ve` (Sales mapping in Cashbook).
- **GREEN Evidence**:
  ```text
  # Subtest: Purchase Timestamp and Cashbook Ordering TDD Suite
      ok 1 - Cashbook sorting: sorts newer transaction first when dates are equal
      ok 2 - Live Backend API: POST /api/purchases captures current timestamp and createdAt
      ok 3 - Live Backend API: POST /api/sales captures current timestamp and createdAt
  1..3
  ok 1 - Purchase Timestamp and Cashbook Ordering TDD Suite
  # tests 3
  # suites 1
  # pass 3
  # fail 0
  ```

## Current Live State
1. **Invoice #1** (Sale - Walk-in, Rs. 10,500) -> **Position 1 (Top / Most Recent, 03:15 PM)**
2. **Invoice #5d4fe9cb** (Purchase - Hasssan, Due: Rs. 31,000) -> **Position 2 (02:52 PM)**
3. **Invoice #d9ffa738** (Purchase - Hasssan, Paid: Rs. 31,000) -> **Position 3 (02:48 PM)**
