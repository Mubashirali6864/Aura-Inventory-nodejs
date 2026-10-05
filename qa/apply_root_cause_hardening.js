const fs = require('fs');
const path = require('path');

console.log('--- Applying Root Cause Hardening to Backend & Frontend ---');

// 1. Update frontend dist bundle
const distPath = path.join(__dirname, '../dist/assets/index-BQlSbgAO.js');
let distContent = fs.readFileSync(distPath, 'utf8');

const oldDistTarget = 'te_sup.filter(he=>!he.note||!he.note.startsWith("Immediate payment for Purchase")).map';
const newDistTarget = 'te_sup.filter(he=>!he.purchaseId&&!he.isImmediate&&(!he.note||!he.note.startsWith("Immediate payment for Purchase #"))).map';

if (distContent.includes(oldDistTarget)) {
    distContent = distContent.replace(oldDistTarget, newDistTarget);
    fs.writeFileSync(distPath, distContent, 'utf8');
    console.log('[Frontend] Cashbook deduplication upgraded to use stable reference ID (purchaseId / isImmediate).');
} else if (distContent.includes(newDistTarget)) {
    console.log('[Frontend] Cashbook deduplication already upgraded.');
} else {
    console.warn('[Frontend] Warning: Target filter pattern not found in dist bundle.');
}

// 2. Update backend/index.js
const backendPath = path.join(__dirname, '../backend/index.js');
let backendContent = fs.readFileSync(backendPath, 'utf8');

// A. Harden PUT /api/customers/:id to protect ledger balance
const oldPutCustomer = `app.put('/api/customers/:id', async (req, res) => {
    try {
        const id = req.params.id;
        await update('customers', id, stripUndefined(req.body));
        res.json({ id, ...req.body });
    } catch (error) { res.status(500).json({ error: error.message }); }
});`;

const newPutCustomer = `app.put('/api/customers/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const existing = await getById('customers', id);
        if (!existing) {
            return res.status(404).json({ error: 'Customer not found.' });
        }
        // Protect financial ledger fields from direct manual tampering
        const { balance, totalPurchased, totalPaid, ...safeUpdates } = req.body || {};
        await update('customers', id, stripUndefined(safeUpdates));
        const updated = await getById('customers', id);
        res.json(updated);
    } catch (error) { res.status(500).json({ error: error.message }); }
});`;

// Normalize line endings for replacement
const normalizeLf = (s) => s.replace(/\r\n/g, '\n');

if (normalizeLf(backendContent).includes(normalizeLf(oldPutCustomer))) {
    backendContent = normalizeLf(backendContent).replace(normalizeLf(oldPutCustomer), normalizeLf(newPutCustomer));
    console.log('[Backend] Hardened PUT /api/customers/:id against arbitrary ledger tampering.');
}

// B. Harden PUT /api/suppliers/:id to protect ledger balance
const oldPutSupplier = `app.put('/api/suppliers/:id', async (req, res) => {
    try {
        const id = req.params.id;
        await update('suppliers', id, req.body);
        res.json({ id, ...req.body });
    } catch (error) { res.status(500).json({ error: error.message }); }
});`;

const newPutSupplier = `app.put('/api/suppliers/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const existing = await getById('suppliers', id);
        if (!existing) {
            return res.status(404).json({ error: 'Supplier not found.' });
        }
        // Protect financial ledger fields from direct manual tampering
        const { balance, totalPurchased, totalPaid, ...safeUpdates } = req.body || {};
        await update('suppliers', id, stripUndefined(safeUpdates));
        const updated = await getById('suppliers', id);
        res.json(updated);
    } catch (error) { res.status(500).json({ error: error.message }); }
});`;

if (normalizeLf(backendContent).includes(normalizeLf(oldPutSupplier))) {
    backendContent = normalizeLf(backendContent).replace(normalizeLf(oldPutSupplier), normalizeLf(newPutSupplier));
    console.log('[Backend] Hardened PUT /api/suppliers/:id against arbitrary ledger tampering.');
}

// C. Harden POST /api/sales against Quotation casing variations and edge cases
const oldSalesCheck = `        // Validation: If bill is on partial or pending, customer name and phone are strictly required
        if (type !== 'Quotation' && (paymentType === 'Partial' || paymentType === 'Pending' || remainingBalance > 0)) {`;

const newSalesCheck = `        const rawType = (type || 'Sale').trim();
        const normalizedType = rawType.toLowerCase();
        const isQuotation = normalizedType === 'quotation';
        const isReturn = normalizedType === 'return';
        const effectiveType = isQuotation ? 'Quotation' : (isReturn ? 'Return' : 'Sale');

        // Validation: If bill is on partial or pending, customer name and phone are strictly required
        if (!isQuotation && (paymentType === 'Partial' || paymentType === 'Pending' || remainingBalance > 0)) {`;

