require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 7860;

// Security Headers Middleware
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Content-Security-Policy', "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; img-src 'self' data: blob:; connect-src 'self' ws: wss: http: https:;");
    next();
});

// Configurable CORS Middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim().toLowerCase())
    : null;

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (curl, mobile, same-origin, file://)
        if (!origin || !allowedOrigins || allowedOrigins.includes(origin.toLowerCase())) {
            return callback(null, true);
        }
        return callback(new Error('CORS request blocked: Origin not allowed.'));
    }
}));
app.use(bodyParser.json({ limit: '10mb' }));

// Serve React frontend (both dev and production)
const frontendPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(frontendPath)) {
    app.use(express.static(frontendPath));
}

// Chrome DevTools & Favicon endpoints
app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
    res.json({});
});
app.get('/favicon.ico', (req, res) => {
    const faviconPath = path.join(frontendPath, 'favicon.ico');
    if (fs.existsSync(faviconPath)) {
        res.sendFile(faviconPath);
    } else {
        res.status(204).end();
    }
});

// Request Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Helper function to generate unique IDs
const generateId = () => {
    return crypto.randomUUID();
};

// Helper to remove undefined fields recursively for JSON compatibility
const stripUndefined = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    Object.keys(obj).forEach(key => {
        if (obj[key] === undefined) {
            delete obj[key];
        } else if (obj[key] !== null && typeof obj[key] === 'object') {
            stripUndefined(obj[key]);
        }
    });
    return obj;
};

// Database and Backups Connection
const dataPath = process.env.APP_DATA_PATH || __dirname;
const dbPath = path.join(dataPath, 'database.sqlite');
const backupsDir = path.join(dataPath, 'backups');
if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
}
console.log(`[Backend] Using database at: ${dbPath}`);
console.log(`[Backend] Backups directory at: ${backupsDir}`);

let db;

const initDb = (callback) => {
    db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('Error opening database', err.message);
            if (callback) callback(err);
        } else {
            console.log('Connected to the SQLite database.');
            db.serialize(() => {
                const tables = ['products', 'customers', 'payments', 'sales', 'suppliers', 'purchases', 'supplierPayments', 'expenses', 'stockTransfers'];
                for (const table of tables) {
                    db.run(`CREATE TABLE IF NOT EXISTS ${table} (id TEXT PRIMARY KEY, data TEXT)`);
                }
                db.run(`CREATE TABLE IF NOT EXISTS counters (id TEXT PRIMARY KEY, value INTEGER)`, () => {
                    mergeDuplicateProducts();
                    syncProductNamesWithHistoricalRecords();
                    reconcileInvoiceCounter();
                    ensurePurchaseInitialPaid();
                    if (callback) callback(null);
                });
            });
        }
    });
};

initDb();

// Floating-point precision helper: standardizes financial values to 2 decimal places
const roundMoney = (val) => Math.round((Number(val) || 0) * 100) / 100;

// SQLite Transaction Serializer: ensures ACID atomicity and prevents multi-terminal race conditions
let transactionQueue = Promise.resolve();

const executeTransaction = (fn) => {
    return new Promise((resolve, reject) => {
        transactionQueue = transactionQueue.then(async () => {
            await new Promise((res, rej) => db.run('BEGIN IMMEDIATE TRANSACTION', err => err ? rej(err) : res()));
            try {
                const result = await fn();
                await new Promise((res, rej) => db.run('COMMIT', err => err ? rej(err) : res()));
                resolve(result);
            } catch (err) {
                await new Promise(res => db.run('ROLLBACK', () => res()));
                reject(err);
            }
        }).catch(err => {
            reject(err);
        });
    });
};


// Backup helper: safe copy of current db
const createBackupFile = (prefix = 'backup') => {
    try {
        if (!fs.existsSync(dbPath)) return null;
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '');
        const filename = `${prefix}-${dateStr}-${timeStr}.sqlite`;
        const destPath = path.join(backupsDir, filename);
        fs.copyFileSync(dbPath, destPath);
        const stats = fs.statSync(destPath);
        return {
            filename,
            size: stats.size,
            sizeFormatted: (stats.size / 1024).toFixed(1) + ' KB',
            createdAt: stats.mtimeMs,
            label: `${dateStr} (${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`
        };
    } catch (e) {
        console.error('[Backup] Failed to create backup file:', e);
        return null;
    }
};

// Automatically ensure today's backup exists
const ensureDailyBackup = () => {
    try {
        if (!fs.existsSync(dbPath)) return;
        const todayStr = new Date().toISOString().split('T')[0];
        const todayBackupName = `backup-${todayStr}.sqlite`;
        const destPath = path.join(backupsDir, todayBackupName);
        if (!fs.existsSync(destPath)) {
            console.log(`[Backup] Automatically generating daily backup for ${todayStr}...`);
            fs.copyFileSync(dbPath, destPath);
        }
    } catch (e) {
        console.error('[Backup] Error ensuring daily backup:', e);
    }
};

// Hourly rolling backup snapshot (keeps last 24 hours of hourly snapshots)
const ensureHourlyBackup = () => {
    try {
        if (!fs.existsSync(dbPath)) return;
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const hourStr = String(now.getHours()).padStart(2, '0');
        const hourlyName = `backup-hourly-${dateStr}-${hourStr}00.sqlite`;
        const destPath = path.join(backupsDir, hourlyName);
        if (!fs.existsSync(destPath)) {
            console.log(`[Backup] Generating hourly rolling snapshot: ${hourlyName}...`);
            fs.copyFileSync(dbPath, destPath);
        }

        // Clean up hourly backups older than 24 snapshots
        const hourlyFiles = fs.readdirSync(backupsDir)
            .filter(f => f.startsWith('backup-hourly-') && (f.endsWith('.sqlite') || f.endsWith('.db')))
            .map(f => ({ name: f, path: path.join(backupsDir, f), mtime: fs.statSync(path.join(backupsDir, f)).mtimeMs }))
            .sort((a, b) => b.mtime - a.mtime);

        if (hourlyFiles.length > 24) {
            hourlyFiles.slice(24).forEach(file => {
                try { fs.unlinkSync(file.path); } catch (_) {}
            });
        }
    } catch (e) {
        console.error('[Backup] Error ensuring hourly backup:', e);
    }
};

ensureDailyBackup();
ensureHourlyBackup();

// Daily automated backup schedule (every 6 hours checks and saves daily backup)
setInterval(() => {
    ensureDailyBackup();
}, 6 * 60 * 60 * 1000);

// Hourly rolling snapshot schedule (every 15 minutes checks/records current hour)
setInterval(() => {
    ensureHourlyBackup();
}, 15 * 60 * 1000);

// Generic DB Operations
const getAll = (table) => {
    return new Promise((resolve, reject) => {
        db.all(`SELECT id, data FROM ${table}`, (err, rows) => {
            if (err) return reject(err);
            resolve(rows.map(r => ({ id: r.id, ...JSON.parse(r.data) })));
        });
    });
};

const getById = (table, id) => {
    return new Promise((resolve, reject) => {
        db.get(`SELECT data FROM ${table} WHERE id = ?`, [id], (err, row) => {
            if (err) return reject(err);
            if (!row) return resolve(null);
            resolve({ id, ...JSON.parse(row.data) });
        });
    });
};

const insert = (table, id, data) => {
    return new Promise((resolve, reject) => {
        const { id: _, ...rest } = data;
        db.run(`INSERT INTO ${table} (id, data) VALUES (?, ?)`, [id, JSON.stringify(rest)], (err) => {
            if (err) return reject(err);
            resolve();
        });
    });
};

const update = (table, id, data) => {
    return new Promise((resolve, reject) => {
        getById(table, id).then(existing => {
            if (!existing) return reject(new Error('Not found'));
            // Remove undefined fields from incoming data to avoid accidentally
            // clearing existing fields like createdAt when callers pass
            // objects with undefined properties.
            const cleanData = stripUndefined(data || {});
            const merged = { ...existing, ...cleanData };
            const { id: _, ...rest } = merged;
            db.run(`UPDATE ${table} SET data = ? WHERE id = ?`, [JSON.stringify(rest), id], (err) => {
                if (err) return reject(err);
                resolve(merged);
            });
        }).catch(reject);
    });
};

const remove = (table, id) => {
    return new Promise((resolve, reject) => {
        db.run(`DELETE FROM ${table} WHERE id = ?`, [id], (err) => {
            if (err) return reject(err);
            resolve();
        });
    });
};

const mergeDuplicateProducts = async () => {
    try {
        console.log('[Startup Reconciler] Checking for duplicate products...');
        const products = await getAll('products');
        const groups = {};
        
        for (const p of products) {
            const name = (p.name || '').trim().toLowerCase();
            const size = (p.size || '').trim().toLowerCase();
            const unit = (p.unit || '').trim().toLowerCase();
            const shopId = p.shopId || 'shop-1';
            const key = `${shopId}::${name}::${size}::${unit}`;
            
            if (!groups[key]) groups[key] = [];
            groups[key].push(p);
        }

        const idMap = {};
        let updatedCount = 0;

        for (const key of Object.keys(groups)) {
            const group = groups[key];
            if (group.length <= 1) continue;

            // Sort so the preferred product is first
            group.sort((a, b) => {
                const aHasStock = (a.stock || 0) > 0;
                const bHasStock = (b.stock || 0) > 0;
                if (aHasStock && !bHasStock) return -1;
                if (!aHasStock && bHasStock) return 1;
                return (a.createdAt || 0) - (b.createdAt || 0);
            });

            const primary = group[0];
            const secondaries = group.slice(1);
            let combinedStock = primary.stock || 0;
            let needsUpdate = false;

            console.log(`[Startup Reconciler] Found duplicate group for key "${key}". Primary ID: ${primary.id} (SKU: ${primary.sku}, Stock: ${primary.stock})`);

            for (const sec of secondaries) {
                console.log(`[Startup Reconciler] Merging duplicate ID: ${sec.id} (SKU: ${sec.sku}, Stock: ${sec.stock}) -> Primary`);
                combinedStock += (sec.stock || 0);
                idMap[sec.id] = primary.id;
                await remove('products', sec.id);
                needsUpdate = true;
            }

            if (needsUpdate || primary.stock !== combinedStock) {
                await update('products', primary.id, { stock: combinedStock });
                updatedCount++;
            }
        }

        const mergedIdsCount = Object.keys(idMap).length;
        if (mergedIdsCount > 0) {
            console.log(`[Startup Reconciler] Merged ${mergedIdsCount} duplicate product entities. Updating transaction references...`);

            // Update Sales references
            const sales = await getAll('sales');
            for (const sale of sales) {
                let saleChanged = false;
                if (sale.items && Array.isArray(sale.items)) {
                    sale.items = sale.items.map(item => {
                        const pid = item.id || item.productId;
                        if (pid && idMap[pid]) {
                            saleChanged = true;
                            return { ...item, id: idMap[pid], productId: idMap[pid] };
                        }
                        return item;
                    });
                }
                if (saleChanged) {
                    await update('sales', sale.id, sale);
                }
            }

            // Update Purchases references
            const purchases = await getAll('purchases');
            for (const purchase of purchases) {
                let purchaseChanged = false;
                if (purchase.items && Array.isArray(purchase.items)) {
                    purchase.items = purchase.items.map(item => {
                        if (item.productId && idMap[item.productId]) {
                            purchaseChanged = true;
                            return { ...item, productId: idMap[item.productId] };
                        }
                        return item;
                    });
                }
                if (purchaseChanged) {
                    await update('purchases', purchase.id, purchase);
                }
            }

            // Update Stock Transfers references
            const transfers = await getAll('stockTransfers');
            for (const transfer of transfers) {
                let transferChanged = false;
                if (transfer.sourceProductId && idMap[transfer.sourceProductId]) {
                    transfer.sourceProductId = idMap[transfer.sourceProductId];
                    transferChanged = true;
                }
                if (transfer.targetProductId && idMap[transfer.targetProductId]) {
                    transfer.targetProductId = idMap[transfer.targetProductId];
                    transferChanged = true;
                }
                if (transferChanged) {
                    await update('stockTransfers', transfer.id, transfer);
                }
            }

            console.log('[Startup Reconciler] Database references update complete.');
        } else {
            console.log('[Startup Reconciler] No duplicate product entities found.');
        }
    } catch (err) {
        console.error('[Startup Reconciler] Error during duplicate merge:', err);
    }
};

