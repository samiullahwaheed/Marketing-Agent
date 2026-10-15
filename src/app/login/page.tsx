import { AuthLayout } from "@/components/AuthLayout";
import LoginForm from "./LoginForm";

function Hero() {
  return (
    <>
      <div className="max-w-[540px] flex flex-col gap-[18px]">
        <h1 className="heading text-white font-extrabold leading-[1.04] text-[clamp(38px,4.4vw,58px)]">
          Your posts, written for you. <span className="text-marigold-soft">Approved by you.</span>
        </h1>
        <p className="m-0 text-lg text-[#D7E6DD] max-w-[460px]">
          The agent drafts, checks and schedules every post. Nothing goes live until you say so.
        </p>
      </div>
      <div aria-hidden="true" className="relative max-w-[460px] pt-2 pb-6">
        <div className="absolute -right-2 -top-3.5 rotate-[4deg] bg-marigold-soft text-[#3B2A08] rounded-xl px-4 py-3 text-sm font-semibold max-w-[210px] shadow-[0_10px_24px_rgba(0,0,0,.18)]">
          Heads up: &ldquo;11 hours a week&rdquo; needs a source before this goes out.
        </div>
        <div className="bg-white/80 backdrop-blur-xl backdrop-saturate-150 border border-white/50 text-ink rounded-2xl p-5 -rotate-2 shadow-[0_20px_40px_rgba(0,0,0,.22)] flex flex-col gap-3 max-w-[380px]">
          <span className="self-start bg-warning-bg text-warning text-xs font-bold rounded-full px-2.5 py-[3px]">
            Waiting for you
          </span>
          <div className="font-heading font-bold text-[19px]">Manual invoicing costs</div>
          <div className="text-sm text-nav">
            A client called me last month. His accountant quit. Turns out she was spending 11 hours a week on invoices…
          </div>
          <div className="flex gap-2">
            <span className="bg-primary text-white rounded-lg px-3.5 py-2 text-[13px] font-bold">Approve</span>
            <span className="border border-control rounded-lg px-3.5 py-2 text-[13px] font-semibold">Rewrite</span>
          </div>
        </div>
      </div>
    </>
  );
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;

  return (
    <AuthLayout hero={<Hero />} heroBasis="480px" formBasis="440px">
      <div className="w-full max-w-[420px] flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <h2 className="heading text-4xl">Welcome back</h2>
          <p className="m-0 text-muted text-base">Enter the dashboard password to continue.</p>
        </div>
        <LoginForm error={!!error} next={next || "/"} />
      </div>
    </AuthLayout>
  );
}
