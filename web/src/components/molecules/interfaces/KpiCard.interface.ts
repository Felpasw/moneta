export interface KpiCardProps {
  label: string;
  value: string;
  hint?: string;
  emphasis?: "primary" | "secondary";
  negative?: boolean;
}
