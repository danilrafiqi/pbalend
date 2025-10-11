import { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useChainId, useAccount } from 'wagmi';
import { useMutation } from '@tanstack/react-query';
import { parseUnits } from 'viem';
import { approveToSpender, parseContractError } from '@/lib/helper';
import { PBA_LEND_ABI } from '@/lib/abis/PBALend';
import { PBA_LEND_ADDRESS } from '@/lib/addresses';
import { getToken } from '@/lib/tokens';
import { simulateContract } from 'wagmi/actions';
import { config as wagmiConfig } from '@/lib/wagmi';

interface UseBorrowParams {
  loanTokenAddress: string;
  collateralTokenAddress: string;
}

export const useBorrow = ({ loanTokenAddress, collateralTokenAddress }: UseBorrowParams) => {
  const [step, setStep] = useState<'idle' | 'approving' | 'borrowing' | 'confirming' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const chainId = useChainId();
  const { address: userAddress } = useAccount();

  const loanTokenDecimals = getToken(loanTokenAddress)?.decimals || 18;
  const collateralTokenDecimals = getToken(collateralTokenAddress)?.decimals || 18;

  const { writeContractAsync: borrow } = useWriteContract();
  
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

  const borrowMutation = useMutation({
    mutationFn: async ({ borrowAmount, collateralAmount, onSuccess }: { borrowAmount: string; collateralAmount: string; onSuccess?: () => void }) => {
      if (!userAddress) throw new Error('User not connected');
      
      setStep('approving');
      setError(null);

      const amountWei = parseUnits(borrowAmount, loanTokenDecimals);
      const collateralAmountWei = parseUnits(collateralAmount, collateralTokenDecimals);

      try {
        // Step 1: Check if approval is needed for collateral
        await approveToSpender({
          token: collateralTokenAddress as `0x${string}`,
          owner: userAddress as `0x${string}`,
          spender: PBA_LEND_ADDRESS as `0x${string}`,
          amount: collateralAmountWei,
          chainId: chainId as number
        });

        // Step 2: Submit borrow transaction
        setStep('borrowing');
        await simulateContract(wagmiConfig, {
          address: PBA_LEND_ADDRESS as `0x${string}`,
          abi: PBA_LEND_ABI,
          functionName: 'borrow',
          args: [
            loanTokenAddress as `0x${string}`,
            collateralTokenAddress as `0x${string}`,
            amountWei,
            collateralAmountWei
          ],
        });

        const hash = await borrow({
          address: PBA_LEND_ADDRESS as `0x${string}`,
          abi: PBA_LEND_ABI,
          functionName: 'borrow',
          args: [
            loanTokenAddress as `0x${string}`,
            collateralTokenAddress as `0x${string}`,
            amountWei,
            collateralAmountWei
          ],
          gas: BigInt(1000000), // 1M gas limit
          gasPrice: BigInt(1000000000), // 1 gwei gas price
        });

        if (hash) {
          setTxHash(hash);
          setStep('confirming');
          
        } else {
          throw new Error('Transaction failed to submit');
        }
      } catch (err) {
        setStep('error');
        const errorMessage = err instanceof Error ? err.message : 'Transaction failed';
        setError(errorMessage);
        console.error('Borrow transaction error:', err);
        throw err;
      }
    },
  });

  return {
    borrow: borrowMutation.mutate,
    borrowAsync: borrowMutation.mutateAsync,
    isLoading: borrowMutation.isPending || isWaitingForReceipt,
    isSuccess: borrowMutation.isSuccess,
    isError: borrowMutation.isError,
    error: error || borrowMutation.error?.message,
    step,
    txHash,
  };
};
