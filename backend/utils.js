const crypto = require('crypto');

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

// Floating-point precision helper: standardizes financial values to 2 decimal places
const roundMoney = (val) => Math.round((Number(val) || 0) * 100) / 100;

module.exports = {
    generateId,
    stripUndefined,
    roundMoney
};
