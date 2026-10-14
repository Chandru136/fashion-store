const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { NextRequest, NextResponse } = require('next/server');

function load(file, dependencies, env = {}, globals = {}) {
  const context = { exports: {}, process: { env }, console, TextEncoder, Date, URL, URLSearchParams, ...globals,
    require(name) { if (!Object.hasOwn(dependencies, name)) throw Error(`Unexpected dependency ${name} in ${file}`); return dependencies[name]; } };
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
  const permissions = load('lib/permissions.ts', {});
  const authorization = load('lib/admin-authorization.ts', { 'next/headers': { cookies: async () => cookieStore }, '@/lib/auth': auth, '@/lib/db': { prisma }, '@/lib/session-config': config, '@/lib/permissions': permissions });
  const orderActions = load('app/actions/order.actions.ts', { '@/lib/payments/lifecycle.service': { updateOrderFulfillment: async () => { throw Error('Unexpected fulfillment call in session test'); } }, '@/lib/admin-authorization': authorization, '@/lib/permissions': permissions, '@/lib/session-config': config, '@/lib/services/order.service': { createOrderFromCart: async input => { orders++; assert.equal(input.userId, user.id); return { id: 'sc-test-order', orderNumber: 'SC-TEST', paymentMethod: input.paymentMethod }; } }, '@/lib/validations/order': orderSchema, 'next/headers': { cookies: async () => cookieStore }, '@/lib/db': { prisma }, 'next/cache': { revalidatePath: () => {} }, '@/lib/auth': auth, '@/lib/mailer': { sendEmail: async () => {} }, '@/lib/email-templates': {} });
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
    '@prisma/client': {}, '@/lib/listing': {}, '@/lib/services/coupon.service': {}, crypto: require('node:crypto'),
    '@/lib/payments/razorpay': { paymentConfig: () => { throw Error('Provider must not be called for invalid payment methods'); } },
  });
  await assert.rejects(() => createOrderFromCart({ paymentMethod: 'OFFLINE' }), /Only online payment is supported/);
  assert.equal(databaseCalls, 0);
});


