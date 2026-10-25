const test = require('node:test');
const assert = require('node:assert/strict');
const { roundMoney } = require('../../backend/utils.js');

test('Unit Test: FIFO Purchase Debt Allocation Algorithm', async (t) => {
    function allocateFifo(openPurchases, paymentAmount) {
        // Sort chronologically by createdAt / date
        const sorted = [...openPurchases].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
        let unallocated = roundMoney(paymentAmount);
        const updates = [];

        for (const pur of sorted) {
            if (unallocated <= 0) break;
            const currentRemaining = pur.remainingAmount != null ? pur.remainingAmount : (pur.totalAmount - (pur.paidAmount || 0));
            const alloc = Math.min(unallocated, currentRemaining);
            const newPaid = roundMoney((pur.paidAmount || 0) + alloc);
            const newRemaining = roundMoney(Math.max(0, pur.totalAmount - newPaid));

            updates.push({
                purchaseId: pur.id,
                allocated: alloc,
                newPaid,
                newRemaining
            });
            unallocated = roundMoney(unallocated - alloc);
        }

        return { updates, unallocated };
    }

    await t.test('single purchase: clears remaining balance exactly', () => {
        const purchases = [
            { id: 'p1', totalAmount: 50000, paidAmount: 0, remainingAmount: 50000, createdAt: 1000 }
        ];
        const res = allocateFifo(purchases, 50000);
        assert.equal(res.updates.length, 1);
        assert.equal(res.updates[0].purchaseId, 'p1');
        assert.equal(res.updates[0].allocated, 50000);
        assert.equal(res.updates[0].newPaid, 50000);
        assert.equal(res.updates[0].newRemaining, 0);
        assert.equal(res.unallocated, 0);
    });

    await t.test('multi-purchase FIFO: clears oldest purchase first, rolls remainder to next', () => {
        const purchases = [
            { id: 'p1', totalAmount: 30000, paidAmount: 0, remainingAmount: 30000, createdAt: 1000 },
            { id: 'p2', totalAmount: 40000, paidAmount: 10000, remainingAmount: 30000, createdAt: 2000 }
        ];
        // Payment of 45,000 should clear p1 completely (30,000) and allocate 15,000 to p2
        const res = allocateFifo(purchases, 45000);
        assert.equal(res.updates.length, 2);
        
        assert.equal(res.updates[0].purchaseId, 'p1');
        assert.equal(res.updates[0].allocated, 30000);
        assert.equal(res.updates[0].newRemaining, 0);

        assert.equal(res.updates[1].purchaseId, 'p2');
        assert.equal(res.updates[1].allocated, 15000);
        assert.equal(res.updates[1].newPaid, 25000);
        assert.equal(res.updates[1].newRemaining, 15000);
        assert.equal(res.unallocated, 0);
    });

    await t.test('multi-purchase FIFO: strictly maintains chronological order even if array is unsorted', () => {
        const purchases = [
            { id: 'p2', totalAmount: 50000, paidAmount: 0, remainingAmount: 50000, createdAt: 2000 },
            { id: 'p1', totalAmount: 20000, paidAmount: 0, remainingAmount: 20000, createdAt: 1000 }
        ];
        const res = allocateFifo(purchases, 25000);
        assert.equal(res.updates[0].purchaseId, 'p1');
        assert.equal(res.updates[0].allocated, 20000);
        assert.equal(res.updates[1].purchaseId, 'p2');
        assert.equal(res.updates[1].allocated, 5000);
    });
});