// Helper: Propagate product updates (name, size, unit, sku, category) across historical records
const propagateProductUpdates = async (productId, updates) => {
    try {
        if (!productId || !updates) return;
        const { name, size, unit, category, sku } = updates;
        if (!name && !size && !unit && !category && !sku) return;

        // 1. Sales line items
        const allSales = await getAll('sales');
        for (const sale of allSales) {
            let saleModified = false;
            if (sale.items && Array.isArray(sale.items)) {
                sale.items = sale.items.map(item => {
                    const pid = item.id || item.productId;
                    if (pid === productId) {
                        saleModified = true;
                        return {
                            ...item,
                            ...(name ? { name } : {}),
                            ...(size !== undefined ? { size } : {}),
                            ...(unit !== undefined ? { unit } : {}),
                            ...(category !== undefined ? { category } : {}),
                            ...(sku !== undefined ? { sku } : {})
                        };
                    }
                    return item;
                });
            }
            if (saleModified) {
                await update('sales', sale.id, sale);
            }
        }

        // 2. Purchases line items
        const allPurchases = await getAll('purchases');
        for (const pur of allPurchases) {
            let purModified = false;
            if (pur.items && Array.isArray(pur.items)) {
                pur.items = pur.items.map(item => {
                    const pid = item.id || item.productId;
                    if (pid === productId) {
                        purModified = true;
                        return {
                            ...item,
                            ...(name ? { name } : {}),
                            ...(size !== undefined ? { size } : {}),
                            ...(unit !== undefined ? { unit } : {}),
                            ...(category !== undefined ? { category } : {}),
                            ...(sku !== undefined ? { sku } : {})
                        };
                    }
                    return item;
                });
            }
            if (purModified) {
                await update('purchases', pur.id, pur);
            }
        }

        // 3. Stock Transfers
        const allTransfers = await getAll('stockTransfers');
        for (const transfer of allTransfers) {
            if (transfer.sourceProductId === productId || transfer.targetProductId === productId) {
                if (name && transfer.productName !== name) {
                    transfer.productName = name;
                    await update('stockTransfers', transfer.id, transfer);
                }
            }
        }
        console.log(`[Product Propagator] Successfully propagated updates for product ${productId} to historical records.`);
    } catch (err) {
        console.error('[Product Propagator] Error propagating product updates:', err);
    }
};

// Startup reconciler: Ensure all transaction line items reflect the current product names from products table
const syncProductNamesWithHistoricalRecords = async () => {
    try {
        const products = await getAll('products');
        if (!products || products.length === 0) return;
        const productMap = {};
        products.forEach(p => {
            if (p.id) productMap[p.id] = p;
        });

        // Sync Sales
        const sales = await getAll('sales');
        for (const sale of sales) {
            let modified = false;
            if (sale.items && Array.isArray(sale.items)) {
                sale.items = sale.items.map(item => {
                    const pid = item.id || item.productId;
                    const p = productMap[pid];
                    if (p && (item.name !== p.name || (p.size && item.size !== p.size))) {
                        modified = true;
                        return {
                            ...item,
                            name: p.name,
                            ...(p.size ? { size: p.size } : {}),
                            ...(p.unit ? { unit: p.unit } : {})
                        };
                    }
                    return item;
                });
            }
            if (modified) {
                await update('sales', sale.id, sale);
            }
        }

        // Sync Purchases
        const purchases = await getAll('purchases');
        for (const pur of purchases) {
            let modified = false;
            if (pur.items && Array.isArray(pur.items)) {
                pur.items = pur.items.map(item => {
                    const pid = item.id || item.productId;
                    const p = productMap[pid];
                    if (p && (item.name !== p.name || (p.size && item.size !== p.size))) {
                        modified = true;
                        return {
                            ...item,
                            name: p.name,
                            ...(p.size ? { size: p.size } : {}),
                            ...(p.unit ? { unit: p.unit } : {})
                        };
                    }
                    return item;
                });
            }
            if (modified) {
                await update('purchases', pur.id, pur);
            }
        }

        // Sync Stock Transfers
        const transfers = await getAll('stockTransfers');
        for (const transfer of transfers) {
            const pid = transfer.sourceProductId || transfer.targetProductId;
            const p = productMap[pid];
            if (p && transfer.productName !== p.name) {
                transfer.productName = p.name;
                await update('stockTransfers', transfer.id, transfer);
            }
        }
        console.log('[Startup Reconciler] Synced product names with historical transactions.');
    } catch (err) {
        console.error('[Startup Reconciler] Error syncing product names:', err);
    }
};

// ============================================================================================
// INVOICE NUMBERING HELPER & RECONCILER
// ============================================================================================
const reconcileInvoiceCounter = () => {
    return new Promise((resolve) => {
        db.all(`SELECT data FROM sales`, (err, rows) => {
            if (err || !rows) return resolve();
            let maxInv = 0;
            rows.forEach(r => {
                try {
                    const d = JSON.parse(r.data);
                    const inv = Number(d.invoiceNumber);
                    if (!isNaN(inv) && inv > maxInv) maxInv = inv;
                } catch (e) {}
            });
            db.get(`SELECT value FROM counters WHERE id = 'invoiceNumber'`, (err, row) => {
                const currentNumber = row ? row.value : 0;
                // If counter is desynchronized above max existing invoice (e.g. purged test records),
                // align it with maxInv so future invoices continue gaplessly.
                if (maxInv > 0 && currentNumber > maxInv) {
                    console.log(`[Invoice Reconciler] Adjusting counter from ${currentNumber} to max actual invoice ${maxInv}`);
                    db.run(`UPDATE counters SET value = ? WHERE id = 'invoiceNumber'`, [maxInv], () => resolve());
                } else if (!row) {
                    db.run(`INSERT INTO counters (id, value) VALUES ('invoiceNumber', ?)`, [maxInv], () => resolve());
                } else {
                    resolve();
                }
            });
        });
    });
};

const getNextInvoiceNumber = () => {
    return new Promise((resolve, reject) => {
        db.all(`SELECT data FROM sales`, (err, rows) => {
            let maxInv = 0;
            if (!err && rows) {
                rows.forEach(r => {
                    try {
                        const d = JSON.parse(r.data);
                        const inv = Number(d.invoiceNumber);
                        if (!isNaN(inv) && inv > maxInv) maxInv = inv;
                    } catch (e) {}
                });
            }
            db.get(`SELECT value FROM counters WHERE id = 'invoiceNumber'`, (err, row) => {
                if (err) return reject(err);
                const currentNumber = row ? row.value : 0;
                const baseNumber = (maxInv > 0 && currentNumber > maxInv) ? maxInv : Math.max(currentNumber, maxInv);
                const newNumber = baseNumber + 1;
                if (row) {
                    db.run(`UPDATE counters SET value = ? WHERE id = 'invoiceNumber'`, [newNumber], err => err ? reject(err) : resolve(newNumber));
                } else {
                    db.run(`INSERT INTO counters (id, value) VALUES ('invoiceNumber', ?)`, [newNumber], err => err ? reject(err) : resolve(newNumber));
                }
            });
        });
    });
};

// Helper: Ensure all historical purchases have an initialPaid property reflecting their true upfront cash
const ensurePurchaseInitialPaid = async () => {
    try {
        const purchases = await getAll('purchases');
        const supPayments = await getAll('supplierPayments');
        for (const pur of purchases) {
            if (pur.initialPaid === undefined) {
                const imm = supPayments.find(sp => sp.purchaseId === pur.id && sp.isImmediate);
                const initPaid = imm ? (Number(imm.amount) || 0) : (Number(pur.paidAmount) || 0);
                await update('purchases', pur.id, { initialPaid: initPaid });
            }
        }
    } catch (e) {
        console.error('[Startup] ensurePurchaseInitialPaid error:', e);
    }
};

// ============================================================================================
// PRODUCTS API
// ============================================================================================

