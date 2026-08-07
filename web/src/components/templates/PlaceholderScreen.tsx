import type { ReactNode } from "react";

interface PlaceholderScreenProps {
  title: string;
  description: string;
  icon?: ReactNode;
}

export function PlaceholderScreen({ title, description, icon }: PlaceholderScreenProps) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      {icon !== undefined ? (
        <div
          aria-hidden
          className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary"
        >
          {icon}
        </div>
      ) : null}
      <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
      <p className="max-w-md text-sm text-muted-foreground">{description}</p>
    </main>
  );
}

export default PlaceholderScreen;
