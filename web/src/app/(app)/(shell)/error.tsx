"use client";

interface ShellErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ShellError({ reset }: ShellErrorProps) {
  return (
    <div
      role="alert"
      className="mx-auto flex min-h-[60vh] max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 text-center"
    >
      <p className="font-heading text-lg font-medium">Something went wrong.</p>
      <p className="text-sm text-muted-foreground">
        We couldn&apos;t load this page. Try again in a moment.
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Try again
      </button>
    </div>
  );
}
