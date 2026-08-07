import { DashboardBundle, ExecutiveDashboardData, ExecutiveRole, KpiValue } from "./types";

function fmt(n: number): string {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

function pick(kpis: KpiValue[], ids: string[]): KpiValue[] {
  return ids.map((id) => kpis.find((k) => k.id === id)).filter((k): k is KpiValue => !!k);
}

function ceoDashboard(b: DashboardBundle): ExecutiveDashboardData {
  const insights: string[] = [
    `Overall health score is ${b.healthScore.overallScore}/100, driven most by ${
      [...b.healthScore.breakdown].sort((x, y) => x.score - y.score)[0]?.label ?? "pipeline quality"
    }.`,
    `Forecast revenue from the open pipeline is ${fmt(b.forecast.forecastRevenue)} at ${b.forecast.confidenceScore}/100 confidence.`,
  ];
  if (b.growthOpportunities[0]) {
    insights.push(
      `${b.growthOpportunities[0].sector} shows the strongest growth ratio - pipeline is ${b.growthOpportunities[0].growthRatio.toFixed(
        1
      )}x current collected revenue in that sector.`
    );
  }

  const risks: string[] = [];
  if (b.concentrationRisk.isHighRisk) {
    risks.push(
      `Revenue concentration risk: ${b.concentrationRisk.topSector ?? "one sector"} accounts for ${Math.round(
        b.concentrationRisk.topSectorShare * 100
      )}% of collected revenue.`
    );
  }
  if (b.stuckDeals.length > 0) {
    risks.push(`${b.stuckDeals.length} deal(s) are stuck (overdue or stale), worth ${fmt(b.stuckDeals.reduce((s, d) => s + d.value, 0))}.`);
  }
  if (b.dataQuality.overallScore < 70) {
    risks.push(`Data quality score is ${b.dataQuality.overallScore}/100 - forecasts and scoring carry extra uncertainty.`);
  }

  const recommendations: string[] = [
    b.concentrationRisk.isHighRisk
      ? `Diversify pipeline generation away from ${b.concentrationRisk.topSector ?? "the top sector"} to reduce concentration risk.`
      : `Sector mix is reasonably diversified - keep monitoring as new deals close.`,
    b.stuckDeals.length > 0
      ? `Review the ${Math.min(5, b.stuckDeals.length)} largest stuck deals with sales leads this week.`
      : `No stuck deals detected - pipeline hygiene is healthy.`,
  ];

  return {
    role: "ceo",
    title: "CEO Dashboard",
    kpis: pick(b.kpis, ["revenue", "pipeline_value", "forecast_revenue", "health_score"]),
    insights,
    risks,
    recommendations,
  };
}

function salesDashboard(b: DashboardBundle): ExecutiveDashboardData {
  const topOwner = b.ownerPerformance[0];
  const insights: string[] = [
    `${b.pipelineFunnel.reduce((s, f) => s + f.count, 0)} open deals across ${b.pipelineFunnel.length} active stages.`,
  ];
  if (topOwner) {
    insights.push(`${topOwner.ownerCode} leads on won value with ${fmt(topOwner.wonValue)} across ${topOwner.wonCount} won deal(s).`);
  }
  if (b.largestOpportunities[0]) {
    insights.push(`Largest open opportunity: ${b.largestOpportunities[0].dealName} at ${fmt(b.largestOpportunities[0].value)}.`);
  }

  const highLeakage = b.leakage.filter((l) => l.leakageRate > 0.4).sort((a, c) => c.leakageRate - a.leakageRate);
  const risks: string[] = highLeakage.slice(0, 3).map(
    (l) => `${l.stage}: ${Math.round(l.leakageRate * 100)}% of deals that entered this stage went dead.`
  );
  if (b.stuckDeals.length > 0) {
    risks.push(`${b.stuckDeals.length} deal(s) need a status check-in (overdue close date or 75+ days stale).`);
  }

  const recommendations = [
    highLeakage[0]
      ? `Investigate qualification criteria at "${highLeakage[0].stage}" - it has the highest drop-off rate.`
      : `Funnel drop-off is within normal range across stages.`,
    `Prioritize outreach on the top ${Math.min(5, b.largestOpportunities.length)} opportunities by value this week.`,
  ];

  return {
    role: "sales",
    title: "Sales Dashboard",
    kpis: pick(b.kpis, ["pipeline_value", "open_deals", "forecast_revenue"]),
    insights,
    risks,
    recommendations,
  };
}

function operationsDashboard(b: DashboardBundle): ExecutiveDashboardData {
  const aging90 = b.dealAging.find((a) => a.bucket === "90+ days");
  const insights: string[] = [
    `${b.stuckDeals.length} deal(s) currently flagged stuck across the pipeline.`,
  ];
  if (aging90 && aging90.count > 0) {
    insights.push(`${aging90.count} open deal(s) have been in the pipeline 90+ days, worth ${fmt(aging90.value)}.`);
  }
  const dqTopIssue = b.dataQuality.fields[0];
  if (dqTopIssue) {
    insights.push(`Largest data gap: "${dqTopIssue.field}" on ${dqTopIssue.boardName} (${dqTopIssue.missingCount} missing).`);
  }

  const risks: string[] = [];
  if (b.dataQuality.overallScore < 70) {
    risks.push(`Data quality score is ${b.dataQuality.overallScore}/100 - execution reporting may be understated.`);
  }
  if (b.warnings.some((w) => w.severity === "high")) {
    risks.push(`One or more fields have high-severity missing-data warnings.`);
  }

  const recommendations = [
    dqTopIssue ? dqTopIssue.recommendedFix : `No urgent data-quality fixes identified.`,
    `Set a weekly cadence to review deals aged 90+ days and either close, requalify, or archive them.`,
  ];

  return {
    role: "operations",
    title: "Operations Dashboard",
    kpis: pick(b.kpis, ["open_deals", "health_score"]),
    insights,
    risks,
    recommendations,
  };
}

function financeDashboard(b: DashboardBundle): ExecutiveDashboardData {
  const insights: string[] = [
    `${fmt(b.kpis.find((k) => k.id === "revenue")?.value ?? 0)} collected against ${fmt(
      b.collectionStatus.reduce((s, c) => s + c.amount, 0)
    )} outstanding receivable.`,
  ];
  const topStatus = [...b.collectionStatus].sort((a, c) => c.amount - a.amount)[0];
  if (topStatus) {
    insights.push(`Largest outstanding bucket: "${topStatus.status}" at ${fmt(topStatus.amount)} across ${topStatus.count} order(s).`);
  }

  const risks: string[] = [];
  if (b.concentrationRisk.topClient && b.concentrationRisk.topClientShare > 0.25) {
    risks.push(
      `${b.concentrationRisk.topClient} represents ${Math.round(b.concentrationRisk.topClientShare * 100)}% of collected revenue - a single-client concentration risk.`
    );
  }
  const collectionKpi = b.kpis.find((k) => k.id === "collection_pct");
  if (collectionKpi && collectionKpi.value < 50) {
    risks.push(`Collection rate is only ${collectionKpi.value}% - cash conversion is lagging billed/receivable value.`);
  }

  const recommendations = [
    topStatus ? `Prioritize collections follow-up on the "${topStatus.status}" bucket first - it's the largest outstanding balance.` : `Collections are current.`,
    b.concentrationRisk.topClient ? `Track ${b.concentrationRisk.topClient} receivables closely given its revenue share.` : `Client concentration is currently healthy.`,
  ];

  return {
    role: "finance",
    title: "Finance Dashboard",
    kpis: pick(b.kpis, ["revenue", "collection_pct"]),
    insights,
    risks,
    recommendations,
  };
}

export function buildExecutiveDashboard(role: ExecutiveRole, bundle: DashboardBundle): ExecutiveDashboardData {
  switch (role) {
    case "ceo":
      return ceoDashboard(bundle);
    case "sales":
      return salesDashboard(bundle);
    case "operations":
      return operationsDashboard(bundle);
    case "finance":
      return financeDashboard(bundle);
  }
}
