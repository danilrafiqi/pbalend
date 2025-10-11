"use client"

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  title: string
  description?: string
  type: ToastType
  duration?: number
}

interface ToastContextType {
  showToast: (toast: Omit<Toast, 'id'>) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = { ...toast, id }
    
    setToasts(prev => [...prev, newToast])

    // Auto remove after duration (default 5 seconds)
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, toast.duration || 5000)
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[], onRemove: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onRemove }: { toast: Toast, onRemove: (id: string) => void }) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Trigger animation
    setTimeout(() => setIsVisible(true), 10)
  }, [])

  const handleRemove = () => {
    setIsVisible(false)
    setTimeout(() => onRemove(toast.id), 300)
  }

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-chart-1" />
      case 'error':
        return <XCircle className="w-5 h-5 text-chart-4" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-chart-3" />
      default:
        return <CheckCircle className="w-5 h-5 text-primary" />
    }
  }

  const getBgColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-chart-1/10 border-chart-1/20 hover:border-chart-1/30'
      case 'error':
        return 'bg-chart-4/10 border-chart-4/20 hover:border-chart-4/30'
      case 'warning':
        return 'bg-chart-3/10 border-chart-3/20 hover:border-chart-3/30'
      default:
        return 'bg-primary/10 border-primary/20 hover:border-primary/30'
    }
  }

  return (
    <div
      className={`
        min-w-80 max-w-md p-4 rounded-xl border shadow-xl backdrop-blur-sm
        bg-card/90 border-border
        transform transition-all duration-300 ease-in-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        hover:shadow-2xl
      `}
    >
      <div className="flex items-start gap-3">
        <div className={`
          w-8 h-8 rounded-full flex items-center justify-center
          ${getBgColor()}
        `}>
          {getIcon()}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-sm text-foreground mb-1">
            {toast.title}
          </h4>
          {toast.description && (
            <p className="text-sm text-muted-foreground">
              {toast.description}
            </p>
          )}
        </div>
        <button
          onClick={handleRemove}
          className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted/50"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export function useCustomToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useCustomToast must be used within a ToastProvider')
  }
  return context
}
