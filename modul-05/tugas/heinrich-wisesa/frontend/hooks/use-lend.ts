import { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useChainId, useAccount } from 'wagmi';
import { simulateContract } from 'wagmi/actions';
import { config as wagmiConfig } from '@/lib/wagmi';
import { useMutation } from '@tanstack/react-query';
import { parseUnits } from 'viem';
import { approveToSpender, parseContractError } from '@/lib/helper';
import { PBA_LEND_ABI } from '@/lib/abis/PBALend';
import { PBA_LEND_ADDRESS } from '@/lib/addresses';
import { getToken } from '@/lib/tokens';

interface UseLendParams {
  loanTokenAddress: string;
  collateralTokenAddress: string;
}

export const useLend = ({ loanTokenAddress, collateralTokenAddress }: UseLendParams) => {
  const [step, setStep] = useState<'idle' | 'approving' | 'depositing' | 'confirming' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const chainId = useChainId();
  const { address: userAddress } = useAccount();

  const loanTokenDecimals = getToken(loanTokenAddress)?.decimals || 18;

  const { writeContractAsync: deposit } = useWriteContract();
  
  // Wait for transaction receipt
  const { 
    isLoading: isWaitingForReceipt,
    isSuccess: isTxSuccess,
    isError: isTxError,
    error: receiptError,
    data: receipt
  } = useWaitForTransactionReceipt({
    hash: txHash || undefined,
  });

  // Handle transaction confirmation
  useEffect(() => {
    if (isTxSuccess && receipt) {
      // Check if transaction was successful (status === 'success')
      if (receipt.status === 'success') {
        setStep('success');
      } else {
        setStep('error');
        
        // Try to get more specific error information
        let errorMessage = 'Transaction was reverted by the contract';
        
        // Check if there are any logs that might indicate the revert reason
        if (receipt.logs && receipt.logs.length > 0) {
          console.log('Transaction logs:', receipt.logs);
        }
        
        setError(errorMessage);
      }
    } else if (isTxError) {
      setStep('error');
      const errorMessage = parseContractError(receiptError);
      setError(errorMessage);
    }
  }, [isTxSuccess, isTxError, receipt]);

  const lendMutation = useMutation({
    mutationFn: async ({ amount, onSuccess }: { amount: string; onSuccess?: () => void }) => {
      if (!userAddress) throw new Error('User not connected');
      
      setStep('approving');
      setError(null);

      const amountWei = parseUnits(amount, loanTokenDecimals);

      try {
        // Step 1: Check if approval is needed
        await approveToSpender({
          token: loanTokenAddress as `0x${string}`,
          owner: userAddress as `0x${string}`,
          spender: PBA_LEND_ADDRESS as `0x${string}`,
          amount: amountWei,
          chainId: chainId as number
        });

        // Step 2: Deposit to lending pool
        setStep('depositing');
        // Pre-flight simulate to surface revert reasons before sending tx
        await simulateContract(wagmiConfig, {
          address: PBA_LEND_ADDRESS as `0x${string}`,
          abi: PBA_LEND_ABI,
          functionName: 'deposit',
          args: [
            loanTokenAddress as `0x${string}`,
            collateralTokenAddress as `0x${string}`,
            amountWei
          ],
          chainId: chainId as (typeof wagmiConfig)['chains'][number]['id'],
          account: userAddress as `0x${string}`,
        });

        const hash = await deposit({
          address: PBA_LEND_ADDRESS as `0x${string}`,
          abi: PBA_LEND_ABI,
          functionName: 'deposit',
          args: [
            loanTokenAddress as `0x${string}`,
            collateralTokenAddress as `0x${string}`,
            amountWei
          ],
          gas: BigInt(300000),
        });

        if (hash) {
          setTxHash(hash);
          setStep('confirming')
        } else {
          throw new Error('Transaction failed to submit');
        }
      } catch (err) {
        setStep('error');
        const errorMessage = parseContractError(err);
        setError(errorMessage);
        throw err;
      }
    },
  });

  return {
    lend: lendMutation.mutate,
    lendAsync: lendMutation.mutateAsync,
    isLoading: lendMutation.isPending || isWaitingForReceipt,
    isSuccess: lendMutation.isSuccess,
    isError: lendMutation.isError,
    error: error || lendMutation.error?.message,
    step,
    txHash,
  };
};
