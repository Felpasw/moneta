import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: unknown) => {
        const status = (error as { response?: { status?: number } })?.response?.status;

        if (status !== undefined && status >= 400 && status < 500 && status !== 408) {
          return false;
        }

        return failureCount < 3;
      },
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: (failureCount, error: unknown) => {
        const status = (error as { response?: { status?: number } })?.response?.status;

        if (status !== undefined && status >= 400 && status < 500) {
          return false;
        }

        return failureCount < 1;
      },
    },
  },
});
