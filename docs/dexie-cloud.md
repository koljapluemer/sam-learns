# Dexie Cloud

All apps share one Dexie(+Cloud) database, `src/shared/db/db.ts`. Each app's
`db/appDb.ts` is a thin shim mapping its local table names onto prefixed
tables in that shared schema (see `add-a-new-app.md` for the pattern when
adding a new app).

Sync is opt-in: the app works fully offline/unauthenticated as before,
signing in (Settings page) just starts syncing that device's data to the
user's account. Data is private per user by default - no realm config
needed.

## Env vars

- `VITE_DEXIE_CLOUD_DB_URL` - the provisioned Dexie Cloud database URL
  (`npx dexie-cloud create`). Required.
- `VITE_DEXIE_CLOUD_SIGNUP_OPEN` - feature flag gating new account creation.
  - Unset or anything other than `"true"` (the default): signup is
    **closed**. Login is called with `{ intent: 'login' }`, so an unknown
    email gets rejected (`USER_NOT_REGISTERED`) instead of silently
    registering. The login dialog shows "Account creation is currently
    closed."
  - `"true"`: signup is open, anyone can create an account via the normal
    email + OTP flow.

  Dexie Cloud itself doesn't have an "is this email already registered"
  toggle - this flag works by choosing which `intent` we pass to
  `db.cloud.login()`, per `dexie-cloud-addon`'s `LoginHints` type.

Note: a fresh database has no registered users, so signup must be `true` at
least once (to create the first/owner account) before it's safe to close.
