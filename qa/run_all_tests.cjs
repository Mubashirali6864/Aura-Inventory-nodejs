/**
 * ============================================================================================
 * AURA POS - UNIFIED MASTER TEST RUNNER (UNIT + INTEGRATION + RECOVERY)
 * ============================================================================================
 * Runs all modular Unit and Integration test suites sequentially in isolated environments.
 * Generates an executive testing summary with 100% zero leftover scratch files.
 * ============================================================================================
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const testSuites = [
    // Layer 1: Unit Test Suites
    { name: 'Unit: stripUndefined (Recursive DAO Sanitization)', file: 'qa/unit/stripUndefined.test.cjs', type: 'Unit' },
    { name: 'Unit: roundMoney (Financial Currency Precision)', file: 'qa/unit/roundMoney.test.cjs', type: 'Unit' },
    { name: 'Unit: Pakistani Timezone (Asia/Karachi / UTC+5)', file: 'qa/unit/timezone_formatters.test.cjs', type: 'Unit' },
    { name: 'Unit: Validation Guards & Business Rules', file: 'qa/unit/validation_guards.test.cjs', type: 'Unit' },
    { name: 'Unit: Sales Return & Capped Refund Logic', file: 'qa/unit/return_financials.test.cjs', type: 'Unit' },
    { name: 'Unit: FIFO Purchase Debt Allocation Algorithm', file: 'qa/unit/fifo_allocation.test.cjs', type: 'Unit' },

    // Layer 2: Modular Integration Test Suites
    { name: 'Integration: Multi-Shop Parity & 6-Way Transfers', file: 'qa/integration/inventory_and_transfers.test.cjs', type: 'Integration' },
    { name: 'Integration: Sales Counter, Credit Ledger & Returns', file: 'qa/integration/sales_and_credit.test.cjs', type: 'Integration' },
    { name: 'Integration: Supplier Procurement & FIFO Payments', file: 'qa/integration/procurement_and_suppliers.test.cjs', type: 'Integration' },
    { name: 'Integration: Cashbook Reconciliation & Expenses', file: 'qa/integration/cashbook_and_expenses.test.cjs', type: 'Integration' },
    { name: 'Integration: ACID Multi-Table Void & 1-Click Undo', file: 'qa/integration/acid_void_and_undo.test.cjs', type: 'Integration' },

    // Layer 3: End-to-End Master All-Angles System Suite
    { name: 'E2E Master: 7-Angle Operational Verification Suite', file: 'qa/master_cross_angle_suite.test.cjs', type: 'E2E' }
];

function runTest(suite) {
    return new Promise((resolve) => {
        const startTime = Date.now();
        const proc = spawn(process.execPath, [suite.file], {
            cwd: path.resolve(__dirname, '..'),
            env: { ...process.env, APP_ENV: 'test' }
        });

        let output = '';
        proc.stdout.on('data', chunk => output += chunk);
        proc.stderr.on('data', chunk => output += chunk);

        proc.on('close', (code) => {
            const durationMs = Date.now() - startTime;
            // Parse assertion passes if available
            const passMatches = output.match(/ok \d+|\[PASS\]/g) || [];
            const failMatches = output.match(/not ok \d+|\[FAIL\]/g) || [];
            
            resolve({
                name: suite.name,
                type: suite.type,
                file: suite.file,
                success: code === 0,
                durationMs,
                assertionsPassed: passMatches.length,
                assertionsFailed: failMatches.length,
                output
            });
        });
    });
}

async function main() {
    console.log(`\n========================================================================================`);
    console.log(`🚀 AURA POS - EXECUTING COMPLETE TEST SUITE (UNIT + INTEGRATION + E2E)`);
    console.log(`========================================================================================\n`);

    const results = [];
    let totalPassed = 0;
    let totalFailed = 0;
    let totalAssertions = 0;

    for (const suite of testSuites) {
        process.stdout.write(`  ⏳ Running ${suite.type.padEnd(11)}: ${suite.name} ... `);
        const res = await runTest(suite);
        results.push(res);
        if (res.success) {
            totalPassed++;
            console.log(`✅ PASS (${res.durationMs}ms, ${res.assertionsPassed} checks)`);
        } else {
            totalFailed++;
            console.log(`❌ FAIL (${res.durationMs}ms)`);
            console.error(res.output);
        }
        totalAssertions += (res.assertionsPassed + res.assertionsFailed);
    }

    console.log(`\n========================================================================================`);
    console.log(`📊 MASTER TEST EXECUTION SUMMARY`);
    console.log(`========================================================================================`);
    console.log(`Total Test Suites   : ${results.length}`);
    console.log(`Suites Passed       : ${totalPassed} (${Math.round((totalPassed / results.length) * 100)}%)`);
    console.log(`Suites Failed       : ${totalFailed}`);
    console.log(`Total Assertions    : ${totalAssertions}`);
    console.log(`----------------------------------------------------------------------------------------`);
    
    // Group by layer
    const layers = ['Unit', 'Integration', 'E2E'];
    layers.forEach(layer => {
        const layerSuites = results.filter(r => r.type === layer);
        const passed = layerSuites.filter(r => r.success).length;
        const total = layerSuites.length;
        const totalTime = layerSuites.reduce((sum, r) => sum + r.durationMs, 0);
        console.log(`• ${layer.padEnd(12)}: ${passed}/${total} Suites Passed (${totalTime}ms)`);
    });
    console.log(`========================================================================================\n`);

    // Workspace hygiene: clean any leftover test folders
    const qaDir = __dirname;
    try {
        const entries = fs.readdirSync(qaDir);
        for (const entry of entries) {
            if (entry.startsWith('.tmp_test_env_') || entry === 'test_isolated_env') {
                fs.rmSync(path.join(qaDir, entry), { recursive: true, force: true });
            }
        }
    } catch (_) {}

    process.exit(totalFailed > 0 ? 1 : 0);
}

main().catch(err => {
    console.error('Test Runner Failed:', err);
    process.exit(1);
});
