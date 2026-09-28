import assert from "node:assert/strict";
import test from "node:test";
import { attachBulkImageUrls, imageFileNames, resolveBulkImageFiles } from "../lib/bulk-product-images";
import { BulkProductRowSchema } from "../lib/validations/bulk-product";

const front = { name: "SC-001-front.jpg", type: "image/jpeg", size: 100 };
const back = { name: "SC-001-back.png", type: "image/png", size: 100 };

test("matches images in spreadsheet order and uploads shared files once", () => {
  const result = resolveBulkImageFiles([
    { imageFiles: ` ${back.name}, ${front.name}, ` },
    { imageFiles: front.name },
  ], [front, back]);
  assert.deepEqual([...result.keys()], [back.name, front.name]);
  assert.equal(result.get(front.name), front);
  assert.deepEqual(imageFileNames(undefined), []);
  assert.equal(resolveBulkImageFiles([{ imageUrls: "https://example.com/image.jpg" }], []).size, 0);
});

test("missing or ambiguous filenames stop the upload", () => {
  assert.throws(() => resolveBulkImageFiles([{ imageFiles: "missing.jpg" }], [front]), /Spreadsheet row 2/);
  assert.throws(() => resolveBulkImageFiles([], [front, front]), /Duplicate filename/);
});

test("rejects unsupported, empty and oversized referenced files", () => {
  for (const file of [{ ...front, type: "text/html" }, { ...front, size: 0 }, { ...front, size: 5 * 1024 * 1024 + 1 }]) {
    assert.throws(() => resolveBulkImageFiles([{ imageFiles: front.name }], [file]));
  }
  assert.equal(resolveBulkImageFiles([{ imageFiles: front.name }], [{ ...front, size: 5 * 1024 * 1024 }]).size, 1);
});

test("file-only, URL-only and mixed imports satisfy server image validation", () => {
  const base = { title: "Sudha Collections saree", sku: "SC-001", category: "Sarees", mrp: 100,
    sellingPrice: 90, description: "Silk saree", variantSku: "SC-001-FREE" };
  const uploaded = new Map([[front.name, "/uploads/products/front.jpg"]]);
  for (const images of [
    { imageUrls: "", imageFiles: front.name },
    { imageUrls: "https://example.com/front.jpg" },
    { imageUrls: "https://example.com/front.jpg", imageFiles: front.name },
  ]) {
    const [row] = attachBulkImageUrls([{ ...base, ...images }], uploaded);
    assert.equal(BulkProductRowSchema.safeParse(row).success, true);
  }
  assert.throws(() => resolveBulkImageFiles([{ imageUrls: "" }], [front]), /assign selected image files/);
  assert.throws(() => attachBulkImageUrls([{ imageFiles: front.name }], new Map()), /has not been uploaded/);
  assert.equal(BulkProductRowSchema.safeParse({ ...base, imageUrls: " , " }).success, false);
});
