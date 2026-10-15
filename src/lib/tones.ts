export type Tone = "success" | "warning" | "error" | "info" | "neutral" | "green";

/** Background + text colour classes for each tone. */
export const toneClasses: Record<Tone, string> = {
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  error: "bg-error-bg text-error",
  info: "bg-info-bg text-info",
  neutral: "bg-divider text-nav",
  green: "bg-primary-light text-primary-hover",
};