// Every application import is allowlisted. No Prisma client, network, mailer,
// application environment, or provider SDK is loaded by these fixtures.
async function sessionFixture() {
  const jose = await import('jose');
  const secret = 'sudha-collections-unit-test-secret-only';
  const env = { AUTH_SECRET: secret, NODE_ENV: 'production' };
  const config = load('lib/session-config.ts', {}, env);
  const schema = load('lib/validations/auth.ts', { zod: require('zod') });
  const jar = new Map();
  const writes = [];
  const state = { user: { id: 'SC-user', name: 'Sudha Collections Test', email: 'auth@example.invalid', role: 'CUSTOMER', status: 'ACTIVE', passwordHash: 'mock-hash', failedLoginAttempts: 0, lockedUntil: null, googleId: null }, exchanges: 0, creates: 0 };
  const store = { get: name => jar.has(name) ? { value: jar.get(name) } : undefined,
    set: (name, value, options) => { jar.set(name, value); writes.push({ name, options }); }, delete: name => jar.delete(name) };
  const prisma = { user: {
    findUnique: async ({ where }) => state.user && Object.entries(where).every(([key, value]) => state.user[key] === value) ? { ...state.user } : null,
    update: async ({ data }) => { writes.push({ data }); Object.assign(state.user, data); return { ...state.user }; },
    create: async ({ data }) => { state.creates++; state.user = { id: 'SC-new-user', status: 'ACTIVE', ...data }; return { ...state.user }; },
  } };
  const auth = load('lib/auth.ts', { './session-config': config, bcryptjs: { compare: async value => value === 'valid-password', hash: async () => 'mock-hash' }, jose, '@/lib/db': { prisma }, '@prisma/client': {} }, env);
  const edge = load('lib/session-edge.ts', { jose }, env);
  const permissions = load('lib/permissions.ts', {});
  const headers = { cookies: async () => store };
  const guard = load('lib/admin-authorization.ts', { 'next/headers': headers, '@/lib/auth': auth, '@/lib/db': { prisma }, '@/lib/session-config': config, '@/lib/permissions': permissions });
  const actions = load('app/actions/auth.actions.ts', { '@/lib/session-config': config, '@/lib/db': { prisma }, '@/lib/auth': auth, '@/lib/validations/auth': schema, 'next/headers': headers, '@/lib/mailer': { sendEmail: async () => {} }, '@/lib/email-templates': { welcomeEmailHtml: () => '' } }, env);
  const middleware = load('middleware.ts', { '@/lib/session-config': config, 'next/server': { NextResponse }, '@/lib/session-edge': edge });
  const googleUser = { sub: 'SC-google-id', email: 'auth@example.invalid', name: 'Sudha Collections Test', email_verified: true };
  const google = load('app/api/auth/google/callback/route.ts', { '@/lib/session-config': config, 'next/server': { NextRequest, NextResponse }, '@/lib/google-auth': {
    exchangeCodeForToken: async () => { state.exchanges++; return { access_token: 'mock-token' }; }, fetchGoogleUserInfo: async () => googleUser,
  }, '@/lib/auth': auth, '@/lib/db': { prisma }, 'next/headers': headers }, env);
  const applyCookies = response => { for (const c of response.cookies.getAll()) {
    if (c.maxAge === 0 || (c.expires && c.expires.getTime() <= Date.now())) jar.delete(c.name); else jar.set(c.name, c.value);
  } };
  const signIn = async () => jar.set(config.SESSION_COOKIE_NAME, await auth.createSessionToken(state.user));
  const request = path => new NextRequest('https://sudha-collections.example' + path, { headers: { cookie: [...jar].map(([k,v]) => k + '=' + v).join('; ') } });
  return { jose, secret, env, config, schema, jar, writes, state, prisma, auth, edge, guard, actions, middleware, google, googleUser, applyCookies, signIn, request, headers };
}

for (const scenario of ['valid', 'wrong password', 'missing account', 'blocked', 'locked', 'Google only']) {
  test('password login: ' + scenario, async () => {
    const f = await sessionFixture();
    if (scenario === 'missing account') f.state.user = null;
    if (scenario === 'blocked') f.state.user.status = 'BLOCKED';
    if (scenario === 'locked') f.state.user.lockedUntil = new Date(Date.now() + 60000);
    if (scenario === 'Google only') f.state.user.passwordHash = null;
    const result = await f.actions.loginUser({ email: 'AUTH@example.invalid', password: scenario === 'wrong password' ? 'wrong' : 'valid-password' });
    assert.equal(result.success, scenario === 'valid');
    assert.equal(f.jar.has(f.config.SESSION_COOKIE_NAME), scenario === 'valid');
    if (scenario === 'valid') {
      const c = f.writes.at(-1).options;
      assert.equal(c.httpOnly, true); assert.equal(c.secure, true); assert.equal(c.sameSite, 'lax'); assert.equal(c.path, '/'); assert.equal(c.maxAge, 604800);
    } else if (scenario !== 'wrong password') assert.equal(f.writes.length, 0);
  });
}

test('login lockout threshold and successful counter reset', async () => {
  const f = await sessionFixture(); f.state.user.failedLoginAttempts = 4;
  await f.actions.loginUser({ email: f.state.user.email, password: 'wrong' });
  assert.equal(f.state.user.failedLoginAttempts, 0); assert(f.state.user.lockedUntil > new Date());
  f.state.user.lockedUntil = new Date(0); f.state.user.failedLoginAttempts = 2;
  assert.equal((await f.actions.loginUser({ email: f.state.user.email, password: 'valid-password' })).success, true);
  assert.equal(f.state.user.failedLoginAttempts, 0); assert.equal(f.state.user.lockedUntil, null);
});