if (normalizeLf(backendContent).includes(normalizeLf(oldSalesCheck))) {
    backendContent = normalizeLf(backendContent).replace(normalizeLf(oldSalesCheck), normalizeLf(newSalesCheck));
    console.log('[Backend] Hardened POST /api/sales quotation type case-insensitivity.');
}

// Update sales stock pre-validation
const oldStockPreCheck = `            if (product && (type === 'Sale' || !type) && (product.stock || 0) < item.quantity) {`;
const newStockPreCheck = `            if (product && (!isQuotation && !isReturn) && (product.stock || 0) < item.quantity) {`;

if (normalizeLf(backendContent).includes(normalizeLf(oldStockPreCheck))) {
    backendContent = normalizeLf(backendContent).replace(normalizeLf(oldStockPreCheck), normalizeLf(newStockPreCheck));
    console.log('[Backend] Updated sales stock pre-validation to use normalized type.');
}

// Update sale object type assignment
const oldSaleType = `            id: saleId, invoiceNumber, type: type || 'Sale', total: parsedTotal, createdAt: date, date: date,`;
const newSaleType = `            id: saleId, invoiceNumber, type: effectiveType, total: parsedTotal, createdAt: date, date: date,`;

if (normalizeLf(backendContent).includes(normalizeLf(oldSaleType))) {
    backendContent = normalizeLf(backendContent).replace(normalizeLf(oldSaleType), normalizeLf(newSaleType));
    console.log('[Backend] Updated sale object to store normalized effectiveType.');
}

// Update physical stock inventory update
const oldStockUpdate = `        // Update physical product inventory only for actual Sales or Returns (never for Quotations)
        if (type === 'Sale' || type === 'Return' || !type) {
            for (const item of items) {
                const pid = item.id || item.productId;
                if (!pid) continue;
                const product = await getById('products', pid);
                if (product) {
                    const stockChange = type === 'Return' ? item.quantity : -item.quantity;
                    await update('products', pid, { stock: (product.stock || 0) + stockChange });
                }
            }
        }`;

const newStockUpdate = `        // Update physical product inventory only for actual Sales or Returns (never for Quotations)
        if (!isQuotation) {
            for (const item of items) {
                const pid = item.id || item.productId;
                if (!pid) continue;
                const product = await getById('products', pid);
                if (product) {
                    const stockChange = isReturn ? item.quantity : -item.quantity;
                    await update('products', pid, { stock: (product.stock || 0) + stockChange });
                }
            }
        }`;

if (normalizeLf(backendContent).includes(normalizeLf(oldStockUpdate))) {
    backendContent = normalizeLf(backendContent).replace(normalizeLf(oldStockUpdate), normalizeLf(newStockUpdate));
    console.log('[Backend] Hardened inventory stock change logic for quotations and returns.');
}

// Update customer balance update condition
const oldCustUpdate = `        // Only update EXISTING customers for confirmed Sales and Returns (never for Quotations).
        if (type !== 'Quotation' && cName && cName !== 'Walk-in Customer' && cName !== 'Walk-in' && customerDetails.customerId) {`;

const newCustUpdate = `        // Only update EXISTING customers for confirmed Sales and Returns (never for Quotations).
        if (!isQuotation && cName && cName !== 'Walk-in Customer' && cName !== 'Walk-in' && customerDetails.customerId) {`;

if (normalizeLf(backendContent).includes(normalizeLf(oldCustUpdate))) {
    backendContent = normalizeLf(backendContent).replace(normalizeLf(oldCustUpdate), normalizeLf(newCustUpdate));
    console.log('[Backend] Hardened customer balance update condition for quotations.');
}

// D. Harden POST /api/purchases to:
// 1) Validate paidAmount <= totalAmount & >= 0
// 2) Validate non-empty items
// 3) Store purchaseId and isImmediate: true on supplierPayments
const oldPurchasesRoute = `app.post('/api/purchases', async (req, res) => {
    try {
        const { supplierId, items, paidAmount, shopId, dueDate } = req.body;
        const purchaseId = generateId();
        const { date: providedDate } = req.body;
        const date = providedDate || Date.now();
        const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

        const supplier = await getById('suppliers', supplierId);
        const supplierName = supplier?.name || 'Unknown';

        const purchase = {
            id: purchaseId, supplierId, supplierName, totalAmount, paidAmount, remainingAmount: totalAmount - paidAmount, createdAt: date, date: date, shopId, items
        };
        await insert('purchases', purchaseId, purchase);

        for (const item of items) {
            const product = await getById('products', item.productId);
            if (product) {
                await update('products', item.productId, {
                    stock: (product.stock || 0) + item.quantity, purchasePrice: item.costPrice, supplierId, supplierName
                });
            }
        }

        if (supplier) {
            await update('suppliers', supplierId, {
                totalPurchased: (supplier.totalPurchased || 0) + totalAmount,
                balance: (supplier.balance || 0) + totalAmount,
                ...(dueDate ? { nextPaymentDate: dueDate } : {})
            });
        }

        if (paidAmount > 0) {
            const paymentId = generateId();
            await insert('supplierPayments', paymentId, {
                id: paymentId, supplierId, amount: paidAmount, createdAt: date, method: 'Cash', note: \`Immediate payment for Purchase #\${purchaseId}\`
            });
            if (supplier) {
                await update('suppliers', supplierId, {
                    balance: (supplier.balance || 0) + totalAmount - paidAmount,
                    totalPaid: (supplier.totalPaid || 0) + paidAmount
                });
            }
        }

        res.status(201).json({ id: purchaseId, message: 'Purchase recorded' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});`;

