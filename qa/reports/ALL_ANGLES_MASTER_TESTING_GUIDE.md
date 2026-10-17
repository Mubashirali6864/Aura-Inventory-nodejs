# Aura POS - All-Angles Master Testing & Verification Guide
## Comprehensive Quality Assurance & Edge-Case Manual

**Document Status:** Verified Baseline  
**Test Suite:** `qa/master_cross_angle_suite.test.cjs`  
**Execution Command:** `npm test` or `node qa/master_cross_angle_suite.test.cjs`  
**Pass Rate:** 36 / 36 Assertions Passed (100%)  

---

### Overview

This testing manual provides step-by-step test execution across all 7 operational angles of the system:
1. **Multi-Shop Symmetry & 6-Way Crossover Transfers**
2. **Unexperienced User & Novice Mistake Safeguards**
3. **Billing, POS Counter Checkout & Return Auto-Population**
4. **Supplier Procurement, FIFO Debt Allocation & Overpay Guards**
5. **Cashbook Financial Reconciliation & Operating Expenses**
6. **ACID Multi-Table Transaction Management & Stock/Ledger Reversals**
7. **Disaster Recovery, Rolling Hourly Snapshots & 1-Click Mistake Undo**

---

### Angle 1: Multi-Shop Symmetry & 6-Way Crossover Transfers

**Objective:** Validate that Shop 1, Shop 2, and Shop 3 operate with complete parity and that inter-shop stock transfers seamlessly shift inventory without leakage.

#### Test Steps:
1. **Catalog Initialization:**
   * Create product `Royal Teak Bed` in **Shop 1** (Stock: 20).
   * Create matching item in **Shop 2** (Stock: 5).
   * Create matching item in **Shop 3** (Stock: 2).
2. **Inter-Shop Transfer (Shop 1 &rarr; Shop 3):**
   * Submit `POST /api/products/transfer` with `sourceProductId: <Shop 1 ID>`, `quantity: 4`, `targetShopId: 'shop-3'`.
   * **Verification:**
     * Shop 1 stock decrements: `20 -> 16`.
     * Shop 3 stock increments: `2 -> 6`.
     * Generates auditable entry in `stockTransfers` table.
3. **Crossover Transfer (Shop 3 &rarr; Shop 2):**
   * Submit transfer from Shop 3 to Shop 2 for 3 units.
   * **Verification:** Shop 3 drops to 3, Shop 2 rises to 8.
4. **Self-Transfer Block (Shop 1 &rarr; Shop 1):**
   * Submit transfer where source shop equals target shop (`shop-1 -> shop-1`).
   * **Verification:** System rejects with `HTTP 400 Bad Request` ("Source and target shop cannot be the same").

---

### Angle 2: Unexperienced User & Novice Mistake Safeguards

**Objective:** Prevent accidental human errors by cashier or novice operators at checkout or stock entry.

#### Test Steps:
1. **Anonymous Credit Sale Block:**
   * Submit sale with payment type `Partial` or `Pending` with customer name set to `"Walk-in Customer"` or empty phone.
   * **Verification:** Strictly rejected with `HTTP 400 Bad Request` ("Customer name is required for partial and pending bills").
2. **Negative Stock Entry Prevention:**
   * Submit `POST /api/products` with `stock: -10`.
   * **Verification:** System rejects with `HTTP 400 Bad Request` ("Stock must be a non-negative number").
3. **Negative Price Entry Prevention:**
   * Submit `POST /api/products` with `purchasePrice: -500`.
   * **Verification:** System rejects with `HTTP 400 Bad Request` ("Prices cannot be negative numbers").

---

### Angle 3: Billing, POS Checkout & Return Auto-Population

**Objective:** Test full lifecycle of counter checkout, dynamic pricing, credit debiting, and sales returns.

#### Test Steps:
1. **Dynamic Counter Price Sale:**
   * Add 2 units of `Royal Teak Bed` at custom counter rate of Rs. 75,000 (Total: Rs. 150,000).
   * Cashier accepts upfront down payment of Rs. 50,000; remaining Rs. 100,000 marked as credit.
   * **Verification:**
     * Product stock decrements from 16 to 14.
     * Customer debt balance debits by Rs. 100,000.
     * Cashbook logs +Rs. 50,000 upfront cash inflow.
2. **Sales Return with Invoiced Item Auto-Population:**
   * Customer returns 1 unit against original sale invoice.
   * Enter original invoice #; system pulls line items and rates.
   * Process return for 1 unit (Rs. 75,000 credit).
   * **Verification:**
     * Product stock restores from 14 to 15.
     * Original invoice `returnedQuantity` increments to 1.
     * Customer debt balance automatically credits from Rs. 100,000 to Rs. 25,000.

