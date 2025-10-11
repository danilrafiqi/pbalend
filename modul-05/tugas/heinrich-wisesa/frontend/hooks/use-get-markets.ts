import { useQuery } from '@tanstack/react-query';

// GraphQL query
const GET_ALL_MARKETS_QUERY = `
  query GetAllMarkets($where: marketFilter!) {
    markets(where: $where) {
      items {
        loanToken
        collateralToken
        interestRate
        LTV
      }
    }
  }
`;

export interface MarketFilter {
  loanToken?: string;
  collateralToken?: string;
}

// Type definitions
export interface Market {
  loanToken: string;
  collateralToken: string;
  interestRate: string;
  LTV: string;
}

export interface MarketsResponse {
  markets: {
    items: Market[];
  };
}

// GraphQL endpoint - you'll need to replace this with your actual endpoint
const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT!;

// Function to fetch markets from GraphQL
export const fetchMarkets = async (filter: MarketFilter): Promise<Market[]> => {
  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_ALL_MARKETS_QUERY,
        variables: {
          where: filter
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.errors) {
      throw new Error(`GraphQL errors: ${result.errors.map((e: any) => e.message).join(', ')}`);
    }

    return result.data.markets.items;
  } catch (error) {
    console.error('Error fetching markets:', error);
    throw error;
  }
};

// Custom hook
export const useGetMarkets = (filter: MarketFilter) => {
  return useQuery({
    queryKey: ['markets'],
    queryFn: async () => fetchMarkets(filter),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
