import { AboutScreen } from "@/components/templates/AboutScreen";

export const metadata = {
  title: "About · Moneta",
};

export default function AboutPage() {
  return (
    <AboutScreen
      versions={{
        web: process.env.NEXT_PUBLIC_WEB_VERSION ?? "0.0.0",
        api: process.env.NEXT_PUBLIC_API_VERSION ?? "0.0.0",
      }}
    />
  );
}
