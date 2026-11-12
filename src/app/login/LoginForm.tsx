"use client";

import { useState } from "react";
import { PasswordInput } from "@/components/AuthLayout";
import { loginAction } from "./actions";

const authInput =
  "w-full min-h-12 px-3.5 py-[11px] border border-control rounded-[10px] text-[15px] leading-[1.4] text-ink bg-white/85 font-sans transition-[border-color,box-shadow] duration-150 ease-out focus:outline-none focus:border-primary focus:shadow-[0_0_0_4px_rgb(31_92_70/0.14)]";
const fieldLabel = "flex flex-col gap-1.5 font-semibold text-sm";

export default function LoginForm({ error, next }: { error: boolean; next: string }) {
  const [password, setPassword] = useState("");

  return (
    <form action={loginAction} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <label className={fieldLabel}>
        Password
        <PasswordInput
          className={authInput}
          name="password"
          value={password}
          onChange={setPassword}
          placeholder="Your password"
          autoComplete="current-password"
        />
      </label>
      {error && <p className="m-0 text-sm text-error font-semibold">That password isn&apos;t right. Try again.</p>}
      <button
        type="submit"
        className="press w-full min-h-[52px] rounded-[10px] border border-primary bg-primary text-white text-base font-semibold cursor-pointer select-none shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_1px_2px_rgb(23_32_28/0.18)] hover:bg-primary-hover"
      >
        Sign in
      </button>
    </form>
  );
}
