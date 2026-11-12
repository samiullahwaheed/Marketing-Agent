import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE, readSessionUserId } from "./auth";
import { getSupabase, unwrap, unwrapOne } from "./supabase";

export interface User {
  id: string;
  name: string;
  email: string;
}

interface UserRow extends User {
  password_hash: string;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const res = await getSupabase().from("users").select("*").eq("email", normalizeEmail(email)).maybeSingle();
  return unwrap(res, "Looking up user") as UserRow | null;
}

/** Returns null when the email is already taken. */
export async function createUser(name: string, email: string, passwordHash: string): Promise<User | null> {
  const res = await getSupabase()
    .from("users")
    .insert({ name: name.trim(), email: normalizeEmail(email), password_hash: passwordHash })
    .select("id, name, email")
    .single();
  // 23505 = unique_violation: two sign-ups for the same email raced.
  if (res.error?.code === "23505") return null;
  return unwrapOne(res, "Creating user") as User;
}

/** The signed-in user, or null for a session made before accounts existed. */
export async function getCurrentUser(): Promise<User | null> {
  const id = await readSessionUserId((await cookies()).get(SESSION_COOKIE)?.value);
  if (!id) return null;
  const res = await getSupabase().from("users").select("id, name, email").eq("id", id).maybeSingle();
  // Only used for display, so a missing table or row shouldn't take the dashboard down.
  return res.error ? null : (res.data as User | null);
}
