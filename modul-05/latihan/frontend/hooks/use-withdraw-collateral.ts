import { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { useMutation } from '@tanstack/react-query';
import { parseUnits } from 'viem';
import { PBA_LEND_ABI } from '@/lib/abis/PBALend';
import { PBA_LEND_ADDRESS } from '@/lib/addresses';
import { getToken } from '@/lib/tokens';

interface UseWithdrawCollateralParams {
  loanTokenAddress: string;
  collateralTokenAddress: string;
}

type WithdrawCollateralStep = 'idle' | 'withdrawing' | 'confirming' | 'success' | 'error';

export function useWithdrawCollateral({ loanTokenAddress, collateralTokenAddress }: UseWithdrawCollateralParams) {
  const [step, setStep] = useState<WithdrawCollateralStep>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { address: userAddress } = useAccount();
  const { writeContractAsync: withdrawCollateral } = useWriteContract();

  // Wait for transaction confirmation
  const { data: receipt, isSuccess: isTxSuccess, isError: isTxError } = useWaitForTransactionReceipt({
    hash: txHash as `0x${string}` | undefined,
  });

  // Handle transaction confirmation
  useEffect(() => {
    if (isTxSuccess && receipt) {
      if (receipt.status === 'success') {
        setStep('success');
        setError(null);
      } else {
        setStep('error');
        setError('Transaction failed');
      }
    } else if (isTxError) {
      setStep('error');
      setError('Transaction failed');
    }
  }, [isTxSuccess, isTxError, receipt]);

  const withdrawCollateralMutation = useMutation({
    mutationFn: async ({ amount }: { amount: string }) => {
      if (!userAddress) {
        throw new Error('Wallet not connected');
      }

      if (!loanTokenAddress || !collateralTokenAddress) {
        throw new Error('Token addresses not provided');
      }

      setError(null);
      setStep('withdrawing');

      const collateralToken = getToken(collateralTokenAddress);
      if (!collateralToken) {
        throw new Error('Collateral token not found');
      }

      // Convert amount to wei using collateral token decimals
      const amountWei = parseUnits(amount, collateralToken.decimals);

      // Submit withdraw collateral transaction
      //TODO: Implement Pre-flight simulate

      const hash = "0x123"; //TODO: Implement Withdraw Collateral

      if (hash) {
        setTxHash(hash);
        setStep('confirming');
        return hash;
      } else {
        throw new Error('Transaction failed to submit');
      }
    },
    onError: (err) => {
      setStep('error');
      const errorMessage = err instanceof Error ? err.message : 'Transaction failed';
      setError(errorMessage);
    },
  });

  return {
    withdrawCollateral: withdrawCollateralMutation.mutate,
    withdrawCollateralAsync: withdrawCollateralMutation.mutateAsync,
    isLoading: withdrawCollateralMutation.isPending || step === 'confirming',
    step,
    txHash,
    error,
  };
}
