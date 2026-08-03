import type { ReactNode } from "react";

import { AppShell } from "@/components/templates/AppShell";

interface ShellLayoutProps {
  children: ReactNode;
}

export default function ShellLayout({ children }: ShellLayoutProps) {
  return <AppShell>{children}</AppShell>;
}
