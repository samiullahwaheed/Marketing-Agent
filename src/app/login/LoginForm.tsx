"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { Field, FormAlert, PasswordInput, SubmitButton, TextInput } from "@/components/AuthForm";
import { type AuthFormState, loginAction } from "./actions";

export default function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(loginAction, {});
  const formRef = useRef<HTMLFormElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.message) alertRef.current?.focus();
    else if (state.errors) formRef.current?.querySelector<HTMLInputElement>("[aria-invalid='true']")?.focus();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} noValidate className="flex flex-col gap-[18px]">
      <input type="hidden" name="next" value={next} />
      <FormAlert message={state.message} alertRef={alertRef} />

      <Field label="Email" error={state.errors?.email}>
        {(a) => (
          <TextInput
            {...a}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="you@company.com"
            // Uncontrolled + key: React resets the form after an action, so re-seed what was typed.
            key={state.values?.email ?? ""}
            defaultValue={state.values?.email}
            autoFocus
            required
          />
        )}
      </Field>

      <Field label="Password" error={state.errors?.password}>
        {(a) => <PasswordInput {...a} name="password" autoComplete="current-password" placeholder="Your password" required />}
      </Field>

      <div className="flex flex-col gap-3 pt-1">
        <SubmitButton pending={pending} pendingLabel="Signing in…">
          Sign in
        </SubmitButton>
        <p className="m-0 text-center text-sm text-muted">
          New to the team?{" "}
          <Link href="/signup" className="font-bold">
            Create an account
          </Link>
        </p>
      </div>
    </form>
  );
}
