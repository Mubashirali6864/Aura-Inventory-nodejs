const test = require('node:test');
const assert = require('node:assert/strict');
const { stripUndefined } = require('../../backend/utils.js');

test('Unit Test: stripUndefined utility', async (t) => {
    await t.test('removes top-level undefined properties', () => {
        const input = { a: 1, b: undefined, c: 'hello' };
        const result = stripUndefined(input);
        assert.deepEqual(result, { a: 1, c: 'hello' });
        assert.equal('b' in result, false);
    });

    await t.test('removes deeply nested undefined properties', () => {
        const input = {
            id: '123',
            customerDetails: {
                name: 'Tariq',
                phone: undefined,
                address: {
                    city: 'Lahore',
                    postalCode: undefined
                }
            }
        };
        const result = stripUndefined(input);
        assert.deepEqual(result, {
            id: '123',
            customerDetails: {
                name: 'Tariq',
                address: {
                    city: 'Lahore'
                }
            }
        });
        assert.equal('phone' in result.customerDetails, false);
        assert.equal('postalCode' in result.customerDetails.address, false);
    });

    await t.test('preserves null, false, 0, and empty strings', () => {
        const input = {
            a: null,
            b: false,
            c: 0,
            d: '',
            e: undefined
        };
        const result = stripUndefined(input);
        assert.deepEqual(result, {
            a: null,
            b: false,
            c: 0,
            d: ''
        });
        assert.equal('e' in result, false);
    });

    await t.test('cleans objects inside arrays', () => {
        const input = {
            items: [
                { id: '1', name: 'Desk', discount: undefined },
                { id: '2', name: 'Chair', note: undefined, price: 5000 }
            ]
        };
        const result = stripUndefined(input);
        assert.deepEqual(result, {
            items: [
                { id: '1', name: 'Desk' },
                { id: '2', name: 'Chair', price: 5000 }
            ]
        });
    });

    await t.test('handles non-object and falsy inputs cleanly without throwing', () => {
        assert.equal(stripUndefined(null), null);
        assert.equal(stripUndefined(undefined), undefined);
        assert.equal(stripUndefined('text'), 'text');
        assert.equal(stripUndefined(42), 42);
        assert.equal(stripUndefined(true), true);
    });
});