for (const scenario of ['missing', 'malformed', 'tampered', 'expired', 'wrong secret']) {
  test('Node and Edge JWT verification reject ' + scenario, async () => {
    const f = await sessionFixture(); let token;
    if (scenario === 'malformed') token = 'not-a-jwt';
    if (scenario === 'tampered') {
      const parts = (await f.auth.createSessionToken(f.state.user)).split('.');
      parts[1] = Buffer.from(JSON.stringify({ ...f.state.user, role: 'ADMIN' })).toString('base64url'); token = parts.join('.');
    }
    if (scenario === 'expired' || scenario === 'wrong secret') token = await new f.jose.SignJWT(f.state.user).setProtectedHeader({ alg: 'HS256' }).setExpirationTime(scenario === 'expired' ? 0 : '1h').sign(new TextEncoder().encode(scenario === 'wrong secret' ? 'different-unit-test-secret' : f.secret));
    assert.equal(await f.auth.verifySessionToken(token), null); assert.equal(await f.edge.verifySessionTokenEdge(token), null);
  });
}

test('current database role and account status govern administrative authorization', async () => {
  const f = await sessionFixture(); f.state.user.role = 'ADMIN'; await f.signIn();
  assert.equal((await f.guard.requireAdminPermission('update_orders')).role, 'ADMIN');
  f.state.user.role = 'CUSTOMER';
  await assert.rejects(() => f.guard.requireAdminPermission('update_orders'), e => e.status === 403);
  assert.equal((await f.auth.getSessionUser(f.state.user.id)).role, 'CUSTOMER');
  f.state.user.role = 'ORDER_MANAGER'; assert.equal((await f.guard.requireAdminPermission('update_orders')).role, 'ORDER_MANAGER');
  f.state.user.status = 'BLOCKED'; assert.equal(await f.auth.getSessionUser(f.state.user.id), null);
  await assert.rejects(() => f.guard.requireAdminPermission('update_orders'), e => e.status === 403);
  f.state.user = null; assert.equal(await f.auth.getSessionUser('SC-user'), null);
  await assert.rejects(() => f.guard.requireAdminPermission('update_orders'), e => e.status === 403);
});

test('customer/admin route separation and repeated action logout deny subsequent access', async () => {
  const f = await sessionFixture(); await f.signIn();
  assert.equal((await f.middleware.middleware(f.request('/admin'))).status, 307);
  assert.equal((await f.middleware.middleware(f.request('/profile'))).status, 200);
  f.state.user.role = 'ADMIN'; await f.signIn();
  assert.equal((await f.middleware.middleware(f.request('/admin'))).status, 200);
  for (const name of f.config.SESSION_COOKIES_TO_CLEAR) if (!f.jar.has(name)) f.jar.set(name, 'pending');
  for (let i = 0; i < 2; i++) { assert.equal((await f.actions.logoutUser()).success, true); assert.equal(f.jar.size, 0); }
  for (const path of ['/admin', '/profile', '/orders', '/addresses']) assert.equal((await f.middleware.middleware(f.request(path))).status, 307);
  await assert.rejects(() => f.guard.requireAdminPermission('update_orders'), e => e.status === 401);
});

test('logout API rejects cross-site requests and repeatedly expires browser cookies', async () => {
  const f = await sessionFixture(); await f.signIn();
  const route = load('app/api/auth/logout/route.ts', { '@/lib/session-config': f.config, 'next/server': { NextRequest, NextResponse } });
  for (const headers of [{}, { 'x-sudha-logout': '1', 'sec-fetch-site': 'cross-site' }]) {
    const r = await route.POST(new NextRequest('https://sudha-collections.example/api/auth/logout', { method: 'POST', headers }));
    assert.equal(r.status, 403); assert.equal(r.cookies.getAll().length, 0);
  }
  for (let i = 0; i < 2; i++) {
    const r = await route.POST(new NextRequest('https://sudha-collections.example/api/auth/logout', { method: 'POST', headers: { 'x-sudha-logout': '1' } }));
    assert.equal(r.status, 200); assert.equal(r.headers.get('cache-control'), 'no-store');
    for (const name of f.config.SESSION_COOKIES_TO_CLEAR) { const c = r.cookies.get(name); assert.equal(c.maxAge, 0); assert.equal(c.secure, true); assert.equal(c.httpOnly, true); assert.equal(c.sameSite, 'lax'); assert.equal(c.path, '/'); }
    f.applyCookies(r); assert.equal(f.jar.size, 0);
    assert.equal((await f.middleware.middleware(f.request('/profile'))).status, 307);
  }
});

