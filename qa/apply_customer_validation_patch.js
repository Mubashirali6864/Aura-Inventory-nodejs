const fs = require('fs');
const path = require('path');

const bundlePath = path.join(__dirname, '..', 'dist', 'assets', 'index-BQlSbgAO.js');
let content = fs.readFileSync(bundlePath, 'utf8');
console.log('Current bundle size:', content.length);

// 1. Patch Te validation
const targetTe = 'if(x==="Sale")for(const be of Xe){const We=e.find(Ue=>Ue.id===be.id);if(We&&be.quantity>We.stock){alert(`Insufficient stock for ${be.name}. Available: ${We.stock}, in cart: ${be.quantity}. Please reduce quantity.`);return}}';

const replTe = 'if(x==="Sale")for(const be of Xe){const We=e.find(Ue=>Ue.id===be.id);if(We&&be.quantity>We.stock){alert(`Insufficient stock for ${be.name}. Available: ${We.stock}, in cart: ${be.quantity}. Please reduce quantity.`);return}}if(x!=="Quotation"&&(he==="Partial"||he==="Pending"||Qe-rt>0)){const _cn=(V||"").trim(),_cp=(z||"").trim();if(!_cn||_cn.toLowerCase()==="walk-in customer"||_cn.toLowerCase()==="walk-in"){alert("Customer Name is required for Partial and Pending bills.");return}if(!_cp){alert("Customer Phone number is required for Partial and Pending bills.");return}}';

if (!content.includes(targetTe)) {
    console.error('Failed to locate targetTe!');
    process.exit(1);
}
content = content.replace(targetTe, replTe);
console.log('Patched Te validation.');

// 2. Patch Customer Name placeholder
const targetName = 'm.jsx("input",{placeholder:"Customer Name",className:"w-full pl-3 pr-8 py-2 rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-apple-blue/20 focus:border-apple-blue outline-none transition-all text-sm",value:V';

const replName = 'm.jsx("input",{placeholder:he==="Partial"||he==="Pending"?"Customer Name * (Required)":"Customer Name",className:`w-full pl-3 pr-8 py-2 rounded-lg bg-gray-50 border ${(he==="Partial"||he==="Pending")&&(!V||V.trim()===""||V==="Walk-in Customer")?"border-orange-300 ring-1 ring-orange-200":"border-gray-200"} focus:bg-white focus:ring-2 focus:ring-apple-blue/20 focus:border-apple-blue outline-none transition-all text-sm`,value:V';

if (!content.includes(targetName)) {
    console.error('Failed to locate targetName!');
    process.exit(1);
}
content = content.replace(targetName, replName);
console.log('Patched Customer Name placeholder and styling.');

// 3. Patch Phone Number placeholder and disabled rule
const targetPhone = 'm.jsx("input",{placeholder:"Phone Number",className:"w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-apple-blue/20 outline-none transition-all text-sm",value:z,onChange:be=>Z(be.target.value),disabled:!!K})';

const replPhone = 'm.jsx("input",{placeholder:he==="Partial"||he==="Pending"?"Phone Number * (Required)":"Phone Number",className:`w-full px-3 py-2 rounded-lg bg-gray-50 border ${(he==="Partial"||he==="Pending")&&(!z||z.trim()==="")?"border-orange-300 ring-1 ring-orange-200":"border-gray-200"} focus:bg-white focus:ring-2 focus:ring-apple-blue/20 outline-none transition-all text-sm`,value:z,onChange:be=>Z(be.target.value),disabled:!!K&&!!K.phone})';

if (!content.includes(targetPhone)) {
    console.error('Failed to locate targetPhone!');
    process.exit(1);
}
content = content.replace(targetPhone, replPhone);
console.log('Patched Phone Number placeholder and styling.');

fs.writeFileSync(bundlePath, content, 'utf8');
console.log('Successfully updated dist/assets/index-BQlSbgAO.js! New size:', content.length);
