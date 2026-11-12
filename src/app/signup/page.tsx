import { CalendarCheck, PenLine, ShieldCheck, type LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import { AuthLayout } from "@/components/AuthLayout";
import SignupForm from "./SignupForm";

export const metadata: Metadata = {
  title: "Create your account · Marketing agent",
};

const steps: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: PenLine,
    title: "Give it a topic",
    body: "The agent writes a separate post for LinkedIn, Facebook and Instagram, with an image to match.",
  },
  {
    icon: ShieldCheck,
    title: "You approve every post",
    body: "Edit, ask for a rewrite or reject. Nothing goes live without a person saying yes.",
  },
  {
    icon: CalendarCheck,
    title: "It goes out on time",
    body: "Post right away or pick a time. You see the live link for each platform.",
  },
];

function Hero() {
  return (
    <>
      <div className="max-w-[540px] flex flex-col gap-[18px]">
        <h1 className="heading display text-white font-extrabold text-[clamp(36px,4.2vw,54px)]">
          Join your team&rsquo;s <span className="text-marigold-soft">marketing agent.</span>
        </h1>
        <p className="m-0 text-lg text-[#D7E6DD] max-w-[460px]">
          One workspace for drafting, approving and publishing your social posts.
        </p>
      </div>
      {/* On phones the form comes first; the walkthrough is extra, so it waits for wider screens. */}
      <ol className="m-0 p-0 list-none hidden md:flex flex-col gap-3 max-w-[460px]">
        {steps.map(({ icon: Icon, title, body }, i) => (
          <li key={title} className="flex gap-3.5 rounded-2xl bg-white/[0.08] border border-white/15 px-4 py-3.5">
            <span className="flex-none w-10 h-10 rounded-xl bg-white/12 flex items-center justify-center text-marigold-soft">
              <Icon size={20} strokeWidth={2} aria-hidden="true" />
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-white">
                <span className="sr-only">Step {i + 1}: </span>
                {title}
              </span>
              <span className="text-sm text-[#D7E6DD] leading-[1.45]">{body}</span>
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}

export default function SignupPage() {
  return (
    <AuthLayout hero={<Hero />} heroBasis="480px" formBasis="460px">
      <div className="w-full max-w-[440px] flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <h2 className="heading display text-4xl">Create your account</h2>
          <p className="m-0 text-muted text-base">It takes under a minute. You&rsquo;ll go straight to your dashboard.</p>
        </div>
        <SignupForm />
      </div>
    </AuthLayout>
  );
}
