import { useQuery } from '@tanstack/react-query';
import { readContract } from '@wagmi/core';
import { PBA_LEND_ABI } from '@/lib/abis/PBALend';
import { PBA_LEND_ADDRESS } from '@/lib/addresses';
import { config } from '@/lib/wagmi';
import { calculateHealthFactor } from '@/lib/helper';
import { getToken } from '@/lib/tokens';
import { formatUnits } from 'viem';

// GraphQL query
const GET_BORROW_POSITIONS_QUERY = `
  query GetBorrowPositions($where: borrowPositionFilter!) {
    borrowPositions(where: $where) {
      items {
        loanToken
        collateralToken
        user
        amount
        shares
        collateralAmount
      }
      totalCount
    }
  }
`;

// Type definitions
export interface MarketData {
  loanToken: `0x${string}`;
  collateralToken: `0x${string}`;
  isActive: boolean;
  interestRate: bigint;
  LTV: bigint;
  oracle: `0x${string}`;
  totalDepositShares: bigint;
  totalDepositAssets: bigint;
  totalBorrowShares: bigint;
  totalBorrowAssets: bigint;
  lastAccrueTime: bigint;
}

export interface BorrowPosition {
  loanToken: string;
  collateralToken: string;
  user: string;
  amount: string;
  shares: string;
  collateralAmount: string;
  debt: string;
  healthFactor: string;
}

export interface BorrowPositionsResponse {
  borrowPositions: {
    items: BorrowPosition[];
    totalCount: number;
  };
}

export interface BorrowPositionFilter {
  user?: string;
  loanToken?: string;
  collateralToken?: string;
}

// Helper function to get unique markets from positions
function getUniqueMarkets(positions: BorrowPosition[]): Array<{loanToken: string, collateralToken: string}> {
  const marketSet = new Set<string>();
  const uniqueMarkets: Array<{loanToken: string, collateralToken: string}> = [];
  
  positions.forEach(position => {
    const marketKey = `${position.loanToken}-${position.collateralToken}`;
    if (!marketSet.has(marketKey)) {
      marketSet.add(marketKey);
      uniqueMarkets.push({
        loanToken: position.loanToken,
        collateralToken: position.collateralToken
      });
    }
  });
  
  return uniqueMarkets;
}

function calculateDebt(shares: string, totalDepositAssets: bigint, totalDepositShares: bigint): number {
  return (Number(shares) * Number(totalDepositAssets) / Number(totalDepositShares));
}

// Custom hook
export function useGetBorrowPositions(filter: BorrowPositionFilter) {
  return useQuery<BorrowPositionsResponse>({
    queryKey: ['borrowPositions', filter],
    queryFn: async () => {
      const graphqlEndpoint = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT;
      
      if (!graphqlEndpoint) {
        throw new Error('GraphQL endpoint not configured. Please set NEXT_PUBLIC_GRAPHQL_ENDPOINT environment variable.');
      }

      // Step 1: Fetch borrow positions from GraphQL
      const response = await fetch(graphqlEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: GET_BORROW_POSITIONS_QUERY,
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

      const borrowPositionsData = data.data as BorrowPositionsResponse;
      const positions = borrowPositionsData.borrowPositions.items;

      // Step 2: Get unique markets and fetch market data for each
      const uniqueMarkets = getUniqueMarkets(positions);
      const marketDataMap = new Map<string, MarketData>();

      // Fetch market data for each unique market using contract calls
      await Promise.all(
        uniqueMarkets.map(async (market) => {
          try {
            const marketData = await readContract(config, {
              address: PBA_LEND_ADDRESS as `0x${string}`,
              abi: PBA_LEND_ABI,
              functionName: 'getMarketData',
              args: [
                market.loanToken as `0x${string}`,
                market.collateralToken as `0x${string}`
              ],
            }) as MarketData;

            const marketKey = `${market.loanToken}-${market.collateralToken}`;
            marketDataMap.set(marketKey, marketData);
          } catch (error) {
            console.error(`Failed to fetch market data for ${market.loanToken}/${market.collateralToken}:`, error);
          }
        })
      );

      // Step 3: Merge market data with positions
      const positionsWithMarketData = positions.map((position) => {
        const marketKey = `${position.loanToken}-${position.collateralToken}`;
        const marketData = marketDataMap.get(marketKey);
        const debt = calculateDebt(
          position.shares,
          marketData?.totalDepositAssets || BigInt(0),
          marketData?.totalDepositShares || BigInt(0),
        );
        return {
          ...position,
          debt: formatUnits(BigInt(debt), getToken(position.loanToken || "")?.decimals || 18),
          healthFactor: calculateHealthFactor(
            debt.toString(),
            position.collateralAmount,
            marketData?.LTV.toString() || "0",
            getToken(position.collateralToken || "")?.price || 0
          )
        };
      });

      return {
        borrowPositions: {
          items: positionsWithMarketData,
          totalCount: borrowPositionsData.borrowPositions.totalCount
        }
      } as BorrowPositionsResponse;
    },
    enabled: !!filter && Object.keys(filter).length > 0, // Only run query if filter is provided
    staleTime: 30000, // Data is fresh for 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
}


