import { BarChart3, Brain, CalendarClock, Wallet } from "lucide-react";

export const NAV_ITEMS = [
  { icon: BarChart3, label: "Market", target: "market", active: true },
  { icon: Wallet, label: "Portfolio", target: "portfolio" },
  { icon: CalendarClock, label: "Forecast", target: "forecast" },
  { icon: Brain, label: "AI", target: "assistant" }
];
