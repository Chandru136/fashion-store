import assert from "node:assert/strict";
import test from "node:test";
import { collectionSchema, collectionIdeas } from "../lib/validations/collection";

const sample = { ...collectionIdeas[0], mobileImage: "", buttonText: "Explore the edit", status: "INACTIVE", displayOrder: 1 };
test("Sudha Collections starter ideas are valid drafts", () => {
  for (const idea of collectionIdeas) assert.equal(collectionSchema.safeParse({ ...sample, ...idea }).success, true);
});
test("collection destinations stay in the shopping catalogue", () => {
  for (const buttonUrl of ["javascript:alert(1)", "//example.com", "/admin", "/products/../admin", "/category/../../admin", "https://example.com", "/products\\evil", ""]) {
    assert.equal(collectionSchema.safeParse({ ...sample, buttonUrl }).success, false, buttonUrl);
  }
  for (const buttonUrl of ["/products", "/products?occasion=Wedding&sort=newest", "/category/silk-sarees"]) {
    assert.equal(collectionSchema.safeParse({ ...sample, buttonUrl }).success, true, buttonUrl);
  }
});
test("collection validation rejects incomplete and invalid publication data", () => {
  for (const patch of [{ name: "" }, { slug: "Bad Slug" }, { slug: "two--hyphens" }, { image: "javascript:alert(1)" }, { image: "//example.com/a.jpg" }, { displayOrder: -1 }, { displayOrder: 1.5 }, { displayOrder: NaN }, { status: "PUBLISHED" }, { buttonText: "" }]) {
    assert.equal(collectionSchema.safeParse({ ...sample, ...patch }).success, false, JSON.stringify(patch));
  }
});
