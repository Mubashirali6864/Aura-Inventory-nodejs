const test = require('node:test');
const assert = require('node:assert/strict');
const { roundMoney } = require('../../backend/utils.js');

test('Unit Test: Return Financials & Capped Refund Logic', async (t) => {
    // Return financial settlement algorithm
    function calculateReturnFinancials(returnTotal, originalInitialPaid, originalRemainingBalance) {
        // Cash refund cannot exceed initial paid cash collected at counter
        const cashRefund = roundMoney(Math.min(returnTotal, originalInitialPaid));
        // Remaining return amount credits customer debt / outstanding balance
        const debtCredited = roundMoney(Math.max(0, returnTotal - cashRefund));
        // New remaining balance of original sale
        const newSaleRemaining = roundMoney(Math.max(0, originalRemainingBalance - debtCredited));
        
        return { cashRefund, debtCredited, newSaleRemaining };
    }

    await t.test('Full Cash Sale Return: 100% cash refund, 0 debt credit', () => {
        // Sale of 50,000, 50,000 paid upfront, 0 due
        const result = calculateReturnFinancials(50000, 50000, 0);
        assert.equal(result.cashRefund, 50000);
        assert.equal(result.debtCredited, 0);
        assert.equal(result.newSaleRemaining, 0);
    });

    await t.test('Partial Credit Sale Return: cash refund capped to collected cash, rest credits debt', () => {
        // Sale of 55,000 (20,000 paid cash, 35,000 due). Customer returns entire 55,000 invoice.
        const result = calculateReturnFinancials(55000, 20000, 35000);
        assert.equal(result.cashRefund, 20000);
        assert.equal(result.debtCredited, 35000);
        assert.equal(result.newSaleRemaining, 0);
    });

    await t.test('Partial Return on Credit Sale: partial item return smaller than collected cash', () => {
        // Sale of 55,000 (20,000 paid, 35,000 due). Customer returns 1 item worth 15,000.
        // Since 15,000 <= 20,000, entire 15,000 is refunded in cash.
        const result = calculateReturnFinancials(15000, 20000, 35000);
        assert.equal(result.cashRefund, 15000);
        assert.equal(result.debtCredited, 0);
        assert.equal(result.newSaleRemaining, 35000);
    });

    await t.test('Partial Return on Credit Sale: item return larger than collected cash', () => {
        // Sale of 100,000 (30,000 paid, 70,000 due). Customer returns item worth 50,000.
        // Cash refund is capped to 30,000; the remaining 20,000 credits pending debt.
        const result = calculateReturnFinancials(50000, 30000, 70000);
        assert.equal(result.cashRefund, 30000);
        assert.equal(result.debtCredited, 20000);
        assert.equal(result.newSaleRemaining, 50000);
    });

    await t.test('Zero-Down Credit Sale Return: 0 cash refund, 100% debt credited', () => {
        // Sale of 80,000 (0 paid upfront, 80,000 due). Customer returns item worth 40,000.
        const result = calculateReturnFinancials(40000, 0, 80000);
        assert.equal(result.cashRefund, 0);
        assert.equal(result.debtCredited, 40000);
        assert.equal(result.newSaleRemaining, 40000);
    });
});
