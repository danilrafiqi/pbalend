import { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { useMutation } from '@tanstack/react-query';
import { parseUnits } from 'viem';
import { PBA_LEND_ABI } from '@/lib/abis/PBALend';
import { PBA_LEND_ADDRESS } from '@/lib/addresses';
import { getToken } from '@/lib/tokens';

interface UseWithdrawParams {
  loanTokenAddress: string;
  collateralTokenAddress: string;
}

type WithdrawStep = 'idle' | 'withdrawing' | 'confirming' | 'success' | 'error';

export function useWithdraw({ loanTokenAddress, collateralTokenAddress }: UseWithdrawParams) {
  const [step, setStep] = useState<WithdrawStep>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { address: userAddress } = useAccount();
  const { writeContractAsync: withdraw } = useWriteContract();

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

  const withdrawMutation = useMutation({
    mutationFn: async ({ shares }: { shares: string }) => {
      if (!userAddress) {
        throw new Error('Wallet not connected');
      }

      if (!loanTokenAddress || !collateralTokenAddress) {
        throw new Error('Token addresses not provided');
      }

      setError(null);
      setStep('withdrawing');

      const loanToken = getToken(loanTokenAddress);
      if (!loanToken) {
        throw new Error('Loan token not found');
      }

      // Convert shares to wei using loan token decimals
      const sharesWei = parseUnits(shares, loanToken.decimals);

      // Submit withdraw transaction
      //TODO: Implement Pre-flight simulate

      const hash = "0x123"; //TODO: Implement Withdraw

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
    withdraw: withdrawMutation.mutate,
    withdrawAsync: withdrawMutation.mutateAsync,
    isLoading: withdrawMutation.isPending || step === 'confirming',
    step,
    txHash,
    error,
  };
}
