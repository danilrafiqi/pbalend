"use client"

import { useState, useEffect } from "react"
import { useAccount } from 'wagmi';
import { useRouter } from "next/navigation"
import { useLend } from "@/hooks/use-lend"
import { useBorrow } from "@/hooks/use-borrow"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Wallet, Loader2, XCircle, Percent } from "lucide-react"
import { useTokenBalance } from "@/hooks/use-token-balance"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useCustomToast } from "@/components/custom-toast"
import { getToken } from "@/lib/tokens";
import { calculateAnnualInterest, calculateHealthFactor, parsePercentage } from "@/lib/helper";
import { LoadingOverlay } from "@/components/loading-overlay";
import { Market } from "@/hooks/use-get-markets";

export default function PoolDetail({
  loanToken,
  collateralToken,
  pool
}: {
  loanToken: string;
  collateralToken: string;
  pool: Market | undefined;
}) {
  const router = useRouter()
  const { isConnected } = useAccount();
  const { showToast } = useCustomToast();
  
  const [lendAmount, setLendAmount] = useState("")
  const [borrowAmount, setBorrowAmount] = useState("")
  const [collateralAmount, setCollateralAmount] = useState("")
  const [healthFactor, setHealthFactor] = useState("")

  // Get token balance for the loan token
  const loanTokenBalance = useTokenBalance({
    tokenAddress: pool?.loanToken as `0x${string}` || "0x0000000000000000000000000000000000000000"
  });

  const collateralTokenBalance = useTokenBalance({
    tokenAddress: pool?.collateralToken as `0x${string}` || "0x0000000000000000000000000000000000000000"
  });

  // Always call these hooks with consistent parameters
  const {
    lend,
    isLoading: isLoadingLend,
    step: lendStep,
    error: lendError
  } = useLend({
    loanTokenAddress: pool?.loanToken as `0x${string}` || "0x0000000000000000000000000000000000000000",
    collateralTokenAddress: pool?.collateralToken as `0x${string}` || "0x0000000000000000000000000000000000000000",
  });

  const {
    borrow,
    isLoading: isBorrowing,
    step: borrowStep,
    error: borrowError,
  } = useBorrow({
    loanTokenAddress: pool?.loanToken as `0x${string}` || "0x0000000000000000000000000000000000000000",
    collateralTokenAddress: pool?.collateralToken as `0x${string}` || "0x0000000000000000000000000000000000000000",
  });

  // Handle health factor calculation
  useEffect(() => {
    if (pool) {
      const newHealthFactor = calculateHealthFactor(borrowAmount, collateralAmount, pool?.LTV || "0", getToken(pool?.collateralToken || "")?.price || 0)
      setHealthFactor(newHealthFactor)
    }
  }, [borrowAmount, collateralAmount, pool])

  // Handle pool not found - since we're using SSR, this should be rare
  if (!pool) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Pool Not Found</h1>
          <p className="text-muted-foreground mb-4">
            No lending pool found for {getToken(loanToken)?.symbol} / {getToken(collateralToken)?.symbol}
          </p>
          <Button onClick={() => router.push("/")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Pools
          </Button>
        </div>
      </div>
    )
  }

  const submitLend = () => {
    if (!lendAmount || !isConnected) return;
    
    lend({ 
      amount: lendAmount,
    });
  }

  // Show toast after lending succeeds or fails
  useEffect(() => {
    if (lendStep === 'success') {
      setLendAmount("");
      showToast({
        title: "Lending Successful! 🎉",
        description: `Successfully deposited ${lendAmount} ${getToken(pool?.loanToken || '')?.symbol} to the lending pool.`,
        type: "success",
      });
    } else if (lendStep === 'error') {
      showToast({
        title: "Lending Failed ❌",
        description: lendError || "Transaction failed",
        type: "error",
      });
    }
  }, [lendStep]);

  const submitBorrow = () => {
    if (!borrowAmount || !collateralAmount || !isConnected) return;
    if(Number.parseFloat(healthFactor) < 1) {
      showToast({
        title: "Health Factor is too low ❌",
        description: "Health Factor must be greater than 1",
        type: "error",
      });
      return;
    }
    
    borrow({ 
      borrowAmount: borrowAmount,
      collateralAmount: collateralAmount,
    });
  }

  // Show toast when borrowing succeeds or fails
  useEffect(() => {
    if (borrowStep === 'success') {
      setBorrowAmount("");
      setCollateralAmount("");
      showToast({
        title: "Borrowing Successful! 🎉",
        description: `Successfully borrowed ${borrowAmount} ${getToken(pool?.loanToken || '')?.symbol} with ${collateralAmount} ${getToken(pool?.collateralToken || '')?.symbol} collateral.`,
        type: "success",
      });
    } else if (borrowStep === 'error') {
      showToast({
        title: "Borrowing Failed ❌",
        description: borrowError || "Transaction failed",
        type: "error",
      });
    }
  }, [borrowStep]);

  return (
    <>
      {/* Loading Overlays */}
      <LoadingOverlay 
        isVisible={isLoadingLend && lendStep !== 'success' && lendStep !== 'error'} 
        step={lendStep} 
        action="Lending" 
      />
      <LoadingOverlay 
        isVisible={isBorrowing && borrowStep !== 'success' && borrowStep !== 'error'} 
        step={borrowStep} 
        action="Borrowing" 
      />

      {/* Full Width Hero Section */}
      <div className="w-full bg-gradient-to-br from-primary/10 via-background to-chart-1/5 py-12">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="relative">
                <img
                  src={getToken(pool.collateralToken)?.image}
                  alt={getToken(pool.collateralToken)?.symbol}
                  className="w-16 h-16 rounded-full border-2 border-background shadow-lg"
                />
                <img
                  src={getToken(pool.loanToken)?.image}
                  alt={getToken(pool.loanToken)?.symbol}
                  className="w-16 h-16 rounded-full border-2 border-background shadow-lg -ml-4"
                />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-foreground mb-4">
              {getToken(pool.collateralToken)?.name} / {getToken(pool.loanToken)?.name}
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Lend {getToken(pool.loanToken)?.name} or use {getToken(pool.collateralToken)?.name} as collateral in this decentralized lending pool
            </p>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 grid-cols-2 gap-6 mb-12 center">
            <Card className="bg-card/80 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-6 h-6 text-primary" />
                </div>
                <div className="text-2xl font-bold text-foreground mb-1">{parsePercentage(pool.interestRate)}%</div>
                <div className="text-sm text-muted-foreground">Interest Rate</div>
              </CardContent>
            </Card>

            <Card className="bg-card/80 backdrop-blur-sm border-border/50 hover:border-chart-1/50 transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-chart-1/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Percent className="w-6 h-6 text-chart-1" />
                </div>
                <div className="text-2xl font-bold text-foreground mb-1">{parsePercentage(pool.LTV)}%</div>
                <div className="text-sm text-muted-foreground">Loan-to-Value</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Lend and Borrow Sections */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Lend Section */}
          <Card className="bg-card/80 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-all duration-300 shadow-lg">
            <CardHeader className="pb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="text-2xl text-card-foreground">
                  Lend {getToken(pool.loanToken)?.symbol}
                </CardTitle>
              </div>
              <CardDescription className="text-muted-foreground text-base">
                Earn {parsePercentage(pool.interestRate)}% APY by supplying {getToken(pool.loanToken)?.symbol} to the lending pool
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-4">
                <Label htmlFor="lend-amount" className="text-card-foreground text-base font-medium">
                  Amount to Lend
                </Label>
                <div className="relative">
                  <Input
                    id="lend-amount"
                    placeholder="0.00"
                    value={lendAmount}
                    onChange={(e) => setLendAmount(e.target.value)}
                    className="bg-input border-border/50 text-foreground pr-16 h-12 text-lg focus:border-primary/50 transition-colors"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                    {getToken(pool.loanToken)?.symbol}
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">
                    Balance: <span className="text-foreground font-medium">{String(loanTokenBalance?.balance || "0")} {getToken(pool.loanToken)?.symbol}</span>
                  </span>
                  <button 
                    onClick={() => setLendAmount(String(loanTokenBalance?.balance || "0"))}
                    className="text-primary hover:text-primary/80 font-medium px-3 py-1 rounded-md hover:bg-primary/5 transition-colors"
                  >
                    Max
                  </button>
                </div>
              </div>

              <div className="bg-gradient-to-r from-primary/5 to-chart-1/5 p-6 rounded-xl border border-primary/10 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Annual earnings:</span>
                  <span className="text-chart-1 font-bold text-lg">
                    {
                      calculateAnnualInterest(lendAmount, pool.interestRate)
                    }
                    {getToken(pool.loanToken)?.symbol}
                  </span>
                </div>
              </div>

              <Button
                className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold py-3 h-12 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                disabled={!isConnected || !lendAmount || isLoadingLend}
                size="lg"
                onClick={submitLend}
              >
                {isConnected ? (
                  <div className="flex items-center gap-2">
                    Deposit {getToken(pool.loanToken)?.symbol}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Wallet className="w-5 h-5" />
                    Connect Wallet First
                  </div>
                )}
              </Button>
              
              {lendError && (
                <Alert className="mt-4 border-destructive/50 bg-destructive/10">
                  <XCircle className="h-4 w-4 text-destructive" />
                  <AlertDescription className="text-destructive">
                    {lendError}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Borrow Section */}
          <Card className="bg-card/80 backdrop-blur-sm border-border/50 hover:border-chart-4/30 transition-all duration-300 shadow-lg">
            <CardHeader className="pb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-chart-4/10 rounded-full flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-chart-4" />
                </div>
                <CardTitle className="text-2xl text-card-foreground">
                  Borrow {getToken(pool.loanToken)?.symbol}
                </CardTitle>
              </div>
              <CardDescription className="text-muted-foreground text-base">
                Borrow {getToken(pool.loanToken)?.symbol} at {parsePercentage(pool.interestRate)}% APY using {getToken(pool.collateralToken)?.symbol} as collateral
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-4">
                <div className="space-y-4">
                  <Label htmlFor="borrow-amount" className="text-card-foreground text-base font-medium">
                    Amount to Borrow
                  </Label>
                  <div className="relative">
                    <Input
                      id="borrow-amount"
                      placeholder="0.00"
                      value={borrowAmount}
                      onChange={(e) => setBorrowAmount(e.target.value)}
                      className="bg-input border-border/50 text-foreground pr-16 h-12 text-lg focus:border-chart-4/50 transition-colors"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                      {getToken(pool.loanToken)?.symbol}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label htmlFor="collateral-amount" className="text-card-foreground text-base font-medium">
                    Collateral Amount
                  </Label>
                  <div className="relative">
                    <Input
                      id="collateral-amount"
                      placeholder="0.00"
                      value={collateralAmount}
                      onChange={(e) => setCollateralAmount(e.target.value)}
                      className="bg-input border-border/50 text-foreground pr-16 h-12 text-lg focus:border-chart-4/50 transition-colors"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">{getToken(pool.collateralToken)?.symbol}</div>
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">
                    Balance: <span className="text-foreground font-medium">{String(collateralTokenBalance?.balance || "0")} {getToken(pool.collateralToken)?.symbol}</span>
                  </span>
                  <button 
                    onClick={() => setCollateralAmount(String(collateralTokenBalance?.balance || "0"))}
                    className="text-primary hover:text-primary/80 font-medium px-3 py-1 rounded-md hover:bg-primary/5 transition-colors"
                  >
                    Max
                  </button>
                </div>
              </div>

              <div className="bg-gradient-to-r from-chart-4/5 to-destructive/5 p-6 rounded-xl border border-chart-4/10 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Health Factor:</span>
                  <span className="text-destructive font-bold text-lg">{healthFactor}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Annual interest:</span>
                  <span className="text-chart-4 font-bold text-lg">
                    {calculateAnnualInterest(borrowAmount, pool.interestRate)}
                    {getToken(pool.loanToken)?.symbol}
                  </span>
                </div>
              </div>

              <Button
                className="w-full bg-gradient-to-r from-chart-4 to-chart-4/80 hover:from-chart-4/90 hover:to-chart-4/70 text-white font-semibold py-3 h-12 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                disabled={!isConnected || !borrowAmount || !collateralAmount || isBorrowing}
                size="lg"
                onClick={submitBorrow}
              >
                {isConnected ? (
                  <div className="flex items-center gap-2">
                    Borrow {getToken(pool.loanToken)?.symbol}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Wallet className="w-5 h-5" />
                    Connect Wallet First
                  </div>
                )}
              </Button>
              
              {borrowError && (
                <Alert className="mt-4 border-destructive/50 bg-destructive/10">
                  <XCircle className="h-4 w-4 text-destructive" />
                  <AlertDescription className="text-destructive">
                    {borrowError}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
