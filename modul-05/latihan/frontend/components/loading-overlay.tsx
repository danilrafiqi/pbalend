"use client"

import { Loader2 } from "lucide-react"

interface LoadingOverlayProps {
  isVisible: boolean;
  step: string;
  action: string;
}

export function LoadingOverlay({ isVisible, step, action }: LoadingOverlayProps) {
  if (!isVisible) return null;

  const getStepMessage = (step: string) => {
    switch (step) {
      case 'approving':
        return 'Approving token spending...';
      case 'depositing':
        return 'Depositing to lending pool...';
      case 'borrowing':
        return 'Processing borrow request...';
      case 'withdrawing':
        return 'Processing withdrawal...';
      case 'repaying':
        return 'Processing repayment...';
      case 'confirming':
        return 'Confirming transaction...';
      case 'success':
        return 'Transaction confirmed!';
      case 'error':
        return 'Transaction failed';
      default:
        return 'Processing transaction...';
    }
  };

  const getProgressPercentage = (step: string) => {
    switch (step) {
      case 'approving':
        return '25%';
      case 'depositing':
      case 'borrowing':
      case 'withdrawing':
      case 'repaying':
        return '50%';
      case 'confirming':
        return '75%';
      case 'success':
        return '100%';
      case 'error':
        return '0%';
      default:
        return '10%';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
      <div className="bg-card border border-border rounded-lg p-8 max-w-md w-full mx-4">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <div className="text-center">
            <h3 className="text-lg font-semibold text-card-foreground mb-2">
              {action} in Progress
            </h3>
            <p className="text-sm text-muted-foreground">
              {getStepMessage(step)}
            </p>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-500"
              style={{
                width: getProgressPercentage(step)
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
