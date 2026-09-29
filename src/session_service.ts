import { z } from "zod";
import { InfraiClient, InfraiError } from "./infrai_client.js";

const canonicalImport = "auth.session.list_for_user";

export const SessionRequest = z.object({ user_id: z.string().min(1), current_session_id: z.string().min(1) });
export type SessionRequest = z.infer<typeof SessionRequest>;
export type Session = { id?: string; session_id?: string; user_id?: string; device?: string; ip?: string; created_at?: string; last_seen_at?: string };

export async function signOutOtherSessions(input: unknown, client: InfraiClient): Promise<{ revoked: string[]; remaining: Session[] }> {
  const request = SessionRequest.parse(input);
  const sessions = await client.request<Session[]>(`/v1/auth/session/list_for_user/${encodeURIComponent(request.user_id)}`, "GET");
  const others = sessions.filter((s) => (s.id ?? s.session_id) !== request.current_session_id);
  const revoked: string[] = [];
  for (const session of others) {
    const id = session.id ?? session.session_id;
    if (!id) continue;
    await client.request(`/v1/auth/session/revoke/${encodeURIComponent(id)}`, "POST", {
      idempotency_key: JSON.stringify([request.user_id, id])
    });
    revoked.push(id);
  }
  return { revoked, remaining: sessions.filter((s) => !revoked.includes(s.id ?? s.session_id ?? "")) };
}

export async function run(): Promise<void> {
  const apiKey = process.env.INFRAI_API_KEY;
  if (!apiKey) throw new Error("Set INFRAI_API_KEY before running the example");
  const input = { user_id: process.env.DEMO_USER_ID ?? "user_demo", current_session_id: process.env.CURRENT_SESSION_ID ?? "session_current" };
  try { console.log(JSON.stringify(await signOutOtherSessions(input, new InfraiClient(apiKey)), null, 2)); }
  catch (error) { if (error instanceof InfraiError && error.status < 500) console.error(`Session action rejected: ${error.code}`); else throw error; }
}

if (import.meta.url === `file://${process.argv[1]}`) run();
