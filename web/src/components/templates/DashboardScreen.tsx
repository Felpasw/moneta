"use client";

import {
  ArrowLeftRight,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Settings,
  Tags,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppSidebar } from "@/components/organisms/AppSidebar";
import { BarLoader } from "@/components/atoms/BarLoader";
import { MicButton } from "@/components/atoms/MicButton";
import { VoiceOrb } from "@/components/atoms/VoiceOrb";
import { MicState, useAgentSession } from "@/hooks/useAgentSession";

const MIC_DENIED_TOAST =
  "Permita o microfone nas configurações do navegador pra conversar com a Moneta.";
const MIC_ERROR_TOAST = "Não consegui abrir seu microfone.";

const ICON_CLASS = "h-full w-full";

const PREVIEW_USER = {
  name: "Felipe",
  email: "felipecavalcantelacerda@hotmail.com",
};

const MONETA_NAV_ITEMS = [
  {
    label: "Início",
    href: "/dashboard",
    icon: <LayoutDashboard className={ICON_CLASS} />,
  },
  {
    label: "Transações",
    href: "/transactions",
    icon: <ArrowLeftRight className={ICON_CLASS} />,
  },
  {
    label: "Cartões",
    href: "/cards",
    icon: <CreditCard className={ICON_CLASS} />,
  },
  {
    label: "Contas",
    href: "/accounts",
    icon: <Wallet className={ICON_CLASS} />,
  },
  {
    label: "Categorias",
    href: "/categories",
    icon: <Tags className={ICON_CLASS} />,
  },
  {
    label: "Configurações",
    href: "/settings",
    icon: <Settings className={ICON_CLASS} />,
    isSeparator: true,
  },
];

export function DashboardScreen() {
  const [micEnabled, setMicEnabled] = useState(false);
  const { audioElement, isWarming, micStream, micState } = useAgentSession({
    enabled: true,
    micEnabled,
  });

  useEffect(() => {
    if (micState !== MicState.Denied && micState !== MicState.Error) return;
    const message =
      micState === MicState.Denied ? MIC_DENIED_TOAST : MIC_ERROR_TOAST;
    toast.error(message);
    queueMicrotask(() => setMicEnabled(false));
  }, [micState]);

  const handleMicToggle = (): void => setMicEnabled((prev) => !prev);
  const handleLogout = (): void => {
    /* wire-up de logout no auth store fica em sub-task */
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden shrink-0 p-4 md:block">
        <AppSidebar
          user={PREVIEW_USER}
          navItems={MONETA_NAV_ITEMS}
          logoutItem={{
            label: "Sair",
            icon: <LogOut className={ICON_CLASS} />,
            onClick: handleLogout,
          }}
        />
      </div>

      <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16">
        <div className="relative size-40 sm:size-48">
          <VoiceOrb
            audioElement={audioElement}
            audioStream={micStream}
            voiceSensitivity={2.4}
          />
        </div>
        {isWarming ? (
          <BarLoader />
        ) : (
          <MicButton state={micState} onToggle={handleMicToggle} />
        )}
      </main>
    </div>
  );
}

export default DashboardScreen;
