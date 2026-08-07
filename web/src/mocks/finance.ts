export type TransactionDirection = "income" | "expense";

export interface CategoryRow {
  id: string;
  name: string;
  icon: string;
  spent: number;
  budget: number | null;
  usagePct: number;
  overBudget: boolean;
}

export interface TransactionRow {
  id: string;
  description: string;
  accountNickname: string;
  categoryName: string;
  direction: TransactionDirection;
  amount: number;
  signedAmount: number;
}

export interface TransactionGroup {
  id: string;
  date: Date;
  items: TransactionRow[];
}

export interface TransactionsSummary {
  income: number;
  expense: number;
  net: number;
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

const daysAgo = (n: number): Date => {
  const d = new Date(NOW);
  d.setDate(d.getDate() - n);
  return d;
};

const monthAt = (offset: number): Date =>
  new Date(NOW.getFullYear(), NOW.getMonth() + offset, 1);

const SHORT_MONTH = new Intl.DateTimeFormat("en-US", { month: "short" });
const FULL_MONTH = new Intl.DateTimeFormat("en-US", { month: "long" });

const dayKey = (d: Date): string =>
  `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

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

export const MOCK_TRANSACTION_GROUPS: TransactionGroup[] = [
  {
    id: dayKey(daysAgo(0)),
    date: daysAgo(0),
    items: [
      {
        id: "tx-01",
        description: "Weekly grocery run at Whole Foods",
        accountNickname: "Main checking",
        categoryName: "Groceries",
        direction: "expense",
        amount: 187.42,
        signedAmount: -187.42,
      },
      {
        id: "tx-02",
        description: "DoorDash — dinner",
        accountNickname: "Nubank Ultravioleta",
        categoryName: "Food",
        direction: "expense",
        amount: 52.9,
        signedAmount: -52.9,
      },
      {
        id: "tx-03",
        description: "Uber to work",
        accountNickname: "Main checking",
        categoryName: "Transport",
        direction: "expense",
        amount: 24.5,
        signedAmount: -24.5,
      },
    ],
  },
  {
    id: dayKey(daysAgo(1)),
    date: daysAgo(1),
    items: [
      {
        id: "tx-04",
        description: "Payroll",
        accountNickname: "Salary account",
        categoryName: "Salary",
        direction: "income",
        amount: 8500,
        signedAmount: 8500,
      },
      {
        id: "tx-05",
        description: "Netflix",
        accountNickname: "C6 Carbon",
        categoryName: "Subscriptions",
        direction: "expense",
        amount: 55.9,
        signedAmount: -55.9,
      },
    ],
  },
  {
    id: dayKey(daysAgo(2)),
    date: daysAgo(2),
    items: [
      {
        id: "tx-06",
        description: "Concert — ticket",
        accountNickname: "Nubank Ultravioleta",
        categoryName: "Leisure",
        direction: "expense",
        amount: 240,
        signedAmount: -240,
      },
    ],
  },
  {
    id: dayKey(daysAgo(3)),
    date: daysAgo(3),
    items: [
      {
        id: "tx-07",
        description: "Rent",
        accountNickname: "Savings",
        categoryName: "Housing",
        direction: "expense",
        amount: 1850,
        signedAmount: -1850,
      },
    ],
  },
  {
    id: dayKey(daysAgo(4)),
    date: daysAgo(4),
    items: [
      {
        id: "tx-08",
        description: "Walgreens pharmacy",
        accountNickname: "Bradesco Elo Nanquim",
        categoryName: "Health",
        direction: "expense",
        amount: 189.5,
        signedAmount: -189.5,
      },
    ],
  },
  {
    id: dayKey(daysAgo(5)),
    date: daysAgo(5),
    items: [
      {
        id: "tx-09",
        description: "Freelance project",
        accountNickname: "Main checking",
        categoryName: "Freelance",
        direction: "income",
        amount: 1200,
        signedAmount: 1200,
      },
    ],
  },
  {
    id: dayKey(daysAgo(6)),
    date: daysAgo(6),
    items: [
      {
        id: "tx-10",
        description: "Lunch with the team",
        accountNickname: "Nubank Ultravioleta",
        categoryName: "Food",
        direction: "expense",
        amount: 78.4,
        signedAmount: -78.4,
      },
    ],
  },
];

export const MOCK_TRANSACTIONS_SUMMARY: TransactionsSummary = {
  income: 9700,
  expense: 3178.62,
  net: 6521.38,
};

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
