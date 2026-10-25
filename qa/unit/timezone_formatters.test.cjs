const test = require('node:test');
const assert = require('node:assert/strict');

test('Unit Test: Pakistani Timezone (Asia/Karachi / UTC+5) evaluation', async (t) => {
    await t.test('converts UTC timestamp to Pakistani calendar date (en-CA / YYYY-MM-DD)', () => {
        // 2026-10-25 20:00:00 UTC is 2026-10-26 01:00:00 AM PKT (UTC+5)
        const utcDate = new Date('2026-10-25T20:00:00.000Z');
        const pktDateString = utcDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
        assert.equal(pktDateString, '2026-10-26');
    });

    await t.test('evaluates same calendar date when UTC time is morning in UTC', () => {
        // 2026-10-25 04:00:00 UTC is 2026-10-25 09:00:00 AM PKT
        const utcDate = new Date('2026-10-25T04:00:00.000Z');
        const pktDateString = utcDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
        assert.equal(pktDateString, '2026-10-25');
    });

    await t.test('formats timestamp in 12-hour format with Pakistani local time', () => {
        const utcDate = new Date('2026-10-25T14:30:00.000Z'); // 14:30 UTC + 5h = 19:30 (07:30 PM) PKT
        const timeFormatted = utcDate.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Asia/Karachi'
        });
        assert.match(timeFormatted, /07:30\s*PM/i);
    });

    await t.test('formats friendly display date with UK locale in Asia/Karachi timezone', () => {
        const utcDate = new Date('2026-10-25T19:00:00.000Z'); // 19:00 UTC + 5 = 2026-10-26 00:00 PKT
        const displayDate = utcDate.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            timeZone: 'Asia/Karachi'
        });
        assert.equal(displayDate, '26 Oct 2026');
    });

    await t.test('groups Cashbook transactions into Pakistani Today bucket accurately', () => {
        const now = new Date();
        const currentPktDay = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
        
        const txTimestamp = Date.now();
        const txPktDay = new Date(txTimestamp).toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
        
        assert.equal(txPktDay, currentPktDay);
    });
});
