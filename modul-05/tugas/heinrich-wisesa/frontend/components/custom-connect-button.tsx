"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useSwitchChain, useChains } from "wagmi";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Wallet, ChevronDown, Check } from "lucide-react";
import { useState } from "react";

export default function CustomConnectButton() {
  const { isConnected, address, chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const chains = useChains();
  const [isOpen, setIsOpen] = useState(false);

  if (!isConnected) {
    return (
      <ConnectButton.Custom>
        {({ openConnectModal }) => (
          <Button
            onClick={openConnectModal}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Wallet className="w-4 h-4 mr-2" />
            Connect Wallet
          </Button>
        )}
      </ConnectButton.Custom>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Chain Selection Button */}
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="bg-card border-border hover:bg-accent hover:text-accent-foreground"
          >
            <div className="flex items-center gap-2">
              {(chain as any)?.iconUrl ? (
                <img 
                  src={(chain as any)?.iconUrl} 
                  alt={chain?.name || 'Chain'} 
                  className="w-4 h-4 rounded-full"
                  onError={(e) => {
                    // Fallback to letter if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `<div class="w-4 h-4 rounded-full bg-primary flex items-center justify-center"><span class="text-xs font-bold text-primary-foreground">${chain?.name?.charAt(0) || "?"}</span></div>`;
                    }
                  }}
                />
              ) : (
                <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-xs font-bold text-primary-foreground">
                    {chain?.name?.charAt(0) || "?"}
                  </span>
                </div>
              )}
              <span className="text-sm font-medium">{chain?.name || "Unknown"}</span>
              <ChevronDown className="w-4 h-4" />
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="w-56 bg-card border-border"
        >
          {chains.map((chainOption: any) => (
            <DropdownMenuItem
              key={chainOption.id}
              onClick={() => {
                switchChain({ chainId: chainOption.id });
                setIsOpen(false);
              }}
              className="flex items-center justify-between cursor-pointer hover:bg-accent"
            >
              <div className="flex items-center gap-3">
                {(chainOption as any)?.iconUrl ? (
                  <img 
                    src={(chainOption as any)?.iconUrl} 
                    alt={chainOption.name} 
                    className="w-5 h-5 rounded-full"
                    onError={(e) => {
                      // Fallback to letter if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `<div class="w-5 h-5 rounded-full bg-primary flex items-center justify-center"><span class="text-xs font-bold text-primary-foreground">${chainOption.name?.charAt(0) || "?"}</span></div>`;
                      }
                    }}
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-xs font-bold text-primary-foreground">
                      {chainOption.name?.charAt(0) || "?"}
                    </span>
                  </div>
                )}
                <div>
                  <div className="font-medium">{chainOption.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {chainOption.nativeCurrency.symbol}
                  </div>
                </div>
              </div>
              {chain?.id === chainOption.id && (
                <Check className="w-4 h-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Connect Button with Account Info */}
      <ConnectButton.Custom>
        {({ openAccountModal, mounted }) => {
          if (!mounted) return null;
          
          return (
            <Button
              onClick={openAccountModal}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Wallet className="w-4 h-4 mr-2" />
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline">
                  {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Connected"}
                </span>
              </div>
            </Button>
          );
        }}
      </ConnectButton.Custom>
    </div>
  );
}