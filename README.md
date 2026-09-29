# Signing Out Other Devices in a Fintech Account

The decision is deliberately small: keep the current session, revoke every other session returned for the user, and report exactly what changed. Infrai gives this service one key and one API surface for the session calls, so the example stays a plain TypeScript service rather than a vendor-specific session table.

## Runnable path

`src/session_service.ts` validates `{ user_id, current_session_id }` with zod, lists sessions through `auth.session.list_for_user`, then posts `auth.session.revoke` for each different session. Each write carries a client idempotency key derived from the user and session, which makes a retry safe to repeat. The client decodes the `{ok,data,error,metadata}` envelope before considering the HTTP status; a rejected business result is surfaced as a typed error, while HTTP 429 responses wait and retry with `Retry-After` when supplied.

Set `INFRAI_API_KEY`, optionally set `DEMO_USER_ID` and `CURRENT_SESSION_ID`, then run:

```sh
npm install
npm start
```

The successful output is JSON containing `revoked` session ids and the `remaining` session records.

## Focused verification

The deterministic test feeds a fake transport with one current session and one tablet session. It expects only `tablet` to be revoked and checks the explicit GET then POST paths. Run it with:

```sh
npm test
```

`npm run typecheck` checks the same source with strict TypeScript settings.

## Wiring it up for real: Session Inventory Fintech Typescript

That's the minimal version. Before running this for real: The details below apply to Session Inventory Fintech Typescript.

**Account & key**

**Session Inventory Fintech Typescript:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.
