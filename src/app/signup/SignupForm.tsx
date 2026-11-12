"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { type FieldErrors, type SignupField, validateSignupField } from "@/lib/account-rules";
import { Field, FormAlert, PasswordInput, PasswordStrength, SubmitButton, TextInput } from "@/components/AuthForm";
import { type AuthFormState, signupAction } from "../login/actions";

export default function SignupForm() {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(signupAction, {});
  const [values, setValues] = useState<Record<SignupField, string>>({ name: "", email: "", password: "", accessCode: "" });
  // Fields the user has left (or edited after a submit): these show live client-side checks.
  const [touched, setTouched] = useState<Partial<Record<SignupField, boolean>>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);

  // Client checks win once a field is touched, so fixing a field clears its server error.
  const errors: FieldErrors<SignupField> = { ...state.errors };
  for (const f of Object.keys(touched) as SignupField[]) {
    errors[f] = validateSignupField(f, values[f]);
  }

  // After a failed submit, move focus to the problem: the banner, or the first bad field.
  useEffect(() => {
    if (state.message) alertRef.current?.focus();
    else if (state.errors) formRef.current?.querySelector<HTMLInputElement>("[aria-invalid='true']")?.focus();
  }, [state]);

  const bind = (f: SignupField) => ({
    name: f,
    value: values[f],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setValues((v) => ({ ...v, [f]: e.target.value }));
      if (state.errors?.[f]) setTouched((t) => ({ ...t, [f]: true }));
    },
    onBlur: () => values[f] && setTouched((t) => ({ ...t, [f]: true })),
  });

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={() => setTouched({})}
      noValidate
      className="flex flex-col gap-[18px]"
    >
      <FormAlert message={state.message} alertRef={alertRef} />

      <Field label="Full name" error={errors.name}>
        {(a) => <TextInput {...a} {...bind("name")} type="text" autoComplete="name" placeholder="Ayesha Khan" required />}
      </Field>

      <Field label="Work email" error={errors.email}>
        {(a) => (
          <TextInput
            {...a}
            {...bind("email")}
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="you@company.com"
            required
          />
        )}
      </Field>

      <Field label="Password" error={errors.password}>
        {(a) => (
          <div className="flex flex-col gap-2.5">
            <PasswordInput {...a} {...bind("password")} autoComplete="new-password" placeholder="Create a password" required />
            <PasswordStrength password={values.password} />
          </div>
        )}
      </Field>

      <Field
        label="Team access code"
        error={errors.accessCode}
        hint="Sign-up is invite-only, so only your team can post to your accounts. Your workspace admin has the code."
      >
        {(a) => (
          <TextInput {...a} {...bind("accessCode")} type="text" autoComplete="off" autoCapitalize="none" spellCheck={false} required />
        )}
      </Field>

      <div className="flex flex-col gap-3 pt-1">
        <SubmitButton pending={pending} pendingLabel="Creating your account…">
          Create account
          <ArrowRight size={18} strokeWidth={2.2} aria-hidden="true" />
        </SubmitButton>
        <p className="m-0 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-bold">
            Sign in
          </Link>
        </p>
      </div>
    </form>
  );
}
