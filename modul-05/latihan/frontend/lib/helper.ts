import { Address, BaseError, ContractFunctionRevertedError, erc20Abi, decodeErrorResult } from "viem";
import { config as wagmiConfig } from '@/lib/wagmi';
import {
    readContract,
    simulateContract,
    waitForTransactionReceipt,
    writeContract,
  } from 'wagmi/actions';
import { Market } from "@/hooks/use-get-markets";

export async function getAllowance(
    token: Address,
    owner: Address,
    spender: Address,
    chainId: any,
  ) {

    return readContract(wagmiConfig, {
      address: token,
      abi: erc20Abi,
      functionName: 'allowance',
      args: [owner, spender],
      chainId,
    }) as Promise<bigint>;
}

export async function approveToSpender(params: {
    token: Address;
    owner: Address;
    spender: Address;
    amount: bigint;
    chainId: any;
  }) {
    const { token, owner, spender, amount, chainId } = params;
    if (amount === BigInt(0)) return;
  
    const allowance = await getAllowance(token, owner, spender, chainId);
    if (allowance >= amount) return;
  
    const { request } = await simulateContract(wagmiConfig, {
      address: token,
      abi: erc20Abi,
      functionName: 'approve',
      args: [spender, amount],
      chainId,
      account: owner,
    });
    const hash = await writeContract(wagmiConfig, { ...request, chainId });
    const rcpt = await waitForTransactionReceipt(wagmiConfig, { hash, chainId });
    if (!rcpt.status) throw new Error('Token approval failed.');
  }

export function parsePercentage(value: string) {
    return Number(value) / 1e16;
}

export function calculateAnnualInterest(amount: string, interestRate: string) {
  return (
    Number.parseFloat(amount || "0") + 
    (Number.parseFloat(amount || "0") * parsePercentage(interestRate) / 100)
  ).toFixed(2);
}

export function calculateHealthFactor(amount_: string, collateralAmount_: string, ltv_: string, collateralPrice_: number) {
  const amount = Number.parseFloat(amount_ || "0");
  const collateralAmount = Number.parseFloat(collateralAmount_ || "0");

  if(amount === 0 || collateralAmount === 0) return "0"
  
  const ltv = parsePercentage(ltv_) / 100
  const healthFactor = (ltv * collateralPrice_ * collateralAmount) / amount
  return healthFactor.toFixed(2)
}

// Helper function to get market by tokens
export const getMarketByTokens = (allMarkets: Market[], loanToken: string, collateralToken: string) => {
  if (!allMarkets) return null;
  return allMarkets.find(market => 
    market.loanToken.toLowerCase() === loanToken.toLowerCase() && 
    market.collateralToken.toLowerCase() === collateralToken.toLowerCase()
  );
}

export function parseContractError(error: unknown): string {
  if (error instanceof BaseError) {
    const revertError = error.walk(
      (err: unknown) => err instanceof ContractFunctionRevertedError,
    );

    if (revertError instanceof ContractFunctionRevertedError) {
      const name = revertError.data?.errorName;
      if (name && PBALendErrorMessages[name]) {
        return PBALendErrorMessages[name];
      }
    }
  }

  if (error instanceof Error) {
    for (const key of Object.keys(PBALendErrorMessages)) {
      if (error.message.includes(key)) {
        return PBALendErrorMessages[key];
      }
    }
    const lower = error.message.toLowerCase();
    if (lower.includes('insufficient funds'))
      return 'Insufficient funds for gas';
    if (lower.includes('gas required exceeds allowance'))
      return 'Transaction would fail - please check your inputs';
    if (lower.includes('user rejected'))
      return 'Transaction was rejected by user';
  }

  return 'An unexpected error occurred. Please check your inputs and try again.';
}

export const PBALendErrorMessages: Record<string, string> = {
  "EnforcedPause": "The contract is currently paused. This operation is not available at this time.",
  "ExpectedPause": "The contract should be paused for this operation to work properly.",
  "InsufficientBalance": "You don't have enough tokens to complete this transaction.",
  "InsufficientCollateral": "You don't have enough collateral to complete this operation.",
  "InsufficientLiquidity": "There is not enough liquidity available in the market to complete this operation.",
  "InvalidAmount": "The amount you entered is invalid. Please check your input and try again.",
  "MarketAlreadyExists": "A market with these tokens already exists.",
  "MarketDoesNotExist": "The requested market does not exist.",
  "MarketNotActive": "This market is currently inactive and cannot be used for transactions.",
  "OwnableInvalidOwner": "The specified owner address is invalid.",
  "OwnableUnauthorizedAccount": "You are not authorized to perform this operation.",
  "TransferFailed": "Token transfer failed. Please check your balance and try again."
};