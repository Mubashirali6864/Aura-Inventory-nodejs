# Shan-e-Aziz POS - Complete Manual Testing Guide (Every Single Angle)
## Step-by-Step Interactive UI Verification Checklist

This guide gives you the exact mouse clicks, keyboard inputs, and visual verifications to test every single feature, multi-shop crossover, novice mistake safeguard, and disaster recovery button directly in the web browser.

**Target URL:** `https://cms.multiplebusinesscompany.com` (or local `http://localhost:7860`)

---

## 📋 Table of Contents
1. [Test 1: Multi-Shop Switching & 6-Way Crossover Stock Transfers](#test-1-multi-shop-switching--6-way-crossover-transfers)
2. [Test 2: Unexperienced User Mistakes & Input Guardrails](#test-2-unexperienced-user-mistakes--input-guardrails)
3. [Test 3: POS Billing, Dynamic Counter Pricing & Quotations](#test-3-pos-billing-dynamic-counter-pricing--quotations)
4. [Test 4: Live Return Flow with Invoice Auto-Population](#test-4-live-return-flow-with-invoice-auto-population)
5. [Test 5: Supplier Procurement, Overpay Guard & FIFO Bill Clearing](#test-5-supplier-procurement-overpay-guard--fifo-bill-clearing)
6. [Test 6: Customer Credit Ledger & Deep-Link Highlighting](#test-6-customer-credit-ledger--deep-link-highlighting)
7. [Test 7: Cashbook Multi-Shop Filtering & Pakistani Timezone](#test-7-cashbook-multi-shop-filtering--pakistani-timezone)
8. [Test 8: 1-Click Surgical Undo ("Undo Last Transaction")](#test-8-1-click-surgical-undo-undo-last-transaction)
9. [Test 9: 1-Click Time Machine Rollback ("Revert to ~1 Hour Ago")](#test-9-1-click-time-machine-rollback-revert-to-1-hour-ago)
10. [Test 10: Transaction Management Search & Historical Void](#test-10-transaction-management-search--historical-void)

---

### Test 1: Multi-Shop Switching & 6-Way Crossover Stock Transfers

#### Goal:
Verify that **Shop 1**, **Shop 2**, and **Shop 3** maintain separate stocks, and stock transfers work smoothly between all branch combinations.

#### Steps:
1. Click the **Products** tab in the sidebar.
2. In the top filter, click **Shop 1**:
   * Click **+ Add Product**.
   * Name: `Teak Dining Table 6-Seater`
   * Category: `Dining`
   * Size: `6x3`
   * Unit: `Piece`
   * Cost Price: `40000`
   * Stock: `10`
   * Shop: Select **Shop 1**.
   * Click **Save Product**.
3. In the top filter, switch to **Shop 2**:
   * Click **+ Add Product** with the exact same name: `Teak Dining Table 6-Seater`, Size `6x3`, Unit `Piece`, Cost `40000`, Stock: `2`, Shop: **Shop 2**. Save it.
4. In the top filter, switch to **Shop 3**:
   * Click **+ Add Product** with the exact same name, Stock: `0`, Shop: **Shop 3**. Save it.
5. **Crossover Transfer (Shop 1 &rarr; Shop 3):**
   * Filter by **Shop 1**, find `Teak Dining Table 6-Seater`.
   * Click **Transfer Stock**.
   * Target Shop: Select **Shop 3**.
   * Quantity: Enter `3`.
   * Click **Confirm Transfer**.
   * **Verification:**
     * Shop 1 stock drops from `10` to `7`.
     * Switch filter to **Shop 3**: stock rises from `0` to `3`.
6. **Novice Mistake Check (Self-Transfer Block):**
   * Click **Transfer Stock** on Shop 3 item.
   * Target Shop: Select **Shop 3** (same shop).
   * **Verification:** The system displays an alert: *"Source and target shop cannot be the same"* and blocks the transfer.

---

### Test 2: Unexperienced User Mistakes & Input Guardrails

#### Goal:
Verify that cashiers cannot accidentally make invalid credit sales, negative stock submissions, or overpay suppliers.

#### Steps:
1. **Walk-in Credit Prevention:**
   * Go to the **Billing** (POS) tab.
   * Add any item to the cart (e.g. `Teak Dining Table`).
   * Select Payment Type: **Partial** (or **Pending**).
   * Leave Customer Name as `"Walk-in Customer"` or type empty spaces.
   * Click **Complete Sale**.
   * **Verification:** The system halts and displays an error toast: *"Customer name is required for partial and pending bills. Credit cannot be given to Walk-in Customer."*
2. **Negative Stock & Negative Price Entry:**
   * Go to **Products** &rarr; **+ Add Product**.
   * Try entering Stock: `-5` or Cost Price: `-100`.
   * **Verification:** The input validates and prevents submission with *"Stock and price must be positive numbers."*
3. **Supplier Overpayment Protection:**
   * Go to **Suppliers** tab. Find a supplier with a balance of `Rs. 15,000`.
   * Click **Pay Supplier**.
   * Try changing the amount to `Rs. 20,000` (exceeding the Rs. 15,000 dues).
   * **Verification:** The button is disabled and an alert states: *"Payment amount cannot exceed outstanding dues."*

---

### Test 3: POS Billing, Dynamic Counter Pricing & Quotations

#### Goal:
Test real-time price negotiation at the counter, upfront cash collection, customer credit debiting, and non-binding price quotes.

#### Steps:
1. **Dynamic Counter Price Sale:**
   * Go to **Billing** tab.
   * Make sure **Shop 1** is selected.
   * Click on `Teak Dining Table 6-Seater` to add to cart.
   * In the cart item row, click on the **Price** field. Notice you can type any negotiated counter rate (e.g., enter `55000` instead of 40000).
   * Customer Details:
     * Name: `Haji Abdul Rasheed`
     * Phone: `03009876543`
     * Payment Mode: Select **Partial**.
     * Amount Paid (Down Payment): Enter `20000`.
   * Click **Complete Sale**.
2. **Immediate Verification:**
   * An invoice modal displays with Invoice Number (e.g. `#1001`), Total `Rs. 55,000`, Paid `Rs. 20,000`, Due `Rs. 35,000`.
   * Go to **Products** (Shop 1): Stock has decremented by `1` (from `7` to `6`).
   * Go to **Customers**: `Haji Abdul Rasheed` shows an outstanding debt balance of `Rs. 35,000`.
   * Go to **Cashbook**: A new entry shows `+Rs. 20,000` (only the collected down payment is entered into cash, not the unpaid credit).
3. **Quotation Flow:**
   * Go to **Billing**. Add any item. Select Payment Mode: **Quotation**.
   * Customer Name: `Sample Quote Buyer`. Click **Complete Sale**.
   * **Verification:** An invoice prints marked as **QUOTATION**. Product stock does **NOT** decrement. Customer ledger does **NOT** change.

---

### Test 4: Live Return Flow with Invoice Auto-Population

#### Goal:
Verify that customer returns auto-pull original invoice line items, calculate refunds, restore stock, and reverse debt balances.

#### Steps:
1. Go to **Billing** tab.
2. In the sale type selector at the top of the POS screen, toggle from **Sale** to **Return**.
3. Notice the input: **"Original Sale Invoice #"** appears.
4. Type or select the invoice number from Test 3 (e.g., `1001`).
5. **Verification:**
   * The customer details (`Haji Abdul Rasheed`, phone number) automatically populate.
   * The line item (`Teak Dining Table 6-Seater`, Price `55,000`) appears automatically in the return list.
6. Set the Return Quantity to `1`.
7. Click **Process Return**.
8. **Verification:**
   * Go to **Products** (Shop 1): Stock is restored from `6` back to `7`.
   * Go to **Customers**: Haji Abdul Rasheed's debt balance is credited by Rs. 35,000, bringing his balance down to `Rs. 0`.

---

### Test 5: Supplier Procurement, Overpay Guard & FIFO Bill Clearing

#### Goal:
Verify receiving warehouse shipments, auto-filling debts, and chronological FIFO settlement.

#### Steps:
1. Go to **Suppliers** tab.
2. Click **+ Add Supplier**:
   * Name: `ChenOne Woods Rawalpindi`
   * Phone: `03335551234`
   * Click **Save**.
3. **Procurement Inflow:**
   * Click **Add Purchase** on ChenOne Woods.
   * Select Receiving Shop: **Shop 3**.
   * Item: `Teak Dining Table 6-Seater`
   * Quantity: `5`
   * Purchase Cost: `38000` (Total: Rs. 190,000)
   * Paid Amount: Enter `90000` upfront.
   * Click **Save Purchase**.
   * **Verification:**
     * Shop 3 stock increases by `5`.
     * ChenOne Woods balance shows `Rs. 100,000` (Accounts Payable liability).
4. **Auto-Fill & FIFO Debt Payment:**
   * Click **Pay Supplier** on ChenOne Woods.
   * **Verification:** The amount field **automatically pre-fills** with `100000` (the exact outstanding dues).
   * Leave it at `100000` and click **Confirm Payment**.
   * **Verification:**
     * ChenOne Woods balance updates to `Rs. 0`.
     * Click **View Detailed Ledger**: The payment row displays a `🔗 Linked Inv #...` badge linking to the purchase invoice.
5. **Zero-Balance Lock:**
   * Look at the **Pay Supplier** button for ChenOne Woods now that balance is Rs. 0.
   * **Verification:** The button is disabled and locked.

---

### Test 6: Customer Credit Ledger & Deep-Link Highlighting

#### Goal:
Verify debt settlements, transaction linking, and smooth-scroll invoice row highlighting.

#### Steps:
1. Go to **Customers** tab.
2. Find `Haji Abdul Rasheed` (or create a customer with an active debt from an invoice).
3. Click **Settle Payment**:
   * Enter Payment Amount (e.g. `10000`).
   * Select Type: `Cash`.
   * Click **Save Payment**.
4. Click **View Detailed Ledger**.
5. Find the payment row you just created. Look for the `🔗 Linked Inv #...` badge.
6. Click on the badge.
7. **Verification:** The page smoothly scrolls down and highlights the matching original sale invoice row in theme light blue.

---

### Test 7: Cashbook Multi-Shop Filtering & Pakistani Timezone

#### Goal:
Verify cross-branch financial auditing and timezone precision.

#### Steps:
1. Click **Cashbook** in the sidebar.
2. At the top of Cashbook, notice the shop buttons: **All Shops**, **Shop 1**, **Shop 2**, **Shop 3**.
3. Click **Shop 1**: Only transactions that occurred in Shop 1 are shown.
4. Click **Shop 3**: Notice the procurement upfront payment (Rs. 90,000) from Test 5 appears here.
5. Click **All Shops**: Consolidated business ledger appears.
6. Look at the date filters: **Today**, **Yesterday**, **This Week**, **This Month**.
7. Look at the timestamps in the **Date & Time (PKT)** column:
   * **Verification:** All times display in 12-hour AM/PM format matching your local Pakistani clock (`Asia/Karachi` / UTC+5), never defaulting to midnight or UTC.

---

### Test 8: 1-Click Surgical Undo ("Undo Last Transaction")

#### Goal:
Verify that a cashier who makes an immediate mistake can revert it in 1 click without affecting anything else.

#### Steps:
1. Go to **Customers** tab. Note a customer's current balance (e.g. `Rs. 50,000`).
2. Settle a payment of `Rs. 20,000` by mistake. The customer's balance is now `Rs. 30,000`.
3. Now go directly to **Settings** tab.
4. Look at the prominent card at the top: **"Quick Undo & Mistake Recovery"** (with Safety Shield badge).
5. Look at the left sub-card: **⚡ Surgical Undo**:
   * Notice it shows: `Customer Payment #... • Rs. 20,000 — Debt Settlement`.
6. Click **`Undo Last Customer Payment`**.
7. A prompt confirms: *"Undo Customer Payment of Rs. 20,000? Stock and financial balances will be reversed automatically."* Click **OK**.
8. **Verification:**
   * A green toast appears: *"Customer payment undone successfully! Customer balance reverted."*
   * Return to **Customers**: The customer's balance is back to `Rs. 50,000`.
   * Return to **Cashbook**: The payment entry is marked as `Voided`.

---

### Test 9: 1-Click Time Machine Rollback ("Revert to ~1 Hour Ago")

#### Goal:
Verify that an operator can restore the entire database state to the rolling hourly snapshot.

#### Steps:
1. Go to **Settings** tab.
2. Look at the **Quick Undo & Mistake Recovery** card &rarr; right sub-card: **⏪ Time Machine**.
3. Notice it identifies the candidate snapshot (e.g. `Snapshot from Today at 07:00 PM (45 mins ago)`).
4. Click **`Revert to Snapshot`**.
5. A modal pops up:
   * Header: `Revert Entire Database?`
   * Notice the clear warning: *"A safety snapshot of your current state will be saved automatically before rolling back."*
6. Click **`Yes, Revert Database`**.
7. **Verification:**
   * The button shows `Reverting...`.
   * A success message confirms the database switch.
   * The page automatically hot-reloads with the restored dataset.
   * In the **Select Backup** dropdown below, check the backups list: a new `pre-undo-safety-YYYY-MM-DD-HHMMSS.sqlite` file is present, guaranteeing you never lose the state you just rolled back from.

---

### Test 10: Transaction Management Search & Historical Void

#### Goal:
Verify searching and voiding older historical sales or purchases from days ago.

#### Steps:
1. Go to **Settings** tab.
2. Scroll to the **Transaction Management & Void** section.
3. In the search bar, type a customer name, supplier name, or invoice number (e.g. `1001`).
4. In the type filter, toggle between **Sales Only**, **Purchases Only**, **Supplier Payments**, or **Customer Payments**.
5. Find any transaction and click **`Void / Delete`**.
6. **Verification:**
   * If a sale is voided: items are automatically returned to inventory stock, and customer dues are subtracted.
   * If a purchase is voided: items are deducted from inventory, and supplier debt is cancelled.
   * The row displays a grey `Voided` badge and locks against further clicks.

---

### Summary Checklist

| # | Angle / Feature | Expected Result | Pass? |
|---|---|---|:---:|
| 1 | Multi-Shop Parity | Isolated carts, stock visibility across Shop 1, 2, 3 | [ ] |
| 2 | 6-Way Stock Transfers | Stock moves accurately; self-transfer blocked | [ ] |
| 3 | Walk-in Credit Guard | Anonymous partial/pending sales blocked | [ ] |
| 4 | Dynamic Counter Rates | Inline price override updates invoice & ledger | [ ] |
| 5 | Return Auto-Population | Loading invoice # pulls items & reverses dues | [ ] |
| 6 | Overpay Protection | Paying > balance is blocked with alert | [ ] |
| 7 | FIFO Bill Clearing | Dues clear oldest open purchases in order | [ ] |
| 8 | Zero-Balance Lock | Button locks when supplier owes Rs. 0 | [ ] |
| 9 | Cashbook PKT Time | Rows format in Asia/Karachi (UTC+5) | [ ] |
| 10 | 1-Click Surgical Undo | 1 click reverts last mistake with full rollbacks | [ ] |
| 11 | 1-Click Time Machine | Reverts to 1-hour snapshot with safety backup | [ ] |
| 12 | Transaction Search & Void | Search any past transaction & void with ACID reversal | [ ] |
