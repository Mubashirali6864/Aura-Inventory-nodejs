const test = require('node:test');
const assert = require('node:assert/strict');
const { createTestEnvironment } = require('./test_helper.cjs');

test('Integration Test: Cashbook Journal Reconciliation & Multi-Shop Expense Tracking', async (t) => {
    const env = await createTestEnvironment();
    const { req, cleanup } = env;

    t.after(async () => {
        await cleanup();
    });

    await t.test('creates operating expenses across different shop branches', async () => {
        const exp1 = await req('/api/expenses', 'POST', {
            title: 'LESCO Electricity Bill Shop 1',
            category: 'Utilities',
            amount: 15000,
            shopId: 'shop-1',
            description: 'LESCO commercial tariff Shop 1'
        });
        assert.equal(exp1.status, 201);

        const exp2 = await req('/api/expenses', 'POST', {
            title: 'Weekly Staff Refreshments',
            category: 'Refreshments',
            amount: 2500,
            shopId: 'shop-2',
            description: 'Weekly team tea'
        });
        assert.equal(exp2.status, 201);

        const exp3 = await req('/api/expenses', 'POST', {
            title: 'Roof Weatherproofing Maintenance',
            category: 'Maintenance',
            amount: 8000,
            shopId: 'shop-3',
            description: 'Roof weatherproofing'
        });
        assert.equal(exp3.status, 201);
    });

    await t.test('retrieves expenses and verifies multi-shop branch assignments', async () => {
        const res = await req('/api/expenses');
        assert.equal(res.status, 200);
        assert.ok(Array.isArray(res.data));
        assert.equal(res.data.length, 3);

        const shop1Exp = res.data.find(e => e.shopId === 'shop-1');
        const shop2Exp = res.data.find(e => e.shopId === 'shop-2');
        const shop3Exp = res.data.find(e => e.shopId === 'shop-3');

        assert.equal(shop1Exp.amount, 15000);
        assert.equal(shop2Exp.amount, 2500);
        assert.equal(shop3Exp.amount, 8000);
    });

    await t.test('validates expense input constraints', async () => {
        const invalidRes = await req('/api/expenses', 'POST', {
            title: '',
            category: '',
            amount: -500
        });
        assert.ok(invalidRes.status >= 400);
    });
});
