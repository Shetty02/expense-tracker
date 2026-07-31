'use client'

import { AddExpenseProvider } from '@/contexts/AddExpenseContext'
import { SidebarNav } from '@/components/sidebar-nav'
import { BottomNav } from '@/components/bottom-nav'
import { AddExpenseModal } from '@/components/add-expense-modal'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AddExpenseProvider>
      <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans">
        {/* Desktop Sidebar Nav */}
        <SidebarNav />

        {/* Main Content Area */}
        <main className="md:pl-64 pb-20 md:pb-6 min-h-screen">
          <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Nav */}
        <BottomNav />

        {/* Global Add Expense Modal */}
        <AddExpenseModal />
      </div>
    </AddExpenseProvider>
  )
}
