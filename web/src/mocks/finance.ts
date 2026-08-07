export interface CategoryRow {
  id: string;
  name: string;
  icon: string;
  spent: number;
  budget: number | null;
  usagePct: number;
  overBudget: boolean;
}

export interface MonthlyFlowPoint {
  id: string;
  monthLabel: string;
  incomePct: number;
  expensePct: number;
}

export interface BalanceChartView {
  linePath: string;
  areaPath: string;
  lastPoint: { x: number; y: number } | null;
  min: number;
  max: number;
}

export interface TopCategoryShare {
  id: string;
  name: string;
  icon: string;
  spent: number;
  share: number;
}

const NOW = new Date();

const FULL_MONTH = new Intl.DateTimeFormat("en-US", { month: "long" });

export const MOCK_CATEGORY_ROWS: CategoryRow[] = [
  {
    id: "cat-home",
    name: "Housing",
    icon: "🏠",
    spent: 1850,
    budget: 2000,
    usagePct: 93,
    overBudget: false,
  },
  {
    id: "cat-groceries",
    name: "Groceries",
    icon: "🛒",
    spent: 422.12,
    budget: 1200,
    usagePct: 35,
    overBudget: false,
  },
  {
    id: "cat-food",
    name: "Food",
    icon: "🍔",
    spent: 131.3,
    budget: 800,
    usagePct: 16,
    overBudget: false,
  },
  {
    id: "cat-transport",
    name: "Transport",
    icon: "🚗",
    spent: 24.5,
    budget: 500,
    usagePct: 5,
    overBudget: false,
  },
  {
    id: "cat-health",
    name: "Health",
    icon: "💊",
    spent: 189.5,
    budget: 400,
    usagePct: 47,
    overBudget: false,
  },
  {
    id: "cat-leisure",
    name: "Leisure",
    icon: "🎮",
    spent: 240,
    budget: 600,
    usagePct: 40,
    overBudget: false,
  },
  {
    id: "cat-education",
    name: "Education",
    icon: "📚",
    spent: 129.9,
    budget: 300,
    usagePct: 43,
    overBudget: false,
  },
  {
    id: "cat-subscriptions",
    name: "Subscriptions",
    icon: "🎬",
    spent: 55.9,
    budget: 200,
    usagePct: 28,
    overBudget: false,
  },
  {
    id: "cat-salary",
    name: "Salary",
    icon: "💼",
    spent: 0,
    budget: null,
    usagePct: 0,
    overBudget: false,
  },
  {
    id: "cat-freelance",
    name: "Freelance",
    icon: "💻",
    spent: 0,
    budget: null,
    usagePct: 0,
    overBudget: false,
  },
];

export const MOCK_CATEGORIES_MONTH_LABEL = FULL_MONTH.format(NOW);
