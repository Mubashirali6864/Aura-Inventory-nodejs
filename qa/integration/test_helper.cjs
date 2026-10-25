const fs = require('fs');
const path = require('path');
const http = require('http');
const crypto = require('crypto');

async function createTestEnvironment() {
    const runId = crypto.randomUUID().slice(0, 8);
    const testDataDir = path.join(__dirname, '..', `.tmp_test_env_${runId}`);
    
    if (fs.existsSync(testDataDir)) {
        fs.rmSync(testDataDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDataDir, { recursive: true });

    process.env.APP_DATA_PATH = testDataDir;
    process.env.APP_ENV = 'test';
    process.env.ADMIN_RESET_TOKEN = 'test-admin-token-123';
    process.env.ALLOW_DB_RESET = 'true';

    // Fresh require of backend/index.js
    // Clear require cache for backend if needed
    delete require.cache[require.resolve('../../backend/index.js')];
    const app = require('../../backend/index.js');
    if (app.ready) {
        await app.ready();
    }

    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;

    function req(endpoint, method = 'GET', body = null, headers = {}) {
        return new Promise((resolve, reject) => {
            const payload = body ? JSON.stringify(body) : null;
            const request = http.request({
                hostname: '127.0.0.1',
                port,
                path: endpoint,
                method,
                headers: {
                    ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}),
                    ...headers
                }
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    let parsed = null;
                    try { parsed = JSON.parse(data); } catch (_) { parsed = data; }
                    resolve({ status: res.statusCode, data: parsed, headers: res.headers });
                });
            });
            request.on('error', reject);
            if (payload) request.write(payload);
            request.end();
        });
    }

    async function cleanup() {
        await new Promise((resolve) => server.close(resolve));
        if (app.closeDb) {
            await app.closeDb();
        }
        // Small delay for Windows file handles to be released
        await new Promise(r => setTimeout(r, 100));
        try {
            if (fs.existsSync(testDataDir)) {
                fs.rmSync(testDataDir, { recursive: true, force: true });
            }
        } catch (_) {}
    }

    return { app, server, port, req, cleanup, testDataDir };
}

module.exports = { createTestEnvironment };
