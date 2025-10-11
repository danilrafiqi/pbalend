import { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useChainId, useAccount } from 'wagmi';
import { useMutation } from '@tanstack/react-query';
import { parseUnits } from 'viem';
import { approveToSpender } from '@/lib/helper';
import { PBA_LEND_ABI } from '@/lib/abis/PBALend';
import { PBA_LEND_ADDRESS } from '@/lib/addresses';
import { getToken } from '@/lib/tokens';

interface UseRepayParams {
  loanTokenAddress: string;
  collateralTokenAddress: string;
}

type RepayStep = 'idle' | 'approving' | 'repaying' | 'confirming' | 'success' | 'error';

export function useRepay({ loanTokenAddress, collateralTokenAddress }: UseRepayParams) {
  const [step, setStep] = useState<RepayStep>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const chainId = useChainId();
  const { address: userAddress } = useAccount();
  const { writeContractAsync: repay } = useWriteContract();

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

  const repayMutation = useMutation({
    mutationFn: async ({ amount }: { amount: string }) => {
      if (!userAddress) {
        throw new Error('Wallet not connected');
      }

      if (!loanTokenAddress || !collateralTokenAddress) {
        throw new Error('Token addresses not provided');
      }

      setError(null);

      const loanToken = getToken(loanTokenAddress);
      if (!loanToken) {
        throw new Error('Loan token not found');
      }

      // Convert amount to wei using loan token decimals
      const amountWei = parseUnits(amount, loanToken.decimals);

      // Step 1: Approve loan token spending
      setStep('approving');
      //TODO: Implement Approve to Spender

      // Step 2: Submit repay transaction
      setStep('repaying');
      //TODO: Implement Pre-flight simulate     
      
      const hash = "0x123"; //TODO: Implement Repay

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
      
      console.error('❌ Repay transaction error:', err);
      console.error('📋 Full error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        name: err instanceof Error ? err.name : 'Unknown',
        cause: err instanceof Error ? err.cause : undefined,
        stack: err instanceof Error ? err.stack : undefined
      });
    },
  });

  const reset = () => {
    setStep('idle');
    setTxHash(null);
    setError(null);
    repayMutation.reset();
  };

  return {
    repay: repayMutation.mutate,
    repayAsync: repayMutation.mutateAsync,
    isLoading: repayMutation.isPending || step === 'confirming',
    step,
    txHash,
    error,
    reset,
    isSuccess: step === 'success',
    isError: step === 'error',
  };
}
