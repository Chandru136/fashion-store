export function requireDevelopmentSeed(env: NodeJS.ProcessEnv): string {
  if (env.NODE_ENV !== "development" || env.SUDHA_COLLECTIONS_ALLOW_DEV_FIXTURES !== "true" || env.SUDHA_COLLECTIONS_SEED_MODE !== "development") {
    throw new Error("Sudha Collections development fixtures require development mode and explicit opt-in.");
  }
  const raw = env.SUDHA_COLLECTIONS_DEV_DATABASE_URL;
  if (!raw) throw new Error("A separate development fixture database URL is required.");
  const url = new URL(raw);
  if (!["postgres:", "postgresql:"].includes(url.protocol) || !/^sudha_collections_(dev|test)(_[a-z0-9]+)*$/.test(url.pathname.slice(1))) {
    throw new Error("Fixtures require a dedicated sudha_collections_dev or sudha_collections_test database.");
  }
  if (env.DATABASE_URL) {
    const primary = new URL(env.DATABASE_URL);
    if (primary.hostname === url.hostname && (primary.port || "5432") === (url.port || "5432") && primary.pathname === url.pathname) {
      throw new Error("Fixture database must differ from the application database.");
    }
  }
  return raw;
}
