import { Shield } from "lucide-react";

import { PlaceholderScreen } from "@/components/templates/PlaceholderScreen";

export const metadata = {
  title: "Security · Moneta",
};

export default function SecurityPage() {
  return (
    <PlaceholderScreen
      title="Security"
      description="Password, active sessions, passkeys and audit log show up here once the backend endpoints ship."
      icon={<Shield className="h-6 w-6" />}
    />
  );
}
