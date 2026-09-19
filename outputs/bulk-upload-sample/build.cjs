const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const XLSX = require('xlsx');
const context = { exports: {}, require };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/validations/bulk-product.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, context);
const { BULK_UPLOAD_COLUMNS, BulkProductRowSchema } = context.exports;
const samples = [
  ['Royal Red Silk Saree', 'Pure Silk Sarees', 24999, 18999, 'Pure Mulberry Silk', 'Wedding', 'Zari Border', 'Royal Red', 25],
  ['Emerald Banarasi Saree', 'Banarasi Sarees', 15999, 11999, 'Silk Blend', 'Festive', 'Floral Brocade', 'Emerald Green', 18],
  ['Sky Blue Cotton Saree', 'Cotton Sarees', 2999, 1999, 'Cotton', 'Casual', 'Printed', 'Sky Blue', 40],
  ['Mustard Chanderi Saree', 'Chanderi Sarees', 7999, 5999, 'Silk Cotton', 'Festive', 'Butti Work', 'Mustard Yellow', 22],
];
const rows = samples.map((item, i) => ({
  title: `Sudha Collections Test ${item[0]} 0926`,
  sku: `SC-UPLOAD-0926-00${i + 1}`,
  category: item[1], brand: 'Sudha Collections', mrp: item[2], sellingPrice: item[3], tax: 5,
  fabric: item[4], occasion: item[5], pattern: item[6], status: 'DRAFT',
  featured: i === 0 ? 'TRUE' : 'FALSE', bestseller: i === 1 ? 'TRUE' : 'FALSE', newArrival: 'TRUE',
  shortDescription: `Sample ${item[0].toLowerCase()} for bulk upload testing.`,
  description: `Sudha Collections sample product for testing spreadsheet imports. ${item[0]} with ${item[6].toLowerCase()} detailing. Replace sample information before publishing.`,
  imageUrls: i % 2 === 0 ? 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800' : 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800',
  variantSku: `SC-UPLOAD-0926-00${i + 1}-FREE`, color: item[7], size: 'Free Size', stock: item[8],
}));
rows.forEach(row => BulkProductRowSchema.parse(row));
const sheet = XLSX.utils.json_to_sheet(rows, { header: Array.from(BULK_UPLOAD_COLUMNS) });
sheet['!cols'] = BULK_UPLOAD_COLUMNS.map(key => ({ wch: key === 'title' ? 60 : ['description', 'imageUrls'].includes(key) ? 95 : key === 'shortDescription' ? 65 : 24 }));
sheet['!autofilter'] = { ref: 'A1:U5' };
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, sheet, 'Products');
const path = 'outputs/bulk-upload-sample/Sudha-Collections-Bulk-Upload-4-Records.xlsx';
XLSX.writeFile(workbook, path);
const saved = XLSX.readFile(path);
const actual = XLSX.utils.sheet_to_json(saved.Sheets.Products);
assert.equal(actual.length, 4);
assert.deepEqual(Object.keys(actual[0]), Array.from(BULK_UPLOAD_COLUMNS));
actual.forEach(row => BulkProductRowSchema.parse(row));
assert.equal(new Set(actual.map(row => row.sku)).size, 4);
console.log(`Created and validated 4 records: ${path}`);
