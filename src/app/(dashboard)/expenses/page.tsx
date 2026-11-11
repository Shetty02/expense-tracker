'use client'

import { useState } from 'react'
import { format, addMonths, subMonths, parseISO } from 'date-fns'
import { ChevronLeft, ChevronRight, Edit, Trash2, Calendar, ShoppingCart, SlidersHorizontal, AlertCircle, ChevronDown, Wallet, TrendingUp, Sparkles } from 'lucide-react'

import { useExpenses } from '@/hooks/useExpenses'
import { useProfile } from '@/hooks/useProfile'
import { useCategories } from '@/hooks/useCategories'
import { AddExpenseModal } from '@/components/add-expense-modal'
import { CategoryIcon, CategoryBadgeClasses } from '@/components/icons'
import { formatCurrency, cn } from '@/lib/utils'
import { useConfirm } from '@/contexts/ConfirmContext'

export default function ExpensesPage() {
  const confirm = useConfirm()
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date())
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [expenseToEdit, setExpenseToEdit] = useState<any>(null)
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)

  // Month picker popup states
  const [showMonthPicker, setShowMonthPicker] = useState(false)
  const [pickerYear, setPickerYear] = useState<number>(new Date().getFullYear())
  const [pickerViewMode, setPickerViewMode] = useState<'months' | 'years'>('months')

  const handleOpenMonthPicker = () => {
    setPickerYear(selectedMonth.getFullYear())
    setPickerViewMode('months')
    setShowMonthPicker(true)
  }

  const { expenses, isLoading, deleteExpense } = useExpenses(selectedMonth, selectedCategory)
  const { profile } = useProfile()
  const { categories } = useCategories()

  const currencySymbol = profile?.currency || '₹'

  const handlePrevMonth = () => {
    setSelectedMonth(prev => subMonths(prev, 1))
  }

  const handleNextMonth = () => {
    setSelectedMonth(prev => addMonths(prev, 1))
  }

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Transaction',
      message: 'Are you sure you want to delete this transaction? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger'
    })
    if (confirmed) {
      try {
        await deleteExpense(id)
      } catch (err) {
        console.error(err)
      }
    }
  }

  // Grouping expenses by date
  const groupedExpenses: Record<string, typeof expenses> = {}
  expenses.forEach((expense) => {
    const dateStr = expense.expense_date
    if (!groupedExpenses[dateStr]) {
      groupedExpenses[dateStr] = []
    }
    groupedExpenses[dateStr].push(expense)
  })

  // Sort dates descending
  const sortedDates = Object.keys(groupedExpenses).sort((a, b) => b.localeCompare(a))

  const formatDateHeader = (dateStr: string) => {
    try {
      const date = parseISO(dateStr)
      const todayStr = format(new Date(), 'yyyy-MM-dd')
      const yesterdayDate = new Date()
      yesterdayDate.setDate(yesterdayDate.getDate() - 1)
      const yesterdayStr = format(yesterdayDate, 'yyyy-MM-dd')

      if (dateStr === todayStr) return 'Today'
      if (dateStr === yesterdayStr) return 'Yesterday'

      return format(date, 'EEEE, MMMM d, yyyy')
    } catch {
      return dateStr
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Expenses History</h1>
        <p className="text-sm text-zinc-400 mt-1">Review and filter your transactions</p>
      </div>

      {/* Control bar */}
      <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Month Selector */}
        <div className="flex items-center justify-between sm:justify-start gap-2 bg-zinc-950 border border-zinc-850 p-1.5 rounded-xl">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            aria-label="Previous Month"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <button
            onClick={handleOpenMonthPicker}
            className="flex items-center gap-2 px-3 py-1 rounded-lg hover:bg-zinc-900 text-sm font-semibold text-zinc-200 min-w-[120px] justify-center transition-colors cursor-pointer"
          >
            <Calendar className="h-4 w-4 text-emerald-400" />
            <span>{format(selectedMonth, 'MMMM yyyy')}</span>
          </button>

          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            aria-label="Next Month"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Category Filter */}
        <div className="relative flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-950 text-zinc-500 border border-zinc-850 shrink-0">
            <SlidersHorizontal className="h-4 w-4" />
          </div>
          
          <div className="relative w-full">
            <button
              type="button"
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className="flex items-center justify-between w-full min-w-[150px] py-2 px-4 bg-zinc-950 border border-zinc-850 hover:border-zinc-750 text-sm text-zinc-200 rounded-xl focus:outline-none focus:border-emerald-500 transition-all text-left cursor-pointer active:scale-95 duration-100"
            >
              <span className="truncate">
                {selectedCategory === 'all' 
                  ? 'All Categories' 
                  : categories.find(c => c.id === selectedCategory)?.name || 'Select Category'}
              </span>
              <ChevronDown className={cn(
                "h-4 w-4 text-zinc-500 transition-transform duration-200 ml-2 shrink-0",
                showCategoryDropdown && "transform rotate-180 text-emerald-400"
              )} />
            </button>

            {/* Custom Dropdown Popover */}
            {showCategoryDropdown && (
              <>
                {/* Click outside backdrop */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowCategoryDropdown(false)}
                />
                
                {/* Menu list */}
                <div className="absolute right-0 mt-1.5 w-56 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150 max-h-64 overflow-y-auto custom-scrollbar">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('all')
                      setShowCategoryDropdown(false)
                    }}
                    className={cn(
                      "flex items-center w-full px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer text-left",
                      selectedCategory === 'all'
                        ? "bg-emerald-500/10 text-emerald-400 font-bold"
                        : "text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200"
                    )}
                  >
                    All Categories
                  </button>

                  <div className="my-1 border-t border-zinc-850/50" />

                  {categories.map((category) => {
                    const isSelected = selectedCategory === category.id
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(category.id)
                          setShowCategoryDropdown(false)
                        }}
                        className={cn(
                          "flex items-center gap-2.5 w-full px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer text-left",
                          isSelected
                            ? "bg-emerald-500/10 text-emerald-400 font-bold"
                            : "text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200"
                        )}
                      >
                        <div className="flex items-center justify-center w-5 h-5 rounded-md bg-zinc-950/60 border border-zinc-850 text-zinc-400">
                          <CategoryIcon name={category.icon} className="h-3 w-3" />
                        </div>
                        <span className="truncate">{category.name}</span>
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Summary Banner */}
      {!isLoading && expenses.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-zinc-400 font-medium">
                {selectedCategory === 'all' 
                  ? `Total Spent in ${format(selectedMonth, 'MMMM yyyy')}`
                  : `Total Spent on ${categories.find(c => c.id === selectedCategory)?.name || 'Category'} (${format(selectedMonth, 'MMM yyyy')})`
                }
              </p>
              <p className="text-xl font-bold text-zinc-50">
                {formatCurrency(expenses.reduce((sum, exp) => sum + Number(exp.amount), 0), currencySymbol)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-500 font-medium">Transactions</p>
            <p className="text-sm font-semibold text-zinc-300">{expenses.length}</p>
          </div>
        </div>
      )}

      {/* Expense List */}
      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-zinc-900 rounded-lg w-1/4" />
              <div className="h-16 bg-zinc-900 rounded-xl w-full" />
            </div>
          ))}
        </div>
      ) : sortedDates.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-12 text-center space-y-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-zinc-950 text-zinc-600 border border-zinc-850 mx-auto">
            <ShoppingCart className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-zinc-300">No expenses found</h3>
            <p className="text-xs text-zinc-500 mt-1">
              No transactions recorded for the selected filter and period.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((dateStr) => (
            <div key={dateStr} className="space-y-2.5">
              {/* Date Header */}
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider pl-1">
                {formatDateHeader(dateStr)}
              </h3>

              {/* Transactions on this day */}
              <div className="space-y-2">
                {groupedExpenses[dateStr].map((expense) => {
                  const badge = CategoryBadgeClasses[expense.category?.name || 'Other'] || {
                    bg: 'bg-zinc-500/10',
                    border: 'border-zinc-500/20',
                    text: 'text-zinc-400',
                  }
                  
                  const isSelfExpense = expense.description?.includes('[Myself]') || expense.description?.includes('#self')
                  const cleanDescription = expense.description
                    ? expense.description.replace(/^\[Myself\]\s*/i, '').replace(/#self/i, '').trim()
                    : ''
                  const displayTitle = cleanDescription || expense.category?.name

                  return (
                    <div
                      key={expense.id}
                      className="group flex items-center justify-between p-4 bg-zinc-900 hover:bg-zinc-850/60 border border-zinc-850/60 rounded-xl transition-all duration-150"
                    >
                      {/* Left: icon + details */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div 
                          className={cn(
                            "flex items-center justify-center w-10 h-10 rounded-xl border shrink-0",
                            badge.bg,
                            badge.border,
                            badge.text
                          )}
                        >
                          <CategoryIcon name={expense.category?.icon || 'HelpCircle'} className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-zinc-100 truncate">
                            {displayTitle}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span 
                              className={cn(
                                "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border",
                                badge.bg,
                                badge.border,
                                badge.text
                              )}
                            >
                              {expense.category?.name}
                            </span>
                            {isSelfExpense && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[9px] font-bold uppercase tracking-wider">
                                <Sparkles className="h-2.5 w-2.5" />
                                <span>For Myself</span>
                              </span>
                            )}
                            {expense.category?.type === 'savings' ? (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-bold uppercase tracking-wider">
                                <TrendingUp className="h-2.5 w-2.5" />
                                <span>Asset</span>
                              </span>
                            ) : (
                              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">
                                {expense.category?.type}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: amount + action triggers */}
                      <div className="flex items-center gap-4 pl-4 shrink-0">
                        <div className="flex flex-col items-end">
                          <span className="text-base font-bold text-zinc-100">
                            {formatCurrency(Number(expense.amount), currencySymbol)}
                          </span>
                          {expense.billing_cycle === 'annual' && (
                            <span className="text-[9px] text-zinc-500 font-semibold mt-0.5 whitespace-nowrap">
                              ≈ {formatCurrency(Number(expense.amount) / 12, currencySymbol)}/mo
                            </span>
                          )}
                        </div>
                        
                        {/* Hover Actions (shown permanently on touch, hover on desktop) */}
                        <div className="flex items-center gap-1.5 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setExpenseToEdit(expense)}
                            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(expense.id)}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-450 hover:text-red-400 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editing dialog mount */}
      {expenseToEdit && (
        <AddExpenseModal
          expenseToEdit={expenseToEdit}
          onCloseEdit={() => setExpenseToEdit(null)}
        />
      )}

      {/* Month Picker Popup Modal */}
      {showMonthPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowMonthPicker(false)}
          />

          {/* Modal Container */}
          <div className="relative w-full max-w-xs bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl z-10 transition-all transform animate-in zoom-in-95 duration-200">
            {/* Header / Year Switcher */}
            <div className="flex items-center justify-between mb-4 border-b border-zinc-850 pb-3">
              {pickerViewMode === 'months' ? (
                <>
                  <button
                    type="button"
                    onClick={() => setPickerYear(prev => prev - 1)}
                    className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setPickerViewMode('years')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-850 text-xs font-bold text-zinc-200 hover:bg-zinc-900 cursor-pointer transition-all focus:outline-none"
                  >
                    <span>{pickerYear}</span>
                    <ChevronDown className="h-3 w-3 text-zinc-500" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setPickerYear(prev => prev + 1)}
                    className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setPickerYear(prev => prev - 12)}
                    className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setPickerViewMode('months')}
                    className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-850 text-xs font-bold text-zinc-200 hover:bg-zinc-900 cursor-pointer transition-all focus:outline-none"
                  >
                    {pickerYear - 5} - {pickerYear + 6}
                  </button>

                  <button
                    type="button"
                    onClick={() => setPickerYear(prev => prev + 12)}
                    className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>

            {/* Grid display depending on view mode */}
            {pickerViewMode === 'months' ? (
              <div className="grid grid-cols-3 gap-2">
                {[
                  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
                ].map((monthName, index) => {
                  const isSelected = 
                    selectedMonth.getFullYear() === pickerYear && 
                    selectedMonth.getMonth() === index
                  
                  return (
                    <button
                      key={monthName}
                      type="button"
                      onClick={() => {
                        setSelectedMonth(new Date(pickerYear, index, 1))
                        setShowMonthPicker(false)
                      }}
                      className={cn(
                        "py-2.5 text-xs font-semibold rounded-xl text-center transition-all cursor-pointer active:scale-95 duration-100",
                        isSelected
                          ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/10"
                          : "bg-zinc-950 border border-zinc-850 text-zinc-400 hover:border-zinc-750 hover:text-zinc-200"
                      )}
                    >
                      {monthName}
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 12 }, (_, i) => {
                  const y = pickerYear - 5 + i
                  const isSelected = selectedMonth.getFullYear() === y
                  
                  return (
                    <button
                      key={y}
                      type="button"
                      onClick={() => {
                        setPickerYear(y)
                        setPickerViewMode('months')
                      }}
                      className={cn(
                        "py-2.5 text-xs font-semibold rounded-xl text-center transition-all cursor-pointer active:scale-95 duration-100",
                        isSelected
                          ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/10"
                          : "bg-zinc-950 border border-zinc-850 text-zinc-400 hover:border-zinc-750 hover:text-zinc-200"
                      )}
                    >
                      {y}
                    </button>
                  )
                })}
              </div>
            )}
            
            {/* Cancel Button */}
            <button
              type="button"
              onClick={() => setShowMonthPicker(false)}
              className="w-full mt-4 py-2 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 font-medium text-xs rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
