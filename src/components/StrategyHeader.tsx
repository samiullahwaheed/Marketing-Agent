import type { ReactNode } from "react";
import { PageHeader } from "./PageHeader";
import { Tabs } from "./Tabs";

const tabs = [
  { id: "insights", label: "Insights", to: "/strategy/insights" },
  { id: "plan", label: "Plan", to: "/strategy/plan" },
  { id: "audiences", label: "Audiences", to: "/strategy/audiences" },
];

export function StrategyHeader({ actions }: { actions?: ReactNode }) {
  return (
    <>
      <PageHeader
        title="Strategy"
        subtitle="See what happened, decide what to do next, and know who you're talking to."
        actions={actions}
      />
      <Tabs label="Strategy sections" size="lg" items={tabs} />
    </>
  );
}
