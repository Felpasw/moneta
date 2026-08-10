import { Info } from "lucide-react";

import { PlaceholderScreen } from "@/components/templates/PlaceholderScreen";

export const metadata = {
  title: "About · Moneta",
};

export default function AboutPage() {
  return (
    <PlaceholderScreen
      title="About Moneta"
      description="App version, terms of use, privacy policy and open source licenses."
      icon={<Info className="h-6 w-6" />}
    />
  );
}
