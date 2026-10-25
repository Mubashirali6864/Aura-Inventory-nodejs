const test = require('node:test');
const assert = require('node:assert/strict');
const { roundMoney } = require('../../backend/utils.js');

test('Unit Test: roundMoney financial precision', async (t) => {
    await t.test('rounds standard positive currency decimals to 2 places', () => {
        assert.equal(roundMoney(10.555), 10.56);
        assert.equal(roundMoney(10.554), 10.55);
        assert.equal(roundMoney(99.99), 99.99);
        assert.equal(roundMoney(100), 100);
    });

    await t.test('resolves JavaScript IEEE-754 floating point arithmetic inaccuracies', () => {
        const floatSum = 0.1 + 0.2; // 0.30000000000000004
        assert.equal(roundMoney(floatSum), 0.3);

        const discountCalc = 19.99 * 3; // 59.970000000000006
        assert.equal(roundMoney(discountCalc), 59.97);
    });

    await t.test('parses and standardizes valid string numbers', () => {
        assert.equal(roundMoney('12500.50'), 12500.5);
        assert.equal(roundMoney('450.758'), 450.76);
        assert.equal(roundMoney('0'), 0);
    });

    await t.test('safely handles invalid, null, undefined and non-numeric inputs', () => {
        assert.equal(roundMoney(null), 0);
        assert.equal(roundMoney(undefined), 0);
        assert.equal(roundMoney(''), 0);
        assert.equal(roundMoney('abc'), 0);
        assert.equal(roundMoney(NaN), 0);
    });

    await t.test('correctly handles negative numbers for balances and debt calculations', () => {
        assert.equal(roundMoney(-50.556), -50.56);
        assert.equal(roundMoney(-50.554), -50.55);
        assert.equal(roundMoney(-100.20), -100.2);
    });
});
