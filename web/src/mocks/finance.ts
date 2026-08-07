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

export interface DashboardView {
  monthLabel: string;
  totalBalance: number;
  income: number;
  expense: number;
  net: number;
  topCategories: TopCategoryShare[];
  monthlyFlow: MonthlyFlowPoint[];
  balanceChart: BalanceChartView;
}

const NOW = new Date();

const monthAt = (offset: number): Date =>
  new Date(NOW.getFullYear(), NOW.getMonth() + offset, 1);

const SHORT_MONTH = new Intl.DateTimeFormat("en-US", { month: "short" });
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

const monthlyFlowRaw: { income: number; expense: number }[] = [
  { income: 8200, expense: 5980 },
  { income: 8500, expense: 6420 },
  { income: 9100, expense: 7010 },
  { income: 8500, expense: 6250 },
  { income: 9800, expense: 7480 },
  { income: 9700, expense: 6180 },
];

const monthlyFlowMax = Math.max(
  ...monthlyFlowRaw.flatMap((v) => [v.income, v.expense]),
  1,
);

export const MOCK_MONTHLY_FLOW: MonthlyFlowPoint[] = monthlyFlowRaw.map(
  (v, i) => {
    const date = monthAt(i - 5);
    return {
      id: `${date.getFullYear()}-${date.getMonth() + 1}`,
      monthLabel: SHORT_MONTH.format(date).replace(".", ""),
      incomePct: (v.income / monthlyFlowMax) * 100,
      expensePct: (v.expense / monthlyFlowMax) * 100,
    };
  },
);

const BALANCE_CHART_WIDTH = 100;
const BALANCE_CHART_HEIGHT = 40;
const BALANCE_CHART_PADDING_Y = 3;

const balanceSeed = [
  4820, 4780, 4900, 5010, 4880, 4720, 4630, 4550, 4680, 4820, 4990, 5140, 5080,
  4970, 5220, 5380, 5310, 5220, 5090, 4980, 5150, 5310, 5470, 5620, 5540, 5480,
  5390, 5510, 5680, 5820,
];

const balanceMin = Math.min(...balanceSeed);
const balanceMax = Math.max(...balanceSeed);
const balanceRange = balanceMax - balanceMin || 1;
const balanceDrawableHeight =
  BALANCE_CHART_HEIGHT - BALANCE_CHART_PADDING_Y * 2;

const balanceChartPoints = balanceSeed.map((balance, i) => {
  const x =
    balanceSeed.length > 1
      ? (i / (balanceSeed.length - 1)) * BALANCE_CHART_WIDTH
      : BALANCE_CHART_WIDTH / 2;
  const y =
    BALANCE_CHART_PADDING_Y +
    (1 - (balance - balanceMin) / balanceRange) * balanceDrawableHeight;
  return { x, y };
});

const balanceLinePath = `M ${balanceChartPoints
  .map((p) => `${p.x} ${p.y}`)
  .join(" L ")}`;
const balanceLastPoint = balanceChartPoints[balanceChartPoints.length - 1] ?? null;
const balanceAreaPath = `${balanceLinePath} L ${balanceLastPoint?.x ?? 0} ${BALANCE_CHART_HEIGHT} L 0 ${BALANCE_CHART_HEIGHT} Z`;

export const MOCK_BALANCE_CHART_VIEW: BalanceChartView = {
  linePath: balanceLinePath,
  areaPath: balanceAreaPath,
  lastPoint: balanceLastPoint,
  min: balanceMin,
  max: balanceMax,
};

export const MOCK_DASHBOARD_VIEW: DashboardView = {
  monthLabel: FULL_MONTH.format(NOW),
  totalBalance: 18536.43,
  income: 9700,
  expense: 3178.62,
  net: 6521.38,
  topCategories: [
    { id: "cat-home", name: "Housing", icon: "🏠", spent: 1850, share: 0.582 },
    { id: "cat-groceries", name: "Groceries", icon: "🛒", spent: 422.12, share: 0.133 },
    { id: "cat-leisure", name: "Leisure", icon: "🎮", spent: 240, share: 0.075 },
    { id: "cat-health", name: "Health", icon: "💊", spent: 189.5, share: 0.06 },
    { id: "cat-food", name: "Food", icon: "🍔", spent: 131.3, share: 0.041 },
  ],
  monthlyFlow: MOCK_MONTHLY_FLOW,
  balanceChart: MOCK_BALANCE_CHART_VIEW,
};