for (const scenario of ['missing header', 'cross-site', 'malformed JSON', 'invalid input', 'invalid credentials', 'valid credentials', 'service failure']) {
  test('login API: ' + scenario, async () => {
    const f = await sessionFixture(); let calls = 0;
    const route = load('app/api/auth/login/route.ts', { 'next/server': { NextRequest, NextResponse }, '@/lib/validations/auth': f.schema, '@/app/actions/auth.actions': { loginUser: async input => { calls++; if (scenario === 'service failure') throw Error('mock outage'); return f.actions.loginUser(input); } } });
    const headers = { 'x-sudha-login': '1' }; if (scenario === 'missing header') delete headers['x-sudha-login']; if (scenario === 'cross-site') headers['sec-fetch-site'] = 'cross-site';
    const body = scenario === 'malformed JSON' ? '{' : JSON.stringify(scenario === 'invalid input' ? {} : { email: 'auth@example.invalid', password: scenario === 'invalid credentials' ? 'wrong' : 'valid-password' });
    const r = await route.POST(new NextRequest('https://sudha-collections.example/api/auth/login', { method: 'POST', headers, body }));
    const expected = { 'missing header': 403, 'cross-site': 403, 'malformed JSON': 400, 'invalid input': 400, 'invalid credentials': 401, 'valid credentials': 200, 'service failure': 503 }[scenario];
    assert.equal(r.status, expected); assert.equal(calls, [400,403].includes(expected) ? 0 : 1);
    if (![400,403].includes(expected)) assert.equal(r.headers.get('cache-control'), 'no-store');
  });
}

test('Google initiation creates independent short-lived secure state cookies', async () => {
  const f = await sessionFixture();
  const route = load('app/api/auth/google/route.ts', { 'next/server': { NextRequest, NextResponse }, crypto: require('node:crypto'), '@/lib/google-auth': { buildGoogleAuthUrl: state => 'https://accounts.google.com/o/oauth2/v2/auth?state=' + state } }, f.env);
  const states = [];
  for (let i = 0; i < 2; i++) {
    const r = await route.GET(f.request('/api/auth/google')); const c = r.cookies.get('google_oauth_state');
    assert.match(c.value, /^[a-f0-9]{48}$/); assert.equal(new URL(r.headers.get('location')).searchParams.get('state'), c.value);
    assert.equal(c.httpOnly, true); assert.equal(c.secure, true); assert.equal(c.sameSite, 'lax'); assert.equal(c.maxAge, 600); assert.equal(c.path, '/'); states.push(c.value);
  }
  assert.notEqual(states[0], states[1]);
});

for (const query of ['?error=access_denied', '?code=mock', '?state=valid', '?code=mock&state=wrong', '?code=mock&state=valid']) {
  test('Google rejects incomplete/mismatched state without contacting provider: ' + query, async () => {
    const f = await sessionFixture(); if (query !== '?code=mock&state=valid') f.jar.set('google_oauth_state', 'valid');
    const r = await f.google.GET(f.request('/api/auth/google/callback' + query));
    assert.equal(new URL(r.headers.get('location')).pathname, '/login'); assert.equal(r.cookies.get(f.config.SESSION_COOKIE_NAME), undefined); assert.equal(f.state.exchanges, 0); assert.equal(f.writes.length, 0); assert.equal(f.state.creates, 0);
  });
}

