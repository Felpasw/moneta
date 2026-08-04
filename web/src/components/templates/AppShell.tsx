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
import { toast } from "sonner";

import { RippleLoader } from "@/components/atoms/RippleLoader";
import { GlobalAssistant } from "@/components/organisms/GlobalAssistant";
import { DockTabs, type DockItem } from "@/components/ui/DockTabs";
import { MicState, useAgentSession } from "@/hooks/useAgentSession";
import authHooks from "@/hooks/useAuth";
import { useUserHydrated } from "@/hooks/useUserHydrated";
import { agentSessionActions } from "@/stores/agentSessionStore";
import { useUserStore } from "@/stores/userStore";

const MIC_DENIED_TOAST =
  "Allow microphone access in your browser settings to talk to Moneta.";
const MIC_ERROR_TOAST = "Couldn't open your microphone.";

const ICON_CLASS = "h-5 w-5";

const DOCK_ICON_COLOR = "bg-black";

const MONETA_DOCK_ITEMS: Omit<DockItem, "onClick">[] = [
  {
    id: "dashboard",
    name: "Home",
    href: "/dashboard",
    icon: <LayoutDashboard className={ICON_CLASS} />,
    color: DOCK_ICON_COLOR,
  },
  {
    id: "transactions",
    name: "Transactions",
    href: "/transactions",
    icon: <ArrowLeftRight className={ICON_CLASS} />,
    color: DOCK_ICON_COLOR,
  },
  {
    id: "cards",
    name: "Cards",
    href: "/cards",
    icon: <CreditCard className={ICON_CLASS} />,
    color: DOCK_ICON_COLOR,
  },
  {
    id: "accounts",
    name: "Accounts",
    href: "/accounts",
    icon: <Wallet className={ICON_CLASS} />,
    color: DOCK_ICON_COLOR,
  },
  {
    id: "categories",
    name: "Categories",
    href: "/categories",
    icon: <Tags className={ICON_CLASS} />,
    color: DOCK_ICON_COLOR,
  },
  {
    id: "settings",
    name: "Settings",
    href: "/settings",
    icon: <Settings className={ICON_CLASS} />,
    color: DOCK_ICON_COLOR,
  },
  {
    id: "assistant",
    name: "Assistant",
    href: "/settings/assistant",
    icon: <Bot className={ICON_CLASS} />,
    color: DOCK_ICON_COLOR,
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

  const hydrated = useUserHydrated();
  const [bootStatus, setBootStatus] = useState<BootStatus>("booting");
  const didBootRef = useRef(false);

  const { micState } = useAgentSession({ enabled: bootStatus === "ready" });

  useEffect(() => {
    if (!hydrated) return;
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
  }, [hydrated, refresh, router, storedUser]);

  useEffect(() => {
    if (micState !== MicState.Denied && micState !== MicState.Error) return;
    const message =
      micState === MicState.Denied ? MIC_DENIED_TOAST : MIC_ERROR_TOAST;
    toast.error(message);
    queueMicrotask(() => agentSessionActions.setMicEnabled(false));
  }, [micState]);

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSettled: () => router.push("/login"),
    });
  };

  const dockItems: DockItem[] = [
    ...MONETA_DOCK_ITEMS,
    {
      id: "logout",
      name: "Sign out",
      icon: <LogOut className={ICON_CLASS} />,
      color: DOCK_ICON_COLOR,
      onClick: handleLogout,
    },
  ];

  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="flex flex-1 flex-col pb-36">
        {bootStatus === "ready" ? (
          children
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <RippleLoader label="Getting your session ready" />
          </div>
        )}
      </div>

      {bootStatus === "ready" ? <GlobalAssistant /> : null}

      <aside
        aria-label="User Profile Menu"
        className="fixed bottom-12 left-1/2 z-50 -translate-x-1/2"
      >
        <DockTabs items={dockItems} />
      </aside>
    </div>
  );
}

export default AppShell;
