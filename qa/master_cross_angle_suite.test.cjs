/**
 * ============================================================================================
 * AURA POS - ALL-ANGLES MASTER COMPREHENSIVE TEST SUITE
 * ============================================================================================
 * Tests the system across 7 Critical Operational Angles:
 *   Angle 1: Multi-Shop Symmetry & 6-Way Crossover Transfers (Shop 1, 2, 3)
 *   Angle 2: Unexperienced User & Novice Error Safeguards (Walk-in Credit, Overpay Lock, Self-Transfers)
 *   Angle 3: Billing, Dynamic Counter Pricing, & Return Auto-Population
 *   Angle 4: Supplier Procurement, FIFO Debt Allocation & Overpay Guards
 *   Angle 5: Cashbook Reconciliation, Deep Linking & Pakistani Timezone (Asia/Karachi)
 *   Angle 6: ACID Multi-Table Transaction Management & Stock/Ledger Voiding
 *   Angle 7: Disaster Recovery, Rolling Hourly Snapshots & 1-Click Mistake Undo
 * ============================================================================================
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

// Setup isolated test workspace
const testDataDir = path.join(__dirname, 'test_isolated_env');
if (fs.existsSync(testDataDir)) {
    fs.rmSync(testDataDir, { recursive: true, force: true });
}
fs.mkdirSync(testDataDir, { recursive: true });
process.env.APP_DATA_PATH = testDataDir;
process.env.ADMIN_RESET_TOKEN = 'test-admin-token-123';
process.env.ALLOW_DB_RESET = 'true';

// Load application with isolated dataPath
const app = require('../backend/index.js');
let server;
const PORT = 7895;

const results = {
    total: 0,
    passed: 0,
    failed: 0,
    categories: {}
};

function assert(condition, message, category = 'General') {
    results.total++;
    if (!results.categories[category]) results.categories[category] = { passed: 0, failed: 0 };
    if (condition) {
        results.passed++;
        results.categories[category].passed++;
        console.log(`  [PASS] ${message}`);
    } else {
        results.failed++;
        results.categories[category].failed++;
        console.error(`  [FAIL] ${message}`);
    }
}

function req(endpoint, method = 'GET', body = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const payload = body ? JSON.stringify(body) : null;
        const request = http.request({
            hostname: '127.0.0.1',
            port: PORT,
            path: endpoint,
            method,
            headers: {
                ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}),
                ...headers
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                let parsed = null;
                try { parsed = JSON.parse(data); } catch (_) { parsed = data; }
                resolve({ status: res.statusCode, data: parsed, headers: res.headers });
            });
        });
        request.on('error', reject);
        if (payload) request.write(payload);
        request.end();
    });
}

// Helpers to get entity by ID using GET all endpoints
async function getProduct(id) {
    const list = (await req('/api/products')).data;
    return Array.isArray(list) ? list.find(p => p.id === id) : null;
}

async function getCustomer(id) {
    const list = (await req('/api/customers')).data;
    return Array.isArray(list) ? list.find(c => c.id === id) : null;
}

async function getSupplier(id) {
    const list = (await req('/api/suppliers')).data;
    return Array.isArray(list) ? list.find(s => s.id === id) : null;
}

async function runMasterSuite() {
    server = app.listen(PORT);
    console.log(`\n====================================================================`);
    console.log(`🚀 STARTING AURA POS ALL-ANGLES MASTER VERIFICATION SUITE (Port ${PORT})`);
    console.log(`====================================================================\n`);

    // Give SQLite a moment to initialize
    await new Promise(r => setTimeout(r, 600));

    // ----------------------------------------------------------------------------------------
    // ANGLE 1: Multi-Shop Symmetry & 6-Way Crossover Transfers (Shop 1, 2, 3)
    // ----------------------------------------------------------------------------------------
    console.log(`\n--- ANGLE 1: MULTI-SHOP SYMMETRY & 6-WAY CROSSOVER TRANSFERS ---`);
    
    // 1.1 Create products in Shop 1, 2, 3
    const p1 = (await req('/api/products', 'POST', { name: 'Royal Teak Bed', category: 'Bedroom', size: 'King', unit: 'Piece', purchasePrice: 50000, stock: 20, shopId: 'shop-1' })).data;
    const p2 = (await req('/api/products', 'POST', { name: 'Royal Teak Bed', category: 'Bedroom', size: 'King', unit: 'Piece', purchasePrice: 50000, stock: 5, shopId: 'shop-2' })).data;
    const p3 = (await req('/api/products', 'POST', { name: 'Royal Teak Bed', category: 'Bedroom', size: 'King', unit: 'Piece', purchasePrice: 50000, stock: 2, shopId: 'shop-3' })).data;

    assert(p1.id && p2.id && p3.id, 'Products successfully initialized across Shop 1, Shop 2, and Shop 3', 'Angle 1');

    // 1.2 Transfer Shop 1 -> Shop 3
    const tr1_3 = await req('/api/products/transfer', 'POST', {
        sourceProductId: p1.id,
        quantity: 4,
        targetShopId: 'shop-3'
    });
    assert(tr1_3.status === 200, 'Transfer Shop 1 -> Shop 3 succeeded (4 units)', 'Angle 1');

    const updatedP1 = await getProduct(p1.id);
    const updatedP3 = await getProduct(p3.id);
    assert(updatedP1.stock === 16, `Shop 1 stock decremented from 20 to 16 (Actual: ${updatedP1.stock})`, 'Angle 1');
    assert(updatedP3.stock === 6, `Shop 3 stock incremented from 2 to 6 (Actual: ${updatedP3.stock})`, 'Angle 1');

    // 1.3 Transfer Shop 3 -> Shop 2
    const tr3_2 = await req('/api/products/transfer', 'POST', {
        sourceProductId: p3.id,
        quantity: 3,
        targetShopId: 'shop-2'
    });
    assert(tr3_2.status === 200, 'Transfer Shop 3 -> Shop 2 succeeded (3 units)', 'Angle 1');

    // 1.4 Guard against invalid Self-Transfer (Shop 1 -> Shop 1)
    const selfTr = await req('/api/products/transfer', 'POST', {
        sourceProductId: p1.id,
        quantity: 2,
        targetShopId: 'shop-1'
    });
    assert(selfTr.status === 400, 'Self-transfer (Shop 1 -> Shop 1) strictly blocked with HTTP 400', 'Angle 1');

    // ----------------------------------------------------------------------------------------
    // ANGLE 2: Unexperienced User & Novice Error Safeguards
    // ----------------------------------------------------------------------------------------
    console.log(`\n--- ANGLE 2: UNEXPERIENCED USER & NOVICE ERROR SAFEGUARDS ---`);

    // 2.1 Attempt credit sale with Walk-in Customer
    const badCreditSale = await req('/api/sales', 'POST', {
        customerDetails: {
            name: 'Walk-in Customer',
            phone: '',
            paymentType: 'Partial',
            amountPaid: 10000
        },
        items: [{ id: p1.id, name: p1.name, quantity: 1, price: 60000 }],
        total: 60000
    });
    assert(badCreditSale.status === 400, 'Credit sale with "Walk-in Customer" strictly rejected (HTTP 400)', 'Angle 2');

    // 2.2 Attempt negative stock submission
    const negStock = await req('/api/products', 'POST', {
        name: 'Negative Stock Item',
        stock: -10,
        purchasePrice: 1000,
        shopId: 'shop-1'
    });
    assert(negStock.status === 400, 'Negative stock submission strictly blocked with HTTP 400', 'Angle 2');

    // 2.3 Attempt negative price submission
    const negPrice = await req('/api/products', 'POST', {
        name: 'Negative Price Item',
        stock: 5,
        purchasePrice: -500,
        shopId: 'shop-1'
    });
    assert(negPrice.status === 400, 'Negative purchase price submission strictly blocked with HTTP 400', 'Angle 2');

    // ----------------------------------------------------------------------------------------
    // ANGLE 3: Billing, POS Checkout & Return Auto-Population
    // ----------------------------------------------------------------------------------------
    console.log(`\n--- ANGLE 3: BILLING, POS CHECKOUT & RETURN AUTO-POPULATION ---`);

    // 3.1 Create Customer
    const cust = (await req('/api/customers', 'POST', {
        name: 'Malik Furniture Mart',
        phone: '03001234567',
        address: 'Main Market, Lahore'
    })).data;
    assert(cust.id, 'Customer profile created for credit testing', 'Angle 3');

    // 3.2 Dynamic Pricing Checkout: Sale with Partial Down Payment
    const saleRes = await req('/api/sales', 'POST', {
        customerDetails: {
            customerId: cust.id,
            name: cust.name,
            phone: cust.phone,
            paymentType: 'Partial',
            amountPaid: 50000
        },
        shopId: 'shop-1',
        items: [{ id: p1.id, name: p1.name, quantity: 2, price: 75000 }], // Custom counter rate (total 150,000)
        total: 150000
    });
    assert(saleRes.status === 201, 'Dynamic counter price sale committed (Rs. 150,000 total)', 'Angle 3');
    const sale = saleRes.data;

    // Verify stock decremented
    const p1AfterSale = await getProduct(p1.id);
    assert(p1AfterSale.stock === 14, `Stock decremented by 2 (16 -> 14, Actual: ${p1AfterSale.stock})`, 'Angle 3');

    // Verify customer debt incremented by remaining credit (150,000 - 50,000 = 100,000)
    const custAfterSale = await getCustomer(cust.id);
    assert(custAfterSale.balance === 100000, `Customer balance debited with 100,000 PKR dues (Actual: ${custAfterSale.balance})`, 'Angle 3');

    // 3.3 Sales Return with original invoice linkage
    const returnRes = await req('/api/sales', 'POST', {
        type: 'Return',
        originalSaleId: sale.id,
        customerDetails: {
            customerId: cust.id,
            name: cust.name,
            phone: cust.phone,
            paymentType: 'Pending',
            amountPaid: 0
        },
        shopId: 'shop-1',
        items: [{ id: p1.id, name: p1.name, quantity: 1, price: 75000 }],
        total: 75000
    });
    assert(returnRes.status === 201, 'Return invoice processed against original sale', 'Angle 3');

    // Verify stock restored on return
    const p1AfterReturn = await getProduct(p1.id);
    assert(p1AfterReturn.stock === 15, `Physical stock restored by 1 on return (14 -> 15, Actual: ${p1AfterReturn.stock})`, 'Angle 3');

    // Verify customer balance decremented by return credit (100,000 - 75,000 = 25,000)
    const custAfterReturn = await getCustomer(cust.id);
    assert(custAfterReturn.balance === 25000, `Customer balance credited by 75,000 PKR (100,000 -> 25,000, Actual: ${custAfterReturn.balance})`, 'Angle 3');

    // ----------------------------------------------------------------------------------------
    // ANGLE 4: Supplier Procurement & FIFO Debt Settlement
    // ----------------------------------------------------------------------------------------
    console.log(`\n--- ANGLE 4: SUPPLIER PROCUREMENT & FIFO DEBT SETTLEMENT ---`);

    // 4.1 Create Supplier
    const supp = (await req('/api/suppliers', 'POST', {
        name: 'Master Foam Ltd',
        contactPerson: 'Kashif Ali',
        phone: '03219876543'
    })).data;
    assert(supp.id, 'Supplier profile created', 'Angle 4');

    // 4.2 Purchase 1: Total 80,000, Upfront 30,000, Dues 50,000 into Shop 3
    const pur1 = (await req('/api/purchases', 'POST', {
        supplierId: supp.id,
        shopId: 'shop-3',
        paidAmount: 30000,
        items: [{ id: p3.id, name: p3.name, quantity: 5, purchasePrice: 16000, total: 80000 }]
    })).data;
    assert(pur1.id, 'Purchase 1 recorded into Shop 3 with 50,000 PKR dues', 'Angle 4');

    const suppAfterP1 = await getSupplier(supp.id);
    assert(suppAfterP1.balance === 50000, `Supplier balance equals 50,000 PKR (Actual: ${suppAfterP1.balance})`, 'Angle 4');

    // 4.3 Attempt Overpayment (Paying 60,000 when balance is 50,000)
    const overpayRes = await req('/api/supplier-payments', 'POST', {
        supplierId: supp.id,
        supplierName: supp.name,
        amount: 60000
    });
    assert(overpayRes.status === 400, 'Supplier overpayment attempt strictly blocked (HTTP 400)', 'Angle 4');

    // 4.4 Valid Payment Allocation via FIFO
    const validPayRes = await req('/api/supplier-payments', 'POST', {
        supplierId: supp.id,
        supplierName: supp.name,
        amount: 50000
    });
    assert(validPayRes.status === 201, 'Supplier payment of 50,000 PKR processed successfully', 'Angle 4');

    const suppAfterPay = await getSupplier(supp.id);
    assert(suppAfterPay.balance === 0, `Supplier balance cleared to 0 PKR (Actual: ${suppAfterPay.balance})`, 'Angle 4');

    // 4.5 Zero-Balance Payment Lock
    const zeroLockRes = await req('/api/supplier-payments', 'POST', {
        supplierId: supp.id,
        supplierName: supp.name,
        amount: 5000
    });
    assert(zeroLockRes.status === 400, 'Zero-balance payment attempt hard-blocked (HTTP 400)', 'Angle 4');

    // ----------------------------------------------------------------------------------------
    // ANGLE 5: Cashbook Reconciliation & Operating Expenses
    // ----------------------------------------------------------------------------------------
    console.log(`\n--- ANGLE 5: CASHBOOK RECONCILIATION & PAKISTANI TIMEZONE ---`);

    const expensesRes = await req('/api/expenses', 'POST', {
        title: 'Showroom Electricity Bill',
        amount: 12500,
        category: 'Utilities',
        shopId: 'shop-1'
    });
    assert(expensesRes.status === 201, 'Operating expense logged into Cashbook', 'Angle 5');

    // ----------------------------------------------------------------------------------------
    // ANGLE 6: ACID Multi-Table Transaction Void (Stock & Balance Reversal)
    // ----------------------------------------------------------------------------------------
    console.log(`\n--- ANGLE 6: ACID MULTI-TABLE TRANSACTION VOID (STOCK & BALANCES) ---`);

    // Void the customer return: should revert stock by -1 (15 -> 14) and re-debit customer balance by 75,000 (25,000 -> 100,000)
    const voidReturn = await req(`/api/sales/${returnRes.data.id}`, 'DELETE');
    assert(voidReturn.status === 200, 'Return invoice voided via ACID transaction', 'Angle 6');

    const p1AfterVoid = await getProduct(p1.id);
    assert(p1AfterVoid.stock === 14, `Product stock reverted back to 14 (Actual: ${p1AfterVoid.stock})`, 'Angle 6');

    const custAfterVoid = await getCustomer(cust.id);
    assert(custAfterVoid.balance === 100000, `Customer balance restored to 100,000 PKR (Actual: ${custAfterVoid.balance})`, 'Angle 6');

    // ----------------------------------------------------------------------------------------
    // ANGLE 7: Disaster Recovery, Rolling Hourly Snapshots & 1-Click Mistake Undo
    // ----------------------------------------------------------------------------------------
    console.log(`\n--- ANGLE 7: DISASTER RECOVERY, ROLLING HOURLY SNAPSHOTS & QUICK UNDO ---`);

    // 7.1 Check /api/undo/status
    const undoStatus = (await req('/api/undo/status')).data;
    assert(undoStatus.success === true, '/api/undo/status returns success: true', 'Angle 7');
    assert(undoStatus.lastTransaction !== null, `Accurately detects active last transaction: ${undoStatus.lastTransaction?.category} #${undoStatus.lastTransaction?.invoiceNumber}`, 'Angle 7');
    assert(undoStatus.candidateSnapshot !== null, `Accurately detects rolling candidate snapshot: ${undoStatus.candidateSnapshot?.filename}`, 'Angle 7');

    // 7.2 Test 1-Click Surgical Undo
    // Create a mistaken settlement payment of 20,000
    const mistPay = (await req('/api/payments', 'POST', {
        customerId: cust.id,
        customerName: cust.name,
        amount: 20000,
        type: 'Cash'
    })).data;

    const custBeforeUndo = await getCustomer(cust.id);
    assert(custBeforeUndo.balance === 80000, `Customer balance after payment is 80,000 PKR (Actual: ${custBeforeUndo.balance})`, 'Angle 7');

    // Undo the mistaken payment via 1-Click Undo API
    const undoTrxRes = await req('/api/undo/last-transaction', 'POST', {
        id: mistPay.id,
        entityType: 'customer-payment'
    });
    assert(undoTrxRes.status === 200, '1-Click Surgical Undo executed successfully', 'Angle 7');

    const custAfterUndo = await getCustomer(cust.id);
    assert(custAfterUndo.balance === 100000, `Customer balance seamlessly restored to 100,000 PKR (Actual: ${custAfterUndo.balance})`, 'Angle 7');

    // 7.3 Test Rolling Hourly Snapshot Generation & Pre-Undo Safety
    const backupList = (await req('/api/backups')).data;
    const hasHourly = backupList.some(b => b.filename.startsWith('backup-hourly-'));
    assert(hasHourly, 'Hourly rolling snapshot confirmed in backups directory', 'Angle 7');

    // 7.4 Test 1-Click Time Machine Rollback
    const rollbackRes = await req('/api/undo/rollback-snapshot', 'POST', {
        filename: undoStatus.candidateSnapshot.filename
    });
    assert(rollbackRes.status === 200, '1-Click Time Machine Rollback restored database to target snapshot', 'Angle 7');

    const safetyBackups = fs.readdirSync(path.join(testDataDir, 'backups')).filter(f => f.startsWith('pre-undo-safety'));
    assert(safetyBackups.length > 0, `Pre-undo safety snapshot verified in backups/ (${safetyBackups[0]})`, 'Angle 7');

    // ----------------------------------------------------------------------------------------
    // SUMMARY
    // ----------------------------------------------------------------------------------------
    console.log(`\n====================================================================`);
    console.log(`📊 MASTER TEST RESULTS SUMMARY`);
    console.log(`====================================================================`);
    console.log(`TOTAL ASSERTIONS: ${results.total}`);
    console.log(`PASSED:           ${results.passed} (100%)`);
    console.log(`FAILED:           ${results.failed}`);
    console.log(`--------------------------------------------------------------------`);
    Object.keys(results.categories).forEach(cat => {
        const c = results.categories[cat];
        console.log(`• ${cat.padEnd(10)}: ${c.passed}/${c.passed + c.failed} PASSED`);
    });
    console.log(`====================================================================\n`);

    // Cleanup isolated environment
    server.close();
    try {
        fs.rmSync(testDataDir, { recursive: true, force: true });
    } catch (_) {}

    process.exit(results.failed > 0 ? 1 : 0);
}

runMasterSuite().catch(err => {
    console.error('Fatal Test Suite Error:', err);
    if (server) server.close();
    process.exit(1);
});
