const fs = require('fs');
const path = require('path');

const bundlePath = path.join(__dirname, '..', 'dist', 'assets', 'index-BQlSbgAO.js');
let content = fs.readFileSync(bundlePath, 'utf8');
console.log('Current bundle size:', content.length);

// 1. Locate the D function
const targetD = 'const D=async()=>{let C=[],z=[],Z=[],J=[];try{C=await Ft.getSales()}catch(he){console.error("Failed to load sales:",he)}try{z=await Ft.getPayments()}catch(he){console.error("Failed to load payments:",he)}try{Z=await Ft.getExpenses()}catch(he){console.error("Failed to load expenses:",he)}try{J=await Ft.getStockTransfers()||[]}catch(he){console.error("Failed to load stock transfers:",he)}';

if (!content.includes(targetD)) {
    console.error('Target D start not found!');
    process.exit(1);
}

// Locate pe definition in D
const targetPe = 'pe=[...ve,...U,...ae,...se].sort((he,G)=>{const k=he.type==="Sale"||he.type==="Return",F=G.type==="Sale"||G.type==="Return";return k&&F&&he.invoiceNumber!=null&&G.invoiceNumber!=null?G.invoiceNumber-he.invoiceNumber:G.date-he.date});t(pe)}';

if (!content.includes(targetPe)) {
    console.error('Target Pe not found!');
    process.exit(1);
}

const replD = 'const D=async()=>{let C=[],z=[],Z=[],J=[],ee=[],te_sup=[],sup_list=[];try{C=await Ft.getSales()}catch(he){console.error("Failed to load sales:",he)}try{z=await Ft.getPayments()}catch(he){console.error("Failed to load payments:",he)}try{Z=await Ft.getExpenses()}catch(he){console.error("Failed to load expenses:",he)}try{J=await Ft.getStockTransfers()||[]}catch(he){console.error("Failed to load stock transfers:",he)}try{ee=await Ft.getPurchases()||[]}catch(he){console.error("Failed to load purchases:",he)}try{te_sup=await Ft.getSupplierPayments()||[]}catch(he){console.error("Failed to load supplier payments:",he)}try{sup_list=await Ft.getSuppliers()||[]}catch(he){console.error("Failed to load suppliers:",he)}';

const supMapping = 'const sup_purchases=ee.map(he=>{const k=(he.items||[]).map(tt=>`• ${tt.quantity}x ${tt.name}${tt.size?" ("+tt.size+")":""}`).join("\\n"),paid=Number(he.paidAmount)||0,remaining=Number(he.remainingAmount)||((Number(he.totalAmount)||0)-paid),shop=(he.shopId||"").toLowerCase().replace(" ","-"),sName=he.supplierName||((sup_list.find(s=>s.id===he.supplierId))?.name)||"Supplier";return{id:he.id,type:"Purchase",amount:paid,date:he.date||he.createdAt||0,description:`Purchase - ${sName}\\n${k}\\nInvoice #${he.id.substring(0,8)}`,isCredit:!1,remainingBalance:remaining,shopId:shop}}),later_sup_payments=te_sup.filter(he=>!he.note||!he.note.startsWith("Immediate payment for Purchase")).map(he=>{const sName=(sup_list.find(s=>s.id===he.supplierId))?.name||"Supplier";return{id:he.id,type:"Supplier Payment",amount:Number(he.amount)||0,date:he.date||he.createdAt||Date.now(),description:`Supplier Payment - ${sName}\\n${he.note||"Payment against ledger balance"}`.trim(),isCredit:!1,category:"Supplier",shopId:(he.shopId||"").toLowerCase().replace(" ","-")}});';

const replPe = supMapping + 'pe=[...ve,...U,...ae,...se,...sup_purchases,...later_sup_payments].sort((he,G)=>{const k=he.type==="Sale"||he.type==="Return",F=G.type==="Sale"||G.type==="Return";return k&&F&&he.invoiceNumber!=null&&G.invoiceNumber!=null?G.invoiceNumber-he.invoiceNumber:(G.date||0)-(he.date||0)});t(pe)}';

content = content.replace(targetD, replD);
content = content.replace(targetPe, replPe);
console.log('Successfully updated D and transaction list in Cashbook!');

// 2. Add Purchase and Supplier Payment to Type Dropdown
const targetDropdown = 'm.jsx("option",{children:"All Types"}),m.jsx("option",{children:"Sale"}),m.jsx("option",{children:"Payment"}),m.jsx("option",{children:"Expense"}),m.jsx("option",{children:"Return"}),m.jsx("option",{children:"Transfer"})';

const replDropdown = 'm.jsx("option",{children:"All Types"}),m.jsx("option",{children:"Sale"}),m.jsx("option",{children:"Payment"}),m.jsx("option",{children:"Expense"}),m.jsx("option",{children:"Purchase"}),m.jsx("option",{children:"Supplier Payment"}),m.jsx("option",{children:"Return"}),m.jsx("option",{children:"Transfer"})';

if (content.includes(targetDropdown)) {
    content = content.replace(targetDropdown, replDropdown);
    console.log('Updated Cashbook Type dropdown.');
} else {
    console.error('Failed to locate Type dropdown!');
    process.exit(1);
}

// 3. Update Badge in table
const targetBadge = 'C.type==="Sale"&&C.remainingBalance!==void 0&&C.remainingBalance>0?"bg-red-100 text-red-700":C.type==="Sale"?"bg-green-100 text-green-700":C.type==="Payment"?"bg-blue-100 text-blue-700":C.type==="Return"?"bg-orange-100 text-orange-700":C.type==="Transfer"?"bg-purple-100 text-purple-700":"bg-red-100 text-red-700"';

const replBadge = 'C.type==="Purchase"?((C.remainingBalance!==void 0&&C.remainingBalance>0)?"bg-amber-100 text-amber-800 border border-amber-200":"bg-amber-50 text-amber-700"):C.type==="Supplier Payment"?"bg-indigo-100 text-indigo-800 border border-indigo-200":C.type==="Sale"&&C.remainingBalance!==void 0&&C.remainingBalance>0?"bg-red-100 text-red-700":C.type==="Sale"?"bg-green-100 text-green-700":C.type==="Payment"?"bg-blue-100 text-blue-700":C.type==="Return"?"bg-orange-100 text-orange-700":C.type==="Transfer"?"bg-purple-100 text-purple-700":"bg-red-100 text-red-700"';

if (content.includes(targetBadge)) {
    content = content.replace(targetBadge, replBadge);
    console.log('Updated Cashbook Type badge.');
} else {
    console.error('Failed to locate Type badge!');
    process.exit(1);
}

// 4. Update the red dot indicator for remaining balance to also include Purchase
const targetDot = 'C.type==="Sale"&&C.remainingBalance!==void 0&&C.remainingBalance>0&&m.jsx("span",{className:"ml-1",children:"●"})';
const replDot = '(C.type==="Sale"||C.type==="Purchase")&&C.remainingBalance!==void 0&&C.remainingBalance>0&&m.jsx("span",{className:"ml-1",children:"●"})';

if (content.includes(targetDot)) {
    content = content.replace(targetDot, replDot);
    console.log('Updated remaining balance dot indicator.');
}

fs.writeFileSync(bundlePath, content, 'utf8');
console.log('All Cashbook purchase updates applied successfully! New size:', content.length);
