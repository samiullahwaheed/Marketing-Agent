"use client";

import { AlertCircle, Check, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { PASSWORD_RULES, passwordScore } from "@/lib/account-rules";

// 16px on phones so iOS doesn't zoom the page when a field is focused.
const inputBase =
  "w-full min-h-12 px-3.5 py-[11px] rounded-[10px] border bg-white text-ink text-base sm:text-[15px] leading-[1.4] font-sans placeholder:text-[#8A938D] transition-[border-color,box-shadow] duration-150 ease-out focus:outline-none";
const inputOk = "border-control hover:border-[#B5BCB3] focus:border-primary focus:shadow-[0_0_0_4px_rgb(31_92_70/0.14)]";
const inputBad = "border-error focus:border-error shadow-[0_0_0_4px_rgb(142_43_33/0.10)]";

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "id">;

/**
 * Visible label, persistent hint, and an error that sits right under the field and is
 * wired to it with aria-describedby. Space for the error is not reserved: it appears only
 * after blur or submit, so it pushes content once rather than jumping on every keystroke.
 */
export function Field({
  label,
  hint,
  error,
  aside,
  children,
}: {
  label: string;
  hint?: ReactNode;
  error?: string;
  aside?: ReactNode;
  children: (ids: { id: string; describedBy: string | undefined; invalid: boolean }) => ReactNode;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="font-semibold text-sm text-ink">
          {label}
        </label>
        {aside}
      </div>
      {children({ id, describedBy, invalid: !!error })}
      {error && (
        <p id={errorId} className="m-0 flex items-start gap-1.5 text-[13px] font-semibold text-error">
          <AlertCircle size={15} strokeWidth={2.2} className="mt-[2px] flex-none" aria-hidden="true" />
          {error}
        </p>
      )}
      {hint && (
        <p id={hintId} className="m-0 text-[13px] text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}

export function TextInput({
  id,
  describedBy,
  invalid,
  ...rest
}: { id: string; describedBy?: string; invalid: boolean } & InputProps) {
  return (
    <input
      id={id}
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      className={`${inputBase} ${invalid ? inputBad : inputOk}`}
      {...rest}
    />
  );
}

/** Password with a show/hide toggle. Paste and password managers stay allowed. */
export function PasswordInput({
  id,
  describedBy,
  invalid,
  ...rest
}: { id: string; describedBy?: string; invalid: boolean } & InputProps) {
  const [shown, setShown] = useState(false);
  return (
    <span className="relative block">
      <input
        id={id}
        type={shown ? "text" : "password"}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        className={`${inputBase} pr-12 ${invalid ? inputBad : inputOk}`}
        {...rest}
      />
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        aria-label={shown ? "Hide password" : "Show password"}
        aria-pressed={shown}
        className="press absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-lg border-0 bg-transparent text-muted hover:text-ink hover:bg-[rgb(23_32_28/0.05)] cursor-pointer"
      >
        {shown ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
      </button>
    </span>
  );
}

const strengthLabels = ["Too short", "Weak", "Okay", "Good", "Strong"];
const strengthColors = ["bg-control", "bg-danger", "bg-marigold", "bg-[#5E9A78]", "bg-primary"];

/** Strength bar plus a checklist, so the rules are visible before anything goes wrong. */
export function PasswordStrength({ password }: { password: string }) {
  const score = passwordScore(password);
  return (
    <div className="flex flex-col gap-2" aria-live="polite">
      <div className="flex items-center gap-2.5">
        <div className="flex-1 grid grid-cols-4 gap-1" aria-hidden="true">
          {[1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className={`h-1 rounded-full transition-colors duration-200 ${i <= score ? strengthColors[score] : "bg-divider"}`}
            />
          ))}
        </div>
        <span className="text-[12.5px] font-semibold text-muted min-w-[62px] text-right tabular-nums">
          {password ? strengthLabels[score] : ""}
        </span>
      </div>
      <ul className="m-0 p-0 list-none flex flex-wrap gap-x-4 gap-y-1">
        {PASSWORD_RULES.map((r) => {
          const ok = r.test(password);
          return (
            <li
              key={r.id}
              className={`flex items-center gap-1.5 text-[13px] transition-colors duration-150 ${ok ? "text-success font-semibold" : "text-muted"}`}
            >
              <span
                className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors duration-150 ${ok ? "bg-success text-white" : "border border-control"}`}
                aria-hidden="true"
              >
                {ok && <Check size={11} strokeWidth={3} />}
              </span>
              {r.label}
              <span className="sr-only">{ok ? " (done)" : " (missing)"}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function SubmitButton({ pending, children, pendingLabel }: { pending: boolean; children: ReactNode; pendingLabel: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className="press w-full min-h-[52px] inline-flex items-center justify-center gap-2 rounded-[10px] border border-primary bg-primary text-white text-base font-semibold cursor-pointer select-none shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_1px_2px_rgb(23_32_28/0.18),0_8px_20px_rgb(31_92_70/0.2)] hover:bg-primary-hover disabled:opacity-80 disabled:cursor-wait"
    >
      {pending ? (
        <>
          <LoaderCircle size={18} className="animate-spin" aria-hidden="true" />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}

/** Form-level problem (not tied to one field). Announced, and focusable so it can take focus. */
export function FormAlert({ message, alertRef }: { message?: string; alertRef?: React.Ref<HTMLDivElement> }) {
  if (!message) return null;
  return (
    <div
      ref={alertRef}
      tabIndex={-1}
      role="alert"
      className="flex items-start gap-2.5 rounded-xl border border-[#E3BDB7] bg-error-bg px-3.5 py-3 text-sm font-semibold text-error focus:outline-none"
    >
      <AlertCircle size={18} strokeWidth={2.2} className="mt-px flex-none" aria-hidden="true" />
      {message}
    </div>
  );
}
