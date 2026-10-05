const fs = require('fs');
const path = require('path');

const bundlePath = path.join(__dirname, '..', 'dist', 'assets', 'index-BQlSbgAO.js');
let content = fs.readFileSync(bundlePath, 'utf8');
console.log('Current bundle size:', content.length);

// 1. In Ht: make salePrice:0
const htSearch = 'at=parseFloat(rt.salePrice)||0,Gt=parseFloat(rt.initialQty)||1,Xt=await Ft.addProduct({name:rt.name,category:rt.category||"General",size:rt.size,unit:rt.unit,purchasePrice:me,salePrice:at,';
const htRepl = 'Gt=parseFloat(rt.initialQty)||1,Xt=await Ft.addProduct({name:rt.name,category:rt.category||"General",size:rt.size,unit:rt.unit,purchasePrice:me,salePrice:0,';

if (content.includes(htSearch)) {
    content = content.replace(htSearch, htRepl);
    console.log('Updated Ht addProduct salePrice to 0.');
} else {
    console.log('htSearch not found, checking if already patched...');
    if (content.includes('salePrice:0,')) {
        console.log('Ht already patched.');
    } else {
        console.error('Failed to locate Ht addProduct pattern!');
        process.exit(1);
    }
}

// 2. In Ht state reset: salePrice:"" -> salePrice:0
const resetSearch = 'purchasePrice:"",salePrice:"",unit:"Piece",initialQty:"1"';
const resetRepl = 'purchasePrice:"",salePrice:0,unit:"Piece",initialQty:"1"';
if (content.includes(resetSearch)) {
    content = content.replace(resetSearch, resetRepl);
    console.log('Updated Ht state reset.');
}

// 3. JSX: Remove Sale Price input and integrate Initial Qty into the 2-column grid next to Cost Price
const jsxSearch = 'm.jsxs("div",{className:"grid grid-cols-2 gap-3",children:[m.jsxs("div",{children:[m.jsx("label",{className:"text-[10px] text-gray-400 pl-1",children:"Cost Price"}),m.jsx("input",{type:"number",placeholder:"0",className:"w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-100 focus:bg-white focus:border-blue-300 outline-none text-sm text-gray-800",value:rt.purchasePrice||"",onChange:me=>Ye({...rt,purchasePrice:me.target.value})})]}),m.jsxs("div",{children:[m.jsx("label",{className:"text-[10px] text-gray-400 pl-1",children:"Sale Price"}),m.jsx("input",{type:"number",placeholder:"0",className:"w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-100 focus:bg-white focus:border-blue-300 outline-none text-sm text-gray-800",value:rt.salePrice||"",onChange:me=>Ye({...rt,salePrice:me.target.value})})]})]}),m.jsxs("div",{className:"mt-2",children:[m.jsx("label",{className:"text-[10px] text-gray-400 pl-1",children:"Initial Qty"}),m.jsx("input",{type:"number",step:"any",min:"0.001",className:"w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-100 focus:bg-white focus:border-blue-300 outline-none text-sm font-semibold text-gray-800",value:rt.initialQty,onChange:me=>Ye({...rt,initialQty:me.target.value})})]})';

const jsxRepl = 'm.jsxs("div",{className:"grid grid-cols-2 gap-3",children:[m.jsxs("div",{children:[m.jsx("label",{className:"text-[10px] text-gray-400 pl-1",children:"Cost Price"}),m.jsx("input",{type:"number",placeholder:"0",className:"w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-100 focus:bg-white focus:border-blue-300 outline-none text-sm text-gray-800",value:rt.purchasePrice||"",onChange:me=>Ye({...rt,purchasePrice:me.target.value})})]}),m.jsxs("div",{children:[m.jsx("label",{className:"text-[10px] text-gray-400 pl-1",children:"Initial Qty"}),m.jsx("input",{type:"number",step:"any",min:"0.001",placeholder:"1",className:"w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-100 focus:bg-white focus:border-blue-300 outline-none text-sm font-semibold text-gray-800",value:rt.initialQty,onChange:me=>Ye({...rt,initialQty:me.target.value})})]})]})';

if (content.includes(jsxSearch)) {
    content = content.replace(jsxSearch, jsxRepl);
    console.log('Updated Pricing & Stock JSX to remove Sale Price.');
} else {
    console.error('Failed to locate Pricing & Stock JSX!');
    process.exit(1);
}

fs.writeFileSync(bundlePath, content, 'utf8');
console.log('Successfully patched bundle! New size:', content.length);