---

### Angle 4: Supplier Procurement & FIFO Debt Settlement

**Objective:** Verify stock receiving, accounts payable balance accumulation, FIFO purchase allocation, and overpayment locks.

#### Test Steps:
1. **Stock Procurement Inflow:**
   * Record purchase from `Master Foam Ltd` for 5 items at Rs. 16,000 (Total: Rs. 80,000).
   * Pay Rs. 30,000 upfront; Rs. 50,000 left on credit.
   * **Verification:**
     * Target shop inventory increases by 5.
     * Supplier balance reflects Rs. 50,000 accounts payable liability.
2. **Overpayment Attempt Block:**
   * Cashier attempts to disburse Rs. 60,000 payment when dues are Rs. 50,000.
   * **Verification:** Strictly rejected with `HTTP 400 Bad Request` ("Payment amount exceeds supplier outstanding dues").
3. **FIFO Bill Clearing:**
   * Pay exactly Rs. 50,000.
   * **Verification:** Payment auto-links to open purchase, sets `remainingAmount = 0`, clears supplier balance to Rs. 0.
4. **Zero-Balance Lock:**
   * Attempt payment when supplier balance is Rs. 0.
   * **Verification:** Hard-locked and rejected with `HTTP 400 Bad Request` ("Supplier has no outstanding balance to pay").

---

### Angle 5: Cashbook Reconciliation & Operating Expenses

**Objective:** Verify real-time financial auditing and multi-branch cashflow tracking.

#### Test Steps:
1. **Operating Expenses:**
   * Log electricity bill of Rs. 12,500 under Shop 1.
   * **Verification:** Deducts cash balance in Shop 1 cashbook without affecting Shop 2 or Shop 3.
2. **Timezone Audit:**
   * Check timestamps on all Cashbook entries.
   * **Verification:** Strictly formats in Pakistani Standard Time (`Asia/Karachi` / UTC+5).

---

### Angle 6: ACID Multi-Table Transaction Void (Stock & Ledger Reversals)

**Objective:** Validate that voiding any committed transaction executes atomic rollbacks without leaving orphaned states.

#### Test Steps:
1. **Void Customer Return:**
   * Send `DELETE /api/sales/:returnId`.
   * **Verification:**
     * Return marked as `Voided`.
     * Product inventory decrements from 15 back to 14.
     * Customer balance re-debits from Rs. 25,000 back to Rs. 100,000.
     * Zero partial database state occurs even under network interruption.

---

### Angle 7: Disaster Recovery, Rolling Hourly Snapshots & 1-Click Mistake Undo

**Objective:** Validate that human counter mistakes can be undone in 1 click, and full database state can be restored from rolling hourly snapshots.

#### Test Steps:
1. **Surgical Undo (Undo Last Transaction):**
   * Counter staff accidentally logs a debt settlement payment of Rs. 20,000 (dropping customer balance to Rs. 80,000).
   * Open Settings &rarr; **Quick Undo & Mistake Recovery**.
   * Click **`⚡ Undo Last Customer Payment`**.
   * **Verification:**
     * Payment is voided immediately.
     * Customer balance restored to Rs. 100,000.
     * No other transaction or inventory count is touched.
2. **Rolling Hourly Snapshots:**
   * Verify `backend/backups/` contains `backup-hourly-YYYY-MM-DD-HH00.sqlite`.
   * Retention keeps the last 24 snapshots automatically.
3. **Time Machine Rollback (Revert to ~1 Hour Ago):**
   * Open Settings &rarr; **Quick Undo & Mistake Recovery** &rarr; **Time Machine**.
   * Click **`Revert to Snapshot`**.
   * **Verification:**
     * Unconditional safety backup (`pre-undo-safety-YYYY-MM-DD-HHMMSS.sqlite`) created automatically before touching the database.
     * Database safely restored to previous snapshot.
     * Application re-initializes with zero downtime or file corruption.

---

### Running the Master Automated Test Suite

To execute all 36 automated assertions across all 7 angles at any time:

```bash
npm test
```

Expected Output:
```
====================================================================
📊 MASTER TEST RESULTS SUMMARY
====================================================================
TOTAL ASSERTIONS: 36
PASSED:           36 (100%)
FAILED:           0
--------------------------------------------------------------------
• Angle 1   : 6/6 PASSED
• Angle 2   : 3/3 PASSED
• Angle 3   : 7/7 PASSED
• Angle 4   : 7/7 PASSED
• Angle 5   : 1/1 PASSED
• Angle 6   : 3/3 PASSED
• Angle 7   : 9/9 PASSED
====================================================================
```
