import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const imageExtensions: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const image = formData.get("image");

    if (!(image instanceof File)) {
      return NextResponse.json({ error: "Choose an image file to upload." }, { status: 400 });
    }

    const extension = imageExtensions[image.type];
    if (!extension) {
      return NextResponse.json({ error: "Only JPEG, PNG, WebP, GIF and AVIF images are allowed." }, { status: 400 });
    }
    if (image.size === 0 || image.size > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: "The image must be smaller than 5 MB." }, { status: 400 });
    }

    const fileName = `${randomUUID()}${extension}`;
    const uploadDirectory = path.join(process.cwd(), "public", "uploads", "products");
    await mkdir(uploadDirectory, { recursive: true });
    await writeFile(path.join(uploadDirectory, fileName), Buffer.from(await image.arrayBuffer()));

    return NextResponse.json({ url: `/uploads/products/${fileName}` }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unable to upload the image. Please try again." }, { status: 500 });
  }
}
