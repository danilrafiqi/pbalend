"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Wallet, Loader2, ArrowLeft } from "lucide-react"
import { useGetLendPositions } from "@/hooks/use-get-lend-position"
import { useGetBorrowPositions } from "@/hooks/use-get-borrow-positions"
import { useAccount } from "wagmi"
import { LendPositionCard } from "@/components/lend-position"
import { BorrowPositionCard } from "@/components/borrow-position"
import { EmptyState } from "@/components/empty-state"
import { LoadingOverlay } from "@/components/loading-overlay"
import { useWithdraw } from "@/hooks/use-withdraw"
import { useRepay } from "@/hooks/use-repay"
import { formatUnits } from "viem"
import { getToken } from "@/lib/tokens"
import router from "next/router"
import { useCustomToast } from "@/components/custom-toast"
import { useWithdrawCollateral } from "@/hooks/use-withdraw-collateral"
import { getMarketByTokens } from "@/lib/helper"
import { useGetMarkets } from "@/hooks/use-get-markets"

export default function PositionsPage() {
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [repayAmount, setRepayAmount] = useState("")
  const [collateralWithdrawAmount, setCollateralWithdrawAmount] = useState("")
  const [selectedPosition, setSelectedPosition] = useState<any>(null)
  const [actionType, setActionType] = useState<"withdraw" | "repay" | "withdraw-collateral" | null>(null)
  const { address: userAddress } = useAccount()
  const { showToast } = useCustomToast();

  const { data: allMarkets, isLoading: isLoadingMarkets, error: errorMarkets } = useGetMarkets({});
  const { data: lendPositions, isLoading: isLoadingLendPositions, error: errorLendPositions } = useGetLendPositions({ user: userAddress })
  const { data: borrowPositions, isLoading: isLoadingBorrowPositions, error: errorBorrowPositions } = useGetBorrowPositions({ user: userAddress })

  // Initialize withdraw and repay hooks for selected position
  const { withdraw, isLoading: isWithdrawing, step: withdrawStep, error: withdrawError } = useWithdraw({
    loanTokenAddress: selectedPosition?.loanToken || "",
    collateralTokenAddress: selectedPosition?.collateralToken || ""
  });

  const { repay, isLoading: isRepaying, step: repayStep, error: repayError } = useRepay({
    loanTokenAddress: selectedPosition?.loanToken || "",
    collateralTokenAddress: selectedPosition?.collateralToken || ""
  });

  const { withdrawCollateral, isLoading: isWithdrawingCollateral, step: withdrawCollateralStep, error: withdrawCollateralError } = useWithdrawCollateral({
    loanTokenAddress: selectedPosition?.loanToken || "",
    collateralTokenAddress: selectedPosition?.collateralToken || ""
  });

  const handleAction = (position: any, type: "withdraw" | "repay" | "withdraw-collateral") => {
    setSelectedPosition(position)
    setActionType(type)
  }

  const closeModal = () => {
    setSelectedPosition(null)
    setActionType(null)
    setWithdrawAmount("")
    setRepayAmount("")
    setCollateralWithdrawAmount("")
  }

  const handleWithdraw = () => {
    if (!withdrawAmount || !selectedPosition) return;
    withdraw({ shares: withdrawAmount });
  };

  const handleRepay = () => {
    if (!repayAmount || !selectedPosition) return;
    repay({ amount: repayAmount });
  };

  const handleWithdrawCollateral = () => {
    if (!collateralWithdrawAmount || !selectedPosition) return;
    withdrawCollateral({ amount: collateralWithdrawAmount });
  };

  useEffect(() => {
    if (withdrawStep === 'success') {
      setWithdrawAmount("");
      showToast({
        title: "Withdrawal Successful! 🎉",
        description: `Successfully withdrew ${withdrawAmount}`,
        type: "success",
      });
    } else if (withdrawStep === 'error') {
      showToast({
        title: "Withdrawal Failed ❌",
        description: withdrawError || "Transaction failed",
        type: "error",
      });
    }
  }, [withdrawStep]);

  useEffect(() => {
    if (repayStep === 'success') {
      setRepayAmount("");
      showToast({
        title: "Repayment Successful! 🎉",
        description: `Successfully repaid ${repayAmount}`,
        type: "success",
      });
    } else if (repayStep === 'error') {
      showToast({
        title: "Repayment Failed ❌",
        description: repayError || "Transaction failed",
        type: "error",
      });
    }
  }, [repayStep]);

  useEffect(() => {
    if (withdrawCollateralStep === 'success') {
      setCollateralWithdrawAmount("");
      showToast({
        title: "Withdrawal Successful! 🎉",
        description: `Successfully withdrew ${collateralWithdrawAmount} ${getToken(selectedPosition.collateralToken).symbol}`,
        type: "success",
      });
    } else if (withdrawCollateralStep === 'error') {
      showToast({
        title: "Withdraw Collateral Failed ❌",
        description: withdrawCollateralError || "Transaction failed",
        type: "error",
      });
    }
  }, [withdrawCollateralStep]);

  if (isLoadingMarkets || isLoadingLendPositions || isLoadingBorrowPositions) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading positions...</p>
        </div>
      </div>
    )
  }

  if (errorMarkets || errorLendPositions || errorBorrowPositions) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Error Loading Positions</h1>
          <Button onClick={() => router.push("/")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Pools
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Wallet className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">My Positions</h1>
        </div>

        <Tabs defaultValue="lending" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="lending">Lending Positions</TabsTrigger>
            <TabsTrigger value="borrowing">Borrowing Positions</TabsTrigger>
          </TabsList>

          {/* Lending Positions */}
          <TabsContent value="lending" className="space-y-4">
            <div className="grid gap-4">
              {lendPositions?.lendPositions.items && lendPositions.lendPositions.items.length > 0 ? (
                lendPositions.lendPositions.items.map((position) => {
                  const market = getMarketByTokens(allMarkets || [], position.loanToken, position.collateralToken);
                  return (
                    <LendPositionCard
                      key={position.loanToken+"|"+position.collateralToken}
                      position={position}
                      market={market}
                      onWithdraw={(position) => handleAction(position, "withdraw")}
                    />
                  );
                })
              ) : (
                <EmptyState
                  icon={Wallet}
                  title="No Lending Positions"
                  description="You don't have any active lending positions yet."
                  actionLabel="Start Lending"
                  actionHref="/"
                />
              )}
            </div>
          </TabsContent>

          {/* Borrowing Positions */}
          <TabsContent value="borrowing" className="space-y-4">
            <div className="grid gap-4">
              {borrowPositions?.borrowPositions.items && borrowPositions.borrowPositions.items.length > 0 ? (
                borrowPositions.borrowPositions.items.map((position) => {
                  const market = getMarketByTokens(allMarkets || [], position.loanToken, position.collateralToken);
                  return (
                    <BorrowPositionCard
                      key={position.loanToken+"|"+position.collateralToken}
                      position={position}
                      market={market}
                      onRepay={(position) => handleAction(position, "repay")}
                      onWithdrawCollateral={(position) => handleAction(position, "withdraw-collateral")}
                    />
                  );
                })
              ) : (
                <EmptyState
                  icon={Wallet}
                  title="No Borrowing Positions"
                  description="You don't have any active borrowing positions yet."
                  actionLabel="Start Borrowing"
                  actionHref="/"
                />
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Action Modal */}
      {selectedPosition && actionType && !isRepaying && !isWithdrawing && !isWithdrawingCollateral && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-10">
          <Card className="w-full max-w-md bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">
                {actionType === "withdraw" && "Withdraw Funds"}
                {actionType === "repay" && "Repay Loan"}
                {actionType === "withdraw-collateral" && "Withdraw Collateral"}
              </CardTitle>
              <CardDescription>{selectedPosition.pool}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {actionType === "withdraw" && (
                <div className="space-y-2">
                  <Label htmlFor="withdraw-amount">Amount to Withdraw</Label>
                  <Input
                    id="withdraw-amount"
                    type="number"
                    placeholder="0.00"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="bg-background border-border"
                  />
                  <p className="text-sm text-muted-foreground">
                    Available: {formatUnits(BigInt(selectedPosition.shares), getToken(selectedPosition.loanToken).decimals)}
                  </p>
                </div>
              )}

              {actionType === "repay" && (
                <div className="space-y-2">
                  <Label htmlFor="repay-amount">Amount to Repay</Label>
                  <Input
                    id="repay-amount"
                    type="number"
                    placeholder="0.00"
                    value={repayAmount}
                    onChange={(e) => setRepayAmount(e.target.value)}
                    className="bg-background border-border"
                  />
                  <p className="text-sm text-muted-foreground">
                    Debt: {selectedPosition.debt} {getToken(selectedPosition.loanToken).symbol}
                  </p>
                </div>
              )}

              {actionType === "withdraw-collateral" && (
                <div className="space-y-2">
                  <Label htmlFor="collateral-withdraw-amount">Collateral to Withdraw</Label>
                  <Input
                    id="collateral-withdraw-amount"
                    type="number"
                    placeholder="0.00"
                    value={collateralWithdrawAmount}
                    onChange={(e) => setCollateralWithdrawAmount(e.target.value)}
                    className="bg-background border-border"
                  />
                  <p className="text-sm text-muted-foreground">
                    Available: {formatUnits(BigInt(selectedPosition.collateralAmount), getToken(selectedPosition.collateralToken).decimals)} {getToken(selectedPosition.collateralToken).symbol}
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button onClick={closeModal} variant="outline" className="flex-1 bg-transparent">
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    if (actionType === "withdraw") handleWithdraw();
                    else if (actionType === "repay") handleRepay();
                    else if (actionType === "withdraw-collateral") handleWithdrawCollateral();
                  }}
                  disabled={isWithdrawing || isRepaying || isWithdrawingCollateral}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  {isWithdrawing || isRepaying || isWithdrawingCollateral ? "Processing..." : "Confirm"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Loading Overlays */}
      <LoadingOverlay 
        isVisible={isWithdrawing && withdrawStep !== 'success' && withdrawStep !== 'error'} 
        step={withdrawStep} 
        action="Withdrawal" 
      />
      <LoadingOverlay 
        isVisible={isRepaying && repayStep !== 'success' && repayStep !== 'error'} 
        step={repayStep} 
        action="Repayment" 
      />
      <LoadingOverlay 
        isVisible={isWithdrawingCollateral && withdrawCollateralStep !== 'success' && withdrawCollateralStep !== 'error'} 
        step={withdrawCollateralStep} 
        action="Withdraw Collateral" 
      />
    </>
  )
}

