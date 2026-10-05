const { DatabaseSync } = require('node:sqlite');
const Module = require('module');
const origRequire = Module.prototype.require;

Module.prototype.require = function(pathStr) {
    if (pathStr === 'sqlite3') {
        return {
            verbose: () => ({
                Database: function(dbPath, cb) {
                    const db = new DatabaseSync(dbPath);
                    const wrapper = {
                        serialize: (fn) => fn(),
                        run: (sql, params, cb) => {
                            if (typeof params === 'function') {
                                cb = params;
                                params = [];
                            }
                            try {
                                const stmt = db.prepare(sql);
                                stmt.run(...(params || []));
                                if (cb) cb(null);
                            } catch (err) {
                                if (cb) cb(err);
                            }
                        },
                        get: (sql, params, cb) => {
                            if (typeof params === 'function') {
                                cb = params;
                                params = [];
                            }
                            try {
                                const stmt = db.prepare(sql);
                                const row = stmt.get(...(params || []));
                                if (cb) cb(null, row);
                            } catch (err) {
                                if (cb) cb(err, null);
                            }
                        },
                        all: (sql, params, cb) => {
                            if (typeof params === 'function') {
                                cb = params;
                                params = [];
                            }
                            try {
                                const stmt = db.prepare(sql);
                                const rows = stmt.all(...(params || []));
                                if (cb) cb(null, rows);
                            } catch (err) {
                                if (cb) cb(err, null);
                            }
                        }
                    };
                    if (cb) setTimeout(() => cb(null), 10);
                    return wrapper;
                }
            })
        };
    }
    return origRequire.apply(this, arguments);
};
