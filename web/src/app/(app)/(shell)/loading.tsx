import { RippleLoader } from "@/components/atoms/RippleLoader";

export default function ShellLoading() {
  return (
    <div className="flex min-h-[60vh] flex-1 items-center justify-center">
      <RippleLoader label="Loading" />
    </div>
  );
}
