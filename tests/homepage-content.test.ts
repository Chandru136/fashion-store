import assert from "node:assert/strict";
import test from "node:test";
import { defaultHomepageContent, homepageContentSchema } from "../lib/homepage-content";

test("existing storefront defaults are valid CMS content", () => {
  assert.equal(homepageContentSchema.safeParse(defaultHomepageContent).success, true);
});
test("CMS content round-trips edited and reordered menus and stories", () => {
  const content = structuredClone(defaultHomepageContent);
  content.navigation.reverse();
  content.navigation[0].label = "Sudha Collections edits";
  content.lookbook.title = "Discover your next story";
  content.heritage.cards[0].href = "/products?q=heritage";
  assert.deepEqual(homepageContentSchema.parse(JSON.parse(JSON.stringify(content))), content);
});
test("CMS rejects unsafe links and duplicate menu IDs", () => {
  for (const href of ["javascript:alert(1)", "//example.com", "/\\example.com", "data:text/html,test"]) {
    const content = structuredClone(defaultHomepageContent);
    content.navigation[0].href = href;
    assert.equal(homepageContentSchema.safeParse(content).success, false, href);
  }
  const content = structuredClone(defaultHomepageContent);
  content.navigation[1].id = content.navigation[0].id;
  assert.equal(homepageContentSchema.safeParse(content).success, false);
});
test("CMS validates nested images and requires story cards", () => {
  const content = structuredClone(defaultHomepageContent);
  content.heritage.cards[0].image = "javascript:alert(1)";
  assert.equal(homepageContentSchema.safeParse(content).success, false);
  content.heritage.cards = [];
  assert.equal(homepageContentSchema.safeParse(content).success, false);
});