app.get('/api/products', async (req, res) => {
    try { res.json(await getAll('products')); } 
    catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/products', async (req, res) => {
    try {
        const { name, stock, purchasePrice, retailPrice, paidAmount, ...productData } = req.body || {};
        if (!name || typeof name !== 'string' || !name.trim()) {
            return res.status(400).json({ error: 'Product name is required.' });
        }

        const parsedStock = stock !== undefined && stock !== null ? Number(stock) : 0;
        const parsedPurchasePrice = purchasePrice !== undefined && purchasePrice !== null ? Number(purchasePrice) : 0;
        const parsedRetailPrice = retailPrice !== undefined && retailPrice !== null ? Number(retailPrice) : 0;

        if (isNaN(parsedStock) || parsedStock < 0) {
            return res.status(400).json({ error: 'Stock must be a non-negative number.' });
        }
        if (isNaN(parsedPurchasePrice) || parsedPurchasePrice < 0 || isNaN(parsedRetailPrice) || parsedRetailPrice < 0) {
            return res.status(400).json({ error: 'Prices cannot be negative numbers.' });
        }

        const id = generateId();
        const newProduct = {
            ...productData,
            name: name.trim(),
            stock: parsedStock,
            purchasePrice: parsedPurchasePrice,
            retailPrice: parsedRetailPrice,
            createdAt: Date.now()
        };
        await insert('products', id, newProduct);

        // Auto-create purchase if initial stock is added and supplier is selected
        if (newProduct.stock > 0 && newProduct.supplierId && newProduct.purchasePrice > 0) {
            const totalAmount = newProduct.stock * newProduct.purchasePrice;
            const supplier = await getById('suppliers', newProduct.supplierId);
            const actualPaidAmount = Number(paidAmount) || 0;
            
            const purchaseId = generateId();
            const date = Date.now();
            const purchase = {
                id: purchaseId, 
                supplierId: newProduct.supplierId, 
                supplierName: newProduct.supplierName || (supplier ? supplier.name : 'Unknown'), 
                totalAmount: totalAmount, 
                paidAmount: actualPaidAmount, 
                remainingAmount: totalAmount - actualPaidAmount, 
                createdAt: date, 
                shopId: newProduct.shopId || 'shop-1', 
                items: [{
                    productId: id,
                    name: newProduct.name,
                    quantity: newProduct.stock,
                    costPrice: newProduct.purchasePrice,
                    total: totalAmount
                }]
            };
            await insert('purchases', purchaseId, purchase);

            if (supplier) {
                await update('suppliers', newProduct.supplierId, {
                    totalPurchased: (supplier.totalPurchased || 0) + totalAmount,
                    balance: (supplier.balance || 0) + totalAmount
                });
            }

            if (actualPaidAmount > 0) {
                const paymentId = generateId();
                await insert('supplierPayments', paymentId, {
                    id: paymentId, 
                    supplierId: newProduct.supplierId, 
                    amount: actualPaidAmount, 
                    createdAt: date, 
                    method: 'Cash', 
                    note: `Immediate payment for initial stock of ${newProduct.name}`
                });
                if (supplier) {
                    await update('suppliers', newProduct.supplierId, {
                        balance: (supplier.balance || 0) + totalAmount - actualPaidAmount,
                        totalPaid: (supplier.totalPaid || 0) + actualPaidAmount
                    });
                }
            }
        }

        res.status(201).json({ id, ...newProduct });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        await update('products', id, data);
        await propagateProductUpdates(id, data);
        res.json({ id, ...data, message: 'Product updated successfully' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const product = await getById('products', id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found.' });
        }
        const [allPurchases, allSales, allTransfers] = await Promise.all([
            getAll('purchases'),
            getAll('sales'),
            getAll('stockTransfers')
        ]);
        const prodName = (product.name || '').trim().toLowerCase();
        const hasHistory = allPurchases.some(p => (p.items || []).some(it => (it.productId || it.id) === id || (it.name && prodName && it.name.trim().toLowerCase() === prodName)))
            || allSales.some(s => (s.items || []).some(it => (it.productId || it.id) === id || (it.name && prodName && it.name.trim().toLowerCase() === prodName)))
            || allTransfers.some(t => t.sourceProductId === id || t.targetProductId === id || (t.productName && prodName && t.productName.trim().toLowerCase() === prodName));

        if (hasHistory) {
            return res.status(400).json({
                error: 'Cannot delete product: This product has associated purchase, sales, or transfer history. Deletion is blocked to preserve historical audit records.'
            });
        }

        await remove('products', id);
        res.json({ message: 'Product deleted successfully.' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// Stock Transfer endpoint
app.post('/api/products/transfer', async (req, res) => {
    try {
        const { sourceProductId, quantity, targetShopId } = req.body || {};
        const parsedQty = Number(quantity);
        if (!sourceProductId || isNaN(parsedQty) || parsedQty <= 0) {
            return res.status(400).json({ error: 'Invalid transfer parameters. Quantity must be a positive number.' });
        }

        const result = await executeTransaction(async () => {
            const sourceProduct = await getById('products', sourceProductId);
            if (!sourceProduct) {
                const err = new Error('Source product not found');
                err.status = 404;
                throw err;
            }
            if ((sourceProduct.stock || 0) < parsedQty) {
                const err = new Error(`Insufficient stock for transfer. Only ${sourceProduct.stock || 0} in stock.`);
                err.status = 400;
                throw err;
            }

            const sourceShopId = sourceProduct.shopId || 'shop-1';
            const targetShop = targetShopId || (sourceShopId === 'shop-1' ? 'shop-2' : 'shop-1');

            if (sourceShopId === targetShop) {
                const err = new Error('Source and target shop cannot be the same');
                err.status = 400;
                throw err;
            }

            const allProducts = await getAll('products');
            let targetProduct = null;
            const srcName = (sourceProduct.name || '').trim().toLowerCase();
            const srcSku = (sourceProduct.sku || '').trim().toLowerCase();
            const srcSize = (sourceProduct.size || '').trim().toLowerCase();
            const srcUnit = (sourceProduct.unit || '').trim().toLowerCase();
            for (const p of allProducts) {
                if (p.shopId === targetShop) {
                    const pName = (p.name || '').trim().toLowerCase();
                    const pSku = (p.sku || '').trim().toLowerCase();
                    const pSize = (p.size || '').trim().toLowerCase();
                    const pUnit = (p.unit || '').trim().toLowerCase();
                    // Match by SKU (if non-empty) or by Name + Size + Unit
                    const skuMatch = srcSku && pSku && srcSku === pSku;
                    const detailsMatch = srcName && (srcName === pName) && (srcSize === pSize) && (srcUnit === pUnit);
                    if (skuMatch || detailsMatch) { targetProduct = p; break; }
                }
            }

            await update('products', sourceProductId, { stock: sourceProduct.stock - parsedQty });

            if (targetProduct) {
                const updatedTargetStock = (targetProduct.stock || 0) + parsedQty;
                await update('products', targetProduct.id, { stock: updatedTargetStock });
                targetProduct.stock = updatedTargetStock;
            } else {
                const newId = generateId();
                const newProduct = { ...sourceProduct, shopId: targetShop, stock: parsedQty, createdAt: Date.now() };
                delete newProduct.id;
                await insert('products', newId, newProduct);
                targetProduct = { id: newId, ...newProduct };
            }

            const transferId = generateId();
            await insert('stockTransfers', transferId, {
                id: transferId,
                sourceProductId,
                targetProductId: targetProduct.id,
                productName: sourceProduct.name,
                quantity: parsedQty,
                sourceShopId,
                targetShopId: targetShop,
                date: Date.now()
            });

            return {
                message: 'Stock transferred successfully',
                sourceProductId, targetProductId: targetProduct.id, targetShopId: targetShop, quantity: parsedQty,
                newSourceStock: sourceProduct.stock - parsedQty, newTargetStock: targetProduct.stock
            };
        });

        res.json(result);
    } catch (error) { res.status(error.status || 500).json({ error: error.message }); }
});

app.get('/api/stock-transfers', async (req, res) => {
    try { res.json(await getAll('stockTransfers')); } catch (error) { res.status(500).json({ error: error.message }); }
});

// ============================================================================================
// CUSTOMERS API
// ============================================================================================

app.get('/api/customers', async (req, res) => {
    try { res.json(await getAll('customers')); } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/customers', async (req, res) => {
    try {
        const { name } = req.body || {};
        if (!name || typeof name !== 'string' || !name.trim()) {
            return res.status(400).json({ error: 'Customer name is required.' });
        }
        const id = generateId();
        const newCustomer = { ...stripUndefined(req.body), name: name.trim(), balance: 0, totalPurchased: 0, totalPaid: 0, createdAt: Date.now() };
        await insert('customers', id, newCustomer);
        res.status(201).json({ id, ...newCustomer });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/customers/:id', async (req, res) => {
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
});

app.delete('/api/customers/:id', async (req, res) => {
    try {
        await remove('customers', req.params.id);
        res.json({ message: 'Customer deleted' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// ============================================================================================
// PAYMENTS API
// ============================================================================================

app.get('/api/payments', async (req, res) => {
    try {
        const payments = await getAll('payments');
        const filtered = req.query.includeVoided === 'true' ? payments : payments.filter(p => !p.isVoided);
        res.json(filtered);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/payments', async (req, res) => {
    try {
        const data = stripUndefined(req.body || {});
        const amount = roundMoney(Number(data.amount));
        if (isNaN(amount) || amount <= 0) {
            return res.status(400).json({ error: 'Payment amount must be a positive number.' });
        }
        const id = generateId();
        const now = Date.now();
        // Always store both `date` and `createdAt` so the frontend Payment type (which uses `date`) works correctly
        const newPayment = { ...data, amount, date: now, createdAt: now };

        const result = await executeTransaction(async () => {
            if (data.saleId) {
                const sale = await getById('sales', data.saleId);
                if (!sale) {
                    const err = new Error('Sale invoice not found.');
                    err.status = 404;
                    throw err;
                }
                if (sale.isVoided) {
                    const err = new Error('Cannot record payment for a voided invoice.');
                    err.status = 400;
                    throw err;
                }
                const currentRemaining = roundMoney(sale.remainingBalance ?? sale.customerDetails?.remainingBalance ?? 0);
                if (currentRemaining <= 0) {
                    const err = new Error('Cannot record payment: Invoice has no pending balance (balance is Rs. 0).');
                    err.status = 400;
                    throw err;
                }
                if (amount > currentRemaining) {
                    const err = new Error(`Payment amount (Rs. ${amount.toLocaleString()}) cannot exceed outstanding invoice balance (Rs. ${currentRemaining.toLocaleString()}).`);
                    err.status = 400;
                    throw err;
                }
            } else {
                // If no specific saleId passed, validate against customer overall debt
                const allSales = await getAll('sales');
                let targetBalance = 0;
                let foundCustomer = null;
                if (data.customerId && data.customerId !== 'walk-in') {
                    foundCustomer = await getById('customers', data.customerId);
                }
                if (foundCustomer) {
                    targetBalance = roundMoney(Number(foundCustomer.balance) || 0);
                } else if (data.customerId) {
                    const cSales = allSales.filter(s => (s.customerId === data.customerId || (data.customerName && s.customerName === data.customerName)) && !s.isVoided && s.type !== 'Quotation');
                    targetBalance = roundMoney(cSales.reduce((sum, s) => sum + (s.remainingBalance ?? s.customerDetails?.remainingBalance ?? 0), 0));
                }

                if (targetBalance <= 0) {
                    const err = new Error('Cannot record payment: Customer has no pending dues (balance is Rs. 0).');
                    err.status = 400;
                    throw err;
                }
                if (amount > targetBalance) {
                    const err = new Error(`Payment amount (Rs. ${amount.toLocaleString()}) cannot exceed customer's outstanding balance (Rs. ${targetBalance.toLocaleString()}).`);
                    err.status = 400;
                    throw err;
                }
            }

            await insert('payments', id, newPayment);

            if (data.customerId && data.customerId !== 'walk-in') {
                const customer = await getById('customers', data.customerId);
                if (customer) {
                    // Re-calculate totalPaid from all settlement payments + initial checkout payments on sales
                    const allPayments = await getAll('payments');
                    const settlementPaymentsTotal = allPayments
                        .filter(p => p.customerId === data.customerId && !p.isVoided)
                        .reduce((sum, p) => sum + (p.amount || 0), 0);

                    const allSales = await getAll('sales');
                    const initialPaymentsTotal = allSales
                        .filter(s => s.customerId === data.customerId && s.type !== 'Quotation' && !s.isVoided)
                        .reduce((sum, s) => {
                            const saleSettlements = allPayments.filter(p => p.saleId === s.id && !p.isVoided).reduce((sSum, p) => sSum + (p.amount || 0), 0);
                            const init = s.initialPaid != null ? s.initialPaid : Math.max(0, (Number(s.customerDetails?.amountPaid ?? s.amountPaid ?? (s.paymentType === 'Full' ? s.total : 0)) || 0) - saleSettlements);
                            return sum + (s.type === 'Return' ? -init : init);
                        }, 0);

                    const recalcTotalPaid = roundMoney(settlementPaymentsTotal + initialPaymentsTotal);

                    await update('customers', data.customerId, {
                        balance: roundMoney((customer.balance || 0) - amount),
                        totalPaid: recalcTotalPaid
                    });

                    // FIFO: If no specific saleId was passed, allocate payment across customer's open unpaid sales
                    if (!data.saleId) {
                        let unallocated = amount;
                        const openSales = allSales
                            .filter(s => s.customerId === data.customerId && (s.type === 'Sale' || !s.type) && !s.isVoided)
                            .filter(s => {
                                const rem = s.remainingBalance ?? s.customerDetails?.remainingBalance ?? 0;
                                return rem > 0;
                            })
                            .sort((a, b) => (a.createdAt || a.date || 0) - (b.createdAt || b.date || 0));

                        for (const sale of openSales) {
                            if (unallocated <= 0) break;
                            const currentRemaining = sale.remainingBalance ?? sale.customerDetails?.remainingBalance ?? 0;
                            const currentPaid = sale.amountPaid ?? sale.customerDetails?.amountPaid ?? 0;
                            const alloc = Math.min(unallocated, currentRemaining);
                            const newRemaining = roundMoney(Math.max(0, currentRemaining - alloc));
                            const newPaid = roundMoney(currentPaid + alloc);
                            const newStatus = newRemaining <= 0 ? 'Full' : 'Partial';

                            await update('sales', sale.id, {
                                remainingBalance: newRemaining, amountPaid: newPaid, paymentType: newStatus,
                                customerDetails: { ...sale.customerDetails, remainingBalance: newRemaining, amountPaid: newPaid, paymentType: newStatus }
                            });

                            unallocated -= alloc;
                        }
                        if (openSales.length > 0) {
                            await update('payments', id, { saleId: openSales[0].id });
                        }
                    }
                }
            }

            if (data.saleId) {
                const sale = await getById('sales', data.saleId);
                if (sale) {
                    const currentRemaining = sale.remainingBalance ?? sale.customerDetails?.remainingBalance ?? 0;
                    const currentPaid = sale.amountPaid ?? sale.customerDetails?.amountPaid ?? 0;
                    const newRemaining = roundMoney(Math.max(0, currentRemaining - amount));
                    const newPaid = roundMoney(currentPaid + amount);
                    const newStatus = newRemaining <= 0 ? 'Full' : 'Partial';

                    await update('sales', data.saleId, {
                        remainingBalance: newRemaining, amountPaid: newPaid, paymentType: newStatus,
                        customerDetails: { ...sale.customerDetails, remainingBalance: newRemaining, amountPaid: newPaid, paymentType: newStatus }
                    });
                }
            }

            return { id, ...newPayment };
        });

        res.status(201).json(result);
    } catch (error) { res.status(error.status || 500).json({ error: error.message }); }
});

app.delete('/api/payments/:id', async (req, res) => {
    try {
        const paymentId = req.params.id;
        const result = await executeTransaction(async () => {
            const payment = await getById('payments', paymentId);
            if (!payment) {
                const err = new Error('Payment not found');
                err.status = 404;
                throw err;
            }
            if (payment.isVoided) {
                const err = new Error('Payment is already voided');
                err.status = 400;
                throw err;
            }
            const payAmount = Number(payment.amount) || 0;
            let sale = null;
            if (payment.saleId) {
                sale = await getById('sales', payment.saleId);
                if (sale) {
                    const currentRemaining = roundMoney(Number(sale.remainingBalance ?? sale.customerDetails?.remainingBalance ?? 0));
                    const currentPaid = roundMoney(Number(sale.amountPaid ?? sale.customerDetails?.amountPaid ?? 0));
                    const saleTotal = roundMoney(Number(sale.total) || (currentRemaining + payAmount));
                    const newRemaining = roundMoney(Math.min(saleTotal, currentRemaining + payAmount));
                    const newPaid = roundMoney(Math.max(0, currentPaid - payAmount));
                    const newStatus = newPaid <= 0 ? 'Pending' : 'Partial';
                    await update('sales', payment.saleId, {
                        remainingBalance: newRemaining,
                        amountPaid: newPaid,
                        paymentType: newStatus,
                        customerDetails: {
                            ...sale.customerDetails,
                            remainingBalance: newRemaining,
                            amountPaid: newPaid,
                            paymentType: newStatus
                        }
                    });
                }
            }

            let targetCustId = payment.customerId && payment.customerId !== 'walk-in' ? payment.customerId : (sale?.customerId);
            let customer = targetCustId ? await getById('customers', targetCustId) : null;
            if (!customer) {
                const allCusts = await getAll('customers');
                const searchName = payment.customerName || sale?.customerName || (sale?.customerDetails?.name);
                if (searchName) {
                    customer = allCusts.find(c => c.name && c.name.trim().toLowerCase() === searchName.trim().toLowerCase());
                    if (customer) targetCustId = customer.id;
                }
            }
            if (customer && targetCustId) {
                await update('customers', targetCustId, {
                    balance: roundMoney((Number(customer.balance) || 0) + payAmount),
                    totalPaid: roundMoney(Math.max(0, (Number(customer.totalPaid) || 0) - payAmount))
                });
            }
            await update('payments', paymentId, { isVoided: true, status: 'Voided', voidedAt: Date.now() });
            return { message: 'Customer payment voided successfully', isVoided: true };
        });
        res.json(result);
    } catch (err) { res.status(err.status || 500).json({ error: err.message }); }
});

// ============================================================================================
// SALES API
// ============================================================================================

app.get('/api/sales', async (req, res) => {
    try {
        const sales = await getAll('sales');
        const filtered = req.query.includeVoided === 'true' ? sales : sales.filter(s => !s.isVoided);
        res.json(filtered);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/sales/next-invoice', async (req, res) => {
    try {
        db.all(`SELECT data FROM sales`, (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            let maxInv = 0;
            if (rows) {
                rows.forEach(r => {
                    try {
                        const d = JSON.parse(r.data);
                        const inv = Number(d.invoiceNumber);
                        if (!isNaN(inv) && inv > maxInv) maxInv = inv;
                    } catch (e) {}
                });
            }
            db.get(`SELECT value FROM counters WHERE id = 'invoiceNumber'`, (err, row) => {
                if (err) return res.status(500).json({ error: err.message });
                const currentNumber = row ? row.value : 0;
                const baseNumber = (maxInv > 0 && currentNumber > maxInv) ? maxInv : Math.max(currentNumber, maxInv);
                res.json({ nextInvoiceNumber: baseNumber + 1 });
            });
        });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/sales', async (req, res) => {
    try {
        const { items, total, customerDetails = {}, shopId, type } = req.body || {};

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Sales order must contain at least one item.' });
        }

        for (const item of items) {
            const qty = Number(item.quantity);
            if (isNaN(qty) || qty <= 0) {
                return res.status(400).json({ error: `Invalid item quantity (${item.quantity}). Quantity must be a positive number.` });
            }
            const price = Number(item.price ?? item.salePrice ?? item.costPrice ?? 0);
            if (isNaN(price) || price < 0) {
                return res.status(400).json({ error: `Invalid item price (${item.price}). Price cannot be negative.` });
            }
        }

        // Server-side recomputation of invoice total from line items with 2-decimal precision
        const computedItemTotal = roundMoney(items.reduce((sum, item) => {
            const qty = Number(item.quantity) || 0;
            const price = Number(item.price ?? item.salePrice ?? item.costPrice ?? 0);
            return sum + (qty * price);
        }, 0));

        const parsedTotal = total !== undefined && !isNaN(Number(total)) ? roundMoney(total) : computedItemTotal;
        if (parsedTotal < 0) {
            return res.status(400).json({ error: 'Total amount must be a non-negative number.' });
        }
        // Integrity check: If total is supplied, verify it doesn't deviate from line items sum
        if (computedItemTotal > 0 && Math.abs(parsedTotal - computedItemTotal) > 0.5) {
            return res.status(400).json({ error: `Invoice total (${parsedTotal}) does not match line items sum (${computedItemTotal}).` });
        }

        const saleId = generateId();
        const { date: providedDate } = req.body || {};
        const now = Date.now();
        let date = now;
        if (providedDate) {
            const pDate = new Date(providedDate);
            const todayDateStr = new Date().toISOString().slice(0, 10);
            const pDateStr = !isNaN(pDate.getTime()) ? pDate.toISOString().slice(0, 10) : '';
            if (pDateStr === todayDateStr && pDate.getUTCHours() === 0 && pDate.getUTCMinutes() === 0) {
                date = now;
            } else {
                date = Number(providedDate) || pDate.getTime() || now;
            }
        }
        const remainingBalance = roundMoney(parsedTotal - (Number(customerDetails.amountPaid) || 0));
        const shopIdValue = shopId || 'shop-1';
        const paymentType = customerDetails.paymentType || 'Full';

        const rawType = (type || 'Sale').trim();
        const normalizedType = rawType.toLowerCase();
        const isQuotation = normalizedType === 'quotation';
        const isReturn = normalizedType === 'return';
        const effectiveType = isQuotation ? 'Quotation' : (isReturn ? 'Return' : 'Sale');

        let originalSale = null;
        if (isReturn) {
            const targetSaleId = req.body.originalSaleId || req.body.saleId;
            const targetInvoiceNum = req.body.originalInvoiceNumber || req.body.invoiceNumber || customerDetails.originalInvoiceNumber || customerDetails.invoiceNumber;
            if (targetSaleId) {
                originalSale = await getById('sales', targetSaleId);
            }
            if (!originalSale && targetInvoiceNum) {
                const allSales = await getAll('sales');
                const numOnly = String(targetInvoiceNum).replace(/[^0-9]/g, '');
                originalSale = allSales.find(s => 
                    s.invoiceNumber === Number(targetInvoiceNum) || 
                    String(s.invoiceNumber) === String(targetInvoiceNum) || 
                    (numOnly && String(s.invoiceNumber) === numOnly) ||
                    (String(targetInvoiceNum).length >= 8 && s.id && s.id.toLowerCase().startsWith(String(targetInvoiceNum).toLowerCase()))
                );
            }
            if (!originalSale) {
                return res.status(400).json({ error: 'Sales returns must reference a valid original sales invoice.' });
            }
            if (originalSale.type === 'Quotation' || originalSale.type === 'Return') {
                return res.status(400).json({ error: 'Cannot process a return against a quotation or another return.' });
            }
            if (originalSale.isVoided) {
                return res.status(400).json({ error: 'Cannot process a return against a voided invoice.' });
            }

            for (const item of items) {
                const pid = item.id || item.productId;
                const origItem = (originalSale.items || []).find(it => (it.id || it.productId) === pid || (it.name && item.name && it.name.trim().toLowerCase() === item.name.trim().toLowerCase()));
                if (!origItem) {
                    return res.status(400).json({ error: `Item "${item.name || pid}" was not part of original invoice #${originalSale.invoiceNumber || originalSale.id.substring(0,8)}.` });
                }
                const soldQty = Number(origItem.quantity) || 0;
                const alreadyReturnedQty = Number(origItem.returnedQuantity) || 0;
                const maxReturnable = Math.max(0, soldQty - alreadyReturnedQty);
                const reqQty = Number(item.quantity) || 0;
                if (reqQty > maxReturnable) {
                    return res.status(400).json({
                        error: `Cannot return ${reqQty} units of "${origItem.name}". Only ${maxReturnable} units are eligible for return (${soldQty} originally sold, ${alreadyReturnedQty} already returned).`
                    });
                }
            }
        }

        // Validation: If bill is on partial or pending, customer name and phone are strictly required
        if (!isQuotation && !isReturn && (paymentType === 'Partial' || paymentType === 'Pending' || remainingBalance > 0)) {
            let cName = (customerDetails.customerName || customerDetails.name || '').trim();
            let cPhone = (customerDetails.customerPhone || customerDetails.phone || '').trim();

            if (!cPhone && customerDetails.customerId) {
                const existingCustomer = await getById('customers', customerDetails.customerId);
                if (existingCustomer && existingCustomer.phone) {
                    cPhone = existingCustomer.phone.trim();
                    customerDetails.customerPhone = cPhone;
                    customerDetails.phone = cPhone;
                }
            }

            if (!cName || cName.toLowerCase() === 'walk-in customer' || cName.toLowerCase() === 'walk-in') {
                return res.status(400).json({ error: 'Customer name is required for partial and pending bills.' });
            }
            if (!cPhone) {
                return res.status(400).json({ error: 'Customer phone number is required for partial and pending bills.' });
            }
        }

        const saleResult = await executeTransaction(async () => {
            // Pre-validate stock availability inside atomic transaction (prevents concurrent over-decrement)
            for (const item of items) {
                const pid = item.id || item.productId;
                if (!pid) continue;
                const product = await getById('products', pid);
                if (product && (!isQuotation && !isReturn) && (product.stock || 0) < item.quantity) {
                    const err = new Error(`Insufficient stock for product: ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`);
                    err.status = 400;
                    throw err;
                }
            }

            const invoiceNumber = await getNextInvoiceNumber();

            let initialPaid = 0;
            let debtCredited = 0;
            let effectiveRemainingBalance = 0;

            if (isReturn && originalSale) {
                const origRemaining = roundMoney(Math.max(0, Number(originalSale.remainingBalance ?? originalSale.customerDetails?.remainingBalance ?? 0)));
                const origPaid = roundMoney(Math.max(0, Number(originalSale.amountPaid ?? originalSale.initialPaid ?? originalSale.customerDetails?.amountPaid ?? 0)));
                const returnAmount = parsedTotal;

                // 1. First credit/cancel any outstanding debt on this invoice
                debtCredited = roundMoney(Math.min(returnAmount, origRemaining));

                // 2. The remaining portion of the return is cash refunded to the customer, capped by what was actually collected
                initialPaid = roundMoney(Math.min(Math.max(0, returnAmount - debtCredited), origPaid));
                effectiveRemainingBalance = 0;

                // 3. Update originalSale remaining balance and payment status
                const newOrigRemaining = roundMoney(Math.max(0, origRemaining - debtCredited));
                const newOrigPaid = roundMoney(Math.max(0, origPaid - initialPaid));
                const newOrigStatus = newOrigRemaining <= 0 ? 'Full' : (newOrigPaid <= 0 ? 'Pending' : 'Partial');
                await update('sales', originalSale.id, {
                    remainingBalance: newOrigRemaining,
                    amountPaid: newOrigPaid,
                    paymentType: newOrigStatus,
                    customerDetails: {
                        ...originalSale.customerDetails,
                        remainingBalance: newOrigRemaining,
                        amountPaid: newOrigPaid,
                        paymentType: newOrigStatus
                    }
                });
            } else {
                initialPaid = roundMoney(Number(customerDetails.amountPaid) || (customerDetails.paymentType === 'Full' ? parsedTotal : 0));
                effectiveRemainingBalance = roundMoney(parsedTotal - initialPaid);
            }

            const cName = (customerDetails.name || customerDetails.customerName || originalSale?.customerName || '').trim();
            const cPhone = (customerDetails.phone || customerDetails.customerPhone || originalSale?.customerPhone || '').trim();
            const cAddress = (customerDetails.address || customerDetails.customerAddress || originalSale?.customerAddress || '').trim();

            const sale = stripUndefined({
                id: saleId, invoiceNumber, type: effectiveType, total: parsedTotal, createdAt: now, date: date,
                customerName: cName || 'Walk-in Customer',
                customerPhone: cPhone || '',
                paymentType: isReturn ? (debtCredited > 0 ? (initialPaid > 0 ? 'Partial' : 'Pending') : 'Full') : (customerDetails.paymentType || 'Full'),
                dueDate: customerDetails.dueDate,
                amountPaid: initialPaid,
                initialPaid: initialPaid,
                customerDetails: {
                    ...customerDetails,
                    name: cName || 'Walk-in Customer',
                    customerName: cName || 'Walk-in Customer',
                    amountPaid: initialPaid,
                    initialPaid: initialPaid,
                    remainingBalance: effectiveRemainingBalance,
                    debtCredited: isReturn ? debtCredited : undefined,
                    dueDate: customerDetails.dueDate
                },
                remainingBalance: effectiveRemainingBalance,
                debtCredited: isReturn ? debtCredited : undefined,
                shopId: shopIdValue,
                items,
                originalSaleId: originalSale ? originalSale.id : null,
                originalInvoiceNumber: originalSale ? originalSale.invoiceNumber : null
            });

            await insert('sales', saleId, sale);

            // Update physical product inventory only for actual Sales or Returns (never for Quotations)
            if (!isQuotation) {
                for (const item of items) {
                    const pid = item.id || item.productId;
                    if (!pid) continue;
                    const product = await getById('products', pid);
                    if (product) {
                        const stockChange = isReturn ? item.quantity : -item.quantity;
                        await update('products', pid, { stock: Math.max(0, (product.stock || 0) + stockChange) });
                    }
                }
            }

            // If return, update original sale's returnedQuantity on line items and register returnId
            if (isReturn && originalSale) {
                const updatedOrigItems = (originalSale.items || []).map(origItem => {
                    const pid = origItem.id || origItem.productId;
                    const matched = items.find(it => (it.id || it.productId) === pid || (it.name && origItem.name && it.name.trim().toLowerCase() === origItem.name.trim().toLowerCase()));
                    if (matched) {
                        const addQty = Number(matched.quantity) || 0;
                        return {
                            ...origItem,
                            returnedQuantity: roundMoney((origItem.returnedQuantity || 0) + addQty)
                        };
                    }
                    return origItem;
                });
                const updatedReturnIds = [...(originalSale.returnIds || []), saleId];
                await update('sales', originalSale.id, {
                    items: updatedOrigItems,
                    returnIds: updatedReturnIds
                });
            }

            // Customer ledger synchronization & auto-profile creation
            if (!isQuotation && cName && cName.toLowerCase() !== 'walk-in customer' && cName.toLowerCase() !== 'walk-in') {
                let customerId = customerDetails.customerId || originalSale?.customerId;
                let existingCustomer = customerId ? await getById('customers', customerId) : null;
                if (!existingCustomer) {
                    const allCusts = await getAll('customers');
                    existingCustomer = allCusts.find(c =>
                        (c.name && c.name.trim().toLowerCase() === cName.toLowerCase()) &&
                        (!cPhone || !c.phone || c.phone.trim() === cPhone)
                    );
                    if (existingCustomer) {
                        customerId = existingCustomer.id;
                    }
                }

                if (!existingCustomer && !isReturn) {
                    // Auto-create customer profile on first credit/named billing
                    customerId = generateId();
                    existingCustomer = {
                        id: customerId,
                        name: cName,
                        phone: cPhone,
                        address: cAddress,
                        balance: 0,
                        totalPurchased: 0,
                        totalPaid: 0,
                        createdAt: date
                    };
                    await insert('customers', customerId, existingCustomer);
                }

                if (existingCustomer && customerId) {
                    const existingBalance = Number(existingCustomer.balance) || 0;
                    const existingTotalPurchased = Number(existingCustomer.totalPurchased) || 0;
                    const existingTotalPaid = Number(existingCustomer.totalPaid) || 0;

                    let newBal, newPurchased, newPaid;
                    if (isReturn) {
                        newBal = roundMoney(existingBalance - debtCredited);
                        newPurchased = roundMoney(Math.max(0, existingTotalPurchased - parsedTotal));
                        newPaid = roundMoney(Math.max(0, existingTotalPaid - initialPaid));
                    } else {
                        newBal = roundMoney(existingBalance + effectiveRemainingBalance);
                        newPurchased = roundMoney(existingTotalPurchased + parsedTotal);
                        newPaid = roundMoney(existingTotalPaid + initialPaid);
                    }

                    const customerData = stripUndefined({
                        name: cName || existingCustomer.name || 'Unknown',
                        phone: cPhone || existingCustomer.phone || '',
                        address: cAddress || existingCustomer.address || '',
                        balance: newBal,
                        totalPurchased: newPurchased,
                        totalPaid: newPaid,
                        updatedAt: date
                    });

                    await update('customers', customerId, customerData);
                    await update('sales', saleId, { customerId });
                }
            }

            return { id: saleId, ...sale };
        });

        res.status(201).json(saleResult);
    } catch (error) { res.status(error.status || 500).json({ error: error.message }); }
});

app.delete('/api/sales/:id', async (req, res) => {
    try {
        const saleId = req.params.id;
        const result = await executeTransaction(async () => {
            const sale = await getById('sales', saleId);
            if (!sale) {
                const err = new Error('Sale not found');
                err.status = 404;
                throw err;
            }
            if (sale.isVoided) {
                const err = new Error('Transaction is already voided');
                err.status = 400;
                throw err;
            }
            // 1. Revert product stock (if Sale, restore stock; if Return, deduct stock)
            if (sale.type !== 'Quotation' && sale.items && Array.isArray(sale.items)) {
                for (const item of sale.items) {
                    const pid = item.id || item.productId;
                    if (!pid) continue;
                    const product = await getById('products', pid);
                    if (product) {
                        const stockChange = sale.type === 'Return' ? -(Number(item.quantity) || 0) : (Number(item.quantity) || 0);
                        await update('products', pid, { stock: Math.max(0, (product.stock || 0) + stockChange) });
                    }
                }
            }
            // If Return, decrement returnedQuantity on original sale line items AND restore originalSale remaining balance/payment status
            if (sale.type === 'Return' && sale.originalSaleId) {
                const origSale = await getById('sales', sale.originalSaleId);
                if (origSale) {
                    let revertedOrigItems = origSale.items;
                    if (Array.isArray(origSale.items)) {
                        revertedOrigItems = origSale.items.map(origItem => {
                            const pid = origItem.id || origItem.productId;
                            const match = (sale.items || []).find(it => (it.id || it.productId) === pid || it.name === origItem.name);
                            if (match) {
                                const newReturned = Math.max(0, (origItem.returnedQuantity || 0) - (Number(match.quantity) || 0));
                                return { ...origItem, returnedQuantity: newReturned };
                            }
                            return origItem;
                        });
                    }
                    const revertedReturnIds = (origSale.returnIds || []).filter(rid => rid !== saleId);
                    const debtCredited = Number(sale.debtCredited ?? sale.customerDetails?.debtCredited ?? (sale.total || 0));
                    const cashRefunded = Number(sale.initialPaid ?? sale.amountPaid) || 0;
                    const restoredRemaining = roundMoney((Number(origSale.remainingBalance) || 0) + debtCredited);
                    const restoredPaid = roundMoney((Number(origSale.amountPaid) || 0) + cashRefunded);
                    const restoredStatus = restoredRemaining <= 0 ? 'Full' : (restoredPaid <= 0 ? 'Pending' : 'Partial');

                    await update('sales', sale.originalSaleId, {
                        items: revertedOrigItems,
                        returnIds: revertedReturnIds,
                        remainingBalance: restoredRemaining,
                        amountPaid: restoredPaid,
                        paymentType: restoredStatus,
                        customerDetails: {
                            ...(origSale.customerDetails || {}),
                            remainingBalance: restoredRemaining,
                            amountPaid: restoredPaid,
                            paymentType: restoredStatus
                        }
                    });
                }
            }
            // 2. Revert customer balance if applicable
            if (sale.customerId && sale.type !== 'Quotation') {
                const customer = await getById('customers', sale.customerId);
                if (customer) {
                    const isReturn = sale.type === 'Return';
                    const saleTotal = Number(sale.total) || 0;
                    const debtCredited = Number(sale.debtCredited ?? sale.customerDetails?.debtCredited ?? (isReturn ? (sale.total || 0) : 0));
                    const saleRem = isReturn ? debtCredited : (Number(sale.remainingBalance) || 0);
                    const salePaid = Number(sale.initialPaid ?? sale.amountPaid) || 0;
                    await update('customers', sale.customerId, {
                        balance: roundMoney((customer.balance || 0) + (isReturn ? debtCredited : -saleRem)),
                        totalPurchased: roundMoney((customer.totalPurchased || 0) + (isReturn ? saleTotal : -saleTotal)),
                        totalPaid: roundMoney((customer.totalPaid || 0) + (isReturn ? salePaid : -salePaid))
                    });
                }
            }
            // 3. Cleanly void linked customer settlement payments
            const allPayments = await getAll('payments');
            for (const p of allPayments) {
                if (p.saleId === saleId && !p.isVoided) {
                    await update('payments', p.id, { isVoided: true, status: 'Voided', voidedAt: Date.now() });
                    if (sale.customerId && sale.customerId !== 'walk-in') {
                        const customer = await getById('customers', sale.customerId);
                        if (customer) {
                            await update('customers', sale.customerId, {
                                balance: roundMoney((customer.balance || 0) + (Number(p.amount) || 0)),
                                totalPaid: roundMoney(Math.max(0, (customer.totalPaid || 0) - (Number(p.amount) || 0)))
                            });
                        }
                    }
                }
            }
            // 4. Soft-delete / retain row marked voided
            await update('sales', saleId, { isVoided: true, status: 'Voided', voidedAt: Date.now() });
            return { message: 'Transaction voided successfully', isVoided: true };
        });
        res.json(result);
    } catch (err) { res.status(err.status || 500).json({ error: err.message }); }
});

// ============================================================================================
// SUPPLIERS API
// ============================================================================================

app.get('/api/suppliers', async (req, res) => {
    try { res.json(await getAll('suppliers')); } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/suppliers', async (req, res) => {
    try {
        const { name, ...rest } = req.body || {};
        if (!name || typeof name !== 'string' || !name.trim()) {
            return res.status(400).json({ error: 'Supplier name is required.' });
        }
        const id = generateId();
        const newSupplier = { ...rest, name: name.trim(), balance: 0, totalPurchased: 0, totalPaid: 0, createdAt: Date.now() };
        await insert('suppliers', id, newSupplier);
        res.status(201).json({ id, ...newSupplier });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/suppliers/:id', async (req, res) => {
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
});

app.delete('/api/suppliers/:id', async (req, res) => {
    try {
        await remove('suppliers', req.params.id);
        res.json({ message: 'Supplier deleted' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// ============================================================================================
// PURCHASES API
// ============================================================================================

app.get('/api/purchases', async (req, res) => {
    try {
        const purchases = await getAll('purchases');
        const filtered = req.query.includeVoided === 'true' ? purchases : purchases.filter(p => !p.isVoided);
        res.json(filtered);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/purchases', async (req, res) => {
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

        const totalAmount = roundMoney(items.reduce((sum, item) => sum + (Number(item.total) || 0), 0));
        if (totalAmount <= 0) {
            return res.status(400).json({ error: 'Total purchase amount must be greater than zero.' });
        }

        const parsedPaid = roundMoney(Number(paidAmount) || 0);
        if (parsedPaid < 0) {
            return res.status(400).json({ error: 'Paid amount cannot be negative.' });
        }
        if (parsedPaid > totalAmount) {
            return res.status(400).json({ error: 'Immediate paid amount cannot exceed total purchase amount.' });
        }

        const purchaseId = generateId();
        const { date: providedDate } = req.body || {};
        const now = Date.now();
        let date = now;
        if (providedDate) {
            const pDate = new Date(providedDate);
            const todayDateStr = new Date().toISOString().slice(0, 10);
            const pDateStr = !isNaN(pDate.getTime()) ? pDate.toISOString().slice(0, 10) : '';
            // If date provided is midnight UTC of today (from datepicker), use current time
            if (pDateStr === todayDateStr && pDate.getUTCHours() === 0 && pDate.getUTCMinutes() === 0) {
                date = now;
            } else {
                date = Number(providedDate) || pDate.getTime() || now;
            }
        }
        const supplierName = supplier?.name || 'Unknown';
        const remainingAmount = roundMoney(totalAmount - parsedPaid);

        const isAdjustment = req.body.isAdjustment === true || items.some(i => i.productId === 'adjustment' || i.name === 'Pending Balance Adjustment');
        const effectiveType = isAdjustment ? 'Opening Balance' : 'Purchase';

        await executeTransaction(async () => {
            const purchase = {
                id: purchaseId, supplierId, supplierName, totalAmount, paidAmount: parsedPaid, initialPaid: parsedPaid, remainingAmount, createdAt: now, date: date, shopId: shopId || 'shop-1', items,
                type: effectiveType, isAdjustment: !!isAdjustment
            };
            await insert('purchases', purchaseId, purchase);

            if (!isAdjustment) {
                for (const item of items) {
                    const pid = item.productId || item.id;
                    if (pid === 'adjustment') continue;
                    const product = await getById('products', pid);
                    if (product) {
                        await update('products', pid, {
                            stock: (product.stock || 0) + (Number(item.quantity) || 0),
                            purchasePrice: Number(item.costPrice) || product.purchasePrice,
                            supplierId, supplierName
                        });
                    }
                }
            }

            const currentSupplier = await getById('suppliers', supplierId);
            await update('suppliers', supplierId, {
                totalPurchased: roundMoney((Number(currentSupplier.totalPurchased) || 0) + totalAmount),
                totalPaid: roundMoney((Number(currentSupplier.totalPaid) || 0) + parsedPaid),
                balance: roundMoney((Number(currentSupplier.balance) || 0) + remainingAmount),
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
                    createdAt: (now || Date.now()) + 1000,
                    date: (date || now || Date.now()) + 1000,
                    method: 'Cash',
                    note: `Immediate payment for Purchase #${purchaseId}`
                });
            }
        });

        res.status(201).json({ id: purchaseId, message: 'Purchase recorded' });
    } catch (error) { res.status(error.status || 500).json({ error: error.message }); }
});

app.delete('/api/purchases/:id', async (req, res) => {
    try {
        const purchaseId = req.params.id;
        const result = await executeTransaction(async () => {
            const purchase = await getById('purchases', purchaseId);
            if (!purchase) {
                const err = new Error('Purchase not found');
                err.status = 404;
                throw err;
            }
            if (purchase.isVoided) {
                const err = new Error('Purchase is already voided');
                err.status = 400;
                throw err;
            }
            // 1. Revert product stock
            if (!purchase.isAdjustment && purchase.items && Array.isArray(purchase.items)) {
                for (const item of purchase.items) {
                    const pid = item.productId || item.id;
                    if (!pid || pid === 'adjustment') continue;
                    const product = await getById('products', pid);
                    if (product) {
                        const newStock = Math.max(0, (product.stock || 0) - (Number(item.quantity) || 0));
                        await update('products', pid, { stock: newStock });
                    }
                }
            }
            // 2. Revert supplier balance & totals
            if (purchase.supplierId) {
                const supplier = await getById('suppliers', purchase.supplierId);
                if (supplier) {
                    const purTotal = Number(purchase.totalAmount) || 0;
                    const purPaid = Number(purchase.paidAmount) || 0;
                    const purRemaining = Number(purchase.remainingAmount) || (purTotal - purPaid);
                    await update('suppliers', purchase.supplierId, {
                        totalPurchased: roundMoney(Math.max(0, (Number(supplier.totalPurchased) || 0) - purTotal)),
                        totalPaid: roundMoney(Math.max(0, (Number(supplier.totalPaid) || 0) - purPaid)),
                        balance: roundMoney(Math.max(0, (Number(supplier.balance) || 0) - purRemaining))
                    });
                }
            }
            // 3. Void linked immediate payments, unlink later payments
            const allSupPayments = await getAll('supplierPayments');
            for (const sp of allSupPayments) {
                if (sp.purchaseId === purchaseId && !sp.isVoided) {
                    if (sp.isImmediate) {
                        await update('supplierPayments', sp.id, { isVoided: true, status: 'Voided', voidedAt: Date.now() });
                    } else {
                        await update('supplierPayments', sp.id, { purchaseId: null });
                    }
                }
            }
            // 4. Soft-delete / retain row marked voided
            await update('purchases', purchaseId, { isVoided: true, status: 'Voided', voidedAt: Date.now() });
            return { message: 'Purchase voided successfully', isVoided: true };
        });
        res.json(result);
    } catch (err) { res.status(err.status || 500).json({ error: err.message }); }
});

// ============================================================================================
// SUPPLIER PAYMENTS API
// ============================================================================================

app.get('/api/supplier-payments', async (req, res) => {
    try {
        const supPayments = await getAll('supplierPayments');
        const filtered = req.query.includeVoided === 'true' ? supPayments : supPayments.filter(sp => !sp.isVoided);
        res.json(filtered);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/supplier-payments', async (req, res) => {
    try {
        const { supplierId, amount } = req.body || {};
        if (!supplierId) {
            return res.status(400).json({ error: 'Supplier ID is required.' });
        }
        const parsedAmount = roundMoney(Number(amount));
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            return res.status(400).json({ error: 'Payment amount must be a positive number.' });
        }

        const paymentResult = await executeTransaction(async () => {
            const supplier = await getById('suppliers', supplierId);
            if (!supplier) {
                const err = new Error('Supplier not found.');
                err.status = 404;
                throw err;
            }

            const currentBalance = roundMoney(Number(supplier.balance) || 0);
            if (currentBalance <= 0) {
                const err = new Error('Cannot record payment: Supplier has no pending dues (balance is 0).');
                err.status = 400;
                throw err;
            }
            if (parsedAmount > currentBalance) {
                const err = new Error('Payment amount cannot exceed outstanding supplier dues.');
                err.status = 400;
                throw err;
            }
            const paymentId = generateId();
            let targetPurchaseId = req.body.purchaseId || null;

            // FIFO: If no explicit purchaseId was provided, allocate payment across supplier's open purchases
            const allPurchases = await getAll('purchases');
            const openPurchases = allPurchases
                .filter(p => p.supplierId === supplierId && ((p.remainingAmount != null ? p.remainingAmount : (p.totalAmount - (p.paidAmount || 0))) > 0))
                .sort((a, b) => (a.createdAt || a.date || 0) - (b.createdAt || b.date || 0));

            let unallocated = parsedAmount;
            for (const pur of openPurchases) {
                if (unallocated <= 0) break;
                const currentRemaining = pur.remainingAmount != null ? pur.remainingAmount : (pur.totalAmount - (pur.paidAmount || 0));
                const alloc = Math.min(unallocated, currentRemaining);
                const newPaid = roundMoney((pur.paidAmount || 0) + alloc);
                const newRemaining = roundMoney(Math.max(0, pur.totalAmount - newPaid));
                await update('purchases', pur.id, {
                    paidAmount: newPaid,
                    remainingAmount: newRemaining
                });
                if (!targetPurchaseId) {
                    targetPurchaseId = pur.id;
                }
                unallocated -= alloc;
            }

            const now = Date.now();
            const payment = {
                ...stripUndefined(req.body),
                amount: parsedAmount,
                isImmediate: false,
                purchaseId: targetPurchaseId,
                note: req.body.note || (targetPurchaseId ? `Payment for Purchase #${targetPurchaseId.substr(0, 8)}` : ''),
                createdAt: now,
                date: now
            };
            await insert('supplierPayments', paymentId, payment);

            await update('suppliers', supplierId, {
                balance: roundMoney(Math.max(0, currentBalance - parsedAmount)),
                totalPaid: roundMoney((Number(supplier.totalPaid) || 0) + parsedAmount)
            });

            return { id: paymentId, ...payment };
        });

        res.status(201).json(paymentResult);
    } catch (error) { res.status(error.status || 500).json({ error: error.message }); }
});

app.delete('/api/supplier-payments/:id', async (req, res) => {
    try {
        const paymentId = req.params.id;
        const result = await executeTransaction(async () => {
            const payment = await getById('supplierPayments', paymentId);
            if (!payment) {
                const err = new Error('Supplier payment not found');
                err.status = 404;
                throw err;
            }
            if (payment.isVoided) {
                const err = new Error('Supplier payment is already voided');
                err.status = 400;
                throw err;
            }
            const payAmount = Number(payment.amount) || 0;
            if (payment.supplierId) {
                const supplier = await getById('suppliers', payment.supplierId);
                if (supplier) {
                    await update('suppliers', payment.supplierId, {
                        balance: roundMoney((Number(supplier.balance) || 0) + payAmount),
                        totalPaid: roundMoney(Math.max(0, (Number(supplier.totalPaid) || 0) - payAmount))
                    });
                }
            }
            if (payment.purchaseId) {
                const purchase = await getById('purchases', payment.purchaseId);
                if (purchase) {
                    const newPaid = Math.max(0, (Number(purchase.paidAmount) || 0) - payAmount);
                    const newRem = Math.min(Number(purchase.totalAmount) || 0, (Number(purchase.remainingAmount) || 0) + payAmount);
                    await update('purchases', payment.purchaseId, {
                        paidAmount: newPaid,
                        remainingAmount: newRem
                    });
                }
            }
            await update('supplierPayments', paymentId, { isVoided: true, status: 'Voided', voidedAt: Date.now() });
            return { message: 'Supplier payment voided successfully', isVoided: true };
        });
        res.json(result);
    } catch (err) { res.status(err.status || 500).json({ error: err.message }); }
});

// ============================================================================================
// EXPENSES API
// ============================================================================================

app.get('/api/expenses', async (req, res) => {
    try { res.json(await getAll('expenses')); } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/expenses', async (req, res) => {
    try {
        const id = generateId();
        const newExpense = { ...req.body, createdAt: Date.now() };
        await insert('expenses', id, newExpense);
        res.status(201).json({ id, ...newExpense });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// ============================================================================================
// BACKUP & RESTORE APIS
// ============================================================================================

// List available backups (past week & all available)
app.get('/api/backups', (req, res) => {
    try {
        if (!fs.existsSync(backupsDir)) {
            return res.json([]);
        }
        ensureHourlyBackup();
        const files = fs.readdirSync(backupsDir)
            .filter(f => f.endsWith('.sqlite') || f.endsWith('.db'))
            .map(filename => {
                const filePath = path.join(backupsDir, filename);
                const stats = fs.statSync(filePath);
                const d = new Date(stats.mtimeMs);
                const dateStr = d.toISOString().split('T')[0];
                const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                const now = new Date();
                const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
                let relLabel = `${diffDays} days ago`;
                if (diffDays === 0) relLabel = 'Today';
                else if (diffDays === 1) relLabel = 'Yesterday';

                return {
                    filename,
                    size: stats.size,
                    sizeFormatted: (stats.size / 1024).toFixed(1) + ' KB',
                    createdAt: stats.mtimeMs,
                    label: `${dateStr} (${relLabel} - ${timeStr})`
                };
            })
            .sort((a, b) => b.createdAt - a.createdAt);

        res.json(files);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create an immediate backup snapshot
app.post('/api/backups/create', (req, res) => {
    try {
        const backup = createBackupFile('backup-manual');
        if (!backup) {
            return res.status(500).json({ error: 'Failed to create database snapshot.' });
        }
        res.status(201).json({ success: true, backup });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Download a backup file
app.get('/api/backups/download/:filename', (req, res) => {
    try {
        const safeName = path.basename(req.params.filename);
        const filePath = path.join(backupsDir, safeName);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Backup file not found.' });
        }
        res.setHeader('Content-Type', 'application/x-sqlite3');
        res.download(filePath, safeName);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Switch / Restore database to a selected backup
app.post('/api/backups/restore', async (req, res) => {
    try {
        const { filename } = req.body || {};
        if (!filename) {
            return res.status(400).json({ error: 'Filename is required for database restore.' });
        }
        const safeName = path.basename(filename);
        const sourcePath = path.join(backupsDir, safeName);
        if (!fs.existsSync(sourcePath)) {
            return res.status(404).json({ error: `Backup file ${safeName} does not exist.` });
        }

        // 1. Automatically create a safety backup of current state first
        createBackupFile('pre-restore-safety');

        // 2. Close active database connections
        if (db) {
            await new Promise((resolve) => db.close(() => resolve()));
        }

        // 3. Replace database.sqlite with the selected backup
        fs.copyFileSync(sourcePath, dbPath);

        // 4. Re-initialize database
        await new Promise((resolve, reject) => {
            initDb((err) => {
                if (err) return reject(err);
                resolve();
            });
        });

        console.log(`[Backup] Successfully switched database to: ${safeName}`);
        res.json({ success: true, message: `Database successfully restored to ${safeName}` });
    } catch (error) {
        console.error('[Backup] Restore error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================================
// UNDO & MISTAKE RECOVERY APIS
// ============================================================================================

app.get('/api/undo/status', async (req, res) => {
    try {
        // 1. Fetch latest active (non-voided) transaction across sales, purchases, supplierPayments, payments
        const [sales, purchases, spList, cpList] = await Promise.all([
            getAll('sales').catch(() => []),
            getAll('purchases').catch(() => []),
            getAll('supplierPayments').catch(() => []),
            getAll('payments').catch(() => [])
        ]);

        const txList = [
            ...sales.filter(s => !s.isVoided).map(s => ({
                id: s.id,
                entityType: 'sale',
                category: s.type === 'Return' ? 'Return' : 'Sale',
                invoiceNumber: s.invoiceNumber || s.id.substring(0, 8),
                date: s.date || s.createdAt || 0,
                entityName: s.customerName || (s.customerDetails && s.customerDetails.name) || 'Walk-in Customer',
                amount: Number(s.total || s.grandTotal || 0),
                details: Array.isArray(s.items) ? `${s.items.length} items (${s.items.map(i => i.name).filter(Boolean).slice(0, 2).join(', ')}${s.items.length > 2 ? '...' : ''})` : 'Sale transaction'
            })),
            ...purchases.filter(p => !p.isVoided).map(p => ({
                id: p.id,
                entityType: 'purchase',
                category: 'Purchase',
                invoiceNumber: p.id.substring(0, 8),
                date: p.date || p.createdAt || 0,
                entityName: p.supplierName || 'Supplier',
                amount: Number(p.totalAmount || 0),
                details: Array.isArray(p.items) ? `${p.items.length} items procured` : 'Stock purchase'
            })),
            ...spList.filter(sp => !sp.isVoided && !sp.isImmediate).map(sp => ({
                id: sp.id,
                entityType: 'supplier-payment',
                category: 'Supplier Payment',
                invoiceNumber: sp.id.substring(0, 8),
                date: sp.date || sp.createdAt || 0,
                entityName: sp.supplierName || 'Supplier',
                amount: Number(sp.amount || 0),
                details: sp.note || (sp.purchaseId ? `For Purchase #${sp.purchaseId.substring(0, 8)}` : 'Vendor Payment')
            })),
            ...cpList.filter(cp => !cp.isVoided).map(cp => ({
                id: cp.id,
                entityType: 'customer-payment',
                category: 'Customer Payment',
                invoiceNumber: cp.id.substring(0, 8),
                date: cp.date || cp.createdAt || 0,
                entityName: cp.customerName || 'Customer',
                amount: Number(cp.amount || 0),
                details: cp.note || (cp.saleId ? `For Sale #${cp.saleId.substring(0, 8)}` : 'Debt Settlement')
            }))
        ].sort((a, b) => (b.date || 0) - (a.date || 0));

        const lastTransaction = txList.length > 0 ? txList[0] : null;

        // 2. Identify candidate hourly / prior snapshot for 1-hour rollback
        let candidateSnapshot = null;
        if (fs.existsSync(backupsDir)) {
            ensureHourlyBackup();
            const now = Date.now();
            const backups = fs.readdirSync(backupsDir)
                .filter(f => (f.endsWith('.sqlite') || f.endsWith('.db')) && !f.startsWith('pre-undo-safety'))
                .map(filename => {
                    const filePath = path.join(backupsDir, filename);
                    const stats = fs.statSync(filePath);
                    const ageMinutes = Math.round((now - stats.mtimeMs) / (60 * 1000));
                    return {
                        filename,
                        size: stats.size,
                        sizeFormatted: (stats.size / 1024).toFixed(1) + ' KB',
                        mtime: stats.mtimeMs,
                        ageMinutes
                    };
                })
                .sort((a, b) => b.mtime - a.mtime);

            // Prefer snapshots that are at least 15 minutes old (or second most recent)
            const target = backups.find(b => b.ageMinutes >= 15) || (backups.length > 1 ? backups[1] : backups[0]);
            if (target) {
                const d = new Date(target.mtime);
                candidateSnapshot = {
                    ...target,
                    label: `${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Karachi' })} (${target.ageMinutes < 60 ? `${target.ageMinutes} mins ago` : `${Math.round(target.ageMinutes / 60)} hr ago`})`,
                    timeStr: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Karachi' }),
                    dateStr: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Karachi' })
                };
            }
        }

        res.json({ success: true, lastTransaction, candidateSnapshot });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/undo/last-transaction', async (req, res) => {
    try {
        const { id, entityType } = req.body || {};
        let targetId = id;
        let targetType = entityType;

        if (!targetId || !targetType) {
            const [sales, purchases, spList, cpList] = await Promise.all([
                getAll('sales').catch(() => []),
                getAll('purchases').catch(() => []),
                getAll('supplierPayments').catch(() => []),
                getAll('payments').catch(() => [])
            ]);

            const txList = [
                ...sales.filter(s => !s.isVoided).map(s => ({ id: s.id, entityType: 'sale', date: s.date || s.createdAt || 0 })),
                ...purchases.filter(p => !p.isVoided).map(p => ({ id: p.id, entityType: 'purchase', date: p.date || p.createdAt || 0 })),
                ...spList.filter(sp => !sp.isVoided && !sp.isImmediate).map(sp => ({ id: sp.id, entityType: 'supplier-payment', date: sp.date || sp.createdAt || 0 })),
                ...cpList.filter(cp => !cp.isVoided).map(cp => ({ id: cp.id, entityType: 'customer-payment', date: cp.date || cp.createdAt || 0 }))
            ].sort((a, b) => (b.date || 0) - (a.date || 0));

            if (txList.length === 0) {
                return res.status(404).json({ error: 'No recent transaction found to undo.' });
            }
            targetId = txList[0].id;
            targetType = txList[0].entityType;
        }

        let result;
        if (targetType === 'sale') {
            const sale = await getById('sales', targetId);
            if (!sale) return res.status(404).json({ error: 'Sale not found' });
            if (sale.isVoided) return res.status(400).json({ error: 'Sale is already voided' });
            result = await executeTransaction(async () => {
                if (sale.type !== 'Quotation' && Array.isArray(sale.items)) {
                    for (const item of sale.items) {
                        const pid = item.id || item.productId;
                        if (!pid) continue;
                        const product = await getById('products', pid);
                        if (product) {
                            const stockChange = sale.type === 'Return' ? -(Number(item.quantity) || 0) : (Number(item.quantity) || 0);
                            await update('products', pid, { stock: Math.max(0, (product.stock || 0) + stockChange) });
                        }
                    }
                }
                if (sale.customerId) {
                    const customer = await getById('customers', sale.customerId);
                    if (customer) {
                        const total = Number(sale.total) || 0;
                        const remaining = Number(sale.remainingAmount != null ? sale.remainingAmount : (total - (Number(sale.amountPaid) || 0)));
                        const newBal = sale.type === 'Return' ? (Number(customer.balance) || 0) + total : (Number(customer.balance) || 0) - remaining;
                        await update('customers', sale.customerId, {
                            balance: roundMoney(newBal),
                            totalPurchases: roundMoney(Math.max(0, (Number(customer.totalPurchases) || 0) - total))
                        });
                    }
                }
                await update('sales', targetId, { isVoided: true, status: 'Voided', voidedAt: Date.now() });
                return { message: `Sale ${sale.invoiceNumber || targetId.substring(0,8)} undone successfully! Stock and customer balance restored.` };
            });
        } else if (targetType === 'purchase') {
            const purchase = await getById('purchases', targetId);
            if (!purchase) return res.status(404).json({ error: 'Purchase not found' });
            if (purchase.isVoided) return res.status(400).json({ error: 'Purchase is already voided' });
            result = await executeTransaction(async () => {
                if (Array.isArray(purchase.items)) {
                    for (const item of purchase.items) {
                        const pid = item.id || item.productId;
                        if (!pid) continue;
                        const product = await getById('products', pid);
                        if (product) {
                            await update('products', pid, { stock: Math.max(0, (product.stock || 0) - (Number(item.quantity) || 0)) });
                        }
                    }
                }
                if (purchase.supplierId) {
                    const supplier = await getById('suppliers', purchase.supplierId);
                    if (supplier) {
                        const remaining = Number(purchase.remainingAmount != null ? purchase.remainingAmount : ((Number(purchase.totalAmount) || 0) - (Number(purchase.paidAmount) || 0)));
                        await update('suppliers', purchase.supplierId, {
                            balance: roundMoney(Math.max(0, (Number(supplier.balance) || 0) - remaining)),
                            totalPurchases: roundMoney(Math.max(0, (Number(supplier.totalPurchases) || 0) - (Number(purchase.totalAmount) || 0)))
                        });
                    }
                }
                await update('purchases', targetId, { isVoided: true, status: 'Voided', voidedAt: Date.now() });
                return { message: `Purchase #${targetId.substring(0,8)} undone successfully! Stock and supplier balance reverted.` };
            });
        } else if (targetType === 'supplier-payment') {
            const payment = await getById('supplierPayments', targetId);
            if (!payment) return res.status(404).json({ error: 'Supplier payment not found' });
            if (payment.isVoided) return res.status(400).json({ error: 'Payment is already voided' });
            result = await executeTransaction(async () => {
                const payAmount = Number(payment.amount) || 0;
                if (payment.supplierId) {
                    const supplier = await getById('suppliers', payment.supplierId);
                    if (supplier) {
                        await update('suppliers', payment.supplierId, {
                            balance: roundMoney((Number(supplier.balance) || 0) + payAmount),
                            totalPaid: roundMoney(Math.max(0, (Number(supplier.totalPaid) || 0) - payAmount))
                        });
                    }
                }
                if (payment.purchaseId) {
                    const purchase = await getById('purchases', payment.purchaseId);
                    if (purchase) {
                        await update('purchases', payment.purchaseId, {
                            paidAmount: Math.max(0, (Number(purchase.paidAmount) || 0) - payAmount),
                            remainingAmount: Math.min(Number(purchase.totalAmount) || 0, (Number(purchase.remainingAmount) || 0) + payAmount)
                        });
                    }
                }
                await update('supplierPayments', targetId, { isVoided: true, status: 'Voided', voidedAt: Date.now() });
                return { message: `Supplier payment undone successfully! Supplier balance reverted.` };
            });
        } else if (targetType === 'customer-payment') {
            const payment = await getById('payments', targetId);
            if (!payment) return res.status(404).json({ error: 'Customer payment not found' });
            if (payment.isVoided) return res.status(400).json({ error: 'Payment is already voided' });
            result = await executeTransaction(async () => {
                const payAmount = Number(payment.amount) || 0;
                let sale = null;
                if (payment.saleId) {
                    sale = await getById('sales', payment.saleId);
                    if (sale) {
                        const currentRemaining = roundMoney(Number(sale.remainingBalance ?? sale.customerDetails?.remainingBalance ?? 0));
                        const currentPaid = roundMoney(Number(sale.amountPaid ?? sale.customerDetails?.amountPaid ?? 0));
                        const saleTotal = roundMoney(Number(sale.total) || (currentRemaining + payAmount));
                        const newRemaining = roundMoney(Math.min(saleTotal, currentRemaining + payAmount));
                        const newPaid = roundMoney(Math.max(0, currentPaid - payAmount));
                        const newStatus = newPaid <= 0 ? 'Pending' : 'Partial';
                        await update('sales', payment.saleId, {
                            remainingBalance: newRemaining,
                            amountPaid: newPaid,
                            paymentType: newStatus,
                            customerDetails: {
                                ...sale.customerDetails,
                                remainingBalance: newRemaining,
                                amountPaid: newPaid,
                                paymentType: newStatus
                            }
                        });
                    }
                }

                let targetCustId = payment.customerId && payment.customerId !== 'walk-in' ? payment.customerId : (sale?.customerId);
                let customer = targetCustId ? await getById('customers', targetCustId) : null;
                if (!customer) {
                    const allCusts = await getAll('customers');
                    const searchName = payment.customerName || sale?.customerName || (sale?.customerDetails?.name);
                    if (searchName) {
                        customer = allCusts.find(c => c.name && c.name.trim().toLowerCase() === searchName.trim().toLowerCase());
                        if (customer) targetCustId = customer.id;
                    }
                }
                if (customer && targetCustId) {
                    await update('customers', targetCustId, {
                        balance: roundMoney((Number(customer.balance) || 0) + payAmount),
                        totalPaid: roundMoney(Math.max(0, (Number(customer.totalPaid) || 0) - payAmount))
                    });
                }
                await update('payments', targetId, { isVoided: true, status: 'Voided', voidedAt: Date.now() });
                return { message: `Customer payment undone successfully! Customer balance reverted.` };
            });
        } else {
            return res.status(400).json({ error: 'Unknown transaction type.' });
        }

        res.json({ success: true, ...result });
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message });
    }
});

app.post('/api/undo/rollback-snapshot', async (req, res) => {
    try {
        const { filename } = req.body || {};
        let targetFile = filename;

        if (!targetFile && fs.existsSync(backupsDir)) {
            const now = Date.now();
            const backups = fs.readdirSync(backupsDir)
                .filter(f => (f.endsWith('.sqlite') || f.endsWith('.db')) && !f.startsWith('pre-undo-safety'))
                .map(f => ({ name: f, mtime: fs.statSync(path.join(backupsDir, f)).mtimeMs, ageMinutes: Math.round((now - fs.statSync(path.join(backupsDir, f)).mtimeMs) / (60 * 1000)) }))
                .sort((a, b) => b.mtime - a.mtime);

            const chosen = backups.find(b => b.ageMinutes >= 15) || (backups.length > 1 ? backups[1] : backups[0]);
            if (chosen) targetFile = chosen.name;
        }

        if (!targetFile) {
            return res.status(400).json({ error: 'No snapshot available to rollback to.' });
        }

        const safeName = path.basename(targetFile);
        const sourcePath = path.join(backupsDir, safeName);
        if (!fs.existsSync(sourcePath)) {
            return res.status(404).json({ error: `Snapshot file ${safeName} does not exist.` });
        }

        // 1. Safety snapshot of current database state before rollback
        createBackupFile('pre-undo-safety');

        // 2. Close active database connections
        if (db) {
            await new Promise((resolve) => db.close(() => resolve()));
        }

        // 3. Replace database.sqlite with chosen snapshot
        fs.copyFileSync(sourcePath, dbPath);

        // 4. Re-initialize database
        await new Promise((resolve, reject) => {
            initDb((err) => {
                if (err) return reject(err);
                resolve();
            });
        });

        console.log(`[Undo] Successfully rolled back database to: ${safeName}`);
        res.json({ success: true, message: `Database successfully restored to ${safeName}` });
    } catch (err) {
        console.error('[Undo] Rollback error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================================================================
// SYSTEM RESET API
// ============================================================================================

app.post('/api/reset', async (req, res) => {
    try {
        const adminToken = req.headers['x-admin-token'] || req.query.token;
        const configuredToken = process.env.ADMIN_RESET_TOKEN;
        const origin = req.headers.origin || '';
        const host = req.get('host') || req.headers.host || '';
        const isLocalOrSameOrigin = !origin || origin.includes('localhost') || origin.includes('127.0.0.1') || (host && origin.includes(host));

        if (process.env.ALLOW_DB_RESET !== 'true' && !isLocalOrSameOrigin) {
            return res.status(403).json({ error: 'Database reset is disabled. Set ALLOW_DB_RESET=true in .env to enable.' });
        }

        if (configuredToken && !isLocalOrSameOrigin && adminToken !== configuredToken) {
            return res.status(403).json({ error: 'Unauthorized: Invalid or missing admin reset token.' });
        }

        // Always take an automated safety snapshot before any wipe
        createBackupFile('pre-reset-safety');

        const tables = ['products', 'customers', 'payments', 'sales', 'suppliers', 'purchases', 'supplierPayments', 'expenses', 'stockTransfers', 'counters'];
        for (const table of tables) {
            await new Promise((resolve) => db.run(`DELETE FROM ${table}`, () => resolve()));
        }
        res.json({ message: 'Database reset successfully' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// ============================================================================================
// RECALCULATE BALANCES API  — fixes any existing double-counted totalPaid in the DB
// ============================================================================================

app.post('/api/recalculate-balances', async (req, res) => {
    try {
        const customers = await getAll('customers');
        const allPayments = await getAll('payments');
        const allSales = await getAll('sales');

        for (const customer of customers) {
            // Settlement payments made via Payments API
            const settlementPaid = allPayments
                .filter(p => p.customerId === customer.id)
                .reduce((sum, p) => sum + (p.amount || 0), 0);

            // Upfront checkout payments on sales (minus any return cash refunds)
            const upfrontPaid = allSales
                .filter(s => s.customerId === customer.id && s.type !== 'Quotation')
                .reduce((sum, s) => {
                    const saleSettlements = allPayments.filter(p => p.saleId === s.id).reduce((sSum, p) => sSum + (p.amount || 0), 0);
                    const init = s.initialPaid != null ? s.initialPaid : Math.max(0, (Number(s.customerDetails?.amountPaid ?? s.amountPaid ?? (s.paymentType === 'Full' ? s.total : 0)) || 0) - saleSettlements);
                    return sum + (s.type === 'Return' ? -init : init);
                }, 0);

            const totalPaid = settlementPaid + upfrontPaid;

            // Sum all non-quotation sale totals
            const totalPurchased = allSales
                .filter(s => s.customerId === customer.id && (s.type === 'Sale' || !s.type))
                .reduce((sum, s) => sum + (s.total || 0), 0);

            // Sum all return totals
            const totalReturned = allSales
                .filter(s => s.customerId === customer.id && s.type === 'Return')
                .reduce((sum, s) => sum + (s.total || 0), 0);

            const netPurchased = totalPurchased - totalReturned;
            // balance = what they still owe = netPurchased - totalPaid
            const balance = netPurchased - totalPaid;

            await update('customers', customer.id, { totalPaid, totalPurchased: netPurchased, balance });
        }

        res.json({ message: `Recalculated balances for ${customers.length} customers.` });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// Unmatched API routes return clean JSON 404
app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
});

// Catch-all: serve React app for any non-API route
if (fs.existsSync(frontendPath)) {
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api/')) return next();
        res.sendFile(path.join(frontendPath, 'index.html'));
    });
}

// Centralized Express Error Handler
app.use((err, req, res, next) => {
    console.error(`[Unhandled Error] ${req.method} ${req.url}:`, err.message || err);
    if (res.headersSent) return next(err);
    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production' ? 'Internal server error occurred.' : (err.message || 'Internal server error')
    });
});

// Start server
if (process.env.APP_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`Backend server running on port ${PORT}`);
    });
}

module.exports = app;
