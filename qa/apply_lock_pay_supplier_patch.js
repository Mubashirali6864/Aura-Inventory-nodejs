const fs = require('fs');
const path = require('path');
const vm = require('vm');

const bundlePath = path.join(__dirname, '..', 'dist', 'assets', 'index-BQlSbgAO.js');
let content = fs.readFileSync(bundlePath, 'utf8');
console.log('Current bundle size:', content.length);

// 1. Lock Pay Supplier button
const targetBtn = 'm.jsxs(Qt,{onClick:()=>$(!0),variant:"secondary",className:"px-4 py-2 h-10 text-xs gap-1.5",children:[m.jsx(Gc,{size:14})," Pay Supplier"]})';
const replBtn = 'm.jsxs(Qt,{onClick:()=>$(!0),variant:"secondary",disabled:(j?.balance||0)<=0,title:(j?.balance||0)<=0?"No pending dues to pay":"","aria-disabled":(j?.balance||0)<=0,className:`px-4 py-2 h-10 text-xs gap-1.5 ${(j?.balance||0)<=0?"opacity-40 cursor-not-allowed bg-gray-100 text-gray-400 hover:bg-gray-100 border-gray-200":""}`,children:[m.jsx(Gc,{size:14})," Pay Supplier"]})';

if (!content.includes(targetBtn)) {
    console.error('Target Pay Supplier button not found!');
    process.exit(1);
}
content = content.replace(targetBtn, replBtn);
console.log('Patched Pay Supplier button with lock condition.');

// 2. Guard $t payment submission function
const targetFunc = '$t=async()=>{if(!j||!re.amount)return;await Ft.addSupplierPayment';
const replFunc = '$t=async()=>{if(!j||!re.amount)return;if((j.balance||0)<=0){alert("Cannot record payment: Supplier has no pending dues (balance is 0).");return;}await Ft.addSupplierPayment';

if (!content.includes(targetFunc)) {
    console.error('Target $t function not found!');
    process.exit(1);
}
content = content.replace(targetFunc, replFunc);
console.log('Patched $t function with balance check.');

// 3. Disable Save Payment button in modal if balance <= 0
const targetModalBtn = 'm.jsx(Qt,{onClick:$t,isLoading:p,children:"Save Payment"})';
const replModalBtn = 'm.jsx(Qt,{onClick:$t,isLoading:p,disabled:(j?.balance||0)<=0,children:"Save Payment"})';

if (!content.includes(targetModalBtn)) {
    console.error('Target modal Save Payment button not found!');
    process.exit(1);
}
content = content.replace(targetModalBtn, replModalBtn);
console.log('Patched modal Save Payment button with disabled condition.');

fs.writeFileSync(bundlePath, content, 'utf8');
console.log('Saved patched bundle. Validating ES module syntax...');
