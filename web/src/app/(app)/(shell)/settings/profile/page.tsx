import { User } from "lucide-react";

import { PlaceholderScreen } from "@/components/templates/PlaceholderScreen";

export const metadata = {
  title: "Profile · Moneta",
};

export default function ProfilePage() {
  return (
    <PlaceholderScreen
      title="Profile"
      description="Nickname, name and email editing land here as soon as the backend exposes them."
      icon={<User className="h-6 w-6" />}
    />
  );
}
