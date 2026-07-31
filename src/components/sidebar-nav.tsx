'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, History, Settings, Plus, LogOut, Wallet } from 'lucide-react'
import { useAddExpenseModal } from '@/contexts/AddExpenseContext'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

export function SidebarNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { openModal } = useAddExpenseModal()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  const navItems = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'Expenses', href: '/expenses', icon: History },
    { label: 'Settings', href: '/settings', icon: Settings },
  ]

  return (
    <div className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-zinc-950 border-r border-zinc-900 p-6">
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <Wallet className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-semibold text-sm leading-none">ExpenseTracker</h1>
          <span className="text-xs text-zinc-500">Finance Assistant</span>
        </div>
      </div>

      {/* Primary Action */}
      <button
        onClick={openModal}
        className="flex items-center justify-center gap-2 w-full py-3 px-4 mb-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold shadow-lg shadow-emerald-500/10 active:scale-[0.98] transition-all focus:outline-none cursor-pointer"
      >
        <Plus className="h-5 w-5 stroke-[2.5]" />
        <span>Add Expense</span>
      </button>

      {/* Nav Links */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-150",
                isActive
                  ? "bg-zinc-900 text-emerald-400 border border-zinc-800"
                  : "text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive ? "text-emerald-400" : "text-zinc-400")} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Logout Action */}
      <button
        onClick={handleSignOut}
        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-colors duration-150 border border-transparent focus:outline-none cursor-pointer"
      >
        <LogOut className="h-5 w-5" />
        <span>Sign Out</span>
      </button>
    </div>
  )
}
