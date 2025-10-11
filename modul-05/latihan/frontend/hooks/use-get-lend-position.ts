import { useQuery } from '@tanstack/react-query';

// GraphQL query
const GET_LEND_POSITIONS_QUERY = `
  query GetLendPositions($where: lendPositionFilter!) {
    lendPositions(where: $where) {
      items {
        loanToken
        collateralToken
        user
        amount
        shares
      }
      totalCount
    }
  }
`;

// Type definitions
export interface LendPosition {
  loanToken: string;
  collateralToken: string;
  user: string;
  amount: string;
  shares: string;
}

export interface LendPositionsResponse {
  lendPositions: {
    items: LendPosition[];
    totalCount: number;
  };
}

export interface LendPositionFilter {
  user?: string;
  loanToken?: string;
  collateralToken?: string;
}

// Custom hook
export function useGetLendPositions(filter: LendPositionFilter) {
  return useQuery<LendPositionsResponse>({
    queryKey: ['lendPositions', filter],
    queryFn: async () => {
      const graphqlEndpoint = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT;
      
      if (!graphqlEndpoint) {
        throw new Error('GraphQL endpoint not configured. Please set NEXT_PUBLIC_GRAPHQL_ENDPOINT environment variable.');
      }

      const response = await fetch(graphqlEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: GET_LEND_POSITIONS_QUERY,
          variables: {
            where: filter
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.errors) {
        throw new Error(data.errors[0]?.message || 'GraphQL query failed');
      }

      return data.data as LendPositionsResponse;
    },
    enabled: !!filter && Object.keys(filter).length > 0, // Only run query if filter is provided
    staleTime: 30000, // Data is fresh for 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
}
