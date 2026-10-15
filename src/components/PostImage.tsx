/** The desk illustration used as the sample post image. */
export function PostImage({ className = "", aspect = "16/10" }: { className?: string; aspect?: string }) {
  return (
    <div
      className={`max-w-full rounded-xl overflow-hidden bg-[#DCE6DF] flex-none ${className}`}
      style={{ aspectRatio: aspect }}
    >
      <svg
        viewBox="0 0 320 200"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid slice"
        role="img"
        aria-label="Illustration: a desk with a stack of invoices, a laptop showing a chart and a cup of tea"
      >
        <rect width="320" height="200" fill="#DCE6DF" />
        <circle cx="262" cy="48" r="22" fill="#F1F3EE" stroke="#17201C" strokeWidth="2" />
        <path d="M262 36v12l8 5" stroke="#17201C" strokeWidth="2" fill="none" strokeLinecap="round" />
        <rect x="0" y="148" width="320" height="52" fill="#B9CBBF" />
        <rect x="18" y="140" width="284" height="10" rx="3" fill="#2E5E4C" />
        <rect x="42" y="102" width="80" height="38" rx="3" fill="#FFFFFF" stroke="#17201C" strokeWidth="2" transform="rotate(-7 82 121)" />
        <rect x="50" y="96" width="80" height="44" rx="3" fill="#FFFFFF" stroke="#17201C" strokeWidth="2" />
        <path d="M60 108h50M60 117h38M60 126h46" stroke="#9AA59E" strokeWidth="2.4" strokeLinecap="round" />
        <rect x="150" y="76" width="104" height="64" rx="6" fill="#F1F3EE" stroke="#17201C" strokeWidth="2" />
        <rect x="160" y="86" width="84" height="44" rx="2" fill="#FFFFFF" />
        <rect x="170" y="112" width="9" height="12" rx="1" fill="#E8A33D" />
        <rect x="184" y="104" width="9" height="20" rx="1" fill="#1F5C46" />
        <rect x="198" y="96" width="9" height="28" rx="1" fill="#1F5C46" />
        <rect x="212" y="100" width="9" height="24" rx="1" fill="#5E9A78" />
        <path d="M140 140h124" stroke="#17201C" strokeWidth="3" strokeLinecap="round" />
        <rect x="270" y="114" width="20" height="26" rx="3" fill="#E8A33D" stroke="#17201C" strokeWidth="2" />
        <path d="M290 120h5a5 5 0 0 1 0 10h-5" stroke="#17201C" strokeWidth="2" fill="none" />
      </svg>
    </div>
  );
}