for (const scenario of ['unverified', 'blocked linked', 'blocked local', 'active linked', 'active local', 'new account']) {
  test('Google callback: ' + scenario, async () => {
    const f = await sessionFixture(); f.jar.set('google_oauth_state', 'valid');
    if (scenario === 'unverified') f.googleUser.email_verified = false;
    if (scenario.includes('linked')) f.state.user.googleId = f.googleUser.sub;
    if (scenario.startsWith('blocked')) f.state.user.status = 'BLOCKED';
    if (scenario === 'active linked') f.state.user.role = 'ORDER_MANAGER';
    if (scenario === 'new account') f.state.user = null;
    const r = await f.google.GET(f.request('/api/auth/google/callback?code=mock&state=valid'));
    const allowed = scenario.startsWith('active') || scenario === 'new account';
    assert.equal(new URL(r.headers.get('location')).pathname, allowed ? '/profile' : '/login');
    assert.equal(Boolean(r.cookies.get(f.config.SESSION_COOKIE_NAME)), allowed);
    if (!allowed) { assert.equal(f.writes.length, 0); assert.equal(f.state.creates, 0); }
    else {
      const cookie = r.cookies.get(f.config.SESSION_COOKIE_NAME); assert.equal(cookie.secure, true); assert.equal(cookie.httpOnly, true);
      assert.equal((await f.auth.verifySessionToken(cookie.value)).role, scenario === 'active linked' ? 'ORDER_MANAGER' : 'CUSTOMER');
      assert.equal(f.state.creates, scenario === 'new account' ? 1 : 0);
      assert.equal(f.writes.length, scenario === 'active local' ? 1 : 0);
      f.applyCookies(r); assert.equal(f.jar.has('google_oauth_state'), false);
      const repeated = await f.google.GET(f.request('/api/auth/google/callback?code=mock&state=valid'));
      assert.equal(repeated.cookies.get(f.config.SESSION_COOKIE_NAME), undefined); assert.equal(f.state.exchanges, 1);
    }
  });
}

test('address reads and mutations enforce customer ownership; logout denies access', async () => {
  const f = await sessionFixture(); await f.signIn(); let transactions = 0;
  const rows = [{ id: 'SC-own', userId: 'SC-user' }, { id: 'SC-other', userId: 'SC-other-user' }];
  f.prisma.address = {
    findMany: async ({ where }) => rows.filter(r => r.userId === where.userId),
    findFirst: async ({ where }) => rows.find(r => r.id === where.id && r.userId === where.userId) || null,
  };
  f.prisma.$transaction = async () => { transactions++; throw Error('Unexpected mutation'); };
  const actions = load('app/actions/address.actions.ts', { '@/lib/session-config': f.config, '@/lib/db': { prisma: f.prisma }, 'next/headers': f.headers, '@/lib/auth': f.auth, '@/lib/validations/auth': f.schema, 'next/cache': { revalidatePath: () => {} }, zod: require('zod'), 'country-state-city': {} });
  assert.deepEqual((await actions.getAddresses()).map(r => r.id), ['SC-own']);
  assert.equal((await actions.deleteAddress('SC-other')).success, false);
  assert.equal((await actions.setDefaultAddress('SC-other')).success, false); assert.equal(transactions, 0);
  await f.actions.logoutUser(); await assert.rejects(() => actions.getAddresses(), /Not authenticated/);
  await assert.rejects(() => actions.deleteAddress('SC-own'), /Not authenticated/);
});

test('documented limitation: copied JWT and middleware role snapshot survive browser logout/account changes', async () => {
  const f = await sessionFixture(); f.state.user.role = 'ADMIN'; await f.signIn(); const token = f.jar.get(f.config.SESSION_COOKIE_NAME);
  await f.actions.logoutUser(); assert.equal((await f.auth.verifySessionToken(token)).id, 'SC-user');
  f.state.user.status = 'BLOCKED'; f.state.user.role = 'CUSTOMER'; f.jar.set(f.config.SESSION_COOKIE_NAME, token);
  assert.equal((await f.middleware.middleware(f.request('/admin'))).status, 200);
  await assert.rejects(() => f.guard.requireAdminPermission('update_orders'), e => e.status === 403);
});


