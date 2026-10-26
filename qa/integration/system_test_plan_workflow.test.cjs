const test = require('node:test');
const assert = require('node:assert/strict');
const { createTestEnvironment } = require('./test_helper.cjs');

test('Automated End-to-End Operational Verification Workflow (3-Page Checklist)', async (t) => {
    const env = await createTestEnvironment();
    const { req, cleanup } = env;

    t.after(async () => {
        await cleanup();
    });

    // Tracking variables across phases
    let supplierId, supplierName = 'ChenOne Fabrics';
    let prodShop1Id, prodShop2Id, prodShop3Id;
    let walkInFullSaleId;
    let ahmedAliId, ahmedPartialSaleId;
    let shop2FullSaleId, shop2PartialSaleId, shop2PartialCustId;
    let shop3FullSaleId, shop3PartialSaleId, shop3PartialCustId;

    // Helper functions
    async function getProduct(id) {
        const products = (await req('/api/products')).data;
        return Array.isArray(products) ? products.find(p => p.id === id) : null;
    }
    async function getProductsByShop(shopId) {
        const products = (await req('/api/products')).data;
        return Array.isArray(products) ? products.filter(p => p.shopId === shopId) : [];
    }
    async function getSupplier(id) {
        const suppliers = (await req('/api/suppliers')).data;
        return Array.isArray(suppliers) ? suppliers.find(s => s.id === id) : null;
    }
    async function getCustomer(id) {
        const customers = (await req('/api/customers')).data;
        return Array.isArray(customers) ? customers.find(c => c.id === id) : null;
    }

    // --------------------------------------------------------------------------------------------
    // PHASE 1: Supplier Setup, Unpaid Debt & Shop 1 Stock Intake (Vendor Onboarding)
    // --------------------------------------------------------------------------------------------
    await t.test('Phase 1.1: Register Supplier Profile', async () => {
        const res = await req('/api/suppliers', 'POST', {
            name: supplierName,
            shopName: supplierName,
            contactPerson: 'Tariq Mahmood',
            phone: '03001234567',
            address: 'Faisalabad Textile Market'
        });
        assert.equal(res.status, 201);
        assert.ok(res.data.id);
        supplierId = res.data.id;
    });

    await t.test('Phase 1.2: Record Pre-Existing Opening Debt (Rs. 5,000)', async () => {
        // Record legacy opening debt as pending balance adjustment
        const adjRes = await req('/api/purchases', 'POST', {
            supplierId,
            shopId: 'shop-1',
            paidAmount: 0,
            totalAmount: 5000,
            isAdjustment: true,
            items: [{
                productId: 'adjustment',
                name: 'Pending Balance Adjustment',
                quantity: 1,
                costPrice: 5000,
                total: 5000
            }]
        });
        assert.equal(adjRes.status, 201);

        const supplier = await getSupplier(supplierId);
        assert.equal(supplier.balance, 5000, 'Supplier balance should display Rs. 5,000 pending');
    });

    await t.test('Phase 1.3: Add Purchase to Shop 1 (40 Suits @ Rs. 1,000 = Rs. 40,000)', async () => {
        // Create catalog item first
        const prodRes = await req('/api/products', 'POST', {
            name: 'Cotton Suit',
            shopId: 'shop-1',
            stock: 0,
            purchasePrice: 1000
        });
        assert.equal(prodRes.status, 201);
        prodShop1Id = prodRes.data.id;

        // Purchase 40 units into Shop 1 pending/unpaid
        const purRes = await req('/api/purchases', 'POST', {
            supplierId,
            shopId: 'shop-1',
            paidAmount: 0,
            totalAmount: 40000,
            items: [{
                id: prodShop1Id,
                productId: prodShop1Id,
                name: 'Cotton Suit',
                quantity: 40,
                costPrice: 1000,
                total: 40000
            }]
        });
        assert.equal(purRes.status, 201);

        // Math & Verification Check
        const p1 = await getProduct(prodShop1Id);
        assert.equal(p1.stock, 40, 'Shop 1 Stock should equal exactly 40 units');

        const supplier = await getSupplier(supplierId);
        assert.equal(supplier.balance, 45000, 'Supplier Debt should equal Rs. 45,000 (5,000 opening + 40,000 purchase)');
    });

    await t.test('Phase 1.4: Settle Supplier Partial Payment (Pay Rs. 10,000 cash out of drawer)', async () => {
        const payRes = await req('/api/supplier-payments', 'POST', {
            supplierId,
            supplierName,
            amount: 10000,
            method: 'Cash'
        });
        assert.equal(payRes.status, 201);

        const supplier = await getSupplier(supplierId);
        assert.equal(supplier.balance, 35000, 'Supplier balance should drop to Rs. 35,000');
    });

    // --------------------------------------------------------------------------------------------
    // PHASE 2A: Shop 1 — Walk-In Customer Sales & Return Cycle (No Profile Created)
    // --------------------------------------------------------------------------------------------
    await t.test('Phase 2A.1: Walk-In Full Cash Sale (2 Suits @ Rs. 1,500 = Rs. 3,000)', async () => {
        const saleRes = await req('/api/sales', 'POST', {
            shopId: 'shop-1',
            total: 3000,
            customerDetails: {
                name: 'Walk-in Customer',
                paymentType: 'Full',
                amountPaid: 3000
            },
            items: [{
                id: prodShop1Id,
                name: 'Cotton Suit',
                quantity: 2,
                price: 1500,
                total: 3000
            }]
        });
        assert.equal(saleRes.status, 201);
        walkInFullSaleId = saleRes.data.id;
        assert.equal(saleRes.data.initialPaid, 3000);

        const p1 = await getProduct(prodShop1Id);
        assert.equal(p1.stock, 38, 'Shop 1 Stock should drop from 40 to 38');
    });

    await t.test('Phase 2A.2: Walk-In Partial Payment Sale (2 Suits @ Rs. 1,500, Cash Paid: 1,000, Credit: 2,000)', async () => {
        const saleRes = await req('/api/sales', 'POST', {
            shopId: 'shop-1',
            total: 3000,
            customerDetails: {
                name: 'Walk-In Buyer (Shop 1)',
                phone: '03001111111',
                paymentType: 'Partial',
                amountPaid: 1000
            },
            items: [{
                id: prodShop1Id,
                name: 'Cotton Suit',
                quantity: 2,
                price: 1500,
                total: 3000
            }]
        });
        assert.equal(saleRes.status, 201);
        assert.equal(saleRes.data.initialPaid, 1000, 'Cashbook logs inflow +Rs. 1,000');
        assert.equal(saleRes.data.remainingBalance, 2000, 'Credit tab records Rs. 2,000');

        const p1 = await getProduct(prodShop1Id);
        assert.equal(p1.stock, 36, 'Shop 1 Stock should drop from 38 to 36');
    });

    await t.test('Phase 2A.3: Walk-In Full Credit (Pending) Sale (1 Suit @ Rs. 1,500, Mode: Pending)', async () => {
        const saleRes = await req('/api/sales', 'POST', {
            shopId: 'shop-1',
            total: 1500,
            customerDetails: {
                name: 'Walk-In Buyer (Credit)',
                phone: '03002222222',
                paymentType: 'Pending',
                amountPaid: 0
            },
            items: [{
                id: prodShop1Id,
                name: 'Cotton Suit',
                quantity: 1,
                price: 1500,
                total: 1500
            }]
        });
        assert.equal(saleRes.status, 201);
        assert.equal(saleRes.data.initialPaid, 0, 'Cashbook: Rs. 0 change');
        assert.equal(saleRes.data.remainingBalance, 1500, 'Credit tab adds Rs. 1,500');

        const p1 = await getProduct(prodShop1Id);
        assert.equal(p1.stock, 35, 'Shop 1 Stock should drop from 36 to 35');
    });

    await t.test('Phase 2A.4: Walk-In Return & Cash Refund (Return 1 Full Sale Suit -> Refund Rs. 1,500)', async () => {
        const returnRes = await req('/api/sales', 'POST', {
            type: 'Return',
            originalSaleId: walkInFullSaleId,
            shopId: 'shop-1',
            total: 1500,
            customerDetails: {
                name: 'Walk-in Customer',
                paymentType: 'Full',
                amountPaid: 1500
            },
            items: [{
                id: prodShop1Id,
                name: 'Cotton Suit',
                quantity: 1,
                price: 1500
            }]
        });
        assert.equal(returnRes.status, 201);
        assert.equal(returnRes.data.initialPaid, 1500, 'Cashbook logs cash deduction -Rs. 1,500');

        const p1 = await getProduct(prodShop1Id);
        assert.equal(p1.stock, 36, 'Shop 1 Stock should restore from 35 to 36');
    });

    // --------------------------------------------------------------------------------------------
    // PHASE 2B: Shop 1 — Regular Khata Customer (Ahmed Ali)
    // --------------------------------------------------------------------------------------------
    await t.test('Phase 2B.1: Add Regular Customer to Khata with Legacy Debt Rs. 2,000', async () => {
        const custRes = await req('/api/customers', 'POST', {
            name: 'Ahmed Ali',
            phone: '03217778899',
            address: 'Gulberg, Lahore'
        });
        assert.equal(custRes.status, 201);
        ahmedAliId = custRes.data.id;

        // Enter legacy opening debt Rs. 2,000
        const adjRes = await req('/api/sales', 'POST', {
            shopId: 'shop-1',
            total: 2000,
            isAdjustment: true,
            customerDetails: {
                customerId: ahmedAliId,
                name: 'Ahmed Ali',
                phone: '03217778899',
                paymentType: 'Pending',
                amountPaid: 0
            },
            items: [{
                id: 'adjustment',
                productId: 'adjustment',
                name: 'Pending Balance Adjustment',
                quantity: 1,
                price: 2000
            }]
        });
        assert.equal(adjRes.status, 201);

        const customer = await getCustomer(ahmedAliId);
        assert.equal(customer.balance, 2000, 'Ahmed Ali ledger should open with initial debt of Rs. 2,000');
    });

    await t.test('Phase 2B.2: Ahmed Ali Full Sale (1 Suit @ Rs. 1,500 cash -> Mode: Full)', async () => {
        const saleRes = await req('/api/sales', 'POST', {
            shopId: 'shop-1',
            total: 1500,
            customerDetails: {
                customerId: ahmedAliId,
                name: 'Ahmed Ali',
                phone: '03217778899',
                paymentType: 'Full',
                amountPaid: 1500
            },
            items: [{
                id: prodShop1Id,
                name: 'Cotton Suit',
                quantity: 1,
                price: 1500
            }]
        });
        assert.equal(saleRes.status, 201);
        assert.equal(saleRes.data.initialPaid, 1500, 'Cashbook: +Rs. 1,500');

        const p1 = await getProduct(prodShop1Id);
        assert.equal(p1.stock, 35, 'Shop 1 Stock should drop from 36 to 35');
    });

    await t.test('Phase 2B.3: Ahmed Ali Partial Sale (2 Suits @ Rs. 3,000, Paid: 1,000, Debt: 2,000)', async () => {
        const saleRes = await req('/api/sales', 'POST', {
            shopId: 'shop-1',
            total: 3000,
            customerDetails: {
                customerId: ahmedAliId,
                name: 'Ahmed Ali',
                phone: '03217778899',
                paymentType: 'Partial',
                amountPaid: 1000
            },
            items: [{
                id: prodShop1Id,
                name: 'Cotton Suit',
                quantity: 2,
                price: 1500
            }]
        });
        assert.equal(saleRes.status, 201);
        ahmedPartialSaleId = saleRes.data.id;
        assert.equal(saleRes.data.initialPaid, 1000, 'Cashbook: +Rs. 1,000');

        const p1 = await getProduct(prodShop1Id);
        assert.equal(p1.stock, 33, 'Shop 1 Stock should drop from 35 to 33');

        const customer = await getCustomer(ahmedAliId);
        assert.equal(customer.balance, 4000, 'Ahmed Debt should equal Rs. 4,000 (2,000 previous + 2,000 partial)');
    });

    await t.test('Phase 2B.4: Ahmed Ali Pending Bill (1 Suit @ Rs. 1,500 -> Mode: Pending)', async () => {
        const saleRes = await req('/api/sales', 'POST', {
            shopId: 'shop-1',
            total: 1500,
            customerDetails: {
                customerId: ahmedAliId,
                name: 'Ahmed Ali',
                phone: '03217778899',
                paymentType: 'Pending',
                amountPaid: 0
            },
            items: [{
                id: prodShop1Id,
                name: 'Cotton Suit',
                quantity: 1,
                price: 1500
            }]
        });
        assert.equal(saleRes.status, 201);
        assert.equal(saleRes.data.initialPaid, 0, 'Cashbook: Rs. 0 change');

        const p1 = await getProduct(prodShop1Id);
        assert.equal(p1.stock, 32, 'Shop 1 Stock should drop from 33 to 32');

        const customer = await getCustomer(ahmedAliId);
        assert.equal(customer.balance, 5500, 'Ahmed Debt should increase to Rs. 5,500 (4,000 + 1,500)');
    });

    await t.test('Phase 2B.5: Ahmed Ali Settle Credit (Pay Rs. 3,000 cash)', async () => {
        const payRes = await req('/api/payments', 'POST', {
            customerId: ahmedAliId,
            customerName: 'Ahmed Ali',
            amount: 3000,
            method: 'Cash'
        });
        assert.equal(payRes.status, 201);

        const customer = await getCustomer(ahmedAliId);
        assert.equal(customer.balance, 2500, 'Ahmed Debt should drop to Rs. 2,500 (5,500 - 3,000)');
    });

    await t.test('Phase 2B.6: Ahmed Ali Return Check (Return 1 partial sale suit Rs. 1,500 reverted from debt)', async () => {
        const returnRes = await req('/api/sales', 'POST', {
            type: 'Return',
            originalSaleId: ahmedPartialSaleId,
            shopId: 'shop-1',
            total: 1500,
            customerDetails: {
                customerId: ahmedAliId,
                name: 'Ahmed Ali',
                phone: '03217778899',
                paymentType: 'Pending',
                amountPaid: 0
            },
            items: [{
                id: prodShop1Id,
                name: 'Cotton Suit',
                quantity: 1,
                price: 1500
            }]
        });
        assert.equal(returnRes.status, 201);
        assert.equal(returnRes.data.debtCredited, 1500, 'Debt credited should equal Rs. 1,500');
        assert.equal(returnRes.data.initialPaid, 0, 'Cash refund should be 0 (reverted from customer ledger balance rather than cash)');

        const p1 = await getProduct(prodShop1Id);
        assert.equal(p1.stock, 33, 'Shop 1 Stock should restore from 32 to 33');

        const customer = await getCustomer(ahmedAliId);
        assert.equal(customer.balance, 1000, 'Ahmed Debt should reduce from Rs. 2,500 to Rs. 1,000');
    });

    // --------------------------------------------------------------------------------------------
    // PHASE 3: Inter-Shop Transfer & Shop 2 Operations (Shop 1 -> Shop 2 Movement)
    // --------------------------------------------------------------------------------------------
    await t.test('Phase 3.1: Execute Stock Transfer (Source: Shop 1 -> Destination: Shop 2, Qty: 12 units)', async () => {
        const xferRes = await req('/api/products/transfer', 'POST', {
            sourceProductId: prodShop1Id,
            quantity: 12,
            targetShopId: 'shop-2'
        });
        assert.equal(xferRes.status, 200);

        const p1 = await getProduct(prodShop1Id);
        assert.equal(p1.stock, 21, 'Shop 1 Stock should drop from 33 to 21');

        const shop2Products = await getProductsByShop('shop-2');
        const p2 = shop2Products.find(p => p.name === 'Cotton Suit');
        assert.ok(p2, 'Product should exist in Shop 2');
        assert.equal(p2.stock, 12, 'Shop 2 Stock should equal 12 units');
        prodShop2Id = p2.id;
    });

    await t.test('Phase 3.2: Shop 2 Walk-In Full Sale (2 Suits @ Rs. 1,500 = Rs. 3,000 cash)', async () => {
        const saleRes = await req('/api/sales', 'POST', {
            shopId: 'shop-2',
            total: 3000,
            customerDetails: {
                name: 'Walk-in Customer',
                paymentType: 'Full',
                amountPaid: 3000
            },
            items: [{
                id: prodShop2Id,
                name: 'Cotton Suit',
                quantity: 2,
                price: 1500
            }]
        });
        assert.equal(saleRes.status, 201);
        shop2FullSaleId = saleRes.data.id;
        assert.equal(saleRes.data.initialPaid, 3000, 'Cashbook: +Rs. 3,000');

        const p2 = await getProduct(prodShop2Id);
        assert.equal(p2.stock, 10, 'Shop 2 Stock should drop from 12 to 10');
    });

    await t.test('Phase 3.3: Shop 2 Walk-In Partial Sale (2 Suits @ Rs. 3,000 -> Rs. 1,500 cash / Rs. 1,500 credit)', async () => {
        const saleRes = await req('/api/sales', 'POST', {
            shopId: 'shop-2',
            total: 3000,
            customerDetails: {
                name: 'Shop 2 Regular Buyer',
                phone: '03221112233',
                paymentType: 'Partial',
                amountPaid: 1500
            },
            items: [{
                id: prodShop2Id,
                name: 'Cotton Suit',
                quantity: 2,
                price: 1500
            }]
        });
        assert.equal(saleRes.status, 201);
        shop2PartialSaleId = saleRes.data.id;
        shop2PartialCustId = saleRes.data.customerId;
        assert.equal(saleRes.data.initialPaid, 1500, 'Cashbook: +Rs. 1,500');

        const p2 = await getProduct(prodShop2Id);
        assert.equal(p2.stock, 8, 'Shop 2 Stock should drop from 10 to 8');
    });

    await t.test('Phase 3.4: Shop 2 Walk-In Pending Sale (1 Suit @ Rs. 1,500 credit)', async () => {
        const saleRes = await req('/api/sales', 'POST', {
            shopId: 'shop-2',
            total: 1500,
            customerDetails: {
                name: 'Shop 2 Pending Buyer',
                phone: '03223334455',
                paymentType: 'Pending',
                amountPaid: 0
            },
            items: [{
                id: prodShop2Id,
                name: 'Cotton Suit',
                quantity: 1,
                price: 1500
            }]
        });
        assert.equal(saleRes.status, 201);
        assert.equal(saleRes.data.initialPaid, 0, 'Cashbook: Rs. 0');

        const p2 = await getProduct(prodShop2Id);
        assert.equal(p2.stock, 7, 'Shop 2 Stock should drop from 8 to 7');
    });

    await t.test('Phase 3.5: Shop 2 Settlement & Return (Settle Rs. 1,500 partial bill & Return 1 unit Rs. 1,500 refund)', async () => {
        // Settle Rs. 1,500 partial bill in cash
        const payRes = await req('/api/payments', 'POST', {
            saleId: shop2PartialSaleId,
            customerId: shop2PartialCustId,
            customerName: 'Shop 2 Regular Buyer',
            amount: 1500,
            method: 'Cash'
        });
        assert.equal(payRes.status, 201);

        // Process return for 1 unit with Rs. 1,500 cash refund against shop2FullSaleId
        const returnRes = await req('/api/sales', 'POST', {
            type: 'Return',
            originalSaleId: shop2FullSaleId,
            shopId: 'shop-2',
            total: 1500,
            customerDetails: {
                name: 'Walk-in Customer',
                paymentType: 'Full',
                amountPaid: 1500
            },
            items: [{
                id: prodShop2Id,
                name: 'Cotton Suit',
                quantity: 1,
                price: 1500
            }]
        });
        assert.equal(returnRes.status, 201);
        assert.equal(returnRes.data.initialPaid, 1500, 'Cashbook Refund: -Rs. 1,500');

        const p2 = await getProduct(prodShop2Id);
        assert.equal(p2.stock, 8, 'Shop 2 Stock should restore from 7 to 8 units');
    });

    // --------------------------------------------------------------------------------------------
    // PHASE 4: Transfer & Shop 3 (Terminal Branch)
    // --------------------------------------------------------------------------------------------
    await t.test('Phase 4.1: Transfer to Shop 3 (Source: Shop 2 -> Destination: Shop 3, Qty: 5 units)', async () => {
        const xferRes = await req('/api/products/transfer', 'POST', {
            sourceProductId: prodShop2Id,
            quantity: 5,
            targetShopId: 'shop-3'
        });
        assert.equal(xferRes.status, 200);

        const p2 = await getProduct(prodShop2Id);
        assert.equal(p2.stock, 3, 'Shop 2 Stock should drop from 8 to 3 units');

        const shop3Products = await getProductsByShop('shop-3');
        const p3 = shop3Products.find(p => p.name === 'Cotton Suit');
        assert.ok(p3, 'Product should exist in Shop 3');
        assert.equal(p3.stock, 5, 'Shop 3 Stock should equal 5 units');
        prodShop3Id = p3.id;
    });

    await t.test('Phase 4.2: Shop 3 Full & Partial Sales (1 Full Rs. 1,500, 1 Partial Rs. 500 cash / Rs. 1,000 credit)', async () => {
        // 1 Full sale: 1 unit @ 1,500
        const sale1Res = await req('/api/sales', 'POST', {
            shopId: 'shop-3',
            total: 1500,
            customerDetails: {
                name: 'Walk-in Customer',
                paymentType: 'Full',
                amountPaid: 1500
            },
            items: [{
                id: prodShop3Id,
                name: 'Cotton Suit',
                quantity: 1,
                price: 1500
            }]
        });
        assert.equal(sale1Res.status, 201);
        shop3FullSaleId = sale1Res.data.id;

        // 1 Partial sale: 1 unit @ 1,500 (500 cash / 1,000 credit)
        const sale2Res = await req('/api/sales', 'POST', {
            shopId: 'shop-3',
            total: 1500,
            customerDetails: {
                name: 'Shop 3 Client',
                phone: '03331112233',
                paymentType: 'Partial',
                amountPaid: 500
            },
            items: [{
                id: prodShop3Id,
                name: 'Cotton Suit',
                quantity: 1,
                price: 1500
            }]
        });
        assert.equal(sale2Res.status, 201);
        shop3PartialSaleId = sale2Res.data.id;
        shop3PartialCustId = sale2Res.data.customerId;

        const p3 = await getProduct(prodShop3Id);
        assert.equal(p3.stock, 3, 'Shop 3 Stock should drop from 5 to 3 units');
    });

    await t.test('Phase 4.3: Shop 3 Settle & Return (Settle Rs. 1,000 credit & Return 1 unit with Rs. 1,500 refund)', async () => {
        // Settle Rs. 1,000 credit
        const payRes = await req('/api/payments', 'POST', {
            saleId: shop3PartialSaleId,
            customerId: shop3PartialCustId,
            customerName: 'Shop 3 Client',
            amount: 1000,
            method: 'Cash'
        });
        assert.equal(payRes.status, 201);

        // Return 1 unit against shop3FullSaleId with Rs. 1,500 cash refund
        const returnRes = await req('/api/sales', 'POST', {
            type: 'Return',
            originalSaleId: shop3FullSaleId,
            shopId: 'shop-3',
            total: 1500,
            customerDetails: {
                name: 'Walk-in Customer',
                paymentType: 'Full',
                amountPaid: 1500
            },
            items: [{
                id: prodShop3Id,
                name: 'Cotton Suit',
                quantity: 1,
                price: 1500
            }]
        });
        assert.equal(returnRes.status, 201);

        const p3 = await getProduct(prodShop3Id);
        assert.equal(p3.stock, 4, 'Ending Shop 3 Stock should restore from 3 to 4 units');
    });

    // --------------------------------------------------------------------------------------------
    // PHASE 5: Store Expenses (Drawer Outflows)
    // --------------------------------------------------------------------------------------------
    await t.test('Phase 5: Store Expenses (Shop 1 Tea: -500, Shop 2 Rent: -2,000, Drawings: -1,000)', async () => {
        const exp1 = await req('/api/expenses', 'POST', {
            title: 'Shop 1 Tea / Supplies',
            category: 'Supplies',
            amount: 500,
            shopId: 'shop-1',
            description: 'Team tea and refreshments'
        });
        assert.equal(exp1.status, 201);

        const exp2 = await req('/api/expenses', 'POST', {
            title: 'Shop 2 Rent / Utilities',
            category: 'Rent',
            amount: 2000,
            shopId: 'shop-2',
            description: 'Shop 2 Rent contribution'
        });
        assert.equal(exp2.status, 201);

        const exp3 = await req('/api/expenses', 'POST', {
            title: 'Owner Drawings',
            category: 'Drawings',
            amount: 1000,
            shopId: 'all',
            description: 'Personal drawings from drawer'
        });
        assert.equal(exp3.status, 201);
    });

    // --------------------------------------------------------------------------------------------
    // CENTRAL CASH DRAWER AUDIT LEDGER RECONCILIATION
    // --------------------------------------------------------------------------------------------
    await t.test('Central Cash Drawer Audit Ledger: Net Variance Exactly Equals +Rs. 500', async () => {
        // Fetch all financial records
        const allSales = (await req('/api/sales')).data;
        const allCustPayments = (await req('/api/payments')).data;
        const allSuppPayments = (await req('/api/supplier-payments')).data;
        const allExpenses = (await req('/api/expenses')).data;

        // Phase 1: Supplier Payment Payout = -10,000
        const p1SupplierOutflow = allSuppPayments
            .filter(p => !p.isVoided)
            .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        assert.equal(p1SupplierOutflow, 10000, 'Phase 1 Supplier Payout should equal Rs. 10,000');

        // Total Sales Cash Collected (initialPaid on Sale types)
        const regularSales = allSales.filter(s => s.type === 'Sale' && !s.isVoided);
        const totalSalesCashIn = regularSales.reduce((sum, s) => sum + (Number(s.initialPaid) || 0), 0);

        // Total Return Cash Refunds (initialPaid on Return types)
        const returnSales = allSales.filter(s => s.type === 'Return' && !s.isVoided);
        const totalReturnCashOut = returnSales.reduce((sum, s) => sum + (Number(s.initialPaid) || 0), 0);

        // Total Customer Settlement Payments
        const totalCustSettlements = allCustPayments
            .filter(p => !p.isVoided)
            .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

        // Total Expenses
        const totalExpenses = allExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        assert.equal(totalExpenses, 3500, 'Phase 5 Store Expenses should equal Rs. 3,500');

        // Net Cash Calculation:
        // Cash Inflows: Sales counter cash (initialPaid) + Customer Debt Settlements
        // Cash Outflows: Supplier payments + Sales Return cash refunds + Store Expenses
        const totalInflows = totalSalesCashIn + totalCustSettlements;
        const totalOutflows = p1SupplierOutflow + totalReturnCashOut + totalExpenses;
        const netCashChange = totalInflows - totalOutflows;

        console.log(`\n========================================================================`);
        console.log(`📊 CENTRAL CASH DRAWER AUDIT LEDGER REPORT`);
        console.log(`========================================================================`);
        console.log(`• Phase 1: Supplier Payment Payout  : -Rs. ${p1SupplierOutflow.toLocaleString()}`);
        console.log(`• Total Sales Counter Cash Inflow   : +Rs. ${totalSalesCashIn.toLocaleString()}`);
        console.log(`• Total Customer Khata Settlements  : +Rs. ${totalCustSettlements.toLocaleString()}`);
        console.log(`• Total Sales Return Cash Refunds   : -Rs. ${totalReturnCashOut.toLocaleString()}`);
        console.log(`• Phase 5: Store Expenses & Drawings: -Rs. ${totalExpenses.toLocaleString()}`);
        console.log(`------------------------------------------------------------------------`);
        console.log(`• TOTAL CASH INFLOWS               : +Rs. ${totalInflows.toLocaleString()}`);
        console.log(`• TOTAL CASH OUTFLOWS              : -Rs. ${totalOutflows.toLocaleString()}`);
        console.log(`------------------------------------------------------------------------`);
        console.log(`⭐ NET CASH CHANGE IN DRAWER        : +Rs. ${netCashChange.toLocaleString()} PKR`);
        console.log(`========================================================================\n`);

        assert.equal(netCashChange, 500, 'Net Cash Change in shared drawer must be exactly +Rs. 500 PKR');
    });
});
