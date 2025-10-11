import {
  dehydrate,
  QueryClient,
  HydrationBoundary,
} from '@tanstack/react-query';
import PoolDetail from '@/components/pages/pool-detail';
import { fetchMarkets, Market } from '@/hooks/use-get-markets';

export default async function PoolDetailPage({
  params,
}: {
  params: Promise<{ loanToken: string; collateralToken: string }>
}) {
  const { loanToken, collateralToken } = await params;

  // Create QueryClient for SSR
  const queryClient = new QueryClient();
  
  // Prefetch markets data on the server
  await queryClient.prefetchQuery({ 
    queryKey: ['marketDetail',loanToken, collateralToken],
    queryFn: async () => fetchMarkets({ loanToken, collateralToken }),
    staleTime: 5 * 60 * 1000,
  });

  // Get the prefetched data to find the specific pool
  const pool = queryClient.getQueryData(['marketDetail',loanToken, collateralToken]) as Market[] || [];

  // Dehydrate the query client state
  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <PoolDetail 
        loanToken={loanToken} 
        collateralToken={collateralToken} 
        pool={pool[0]}
      />
    </HydrationBoundary>
  );
}
