const test = require('node:test');
const assert = require('node:assert/strict');
const { createTestEnvironment } = require('./test_helper.cjs');

test('Integration Test: Supplier Procurement, FIFO Debt Settlement & Overpay Protection', async (t) => {
    const env = await createTestEnvironment();
    const { req, cleanup } = env;

    t.after(async () => {
        await cleanup();
    });

    let supplierId, supplierName = 'ChenOne Timber & Wood Supplies', prodId;

    await t.test('creates catalog product and supplier profile', async () => {
        const prodRes = await req('/api/products', 'POST', {
            name: 'Teak Wood Planks 8x4',
            shopId: 'shop-3',
            stock: 0,
            purchasePrice: 16000
        });
        assert.equal(prodRes.status, 201);
        prodId = prodRes.data.id;

        const res = await req('/api/suppliers', 'POST', {
            name: supplierName,
            contactPerson: 'Kashif Mehmood',
            phone: '03219876543'
        });
        assert.equal(res.status, 201);
        supplierId = res.data.id;
    });

    await t.test('records purchase into Shop 3 with pending dues', async () => {
        // Purchase: 80,000 total, 30,000 paid upfront, 50,000 remaining
        const p1Res = await req('/api/purchases', 'POST', {
            supplierId,
            shopId: 'shop-3',
            paidAmount: 30000,
            items: [{
                id: prodId,
                name: 'Teak Wood Planks 8x4',
                quantity: 5,
                purchasePrice: 16000,
                total: 80000
            }]
        });
        assert.equal(p1Res.status, 201);

        const suppliers = (await req('/api/suppliers')).data;
        const sup = suppliers.find(s => s.id === supplierId);
        assert.equal(sup.balance, 50000, 'Supplier balance should be 50,000 PKR');

        // Verify product stock incremented in Shop 3
        const products = (await req('/api/products')).data;
        const prod = products.find(p => p.id === prodId);
        assert.equal(prod.stock, 5, 'Shop 3 product stock should increment by 5');
    });

    await t.test('strictly blocks supplier overpayment attempts (paying 60k when dues are 50k)', async () => {
        const res = await req('/api/supplier-payments', 'POST', {
            supplierId,
            supplierName,
            amount: 60000
        });
        assert.equal(res.status, 400);
        assert.match(res.data.error, /cannot exceed/i);
    });

    await t.test('processes valid supplier payment clearing all dues', async () => {
        const res = await req('/api/supplier-payments', 'POST', {
            supplierId,
            supplierName,
            amount: 50000
        });
        assert.equal(res.status, 201);

        const suppliers = (await req('/api/suppliers')).data;
        const sup = suppliers.find(s => s.id === supplierId);
        assert.equal(sup.balance, 0, 'Supplier balance should be cleared to 0');
    });

    await t.test('enforces zero-balance lock blocking payment when balance is 0', async () => {
        const res = await req('/api/supplier-payments', 'POST', {
            supplierId,
            supplierName,
            amount: 5000
        });
        assert.equal(res.status, 400);
        assert.match(res.data.error, /no pending dues/i);
    });
});
