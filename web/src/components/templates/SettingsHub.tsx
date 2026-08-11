"use client";

import {
  ChevronRight,
  Database,
  Info,
  MessageCircle,
  Shield,
  User,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import { useActiveHref } from "@/hooks/useActiveHref";
import { cn } from "@/lib/utils";

interface SettingsHubItem {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

const ITEMS: readonly SettingsHubItem[] = [
  {
    href: "/settings/profile",
    label: "Profile",
    description: "Your name, nickname and email.",
    icon: User,
  },
  {
    href: "/settings/assistant",
    label: "Assistant",
    description: "Voice, avatar and treatment style.",
    icon: MessageCircle,
  },
  {
    href: "/settings/security",
    label: "Security",
    description: "Password, sessions, passkeys and audit log.",
    icon: Shield,
  },
  {
    href: "/settings/data",
    label: "Data",
    description: "Export your data or delete your account.",
    icon: Database,
  },
  {
    href: "/settings/about",
    label: "About",
    description: "App version, terms and privacy.",
    icon: Info,
  },
];

export function SettingsHub() {
  const activeHref = useActiveHref(ITEMS);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <section className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Personalize your account and how Moneta works with you.
        </p>
      </section>

      <nav aria-label="Settings sections" className="flex flex-col gap-2">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeHref === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-accent",
                isActive && "border-primary/40 bg-accent",
              )}
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{item.label}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {item.description}
                </p>
              </div>
              <ChevronRight
                aria-hidden
                className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          );
        })}
      </nav>
    </main>
  );
}

export default SettingsHub;
