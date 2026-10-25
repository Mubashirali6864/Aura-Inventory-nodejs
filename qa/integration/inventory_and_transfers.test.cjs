const test = require('node:test');
const assert = require('node:assert/strict');
const { createTestEnvironment } = require('./test_helper.cjs');

test('Integration Test: Multi-Shop Inventory Parity & 6-Way Crossover Transfers', async (t) => {
    const env = await createTestEnvironment();
    const { req, cleanup } = env;

    t.after(async () => {
        await cleanup();
    });

    let prodShop1Id, prodShop2Id, prodShop3Id;

    await t.test('initializes products across Shop 1, Shop 2, and Shop 3', async () => {
        const res1 = await req('/api/products', 'POST', {
            name: 'Rosewood Dining Table 6-Seater',
            category: 'Tables',
            shopId: 'shop-1',
            stock: 20,
            purchasePrice: 45000,
            sku: 'RDT-001'
        });
        assert.equal(res1.status, 201);
        prodShop1Id = res1.data.id;

        const res2 = await req('/api/products', 'POST', {
            name: 'Rosewood Dining Table 6-Seater',
            category: 'Tables',
            shopId: 'shop-2',
            stock: 5,
            purchasePrice: 45000,
            sku: 'RDT-002'
        });
        assert.equal(res2.status, 201);
        prodShop2Id = res2.data.id;

        const res3 = await req('/api/products', 'POST', {
            name: 'Rosewood Dining Table 6-Seater',
            category: 'Tables',
            shopId: 'shop-3',
            stock: 2,
            purchasePrice: 45000,
            sku: 'RDT-003'
        });
        assert.equal(res3.status, 201);
        prodShop3Id = res3.data.id;
    });

    await t.test('executes transfer from Shop 1 to Shop 3 (4 units)', async () => {
        const transferRes = await req('/api/products/transfer', 'POST', {
            sourceProductId: prodShop1Id,
            sourceShopId: 'shop-1',
            targetShopId: 'shop-3',
            quantity: 4
        });
        assert.equal(transferRes.status, 200);

        const products = (await req('/api/products')).data;
        const p1 = products.find(p => p.id === prodShop1Id);
        const p3 = products.find(p => p.id === prodShop3Id || (p.shopId === 'shop-3' && p.name === p1.name));

        assert.equal(p1.stock, 16, 'Shop 1 stock should decrement from 20 to 16');
        assert.equal(p3.stock, 6, 'Shop 3 stock should increment from 2 to 6');
    });

    await t.test('executes transfer from Shop 3 to Shop 2 (3 units)', async () => {
        const products = (await req('/api/products')).data;
        const p3 = products.find(p => p.id === prodShop3Id || (p.shopId === 'shop-3' && p.name === 'Rosewood Dining Table 6-Seater'));

        const transferRes = await req('/api/products/transfer', 'POST', {
            sourceProductId: p3.id,
            sourceShopId: 'shop-3',
            targetShopId: 'shop-2',
            quantity: 3
        });
        assert.equal(transferRes.status, 200);

        const updatedProducts = (await req('/api/products')).data;
        const updatedP3 = updatedProducts.find(p => p.id === p3.id);
        const updatedP2 = updatedProducts.find(p => p.id === prodShop2Id);

        assert.equal(updatedP3.stock, 3, 'Shop 3 stock should drop from 6 to 3');
        assert.equal(updatedP2.stock, 8, 'Shop 2 stock should increment from 5 to 8');
    });

    await t.test('strictly blocks self-transfers within same shop (Shop 1 -> Shop 1)', async () => {
        const res = await req('/api/products/transfer', 'POST', {
            sourceProductId: prodShop1Id,
            sourceShopId: 'shop-1',
            targetShopId: 'shop-1',
            quantity: 2
        });
        assert.equal(res.status, 400);
        assert.match(res.data.error, /cannot be the same/i);
    });

    await t.test('strictly blocks stock overdraft transfers (quantity > stock)', async () => {
        const res = await req('/api/products/transfer', 'POST', {
            sourceProductId: prodShop1Id,
            sourceShopId: 'shop-1',
            targetShopId: 'shop-2',
            quantity: 999
        });
        assert.equal(res.status, 400);
        assert.match(res.data.error, /insufficient/i);
    });

    await t.test('strictly blocks negative stock product creation', async () => {
        const res = await req('/api/products', 'POST', {
            name: 'Faulty Negative Item',
            shopId: 'shop-1',
            stock: -5,
            purchasePrice: 1000
        });
        assert.equal(res.status, 400);
    });
});
