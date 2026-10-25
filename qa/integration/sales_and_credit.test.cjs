const test = require('node:test');
const assert = require('node:assert/strict');
const { createTestEnvironment } = require('./test_helper.cjs');

test('Integration Test: Sales Counter, Credit Ledger, & Return Auto-Population', async (t) => {
    const env = await createTestEnvironment();
    const { req, cleanup } = env;

    t.after(async () => {
        await cleanup();
    });

    let productId, customerId, creditSaleId;

    await t.test('creates catalog product and customer profile', async () => {
        const prodRes = await req('/api/products', 'POST', {
            name: 'Luxury Velvet Sofa 3-Seater',
            category: 'Sofas',
            shopId: 'shop-1',
            stock: 10,
            purchasePrice: 50000
        });
        assert.equal(prodRes.status, 201);
        productId = prodRes.data.id;

        const custRes = await req('/api/customers', 'POST', {
            name: 'Muhammad Tariq',
            phone: '03001234567',
            address: 'Gulberg III, Lahore'
        });
        assert.equal(custRes.status, 201);
        customerId = custRes.data.id;
    });

    await t.test('strictly forbids Walk-in Customer for credit or partial sales', async () => {
        const res = await req('/api/sales', 'POST', {
            customerDetails: {
                name: 'Walk-in Customer',
                paymentType: 'Pending',
                amountPaid: 0
            },
            total: 50000,
            shopId: 'shop-1',
            items: [{ id: productId, name: 'Luxury Velvet Sofa 3-Seater', quantity: 1, price: 50000 }]
        });
        assert.equal(res.status, 400);
        assert.match(res.data.error, /customer name is required/i);
    });

    await t.test('commits credit sale with dynamic checkout pricing', async () => {
        const res = await req('/api/sales', 'POST', {
            customerDetails: {
                customerId,
                name: 'Muhammad Tariq',
                phone: '03001234567',
                paymentType: 'Partial',
                amountPaid: 50000
            },
            total: 150000, // Dynamic price: 75,000 per unit x 2
            shopId: 'shop-1',
            items: [{
                id: productId,
                name: 'Luxury Velvet Sofa 3-Seater',
                quantity: 2,
                price: 75000
            }]
        });
        assert.equal(res.status, 201);
        creditSaleId = res.data.id;
        assert.equal(res.data.amountPaid, 50000);
        assert.equal(res.data.remainingBalance, 100000);
        assert.ok(res.data.invoiceNumber, 'Invoice number should be generated atomically');

        // Check stock decremented
        const products = (await req('/api/products')).data;
        const p = products.find(x => x.id === productId);
        assert.equal(p.stock, 8, 'Stock should decrement from 10 to 8');

        // Check customer balance debited
        const customers = (await req('/api/customers')).data;
        const c = customers.find(x => x.id === customerId);
        assert.equal(c.balance, 100000, 'Customer balance should reflect pending 100k dues');
    });

    await t.test('processes sales return against original sale invoice', async () => {
        const returnRes = await req('/api/sales', 'POST', {
            type: 'Return',
            originalSaleId: creditSaleId,
            customerDetails: {
                customerId,
                name: 'Muhammad Tariq',
                phone: '03001234567',
                paymentType: 'Pending',
                amountPaid: 0
            },
            shopId: 'shop-1',
            total: 75000, // Returning 1 unit
            items: [{
                id: productId,
                name: 'Luxury Velvet Sofa 3-Seater',
                quantity: 1,
                price: 75000
            }]
        });
        assert.equal(returnRes.status, 201);

        // Check stock incremented back by 1
        const products = (await req('/api/products')).data;
        const p = products.find(x => x.id === productId);
        assert.equal(p.stock, 9, 'Stock should restore from 8 to 9');

        // Check customer balance reduced
        const customers = (await req('/api/customers')).data;
        const c = customers.find(x => x.id === customerId);
        assert.equal(c.balance, 25000, 'Customer balance should drop from 100k to 25k (100k - 75k)');
    });

    await t.test('settles remaining customer dues via customer payment', async () => {
        const payRes = await req('/api/payments', 'POST', {
            customerId,
            customerName: 'Muhammad Tariq',
            amount: 25000,
            type: 'Cash',
            note: 'Final settlement for sofa invoice'
        });
        assert.equal(payRes.status, 201);

        const customers = (await req('/api/customers')).data;
        const c = customers.find(x => x.id === customerId);
        assert.equal(c.balance, 0, 'Customer balance should be completely settled to 0');
    });
});
