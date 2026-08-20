import type { UserBankAccountWithBank } from "@/services/interfaces/accounts.interface";

export interface BankDropdownProps {
  accounts: UserBankAccountWithBank[];
  selected: string[];
  onSelect: (id: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}
