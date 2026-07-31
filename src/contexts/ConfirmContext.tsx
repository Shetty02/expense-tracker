'use client'

import { createContext, useContext, useState, useRef } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
}

type ConfirmContextType = (options: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmContextType | null>(null)

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmOptions>({ message: '' })
  const resolveRef = useRef<(value: boolean) => void>(null)

  const confirm = (opts: ConfirmOptions) => {
    setOptions(opts)
    setIsOpen(true)
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve
    })
  }

  const handleCancel = () => {
    setIsOpen(false)
    if (resolveRef.current) {
      resolveRef.current(false)
    }
  }

  const handleConfirm = () => {
    setIsOpen(false)
    if (resolveRef.current) {
      resolveRef.current(true)
    }
  }

  const title = options.title || 'Are you sure?'
  const confirmText = options.confirmText || 'Confirm'
  const cancelText = options.cancelText || 'Cancel'
  const variant = options.variant || 'danger'

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            onClick={handleCancel}
          />
          
          {/* Modal Container */}
          <div className="relative w-full max-w-xs bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl z-10 transition-all transform animate-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={handleCancel}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Content Layout */}
            <div className="flex flex-col items-center text-center mt-2">
              <div className={cn(
                "flex items-center justify-center w-11 h-11 rounded-full mb-3.5 border",
                variant === 'danger' && "bg-red-500/10 border-red-500/20 text-red-400",
                variant === 'warning' && "bg-amber-500/10 border-amber-500/20 text-amber-400",
                variant === 'info' && "bg-blue-500/10 border-blue-500/20 text-blue-400"
              )}>
                <AlertTriangle className="h-5.5 w-5.5" />
              </div>

              <h3 className="text-sm font-bold text-zinc-100">{title}</h3>
              <p className="text-[11px] text-zinc-400 mt-2.5 leading-relaxed">
                {options.message}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 mt-5">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 text-xs font-semibold active:scale-[0.97] transition-all cursor-pointer"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className={cn(
                  "flex-1 py-2.5 rounded-xl text-zinc-950 text-xs font-bold active:scale-[0.97] transition-all cursor-pointer",
                  variant === 'danger' && "bg-red-500 hover:bg-red-400 shadow-lg shadow-red-500/10",
                  variant === 'warning' && "bg-amber-500 hover:bg-amber-400 shadow-lg shadow-amber-500/10",
                  variant === 'info' && "bg-blue-500 hover:bg-blue-400 shadow-lg shadow-blue-500/10"
                )}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const context = useContext(ConfirmContext)
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider')
  }
  return context
}
