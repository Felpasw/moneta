import type { UserBankAccountWithBank } from "@/services/interfaces/accounts.interface";

export interface BankFilterProps {
  accounts: UserBankAccountWithBank[];
  selected: string[];
  onChange: (selected: string[]) => void;
  maxVisible?: number;
  label?: string;
  className?: string;
}