const newPurchasesRoute = `app.post('/api/purchases', async (req, res) => {
    try {
        const { supplierId, items, paidAmount, shopId, dueDate } = req.body || {};
        if (!supplierId) {
            return res.status(400).json({ error: 'Supplier ID is required.' });
        }
        const supplier = await getById('suppliers', supplierId);
        if (!supplier) {
            return res.status(404).json({ error: 'Supplier not found.' });
        }
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Purchase must include at least one item.' });
        }

        const purchaseId = generateId();
        const { date: providedDate } = req.body || {};
        const date = providedDate || Date.now();
        const totalAmount = items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
        if (totalAmount <= 0) {
            return res.status(400).json({ error: 'Total purchase amount must be greater than zero.' });
        }

        const parsedPaid = Number(paidAmount) || 0;
        if (parsedPaid < 0) {
            return res.status(400).json({ error: 'Paid amount cannot be negative.' });
        }
        if (parsedPaid > totalAmount) {
            return res.status(400).json({ error: 'Immediate paid amount cannot exceed total purchase amount.' });
        }

        const supplierName = supplier?.name || 'Unknown';
        const remainingAmount = totalAmount - parsedPaid;

        const purchase = {
            id: purchaseId, supplierId, supplierName, totalAmount, paidAmount: parsedPaid, remainingAmount, createdAt: date, date: date, shopId: shopId || 'shop-1', items
        };
        await insert('purchases', purchaseId, purchase);

        for (const item of items) {
            const pid = item.productId || item.id;
            const product = await getById('products', pid);
            if (product) {
                await update('products', pid, {
                    stock: (product.stock || 0) + (Number(item.quantity) || 0),
                    purchasePrice: Number(item.costPrice) || product.purchasePrice,
                    supplierId, supplierName
                });
            }
        }

        await update('suppliers', supplierId, {
            totalPurchased: (Number(supplier.totalPurchased) || 0) + totalAmount,
            totalPaid: (Number(supplier.totalPaid) || 0) + parsedPaid,
            balance: (Number(supplier.balance) || 0) + remainingAmount,
            ...(dueDate ? { nextPaymentDate: dueDate } : {})
        });

        if (parsedPaid > 0) {
            const paymentId = generateId();
            await insert('supplierPayments', paymentId, {
                id: paymentId,
                supplierId,
                purchaseId: purchaseId, // Stable foreign key reference to originating purchase
                isImmediate: true,       // Explicit structural flag for Cashbook deduplication
                amount: parsedPaid,
                createdAt: date,
                method: 'Cash',
                note: \`Immediate payment for Purchase #\${purchaseId}\`
            });
        }

        res.status(201).json({ id: purchaseId, message: 'Purchase recorded' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});`;

if (normalizeLf(backendContent).includes(normalizeLf(oldPurchasesRoute))) {
    backendContent = normalizeLf(backendContent).replace(normalizeLf(oldPurchasesRoute), normalizeLf(newPurchasesRoute));
    console.log('[Backend] Hardened POST /api/purchases with overpayment guard and structural purchaseId/isImmediate.');
}

// E. Harden POST /api/supplier-payments to explicitly enforce isImmediate: false, purchaseId: null
const oldSupPaymentInsert = `        const paymentId = generateId();
        const payment = { ...stripUndefined(req.body), amount: parsedAmount, createdAt: Date.now() };
        await insert('supplierPayments', paymentId, payment);`;

const newSupPaymentInsert = `        const paymentId = generateId();
        // Ensure manual supplier payments explicitly have isImmediate: false and purchaseId: null
        const payment = {
            ...stripUndefined(req.body),
            amount: parsedAmount,
            isImmediate: false,
            purchaseId: null,
            createdAt: Date.now()
        };
        await insert('supplierPayments', paymentId, payment);`;

if (normalizeLf(backendContent).includes(normalizeLf(oldSupPaymentInsert))) {
    backendContent = normalizeLf(backendContent).replace(normalizeLf(oldSupPaymentInsert), normalizeLf(newSupPaymentInsert));
    console.log('[Backend] Hardened POST /api/supplier-payments to set isImmediate: false and purchaseId: null.');
}

// Write back to backend/index.js preserving CRLF
fs.writeFileSync(backendPath, backendContent.replace(/\n/g, '\r\n'), 'utf8');
console.log('--- Root Cause Hardening Applied Successfully ---');
