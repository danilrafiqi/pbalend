"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingDown } from "lucide-react"
import { getToken } from "@/lib/tokens"
import { parsePercentage } from "@/lib/helper"
import { formatUnits } from "viem"
import type { BorrowPosition } from "@/hooks/use-get-borrow-positions"

interface Market {
  loanToken: string;
  collateralToken: string;
  interestRate: string;
  LTV: string;
}

interface BorrowPositionProps {
  position: BorrowPosition;
  market?: Market | null;
  onRepay: (position: BorrowPosition) => void;
  onWithdrawCollateral: (position: BorrowPosition) => void;
}

function getHealthFactorStyle(healthFactor: string) {
  if (Number(healthFactor) >= 1) {
    return "text-lg font-semibold text-chart-1";
  } else {
    return "text-lg font-semibold text-chart-4";
  }
}

export function BorrowPositionCard({ position, market, onRepay, onWithdrawCollateral }: BorrowPositionProps) {
  const loanTokenInfo = getToken(position.loanToken);
  const collateralTokenInfo = getToken(position.collateralToken);

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center">
              <img
                src={collateralTokenInfo?.image}
                alt={collateralTokenInfo?.symbol}
                className="w-8 h-8 rounded-full border-2 border-background shadow-sm"
              />
              <img
                src={loanTokenInfo?.image}
                alt={loanTokenInfo?.symbol}
                className="w-8 h-8 rounded-full border-2 border-background shadow-sm -ml-2"
              />
            </div>
            <CardTitle className="text-foreground">
              {collateralTokenInfo?.symbol}
              /
              {loanTokenInfo?.symbol}
            </CardTitle>
          </div>
          <Badge className="bg-chart-4 text-primary-foreground">
            <TrendingDown className="w-3 h-3 mr-1" />
            Borrowing
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <p className="text-sm text-muted-foreground">Borrowed Amount</p>
            <p className="text-lg font-semibold text-foreground">
              {loanTokenInfo &&
                `${formatUnits(BigInt(position.amount), loanTokenInfo.decimals)}`
              } {loanTokenInfo?.symbol}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Collateral Amount</p>
            <p className="text-lg font-semibold text-foreground">
              {collateralTokenInfo &&
                `${formatUnits(BigInt(position.collateralAmount), collateralTokenInfo.decimals)}`
              } {collateralTokenInfo?.symbol}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Interest Rate</p>
            <p className="text-lg font-semibold text-chart-1">
              {`${parsePercentage(market?.interestRate || "0")}%`}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Debt</p>
            <p className="text-lg font-semibold text-chart-1">
              {position.debt}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Health Factor</p>
            <p className={getHealthFactorStyle(position.healthFactor)}>
              {position.healthFactor}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => onRepay(position)}
            className="bg-chart-4 hover:bg-chart-4/90"
          >
            Repay
          </Button>
          <Button onClick={() => onWithdrawCollateral(position)} variant="outline">
            Withdraw Collateral
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
