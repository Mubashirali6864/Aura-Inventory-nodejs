const test = require('node:test');
const assert = require('node:assert/strict');

test('Unit Test: Business Validation Guards & Integrity Rules', async (t) => {
    // 1. Product Name Validation
    function validateProductName(name) {
        if (!name || typeof name !== 'string' || !name.trim()) {
            return { valid: false, error: 'Product name is required.' };
        }
        return { valid: true };
    }

    await t.test('Product Name Guard: blocks empty and whitespace names', () => {
        assert.equal(validateProductName('').valid, false);
        assert.equal(validateProductName('   ').valid, false);
        assert.equal(validateProductName(null).valid, false);
        assert.equal(validateProductName(undefined).valid, false);
        assert.equal(validateProductName('Executive Desk').valid, true);
    });

    // 2. Stock and Price non-negativity
    function validateStockAndPrice(stock, purchasePrice) {
        if (stock !== undefined && (isNaN(Number(stock)) || Number(stock) < 0)) {
            return { valid: false, error: 'Stock must be a non-negative number.' };
        }
        if (purchasePrice !== undefined && (isNaN(Number(purchasePrice)) || Number(purchasePrice) < 0)) {
            return { valid: false, error: 'Prices cannot be negative numbers.' };
        }
        return { valid: true };
    }

    await t.test('Stock & Price Guards: rejects negative values', () => {
        assert.equal(validateStockAndPrice(-1, 1000).valid, false);
        assert.equal(validateStockAndPrice(5, -500).valid, false);
        assert.equal(validateStockAndPrice(0, 0).valid, true);
        assert.equal(validateStockAndPrice(10.5, 2500.5).valid, true);
    });

    // 3. Walk-in Customer Credit Prohibition
    function validateCreditCustomer(customerName, due, paymentType) {
        const isCreditSale = (due > 0) || (paymentType === 'Pending' || paymentType === 'Partial');
        const isWalkIn = (!customerName || customerName.trim().toLowerCase() === 'walk-in customer');
        if (isCreditSale && isWalkIn) {
            return { valid: false, error: 'Credit sales cannot be assigned to Walk-in Customer. Please provide or create a valid customer profile.' };
        }
        return { valid: true };
    }

    await t.test('Credit Customer Guard: strictly forbids Walk-in Customer for credit or partial sales', () => {
        assert.equal(validateCreditCustomer('Walk-in Customer', 5000, 'Partial').valid, false);
        assert.equal(validateCreditCustomer('walk-in customer', 1000, 'Pending').valid, false);
        assert.equal(validateCreditCustomer('', 2000, 'Partial').valid, false);
        assert.equal(validateCreditCustomer('Walk-in Customer', 0, 'Full').valid, true);
        assert.equal(validateCreditCustomer('Haji Rasheed', 50000, 'Partial').valid, true);
    });

    // 4. Inter-Shop Self-Transfer Guard
    function validateTransfer(fromShop, toShop, quantity, currentStock) {
        if (fromShop === toShop) {
            return { valid: false, error: 'Source and destination shops must be different.' };
        }
        const qty = Number(quantity);
        if (isNaN(qty) || qty <= 0) {
            return { valid: false, error: 'Quantity must be a positive number.' };
        }
        if (qty > currentStock) {
            return { valid: false, error: 'Insufficient stock in source shop for transfer.' };
        }
        return { valid: true };
    }

    await t.test('Stock Transfer Guard: blocks self-transfers, negative qty, and overdrafts', () => {
        assert.equal(validateTransfer('shop-1', 'shop-1', 5, 20).valid, false);
        assert.equal(validateTransfer('shop-1', 'shop-2', -3, 20).valid, false);
        assert.equal(validateTransfer('shop-1', 'shop-2', 25, 20).valid, false);
        assert.equal(validateTransfer('shop-1', 'shop-2', 5, 20).valid, true);
        assert.equal(validateTransfer('shop-2', 'shop-3', 20, 20).valid, true);
    });

    // 5. Supplier Payment Overpay & Zero-Balance Guard
    function validateSupplierPayment(amount, supplierBalance) {
        const amt = Number(amount);
        if (isNaN(amt) || amt <= 0) {
            return { valid: false, error: 'Payment amount must be a positive number.' };
        }
        if (supplierBalance <= 0) {
            return { valid: false, error: 'Cannot record payment: Supplier has no pending dues (balance is 0).' };
        }
        if (amt > supplierBalance) {
            return { valid: false, error: 'Payment amount cannot exceed outstanding supplier dues.' };
        }
        return { valid: true };
    }

    await t.test('Supplier Payment Guard: locks payment when balance <= 0 and blocks overpaying', () => {
        assert.equal(validateSupplierPayment(5000, 0).valid, false);
        assert.equal(validateSupplierPayment(5000, -100).valid, false);
        assert.equal(validateSupplierPayment(60000, 50000).valid, false);
        assert.equal(validateSupplierPayment(50000, 50000).valid, true);
        assert.equal(validateSupplierPayment(20000, 50000).valid, true);
    });
});
