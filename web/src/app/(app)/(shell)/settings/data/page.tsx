import { Database } from "lucide-react";

import { PlaceholderScreen } from "@/components/templates/PlaceholderScreen";

export const metadata = {
  title: "Data · Moneta",
};

export default function DataPage() {
  return (
    <PlaceholderScreen
      title="Data"
      description="Export your data or delete your account. Available once LGPD flows are wired to the backend."
      icon={<Database className="h-6 w-6" />}
    />
  );
}
