"use server";

import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { type FieldErrors, type SignupField, validateSignupField } from "@/lib/account-rules";
import { SESSION_COOKIE, createSessionToken } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createUser, findUserByEmail } from "@/lib/users";

export interface AuthFormState {
  errors?: FieldErrors<SignupField>;
  /** A problem that isn't about one field (wrong email/password, server down). */
  message?: string;
  /** Echoed back so a failed submit doesn't wipe what was typed (never the password). */
  values?: { name?: string; email?: string };
}

function safeNext(next: FormDataEntryValue | null): string {
  const n = String(next || "/");
  return n.startsWith("/") && !n.startsWith("//") ? n : "/";
}

async function startSession(userId: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, await createSessionToken(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

/** Sign-up is invite-only: the team code (or, if unset, the old dashboard password) gates it. */
function accessCodeMatches(code: string): boolean {
  const expected = process.env.SIGNUP_ACCESS_CODE || process.env.DASHBOARD_PASSWORD;
  if (!expected) return false;
  const a = Buffer.from(code);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function loginAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const values = { email };

  const errors: FieldErrors<SignupField> = {};
  if (!email.trim()) errors.email = "Enter your email.";
  if (!password) errors.password = "Enter your password.";
  if (errors.email || errors.password) return { errors, values };

  let userId: string;
  try {
    const user = await findUserByEmail(email);
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      // Same message for both cases so the form doesn't reveal which emails have accounts.
      return { message: "That email and password don't match. Check both and try again.", values };
    }
    userId = user.id;
  } catch {
    return { message: "We couldn't reach the account service. Try again in a moment.", values };
  }

  await startSession(userId);
  redirect(safeNext(formData.get("next")));
}

export async function signupAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const fields = {
    name: String(formData.get("name") || ""),
    email: String(formData.get("email") || ""),
    password: String(formData.get("password") || ""),
    accessCode: String(formData.get("accessCode") || ""),
  };
  const values = { name: fields.name, email: fields.email };

  const errors: FieldErrors<SignupField> = {};
  for (const f of Object.keys(fields) as SignupField[]) {
    const e = validateSignupField(f, fields[f]);
    if (e) errors[f] = e;
  }
  if (!errors.accessCode && !accessCodeMatches(fields.accessCode.trim())) {
    errors.accessCode = "That access code isn't right. Check it with your workspace admin.";
  }
  if (Object.keys(errors).length) return { errors, values };

  let userId: string;
  try {
    if (await findUserByEmail(fields.email)) {
      return { errors: { email: "An account with this email already exists. Sign in instead." }, values };
    }
    const user = await createUser(fields.name, fields.email, await hashPassword(fields.password));
    if (!user) return { errors: { email: "An account with this email already exists. Sign in instead." }, values };
    userId = user.id;
  } catch {
    return { message: "We couldn't create your account right now. Try again in a moment.", values };
  }

  await startSession(userId);
  redirect("/");
}

export async function logoutAction(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/login");
}
