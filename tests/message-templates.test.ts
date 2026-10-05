import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { z } from "zod";
import * as messages from "../lib/customer-messages";

const template = { id: "SC-template", name: "SC-update", subject: "Hello {{name}}", body: "News from {{store}} for {{name}}" };
const request = { templateId: template.id, customerIds: ["SC-customer"], requestId: "550e8400-e29b-41d4-a716-446655440000", template };
function harness(options: { authorized?: boolean; accepted?: boolean; active?: boolean; changed?: boolean } = {}) {
  let sends = 0;
  const records = new Map<string, { status: string }>();
  const prisma = {
    messageTemplate: { findUnique: async () => options.changed ? { ...template, body: "Changed message" } : template },
    user: { findMany: async () => options.active === false ? [] : [{ id: "SC-customer", name: "Customer", email: "customer@example.com" }] },
    customerMessageDelivery: {
      createMany: async ({ data }: { data: { requestId: string; customerId: string }[] }) => {
        const key = data[0].requestId + data[0].customerId;
        if (records.has(key)) return { count: 0 };
        records.set(key, { status: "SENDING" }); return { count: 1 };
      },
      findUnique: async () => [...records.values()][0],
      update: async ({ data }: { data: { status: string } }) => { records.set(request.requestId + "SC-customer", data); },
    },
  };
  const modules: Record<string, unknown> = {
    zod: { z }, "next/cache": { revalidatePath() {} }, "@/lib/db": { prisma }, "@/lib/customer-messages": messages,
    "@/lib/services/customer-messages.service": { requireMessagingAdmin: async () => { if (options.authorized === false) throw new Error("Not authorized"); return { id: "SC-admin" }; } },
    "@/lib/mailer": { sendEmail: async () => { sends++; return options.accepted !== false; } },
  };
  const exports = {} as { sendTemplateEmail: (input: unknown) => Promise<{ success: boolean; results?: { status: string }[] }> };
  const code = ts.transpileModule(readFileSync("app/actions/message-template.actions.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  runInNewContext(code, { exports, console, process: { env: { SMTP_USER: "test", SMTP_PASSWORD: "test" } }, require: (name: string) => { if (!(name in modules)) throw new Error("Unexpected dependency: " + name); return modules[name]; } });
  return { action: exports.sendTemplateEmail, sends: () => sends };
}

test("personalizes messages once and escapes email markup", () => {
  assert.equal(messages.renderCustomerMessage("Hi {{name}}, {{store}}", "Asha"), "Hi Asha, Sudha Collections");
  assert.equal(messages.renderCustomerMessage("{{name}}", "{{store}}"), "{{store}}");
  assert.ok(messages.messageEmailHtml('<script>alert("x")</script>').includes("&lt;script&gt;"));
  assert.equal(messages.messageTemplateSchema.safeParse({ ...template, body: "Hi {{unknown}}" }).success, false);
});
test("WhatsApp links normalize Indian numbers, preserve international numbers and encode messages", () => {
  assert.equal(messages.customerWhatsAppUrl("98765 43210", "Hi & hello"), "https://wa.me/919876543210?text=Hi%20%26%20hello");
  assert.equal(messages.customerWhatsAppUrl("+44 7700 900123", "Hi"), "https://wa.me/447700900123?text=Hi");
  assert.equal(messages.customerWhatsAppUrl(null, "Hi"), null);
  assert.equal(messages.customerWhatsAppUrl("not a phone", "Hi"), null);
});
test("retries do not resend an already submitted email", async () => {
  const h = harness();
  assert.equal((await h.action(request)).results?.[0].status, "ACCEPTED");
  assert.equal((await h.action(request)).results?.[0].status, "ACCEPTED");
  assert.equal(h.sends(), 1);
});
test("mail transport failures are shown as failures", async () => {
  const h = harness({ accepted: false });
  assert.equal((await h.action(request)).results?.[0].status, "FAILED");
});
test("unauthorized users, inactive recipients and changed templates cannot send", async () => {
  for (const option of [{ authorized: false }, { active: false }, { changed: true }]) {
    const h = harness(option);
    assert.equal((await h.action(request)).success, false);
    assert.equal(h.sends(), 0);
  }
});
test("recipient limits are enforced before email submission", async () => {
  const h = harness();
  assert.equal((await h.action({ ...request, customerIds: [] })).success, false);
  assert.equal((await h.action({ ...request, customerIds: Array(51).fill("SC-customer") })).success, false);
  assert.equal(h.sends(), 0);
});
