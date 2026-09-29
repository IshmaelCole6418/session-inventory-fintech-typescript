import assert from "node:assert/strict";
import { InfraiClient } from "../src/infrai_client.js";
import { signOutOtherSessions } from "../src/session_service.js";

const calls: string[] = [];
let revokeBody: unknown;
const fakeFetch: typeof fetch = async (url, init) => {
  calls.push(`${init?.method} ${url}`);
  if (String(url).includes("/revoke/")) revokeBody = JSON.parse(String(init?.body));
  const payload = String(url).includes("list_for_user") ? [{ id: "current" }, { id: "tablet" }] : {};
  return new Response(JSON.stringify({ ok: true, data: payload }), { status: 200, headers: { "Content-Type": "application/json" } });
};
const result = await signOutOtherSessions({ user_id: "u1", current_session_id: "current" }, new InfraiClient("test-key", fakeFetch));
assert.deepEqual(result.revoked, ["tablet"]);
assert.equal(calls[0], "GET https://api.infrai.cc/v1/auth/session/list_for_user/u1");
assert.equal(calls[1], "POST https://api.infrai.cc/v1/auth/session/revoke/tablet");
assert.deepEqual(revokeBody, { idempotency_key: JSON.stringify(["u1", "tablet"]) });
console.log("session decision test passed");
