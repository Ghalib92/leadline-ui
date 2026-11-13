import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { orgKeys } from '~/features/orgs/query-keys';
import { orgGoneId } from '~/features/orgs/map';
import type { ReactNode } from 'react';
import { lazy, Suspense, useState } from 'react';

const TanStackDevtools = import.meta.env.DEV
  ? lazy(() =>
      import('@tanstack/react-devtools').then((m) => ({
        default: m.TanStackDevtools,
      }))
    )
  : null;

const ReactQueryDevtoolsPanel = import.meta.env.DEV
  ? lazy(() =>
      import('@tanstack/react-query-devtools').then((m) => ({
        default: m.ReactQueryDevtoolsPanel,
      }))
    )
  : null;

export function QueryProvider({ children }: Readonly<{ children: ReactNode }>) {
  // An org that 404s mid-session was archived or I lost access: refresh my
  // orgs so its page shows "not found" instead of stale data.
  const onError = (error: unknown) => {
    if (orgGoneId(error)) {
      void queryClient.invalidateQueries({ queryKey: orgKeys.mine() });
      void queryClient.invalidateQueries({
        queryKey: [...orgKeys.all, 'slug'],
      });
    }
  };
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({ onError }),
        mutationCache: new MutationCache({ onError }),
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {import.meta.env.DEV && TanStackDevtools && ReactQueryDevtoolsPanel && (
        <Suspense fallback={null}>
          <TanStackDevtools
            plugins={[
              {
                name: 'TanStack Query',
                render: (
                  <Suspense fallback={null}>
                    <ReactQueryDevtoolsPanel />
                  </Suspense>
                ),
                defaultOpen: false,
              },
            ]}
          />
        </Suspense>
      )}
    </QueryClientProvider>
  );
}
