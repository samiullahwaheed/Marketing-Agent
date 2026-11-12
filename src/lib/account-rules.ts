/** Field rules shared by the sign-up form (checks on blur) and the server action (final say). */

export type SignupField = "name" | "email" | "password" | "accessCode";
export type FieldErrors<F extends string> = Partial<Record<F, string>>;

export const PASSWORD_RULES = [
  { id: "length", label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { id: "letter", label: "A letter", test: (p: string) => /[A-Za-z]/.test(p) },
  { id: "number", label: "A number", test: (p: string) => /\d/.test(p) },
] as const;

/** 0–4, for the strength meter. Length counts most; variety adds the rest. */
export function passwordScore(p: string): number {
  if (!p) return 0;
  let score = PASSWORD_RULES.filter((r) => r.test(p)).length;
  if (p.length >= 12 && /[^A-Za-z0-9]/.test(p)) score += 1;
  return Math.min(score, 4);
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateSignupField(field: SignupField, value: string): string | undefined {
  const v = field === "password" ? value : value.trim();
  switch (field) {
    case "name":
      if (!v) return "Enter your name so your team knows who approved what.";
      if (v.length < 2) return "Your name needs at least 2 characters.";
      if (v.length > 80) return "Keep your name under 80 characters.";
      return;
    case "email":
      if (!v) return "Enter your work email.";
      if (!EMAIL.test(v)) return "That doesn't look like an email. Check for a typo, like name@company.com.";
      return;
    case "password": {
      if (!v) return "Create a password.";
      const missing = PASSWORD_RULES.filter((r) => !r.test(v)).map((r) => r.label.toLowerCase());
      if (missing.length) return `Your password needs ${missing.join(", ")}.`;
      return;
    }
    case "accessCode":
      if (!v) return "Enter the team access code. Ask your workspace admin if you don't have it.";
      return;
  }
}
