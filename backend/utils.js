const crypto = require('crypto');

// Helper function to generate unique IDs
const generateId = () => {
    return crypto.randomUUID();
};

// Helper to remove undefined fields recursively for JSON compatibility with recursion depth guard
const stripUndefined = (obj, depth = 0) => {
    if (!obj || typeof obj !== 'object' || depth > 20) return obj;
    Object.keys(obj).forEach(key => {
        if (obj[key] === undefined) {
            delete obj[key];
        } else if (obj[key] !== null && typeof obj[key] === 'object') {
            stripUndefined(obj[key], depth + 1);
        }
    });
    return obj;
};

// Floating-point precision helper: standardizes finite financial values to 2 decimal places
const roundMoney = (val) => {
    const num = Number(val);
    return Number.isFinite(num) ? Math.round(num * 100) / 100 : 0;
};

module.exports = {
    generateId,
    stripUndefined,
    roundMoney
};
