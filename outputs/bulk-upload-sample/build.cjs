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
const colors = ['Rose Pink', 'Peacock Blue', 'Ivory', 'Maroon', 'Lavender'];
const expandedSamples = colors.flatMap((color, batch) => samples.map(item => [
  item[0].replace(item[7], color).replace('Emerald ', `${color} `).replace('Mustard ', `${color} `),
  item[1], item[2] + batch * 200, item[3] + batch * 100, item[4], item[5], item[6], color, item[8] + batch,
]));
const template = XLSX.readFile('C:/Users/DataCentre2/Downloads/product-bulk-upload-template.xlsx');
const headers = XLSX.utils.sheet_to_json(template.Sheets[template.SheetNames[0]], { header: 1 })[0];
assert.deepEqual(headers, Array.from(BULK_UPLOAD_COLUMNS));
const rows = expandedSamples.map((item, i) => ({
  title: `Sudha Collections Sample ${item[0]} Batch 20`,
  sku: `SC-TEST20-${String(i + 1).padStart(3, '0')}`,
  category: item[1], brand: 'Sudha Collections', mrp: item[2], sellingPrice: item[3], tax: 5,
  fabric: item[4], occasion: item[5], pattern: item[6], status: 'DRAFT',
  featured: i === 0 ? 'TRUE' : 'FALSE', bestseller: i === 1 ? 'TRUE' : 'FALSE', newArrival: 'TRUE',
  shortDescription: `Sample ${item[0].toLowerCase()} for bulk upload testing.`,
  description: `Sudha Collections sample product for testing spreadsheet imports. ${item[0]} with ${item[6].toLowerCase()} detailing. Replace sample information before publishing.`,
  imageUrls: i % 2 === 0 ? 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800' : 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800',
  variantSku: `SC-TEST20-${String(i + 1).padStart(3, '0')}-FREE`, color: item[7], size: 'Free Size', stock: item[8],
}));
rows.forEach(row => BulkProductRowSchema.parse(row));
const sheet = XLSX.utils.json_to_sheet(rows, { header: Array.from(BULK_UPLOAD_COLUMNS) });
sheet['!cols'] = BULK_UPLOAD_COLUMNS.map(key => ({ wch: key === 'title' ? 60 : ['description', 'imageUrls'].includes(key) ? 95 : key === 'shortDescription' ? 65 : 24 }));
sheet['!autofilter'] = { ref: 'A1:U21' };
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, sheet, 'Products');
const path = 'outputs/bulk-upload-sample/Sudha-Collections-Bulk-Upload-20-Records.xlsx';
XLSX.writeFile(workbook, path);
const saved = XLSX.readFile(path);
const actual = XLSX.utils.sheet_to_json(saved.Sheets.Products);
assert.equal(actual.length, 20);
assert.deepEqual(Object.keys(actual[0]), Array.from(BULK_UPLOAD_COLUMNS));
actual.forEach(row => BulkProductRowSchema.parse(row));
assert.equal(new Set(actual.map(row => row.sku)).size, 20);
assert.equal(new Set(actual.map(row => row.title)).size, 20);
assert.equal(new Set(actual.map(row => row.variantSku)).size, 20);
actual.forEach(row => headers.forEach(header => assert.notEqual(String(row[header] ?? '').trim(), '')));
console.log(`Created and validated 20 records with all 21 fields populated: ${path}`);