test('Google provider helper builds authorization request and exchanges code using mocked fetch only', async () => {
  const calls = [];
  const env = { GOOGLE_CLIENT_ID: 'SC-test-client', GOOGLE_CLIENT_SECRET: 'SC-test-secret', GOOGLE_REDIRECT_URI: 'https://sudha-collections.example/api/auth/google/callback' };
  let fail = false;
  const helper = load('lib/google-auth.ts', {}, env, { fetch: async (url, options) => {
    calls.push({ url, options }); return { ok: !fail, text: async () => 'mock provider rejection', json: async () => url.includes('/token') ? { access_token: 'SC-test-access' } : { sub: 'SC-test-google', email_verified: true } };
  } });
  const url = new URL(helper.buildGoogleAuthUrl('SC-state'));
  assert.equal(url.origin, 'https://accounts.google.com'); assert.equal(url.searchParams.get('state'), 'SC-state');
  assert.equal(url.searchParams.get('redirect_uri'), env.GOOGLE_REDIRECT_URI); assert.equal(url.searchParams.get('response_type'), 'code');
  assert.equal(url.searchParams.get('scope'), 'openid email profile'); assert.equal(url.searchParams.has('client_secret'), false);
  const tokens = await helper.exchangeCodeForToken('SC-code');
  assert.equal(calls[0].options.method, 'POST'); assert.equal(calls[0].options.body.get('code'), 'SC-code');
  assert.equal(calls[0].options.body.get('client_secret'), env.GOOGLE_CLIENT_SECRET);
  await helper.fetchGoogleUserInfo(tokens.access_token); assert.equal(calls[1].options.headers.Authorization, 'Bearer SC-test-access');
  fail = true; await assert.rejects(() => helper.exchangeCodeForToken('SC-code'), /token exchange failed/);
  await assert.rejects(() => helper.fetchGoogleUserInfo('SC-test-access'), /Failed/);
});

for (const stage of ['exchange', 'userinfo']) test('Google callback fails closed on ' + stage + ' failure', async () => {
  const f = await sessionFixture(); f.jar.set('google_oauth_state', 'valid'); let logs = 0;
  const route = load('app/api/auth/google/callback/route.ts', { '@/lib/session-config': f.config, 'next/server': { NextRequest, NextResponse }, '@/lib/google-auth': {
    exchangeCodeForToken: async () => { if (stage === 'exchange') throw Error('mock provider outage'); return { access_token: 'mock' }; },
    fetchGoogleUserInfo: async () => { throw Error('mock provider outage'); },
  }, '@/lib/auth': f.auth, '@/lib/db': { prisma: f.prisma }, 'next/headers': f.headers }, f.env, { console: { error: () => { logs++; } } });
  const r = await route.GET(f.request('/api/auth/google/callback?code=mock&state=valid'));
  assert.equal(new URL(r.headers.get('location')).pathname, '/login'); assert.equal(r.cookies.get(f.config.SESSION_COOKIE_NAME), undefined);
  assert.equal(f.writes.length, 0); assert.equal(f.state.creates, 0); assert.equal(logs, 1);
});

test('customer order lookup scopes the supplied order id to its owner', async () => {
  const rows = [{ id: 'SC-own-order', userId: 'SC-user' }, { id: 'SC-other-order', userId: 'SC-other-user' }];
  const service = load('lib/services/order.service.ts', { '@/lib/db': { prisma: { order: {
    findUnique: async ({ where }) => { assert.equal(where.userId, 'SC-user'); return rows.find(r => r.id === where.id && r.userId === where.userId) || null; },
  } } }, '@prisma/client': {}, '@/lib/listing': {}, '@/lib/services/coupon.service': {}, crypto: require('node:crypto'), '@/lib/payments/razorpay': {} });
  assert.equal((await service.getOrderById('SC-own-order', 'SC-user')).id, 'SC-own-order');
  assert.equal(await service.getOrderById('SC-other-order', 'SC-user'), null);
});
