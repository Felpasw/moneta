"use client";

import {
  ArrowLeftRight,
  Bot,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Settings,
  Tags,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { RippleLoader } from "@/components/atoms/RippleLoader";
import { DockTabs, type DockItem } from "@/components/ui/dock-tabs";
import authHooks from "@/hooks/useAuth";
import { useUserStore } from "@/stores/userStore";

const ICON_CLASS = "h-5 w-5";

const MONETA_DOCK_ITEMS: Omit<DockItem, "onClick">[] = [
  {
    id: "dashboard",
    name: "Início",
    href: "/dashboard",
    icon: <LayoutDashboard className={ICON_CLASS} />,
    color: "bg-primary",
  },
  {
    id: "transactions",
    name: "Transações",
    href: "/transactions",
    icon: <ArrowLeftRight className={ICON_CLASS} />,
    color: "bg-primary",
  },
  {
    id: "cards",
    name: "Cartões",
    href: "/cards",
    icon: <CreditCard className={ICON_CLASS} />,
    color: "bg-primary",
  },
  {
    id: "accounts",
    name: "Contas",
    href: "/accounts",
    icon: <Wallet className={ICON_CLASS} />,
    color: "bg-primary",
  },
  {
    id: "categories",
    name: "Categorias",
    href: "/categories",
    icon: <Tags className={ICON_CLASS} />,
    color: "bg-primary",
  },
  {
    id: "settings",
    name: "Configurações",
    href: "/settings",
    icon: <Settings className={ICON_CLASS} />,
    color: "bg-muted-foreground",
  },
  {
    id: "assistant",
    name: "Assistente",
    href: "/settings/assistant",
    icon: <Bot className={ICON_CLASS} />,
    color: "bg-muted-foreground",
  },
];

type BootStatus = "booting" | "ready" | "unauthenticated";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const router = useRouter();
  const { logout, refresh } = authHooks.use();
  const storedUser = useUserStore((s) => s.user);

  const [bootStatus, setBootStatus] = useState<BootStatus>("booting");
  const didBootRef = useRef(false);

  useEffect(() => {
    if (didBootRef.current) return;
    didBootRef.current = true;

    if (storedUser === null) {
      setBootStatus("unauthenticated");
      router.push("/login");
      return;
    }

    void (async () => {
      try {
        await refresh.mutateAsync();
        setBootStatus("ready");
      } catch {
        setBootStatus("unauthenticated");
        router.push("/login");
      }
    })();
  }, [refresh, router, storedUser]);

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSettled: () => router.push("/login"),
    });
  };

  const dockItems: DockItem[] = [
    ...MONETA_DOCK_ITEMS,
    {
      id: "logout",
      name: "Sair",
      icon: <LogOut className={ICON_CLASS} />,
      color: "bg-destructive",
      onClick: handleLogout,
    },
  ];

  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="flex flex-1 flex-col pb-28">
        {bootStatus === "ready" ? (
          children
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <RippleLoader label="Preparando sua sessão" />
          </div>
        )}
      </div>

      <aside
        aria-label="User Profile Menu"
        className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2"
      >
        <DockTabs items={dockItems} />
      </aside>
    </div>
  );
}

export default AppShell;
