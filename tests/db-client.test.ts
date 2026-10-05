import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";

const source = ts.transpileModule(readFileSync("lib/db.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;

function loadDatabase(cached?: object) {
  let created = 0;
  class PrismaClient {
    homepageContent = { findUnique() {} };
    messageTemplate = {};
    customerMessageDelivery = {};
    constructor() { created += 1; }
  }
  const context = {
    exports: {} as { prisma?: object },
    prisma: cached,
    process: { env: { NODE_ENV: "development" } },
    require: () => ({ PrismaClient }),
  };
  runInNewContext(source, context);
  return { client: context.exports.prisma, cached: context.prisma, created };
}

test("replaces a cached client created before HomepageContent existed", () => {
  const oldClient = { product: {} };
  const result = loadDatabase(oldClient);
  assert.equal(result.created, 1);
  assert.notEqual(result.client, oldClient);
  assert.equal(result.cached, result.client);
  assert.ok(result.client && "homepageContent" in result.client);
});

test("reuses a current client across development hot reloads", () => {
  const client = { homepageContent: { findUnique() {} }, messageTemplate: {}, customerMessageDelivery: {} };
  const result = loadDatabase(client);
  assert.equal(result.created, 0);
  assert.equal(result.client, client);
});

test("creates and caches a client on first load", () => {
  const result = loadDatabase();
  assert.equal(result.created, 1);
  assert.equal(result.client, result.cached);
});
