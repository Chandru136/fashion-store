// Shared by Edge middleware, server actions and OAuth routes.
export const SESSION_COOKIE_NAME = "sudha_collections_session_user";
export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: SESSION_DURATION_SECONDS,
  path: "/",
};
// Legacy cookies are removed, never accepted as an alternate login.
export const SESSION_COOKIES_TO_CLEAR = [SESSION_COOKIE_NAME, "aarna_session_user", "google_oauth_state"];
