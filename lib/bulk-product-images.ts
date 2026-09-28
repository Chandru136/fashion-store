export function imageFileNames(value: unknown): string[] {
  return String(value ?? "").split(",").map((name) => name.trim()).filter(Boolean);
}

/** Validate every reference before uploading anything. Names are case-sensitive. */
export function resolveBulkImageFiles<T extends { name: string; type: string; size: number }>(
  rows: Record<string, unknown>[], files: T[],
): Map<string, T> {
  const selected = new Map<string, T>();
  for (const file of files) {
    if (selected.has(file.name)) throw new Error(`Duplicate filename: ${file.name}. Rename the files so each name is unique.`);
    selected.set(file.name, file);
  }
  const needed = new Map<string, T>();
  rows.forEach((row, index) => {
    if (!imageFileNames(row.imageUrls).length && !imageFileNames(row.imageFiles).length) {
      throw new Error(`Spreadsheet row ${index + 2}: Add an image URL or assign selected image files to this product below.`);
    }
    for (const name of imageFileNames(row.imageFiles)) {
      const file = selected.get(name);
      if (!file) throw new Error(`Spreadsheet row ${index + 2}: Select the image file "${name}". Filenames must match exactly.`);
      if (!["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"].includes(file.type)) {
        throw new Error(`${name}: Only JPEG, PNG, WebP, GIF and AVIF images are allowed.`);
      }
      if (file.size === 0 || file.size > 5 * 1024 * 1024) {
        throw new Error(`${name}: Each image must be non-empty and no larger than 5 MB.`);
      }
      needed.set(name, file);
    }
  });
  return needed;
}

export function attachBulkImageUrls(rows: Record<string, unknown>[], urls: Map<string, string>) {
  return rows.map((row) => ({
    ...row,
    imageUrls: [...imageFileNames(row.imageUrls), ...imageFileNames(row.imageFiles).map((name) => {
      const url = urls.get(name);
      if (!url) throw new Error(`Image "${name}" has not been uploaded. Please try again.`);
      return url;
    })].join(","),
  }));
}
