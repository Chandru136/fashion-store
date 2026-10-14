import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

import { AuthorizationError, requireAdminPermission } from "@/lib/admin-authorization";
import { PERMISSIONS } from "@/lib/permissions";
import { isValidProductImage, MAX_PRODUCT_IMAGE_SIZE, PRODUCT_IMAGE_EXTENSIONS as imageExtensions } from "@/lib/product-image-validation";

export async function POST(request: Request) {
  try {
    await requireAdminPermission([PERMISSIONS.CREATE_PRODUCTS, PERMISSIONS.UPDATE_PRODUCTS]);
    const formData = await request.formData();
    const image = formData.get("image");

    if (!(image instanceof File)) {
      return NextResponse.json({ error: "Choose an image file to upload." }, { status: 400 });
    }

    const extension = Object.hasOwn(imageExtensions, image.type) ? imageExtensions[image.type] : undefined;
    if (!extension) {
      return NextResponse.json({ error: "Only JPEG, PNG, WebP, GIF and AVIF images are allowed." }, { status: 400 });
    }
    if (image.size === 0 || image.size > MAX_PRODUCT_IMAGE_SIZE) {
      return NextResponse.json({ error: "The image must be no larger than 5 MB." }, { status: 400 });
    }

    const bytes = Buffer.from(await image.arrayBuffer());
    if (!(await isValidProductImage(bytes, image.type))) {
      return NextResponse.json({ error: "Choose a valid image matching its file type, with at most 25 million pixels across all frames." }, { status: 400 });
    }

    const fileName = `${randomUUID()}${extension}`;
    const uploadDirectory = path.join(process.cwd(), "public", "uploads", "products");
    await mkdir(uploadDirectory, { recursive: true });
    await writeFile(path.join(uploadDirectory, fileName), bytes);

    return NextResponse.json({ url: `/uploads/products/${fileName}` }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthorizationError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Unable to upload the image. Please try again." }, { status: 500 });
  }
}
