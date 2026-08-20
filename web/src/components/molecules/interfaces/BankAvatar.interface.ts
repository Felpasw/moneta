import type { UserBankAccountWithBank } from "@/services/interfaces/accounts.interface";

export interface BankAvatarProps {
  account: UserBankAccountWithBank;
  isSelected: boolean;
  onClick: () => void;
}
