// Runs payment integration tests in a disposable PostgreSQL schema, never in store tables.
const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('node:crypto');
const { spawnSync } = require('node:child_process');
if (process.env.RUN_PAYMENT_DB_TESTS !== 'true') { console.error('Set RUN_PAYMENT_DB_TESTS=true to allow creation of an isolated test schema.'); process.exit(1); }
const control = new PrismaClient();
const schema = 'payment_test_' + randomUUID().replaceAll('-', '');
async function main() {
  if (!/^payment_test_[a-f0-9]{32}$/.test(schema)) throw new Error('Invalid test schema');
  await control.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
  const url = new URL(process.env.DATABASE_URL); url.searchParams.set('schema', schema);
  const env = { ...process.env, DATABASE_URL: url.toString(), PAYMENT_ISOLATED_TEST_SCHEMA: schema };
  for (const args of [
    ['node_modules/prisma/build/index.js', 'migrate', 'deploy'],
    ['--import', 'tsx', '--test', '--test-concurrency=1', 'tests/payments.integration.test.ts', 'tests/payment-worker.integration.test.ts'],
  ]) {
    const result = spawnSync(process.execPath, args, { env, encoding: 'utf8' });
    console.log((result.stdout + result.stderr).replaceAll(process.env.DATABASE_URL, '[database URL]').replaceAll(url.toString(), '[test database URL]'));
    if (result.status !== 0) throw new Error('Integration verification failed');
  }
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(async () => {
  await control.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  await control.$disconnect();
});
