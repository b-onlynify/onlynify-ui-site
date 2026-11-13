/** Pricing. Amounts are in paise (₹1 = 100). Change prices here; everything else follows. */
export type PlanId = "free" | "pro" | "team";
export type Plan = {
  id: PlanId;
  name: string;
  tagline: string;
  amount: number;
  currency: "INR";
  seats: number;
  purchasable: boolean;
  features: string[];
  missing?: string[];
};

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Everything in the open-source kit.",
    amount: 0,
    currency: "INR",
    seats: 0,
    purchasable: false,
    features: ["Basic version of all 90 components (MIT)", "17 basic chart types", "HTML, React, Vue, Angular code", "11 free blocks", "12 brand + 5 style presets", "Preview every Pro component", "Commercial use"],
    missing: ["Pro components & Pro charts", "Premium blocks & site templates", "Theme customiser", "Priority support"],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For a solo developer shipping products.",
    amount: 299900,
    currency: "INR",
    seats: 1,
    purchasable: true,
    features: ["Everything in Free", "36 Pro components & Pro charts (modern, production-ready)", "All premium blocks", "8 multi-page site templates", "Theme customiser: any colour, radius, font, density", "Saved themes applied to code downloads", "CLI access with licence key", "Lifetime updates", "Email support"],
  },
  {
    id: "team",
    name: "Team",
    tagline: "For agencies and product teams.",
    amount: 999900,
    currency: "INR",
    seats: 5,
    purchasable: true,
    features: ["Everything in Pro", "Team-only components: app sidebar, data table, kanban, analytics dashboard", "Customised component code: your colours, radius, font and density built in", "5 developer seats", "Use in client projects", "Priority support", "Early access to new blocks", "Invoice with GSTIN"],
  },
];

export const planById = (id: string) => PLANS.find((p) => p.id === id);
export const priceLabel = (p: Plan) => (p.amount === 0 ? "₹0" : `₹${(p.amount / 100).toLocaleString("en-IN")}`);
