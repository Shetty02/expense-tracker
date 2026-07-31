'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, History, Settings, Plus, LogOut } from 'lucide-react'
import { useAddExpenseModal } from '@/contexts/AddExpenseContext'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { useConfirm } from '@/contexts/ConfirmContext'

export function BottomNav() {
  const confirm = useConfirm()
  const pathname = usePathname()
  const router = useRouter()
  const { openModal } = useAddExpenseModal()
  const supabase = createClient()

  const handleSignOut = async () => {
    const confirmed = await confirm({
      title: 'Sign Out',
      message: 'Are you sure you want to sign out of your account?',
      confirmText: 'Sign Out',
      cancelText: 'Cancel',
      variant: 'warning'
    })
    if (confirmed) {
      await supabase.auth.signOut()
      router.refresh()
    }
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/80 backdrop-blur-lg border-t border-zinc-850/80 pb-safe">
      <div className="flex items-center justify-between h-16 max-w-md mx-auto px-2">
        {/* Dashboard Link */}
        <Link
          href="/"
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full text-[10px] transition-colors",
            pathname === '/' ? "text-emerald-400 font-medium" : "text-zinc-400 hover:text-zinc-200"
          )}
        >
          <LayoutDashboard className="h-5 w-5 mb-0.5" />
          <span>Home</span>
        </Link>

        {/* History/Expenses Link */}
        <Link
          href="/expenses"
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full text-[10px] transition-colors",
            pathname === '/expenses' ? "text-emerald-400 font-medium" : "text-zinc-400 hover:text-zinc-200"
          )}
        >
          <History className="h-5 w-5 mb-0.5" />
          <span>Expenses</span>
        </Link>

        {/* Floating Add Expense Button */}
        <div className="relative -top-3 flex items-center justify-center w-12">
          <button
            onClick={openModal}
            className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-lg shadow-emerald-500/25 active:scale-90 transform duration-150 focus:outline-none cursor-pointer"
            aria-label="Add Expense"
          >
            <Plus className="h-6 w-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Settings Link */}
        <Link
          href="/settings"
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full text-[10px] transition-colors",
            pathname === '/settings' ? "text-emerald-400 font-medium" : "text-zinc-400 hover:text-zinc-200"
          )}
        >
          <Settings className="h-5 w-5 mb-0.5" />
          <span>Settings</span>
        </Link>

        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          className="flex flex-col items-center justify-center flex-1 h-full text-[10px] text-zinc-400 hover:text-red-400 transition-colors focus:outline-none cursor-pointer"
        >
          <LogOut className="h-5 w-5 mb-0.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )
}
