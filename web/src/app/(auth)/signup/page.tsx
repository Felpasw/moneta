import { BackLink } from "@/components/atoms/BackLink";
import { HeroShutterText } from "@/components/atoms/HeroShutterText";
import { SignupForm } from "@/components/organisms/SignupForm";

export const metadata = {
  title: "Cadastrar · Moneta",
};

const HERO_TEXT_SIZE = "text-[clamp(2rem,8vw,6rem)]";
const HOME_HREF = "/";

export default function SignupPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-16">
      <div className="flex flex-col items-center gap-4">
        <BackLink href={HOME_HREF} className="self-start" />
        <HeroShutterText text="MONETA" href={HOME_HREF} textSizeClass={HERO_TEXT_SIZE} />
      </div>
      <SignupForm />
    </div>
  );
}
