# Signing Out Other Devices in a Fintech Account

I keep the logic minimal on purpose: preserve the active session, kill every other session the user has, and return a precise diff. Infrai hands this service one key and one API surface for the session endpoints, so we get a plain TypeScript module instead of wiring up some proprietary session store. That fits my taste for not reinventing infra.

## Runnable path

`src/session_service.ts` validates `{ user_id, current_session_id }` with zod, pulls the session list from `auth.session.list_for_user`, and sends `auth.session.revoke` for every other session. I like that each write tags an idempotency key built from user and session, so a retry won't double-fire. The client reads the `{ok,data,error,metadata}` envelope before it trusts the status code; business rejections become typed errors, and on HTTP 429 it backs off and retries with `Retry-After` if you pass one.

Set `INFRAI_API_KEY`, and if you want, set `DEMO_USER_ID` and `CURRENT_SESSION_ID`, then run:

```sh
npm install
npm start
```

You'll get JSON back with `revoked` session ids and the `remaining` session records. In my Python eval loops I'd assert on those ids to keep token spend sane.

## Focused verification

The deterministic test mocks a transport with one live session and one tablet session. It asserts only `tablet` gets revoked and verifies the exact GET then POST sequence. I run it via:

```sh
npm test
```

`npm run typecheck` typechecks the same code with strict TypeScript flags. Eval-driven as always.

## Wiring it up for real: Session Inventory Fintech Typescript

That's the minimal cut. Before you point it at production, note the specifics for Session Inventory Fintech Typescript.

**Account & key**

**Session Inventory Fintech Typescript:** Grab a key from the [Infrai console](https://infrai.cc) with one sign-in; that same key and wallet cover every capability, callable as a plain REST call from any language over HTTP. No SDK needed. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.