import { Settings } from "lucide-react";

import { PlaceholderScreen } from "@/components/templates/PlaceholderScreen";

export const metadata = {
  title: "Settings · Moneta",
};

export default function SettingsPage() {
  return (
    <PlaceholderScreen
      title="Settings"
      description="You'll adjust general Moneta preferences here soon."
      icon={<Settings className="h-6 w-6" />}
    />
  );
}
