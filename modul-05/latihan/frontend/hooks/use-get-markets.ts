import { useQuery } from '@tanstack/react-query';

// GraphQL query
const GET_ALL_MARKETS_QUERY = "GraphQL Query"; //TODO: Implement GraphQL query to get data from the database

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

// Mock data
const MOCK_MARKETS: Market[] = [
  {
    loanToken: '0xe5d18330f15b4174c7a3be036f79d8d2ee1b4986', // USDC address
    collateralToken: '0x398134cbd4592f2925abf72869f992d0cfc595e5', // ETH address
    interestRate: '100000000000000000',
    LTV: '900000000000000000',
  },
  {
    loanToken: '0xe5d18330f15b4174c7a3be036f79d8d2ee1b4986', // USDC address
    collateralToken: '0x4ae66956f3889d06dc6ecfc0ea56ace8ca339652', // BTC address
    interestRate: '100000000000000000',
    LTV: '900000000000000000',
  },
  {
    loanToken: '0xbc0f217636e3cfd41d07a06d0c23e267c4c48bca', // DAI address
    collateralToken: '0x398134cbd4592f2925abf72869f992d0cfc595e5', // ETH address
    interestRate: '100000000000000000',
    LTV: '900000000000000000',
  },
  {
    loanToken: '0xbc0f217636e3cfd41d07a06d0c23e267c4c48bca', // DAI address
    collateralToken: '0x4ae66956f3889d06dc6ecfc0ea56ace8ca339652', // BTC address
    interestRate: '100000000000000000',
    LTV: '900000000000000000',
  },
];

// Function to fetch markets from GraphQL
export const fetchMarkets = async (filter: MarketFilter): Promise<Market[]> => {
  //TODO: Implement GraphQL query to get data from the database
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Filter mock data based on the filter parameter
  let filteredMarkets = MOCK_MARKETS;
  
  if (filter.loanToken) {
    filteredMarkets = filteredMarkets.filter(
      market => market.loanToken.toLowerCase() === filter.loanToken?.toLowerCase()
    );
  }
  
  if (filter.collateralToken) {
    filteredMarkets = filteredMarkets.filter(
      market => market.collateralToken.toLowerCase() === filter.collateralToken?.toLowerCase()
    );
  }
  
  return filteredMarkets;
};

// Custom hook
export const useGetMarkets = (filter: MarketFilter) => {
  return useQuery({
    queryKey: ['markets', filter],
    queryFn: async () => fetchMarkets(filter), //TODO: Change to real fetchMarket using data from database
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
