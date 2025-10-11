"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useGetMarkets } from "@/hooks/use-get-markets"
import { getToken } from "@/lib/tokens"
import { parsePercentage } from "@/lib/helper"
import { Loader2 } from "lucide-react"

export default function PBALend() {
  const { data: pools, isLoading, error } = useGetMarkets({});

  return (
    <>
      {/* Hero Section */}
      <section className="py-10 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6 text-balance">
            Decentralized Lending
            <span className="text-primary block">Made Simple</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-pretty">
            Earn yield by lending your crypto assets or borrow against your holdings with competitive rates in our
            secure DeFi protocol.
          </p>
        </div>
      </section>

      {/* Pool List Section */}
      <section id="pools" className="px-4">
        <div className="container mx-auto">
          <h3 className="text-3xl font-bold text-foreground mb-8 text-center">Pools</h3>
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground text-lg">Loading markets...</p>
              <p className="text-muted-foreground text-sm mt-2">Fetching the latest pool data</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-center">
                <p className="text-destructive text-lg mb-2">Failed to load markets</p>
                <p className="text-muted-foreground text-sm">{error.message}</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {pools && pools.length > 0 ? (
                pools.map((pool) => (
                  <Card
                    key={pool.loanToken+"|"+pool.collateralToken}
                    className="bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img
                            src={getToken(pool.collateralToken)?.image}
                            alt={getToken(pool.collateralToken)?.symbol}
                            className="w-6 h-6 rounded-full border"
                          />
                          <img
                            src={getToken(pool.loanToken)?.image}
                            alt={getToken(pool.loanToken)?.symbol}
                            className="w-6 h-6 rounded-full border -ml-2"
                          />
                          <CardTitle className="text-lg text-card-foreground">
                            {getToken(pool.collateralToken)?.name}/{getToken(pool.loanToken)?.name}
                          </CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">APY</span>
                          <span className="text-primary font-medium">{parsePercentage(pool.interestRate)}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">LTV</span>
                          <span className="text-card-foreground font-medium">{parsePercentage(pool.LTV)}%</span>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Link href={`/pool/${pool.loanToken}/${pool.collateralToken}`} className="flex-1">
                          <Button size="sm" className="w-full bg-primary hover:bg-primary/90">
                            View Pool
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground text-lg mb-2">No markets available</p>
                  <p className="text-muted-foreground text-sm">Check back later for new lending pools</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
