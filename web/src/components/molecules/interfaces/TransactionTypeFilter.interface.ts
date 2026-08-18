export enum TransactionTypeFilterValue {
  All = "all",
  Income = "income",
  Expense = "expense",
}

export interface TransactionTypeFilterProps {
  value: TransactionTypeFilterValue;
  onChange: (value: TransactionTypeFilterValue) => void;
  label?: string;
  className?: string;
}
