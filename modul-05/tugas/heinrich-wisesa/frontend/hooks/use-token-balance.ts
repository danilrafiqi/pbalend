import { useAccount, useReadContract } from 'wagmi';
import { erc20Abi } from 'viem';
import { formatUnits } from 'viem';

interface UseTokenBalanceProps {
  tokenAddress?: `0x${string}`;
}

export function useTokenBalance({ tokenAddress }: UseTokenBalanceProps) {
  const { address: connectedAddress, isConnected } = useAccount();

  const {
    data: balanceData,
    isLoading: isBalanceLoading,
    isError,
    error,
    refetch,
  } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: connectedAddress ? [connectedAddress] : undefined,
    query: {
      enabled: Boolean(tokenAddress && connectedAddress && isConnected),
      gcTime: 5 * 60 * 1000,
    },
  });

  const { data: decimals } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'decimals',
    query: {
      enabled: Boolean(tokenAddress),
    },
  });

  const humanReadableBalance =
    balanceData && decimals !== undefined
      ? formatUnits(balanceData, decimals)
      : 0;

  return {
    balance: humanReadableBalance,
    rawBalance: balanceData,
    decimals,
    isLoading: isBalanceLoading,
    isError,
    error,
    refetch,
  };
}
