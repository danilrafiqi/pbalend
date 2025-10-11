"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp } from "lucide-react"
import { getToken } from "@/lib/tokens"
import { parsePercentage } from "@/lib/helper"
import { formatUnits } from "viem"
import type { LendPosition } from "@/hooks/use-get-lend-position"

interface Market {
  loanToken: string;
  collateralToken: string;
  interestRate: string;
  LTV: string;
}

interface LendPositionProps {
  position: LendPosition;
  market?: Market | null;
  onWithdraw: (position: LendPosition) => void;
}

export function LendPositionCard({ position, market, onWithdraw }: LendPositionProps) {
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
          <Badge className="bg-chart-1 text-primary-foreground">
            <TrendingUp className="w-3 h-3 mr-1" />
            Lending
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <p className="text-sm text-muted-foreground">Amount Lent</p>
            <p className="text-lg font-semibold text-foreground">
              {loanTokenInfo &&
                `${formatUnits(BigInt(position.amount), loanTokenInfo.decimals)}`
              } {loanTokenInfo?.symbol}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Interest Rate</p>
            <p className="text-lg font-semibold text-primary">
              {`${parsePercentage(market?.interestRate || "0")}%`}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Shares</p>
            <p className="text-lg font-semibold text-chart-1">
              {formatUnits(BigInt(position.shares), loanTokenInfo.decimals)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">LTV Ratio</p>
            <p className="text-lg font-semibold text-muted-foreground">
              {`${parsePercentage(market?.LTV || "0")}%`}
            </p>
          </div>
        </div>
        <Button
          onClick={() => onWithdraw(position)}
          className="bg-primary hover:bg-primary/90"
        >
          Withdraw
        </Button>
      </CardContent>
    </Card>
  );
}
