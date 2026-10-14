import sharp from "sharp";

export const MAX_PRODUCT_IMAGE_SIZE = 5 * 1024 * 1024;
export const PRODUCT_IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp",
  "image/gif": ".gif", "image/avif": ".avif",
};

/** Decode all frames, not just headers. Keep the original bytes for storage. */
export async function isValidProductImage(bytes: Buffer, mime: string): Promise<boolean> {
  if (!Object.hasOwn(PRODUCT_IMAGE_EXTENSIONS, mime) || !bytes.length || bytes.length > MAX_PRODUCT_IMAGE_SIZE) return false;
  try {
    // Sharp is already supplied by the installed Next.js image pipeline.
    const image = sharp(bytes, { animated: true, failOn: "error", limitInputPixels: 25_000_000 });
    const metadata = await image.metadata();
    const format = mime === "image/avif" ? "heif" : mime.slice(6);
    if (metadata.format !== format || (mime === "image/avif" && metadata.compression !== "av1")) return false;
    if (!metadata.width || !metadata.height || metadata.width * metadata.height > 25_000_000) return false;
    await image.raw().toBuffer();
    return true;
  } catch {
    return false;
  }
}
