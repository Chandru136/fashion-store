const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { NextRequest, NextResponse } = require('next/server');

function load(file, dependencies, env = process.env) {
  const context = { exports: {}, process: { env }, console, TextEncoder, Date, URL,
    require(name) { if (!(name in dependencies)) throw Error(`Unexpected dependency ${name} in ${file}`); return dependencies[name]; } };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText, context, { filename: file });
  return context.exports;
}

test('manual and Google sessions work for online checkout and are removed on logout', async () => {
  const jose = await import('jose');
  const config = load('lib/session-config.ts', {});
  const schema = load('lib/validations/auth.ts', { zod: require('zod') });
  const orderSchema = load('lib/validations/order.ts', { zod: require('zod') });
  const jar = new Map();
  const writes = [];
  const cookieStore = { get: name => jar.has(name) ? { value: jar.get(name) } : undefined,
    set: (name, value, options) => { jar.set(name, value); writes.push({ name, options }); }, delete: name => jar.delete(name) };
  const user = { id: 'sc-test-user', name: 'Session Test', email: 'session@example.invalid', role: 'CUSTOMER', status: 'ACTIVE', authProvider: 'LOCAL', passwordHash: 'test-hash', failedLoginAttempts: 0, lockedUntil: null };
  const prisma = { user: { findUnique: async () => ({ ...user }), update: async () => ({ ...user }) },
    address: { findFirst: async ({ where }) => { assert.equal(where.userId, user.id); return { name: user.name, phone: '9999999999', addressLine1: 'Test address', addressLine2: null, city: 'Chennai', state: 'Tamil Nadu', pincode: '600001' }; } },
    order: { findUnique: async () => null } };
  const auth = load('lib/auth.ts', { './session-config': config, bcryptjs: { compare: async password => password === 'valid-password', hash: async () => 'test-hash' }, jose, '@/lib/db': { prisma }, '@prisma/client': {} }, { AUTH_SECRET: 'test-only-secret-not-used-by-the-application' });
  const actions = load('app/actions/auth.actions.ts', { '@/lib/session-config': config, '@/lib/db': { prisma }, '@/lib/auth': auth, '@/lib/validations/auth': schema, 'next/headers': { cookies: async () => cookieStore }, '@/lib/mailer': { sendEmail: async () => {} }, '@/lib/email-templates': { welcomeEmailHtml: () => '' } });
  let orders = 0;
  const orderActions = load('app/actions/order.actions.ts', { '@/lib/session-config': config, '@/lib/services/order.service': { createOrderFromCart: async input => { orders++; assert.equal(input.userId, user.id); return { id: 'sc-test-order', orderNumber: 'SC-TEST', paymentMethod: input.paymentMethod }; } }, '@/lib/validations/order': orderSchema, 'next/headers': { cookies: async () => cookieStore }, '@/lib/db': { prisma }, 'next/cache': { revalidatePath: () => {} }, '@/lib/auth': auth, '@/lib/mailer': { sendEmail: async () => {} }, '@/lib/email-templates': {} });
  const input = { checkoutKey: 'b76ae7cf-7705-4c59-932f-dba22a56bd73', shippingAddressId: 'sc-address' };
  async function checkoutOnline() { const result = await orderActions.createOrderAction({ ...input, paymentMethod: 'ONLINE' }); assert.equal(result.success, true); assert.equal(result.paymentMethod, 'ONLINE'); }
  assert.equal((await actions.loginUser({ email: user.email, password: 'wrong' })).success, false);
  assert.equal(jar.has(config.SESSION_COOKIE_NAME), false);
  assert.equal((await actions.loginUser({ email: user.email, password: 'valid-password' })).success, true);
  assert.equal(writes.at(-1).options.httpOnly, true); assert.equal(writes.at(-1).options.path, '/');
  const manualToken = jar.get(config.SESSION_COOKIE_NAME);
  assert.equal((await auth.verifySessionToken(manualToken)).id, user.id);
  const beforeRejectedPayment = orders;
  assert.equal((await orderActions.createOrderAction({ ...input, paymentMethod: 'OFFLINE' })).success, false);
  assert.equal(orders, beforeRejectedPayment);
  await checkoutOnline();
  jar.set('aarna_session_user', manualToken); jar.set('google_oauth_state', 'pending');
  await actions.logoutUser(); assert.equal(jar.size, 0);
  assert.equal((await orderActions.createOrderAction({ ...input, paymentMethod: 'ONLINE' })).success, false);
  jar.set('aarna_session_user', manualToken);
  assert.equal((await orderActions.createOrderAction({ ...input, paymentMethod: 'ONLINE' })).success, false);
  jar.clear(); jar.set('google_oauth_state', 'valid-state');
  const google = load('app/api/auth/google/callback/route.ts', { '@/lib/session-config': config, 'next/server': { NextRequest, NextResponse }, '@/lib/google-auth': { exchangeCodeForToken: async () => ({ access_token: 'test-only' }), fetchGoogleUserInfo: async () => ({ sub: 'test-google-id', email: user.email, name: user.name, email_verified: true }) }, '@/lib/auth': auth, '@/lib/db': { prisma }, 'next/headers': { cookies: async () => cookieStore } });
  const invalid = await google.GET(new NextRequest('http://localhost/api/auth/google/callback?code=test&state=wrong'));
  assert.equal(invalid.cookies.get(config.SESSION_COOKIE_NAME), undefined);
  const response = await google.GET(new NextRequest('http://localhost/api/auth/google/callback?code=test&state=valid-state'));
  const cookie = response.cookies.get(config.SESSION_COOKIE_NAME); assert(cookie); assert.equal(cookie.path, '/'); assert.equal(cookie.httpOnly, true);
  jar.set(config.SESSION_COOKIE_NAME, cookie.value); await checkoutOnline();
  user.status = 'BLOCKED'; assert.equal((await orderActions.createOrderAction({ ...input, paymentMethod: 'ONLINE' })).success, false); user.status = 'ACTIVE';
  jar.set(config.SESSION_COOKIE_NAME, 'tampered'); assert.equal((await orderActions.createOrderAction({ ...input, paymentMethod: 'ONLINE' })).success, false);
  const expired = await new jose.SignJWT({ ...user }).setProtectedHeader({ alg: 'HS256' }).setExpirationTime(0).sign(new TextEncoder().encode('test-only-secret-not-used-by-the-application'));
  jar.set(config.SESSION_COOKIE_NAME, expired); assert.equal((await orderActions.createOrderAction({ ...input, paymentMethod: 'ONLINE' })).success, false);
  const logout = load('app/api/auth/logout/route.ts', { '@/lib/session-config': config, 'next/server': { NextRequest, NextResponse } });
  const cleared = await logout.POST(new NextRequest('http://localhost/api/auth/logout', { method: 'POST', headers: { 'X-Sudha-Logout': '1' } }));
  for (const name of config.SESSION_COOKIES_TO_CLEAR) { const c = cleared.cookies.get(name); assert.equal(c.value, ''); assert.equal(c.maxAge, 0); assert.equal(c.path, '/'); }
  assert.equal(orders, 2);
});

test('checkout defaults to online payment and rejects unsupported payment methods', async () => {
  const { CreateOrderSchema } = load('lib/validations/order.ts', { zod: require('zod') });
  const input = { checkoutKey: 'b76ae7cf-7705-4c59-932f-dba22a56bd73', shippingAddressId: 'sc-address' };
  assert.equal(CreateOrderSchema.parse(input).paymentMethod, 'ONLINE');
  for (const paymentMethod of ['OFFLINE', '', null, 1]) {
    assert.equal(CreateOrderSchema.safeParse({ ...input, paymentMethod }).success, false);
  }
  let databaseCalls = 0;
  const { createOrderFromCart } = load('lib/services/order.service.ts', {
    '@/lib/db': { prisma: { $transaction: async () => { databaseCalls++; } } },
    '@prisma/client': {}, '@/lib/services/coupon.service': {}, crypto: require('node:crypto'),
    '@/lib/payments/razorpay': { paymentConfig: () => { throw Error('Provider must not be called for invalid payment methods'); } },
  });
  await assert.rejects(() => createOrderFromCart({ paymentMethod: 'OFFLINE' }), /Only online payment is supported/);
  assert.equal(databaseCalls, 0);
});
