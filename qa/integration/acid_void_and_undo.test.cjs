const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { createTestEnvironment } = require('./test_helper.cjs');

test('Integration Test: ACID Multi-Table Void, Hourly Snapshots & 1-Click Undo', async (t) => {
    const env = await createTestEnvironment();
    const { req, cleanup, testDataDir } = env;

    t.after(async () => {
        await cleanup();
    });

    let prodId, custId, saleId;

    await t.test('verifies HTTP security headers on all responses', async () => {
        const res = await req('/api/products');
        assert.equal(res.headers['x-content-type-options'], 'nosniff');
        assert.equal(res.headers['x-frame-options'], 'SAMEORIGIN');
        assert.ok(res.headers['content-security-policy'], 'CSP header should be present');
    });

    await t.test('prepares transaction scenario for ACID voiding', async () => {
        const p = await req('/api/products', 'POST', {
            name: 'Conference Room Executive Chair',
            shopId: 'shop-1',
            stock: 20,
            purchasePrice: 15000
        });
        prodId = p.data.id;

        const c = await req('/api/customers', 'POST', {
            name: 'Kamran Akmal',
            phone: '03009988776'
        });
        custId = c.data.id;

        const s = await req('/api/sales', 'POST', {
            customerDetails: {
                customerId: custId,
                name: 'Kamran Akmal',
                phone: '03009988776',
                paymentType: 'Partial',
                amountPaid: 20000
            },
            shopId: 'shop-1',
            total: 60000,
            items: [{
                id: prodId,
                name: 'Conference Room Executive Chair',
                quantity: 2,
                price: 30000
            }]
        });
        saleId = s.data.id;

        // Verify stock dropped to 18 and customer balance is 40k
        const prod = (await req('/api/products')).data.find(x => x.id === prodId);
        const cust = (await req('/api/customers')).data.find(x => x.id === custId);
        assert.equal(prod.stock, 18);
        assert.equal(cust.balance, 40000);
    });

    await t.test('executes ACID Void on sale: stock and customer ledger fully restored', async () => {
        const voidRes = await req(`/api/sales/${saleId}`, 'DELETE');
        assert.equal(voidRes.status, 200);

        const prod = (await req('/api/products')).data.find(x => x.id === prodId);
        const cust = (await req('/api/customers')).data.find(x => x.id === custId);

        assert.equal(prod.stock, 20, 'Stock must revert back to 20');
        assert.equal(cust.balance, 0, 'Customer balance must revert back to 0');
    });

    await t.test('verifies 1-Click Surgical Undo on customer payment', async () => {
        // Create an active sale with pending dues
        const saleRes = await req('/api/sales', 'POST', {
            customerDetails: {
                customerId: custId,
                name: 'Kamran Akmal',
                phone: '03009988776',
                paymentType: 'Partial',
                amountPaid: 10000
            },
            shopId: 'shop-1',
            total: 50000,
            items: [{
                id: prodId,
                name: 'Conference Room Executive Chair',
                quantity: 1,
                price: 50000
            }]
        });
        assert.equal(saleRes.status, 201);

        // Customer balance is now 40,000. Record payment of 15,000
        const payRes = await req('/api/payments', 'POST', {
            customerId: custId,
            customerName: 'Kamran Akmal',
            amount: 15000,
            type: 'Cash',
            note: 'Settlement payment'
        });
        assert.equal(payRes.status, 201);

        const custBeforeUndo = (await req('/api/customers')).data.find(x => x.id === custId);
        assert.equal(custBeforeUndo.balance, 25000);

        const undoStatus = await req('/api/undo/status');
        assert.equal(undoStatus.status, 200);
        assert.equal(undoStatus.data.success, true);
        assert.ok(undoStatus.data.lastTransaction, 'Should detect last active transaction');

        // Execute surgical undo
        const undoRes = await req('/api/undo/last-transaction', 'POST');
        assert.equal(undoRes.status, 200);
        assert.match(undoRes.data.message, /undone successfully/i);

        const custAfterUndo = (await req('/api/customers')).data.find(x => x.id === custId);
        assert.equal(custAfterUndo.balance, 40000, 'Customer balance seamlessly restored to 40,000 PKR');
    });

    await t.test('verifies hourly snapshot generation and Time Machine rollback', async () => {
        const backups = (await req('/api/backups')).data;
        assert.ok(Array.isArray(backups));
        const hourlySnapshot = backups.find(b => b.filename.startsWith('backup-hourly-'));
        assert.ok(hourlySnapshot, 'Hourly rolling snapshot should exist');

        // Test Time Machine Rollback
        const rollbackRes = await req('/api/undo/rollback-snapshot', 'POST', {
            filename: hourlySnapshot.filename
        });
        assert.equal(rollbackRes.status, 200);

        // Verify pre-undo safety snapshot was created before rollback
        const backupsDir = path.join(testDataDir, 'backups');
        const safetyBackups = fs.readdirSync(backupsDir).filter(f => f.startsWith('pre-undo-safety'));
        assert.ok(safetyBackups.length > 0, 'Pre-undo safety snapshot must be generated');
    });
});
