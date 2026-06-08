export const DEFAULT_PROFILE = {
  currency: "usd",
  investment_amount: 1000,
  monthly_contribution: 150,
  holding_coin: "bitcoin",
  holding_amount: 0,
  risk_profile: "balanced",
  strategy_style: "dca",
  investor_goal: ""
};

export const RISK_OPTIONS = [
  { value: "conservative", label: "Conservative" },
  { value: "balanced", label: "Balanced" },
  { value: "aggressive", label: "Aggressive" }
];

export const STRATEGY_OPTIONS = [
  { value: "dca", label: "Dollar-cost average" },
  { value: "lump", label: "Lump sum" },
  { value: "rebalance", label: "Rebalance existing portfolio" }
];

export const NUMERIC_PROFILE_FIELDS = ["investment_amount", "monthly_contribution", "holding_amount"];
