'use client'

import { useEffect, useState } from 'react'
import { 
  TrendingUp, 
  Sparkles, 
  AlertTriangle, 
  ShoppingCart, 
  Film, 
  Plus, 
  ArrowRight,
  TrendingDown,
  Info,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar
} from 'lucide-react'
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts'
import { subMonths, addMonths, format, startOfMonth, isSameMonth } from 'date-fns'

import { useProfile } from '@/hooks/useProfile'
import { useExpenses, useExpensesHistory } from '@/hooks/useExpenses'
import { useAddExpenseModal } from '@/contexts/AddExpenseContext'
import { formatCurrency, cn } from '@/lib/utils'
import { CategoryColorMap } from '@/components/icons'

export default function Dashboard() {
  const [mounted, setMounted] = useState(false)
  const { profile, isLoading: loadingProfile } = useProfile()
  const { openModal } = useAddExpenseModal()

  // Use selected month state
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date())
  
  // Month picker popup states
  const [showMonthPicker, setShowMonthPicker] = useState(false)
  const [pickerYear, setPickerYear] = useState<number>(new Date().getFullYear())
  const [pickerViewMode, setPickerViewMode] = useState<'months' | 'years'>('months')

  const handleOpenMonthPicker = () => {
    setPickerYear(selectedMonth.getFullYear())
    setPickerViewMode('months')
    setShowMonthPicker(true)
  }

  const handlePrevMonth = () => {
    setSelectedMonth(prev => subMonths(prev, 1))
  }

  const handleNextMonth = () => {
    setSelectedMonth(prev => addMonths(prev, 1))
  }

  const { expenses, isLoading: loadingExpenses } = useExpenses(selectedMonth)
  const { data: historyExpenses, isLoading: loadingHistory } = useExpensesHistory(6, selectedMonth)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || loadingProfile || loadingExpenses || loadingHistory) {
    return (
      <div className="space-y-6 animate-pulse py-4">
        <div className="h-8 bg-zinc-900 rounded-lg w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-32 bg-zinc-900 rounded-2xl" />
          <div className="h-32 bg-zinc-900 rounded-2xl" />
          <div className="h-32 bg-zinc-900 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-80 bg-zinc-900 rounded-2xl" />
          <div className="h-80 bg-zinc-900 rounded-2xl" />
        </div>
      </div>
    )
  }

  const currencySymbol = profile?.currency || '₹'
  const income = profile?.monthly_income || 0

  // Calculate limits based on splits
  const splitNeedsPct = profile?.budget_split_needs || 50
  const splitWantsPct = profile?.budget_split_wants || 30
  const splitSavingsPct = profile?.budget_split_savings || 20

  const limitNeeds = income * (splitNeedsPct / 100)
  const limitWants = income * (splitWantsPct / 100)
  const targetSavings = income * (splitSavingsPct / 100)

  // Aggregate current month spend
  let spentNeeds = 0
  let spentWants = 0
  const categorySpentMap: Record<string, number> = {}

  expenses.forEach((expense) => {
    const amount = Number(expense.amount)
    const categoryType = expense.category?.type
    const categoryName = expense.category?.name || 'Other'

    if (categoryType === 'needs') {
      spentNeeds += amount
    } else {
      spentWants += amount
    }

    categorySpentMap[categoryName] = (categorySpentMap[categoryName] || 0) + amount
  })

  const totalSpent = spentNeeds + spentWants
  const savingsProgress = Math.max(0, income - totalSpent)

  // Format Pie Data
  const pieData = Object.keys(categorySpentMap).map((catName) => ({
    name: catName,
    value: categorySpentMap[catName],
    color: CategoryColorMap[catName] || '#6b7280',
  }))

  // Format 6 Months History Data
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(selectedMonth, 5 - i)
    return {
      date,
      label: format(date, 'MMM'),
      yearMonth: format(date, 'yyyy-MM'),
      Needs: 0,
      Wants: 0,
    }
  })

  if (historyExpenses) {
    historyExpenses.forEach((expense) => {
      const expDate = new Date(expense.expense_date)
      const expYearMonth = format(expDate, 'yyyy-MM')
      const categoryType = expense.category?.type
      const amount = Number(expense.amount)

      const monthObj = last6Months.find((m) => m.yearMonth === expYearMonth)
      if (monthObj) {
        if (categoryType === 'needs') {
          monthObj.Needs += amount
        } else {
          monthObj.Wants += amount
        }
      }
    })
  }

  // Warning thresholds for Progress Bars
  const getProgressStyles = (spent: number, limit: number) => {
    const ratio = limit > 0 ? spent / limit : 0
    if (ratio >= 1.0) return { barColor: 'bg-red-500', textColor: 'text-red-400', bannerColor: 'bg-red-500/10 border-red-500/20 text-red-400' }
    if (ratio >= 0.8) return { barColor: 'bg-amber-500', textColor: 'text-amber-400', bannerColor: 'bg-amber-500/10 border-amber-500/20 text-amber-400' }
    return { barColor: 'bg-emerald-500', textColor: 'text-emerald-400', bannerColor: '' }
  }

  const needsStyles = getProgressStyles(spentNeeds, limitNeeds)
  const wantsStyles = getProgressStyles(spentWants, limitWants)

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financial Dashboard</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Tracking budget for {format(selectedMonth, 'MMMM yyyy')}
          </p>
        </div>
        
        {/* Month Selector & Controls */}
        <div className="flex items-center justify-between md:justify-start gap-3 w-full md:w-auto">
          <div className="flex items-center justify-between gap-1.5 bg-zinc-950 border border-zinc-850 p-1.5 rounded-xl flex-1 md:flex-initial">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              aria-label="Previous Month"
            >
              <ChevronLeft className="h-4.5 w-4.5" />
            </button>
            
            <button
              onClick={handleOpenMonthPicker}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-zinc-900 text-xs font-semibold text-zinc-200 transition-colors cursor-pointer flex-1 md:flex-initial justify-center"
            >
              <Calendar className="h-4 w-4 text-emerald-400" />
              <span>{format(selectedMonth, 'MMMM yyyy')}</span>
            </button>

            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              aria-label="Next Month"
            >
              <ChevronRight className="h-4.5 w-4.5" />
            </button>
          </div>

          <button
            onClick={openModal}
            className="hidden md:flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold shadow-lg shadow-emerald-500/10 active:scale-[0.98] transition-all cursor-pointer text-sm"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>Add Expense</span>
          </button>
        </div>

        {/* Mobile-only Add Expense Button */}
        <button
          onClick={openModal}
          className="md:hidden flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold shadow-lg shadow-emerald-500/10 active:scale-[0.98] transition-all cursor-pointer"
        >
          <Plus className="h-5 w-5 stroke-[2.5]" />
          <span>Add Expense</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Net Income */}
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 flex flex-col justify-between">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Monthly Income
          </span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-zinc-100">{formatCurrency(income, currencySymbol)}</span>
          </div>
        </div>

        {/* Total Spend */}
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 flex flex-col justify-between">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Spent This Month
          </span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-zinc-100">{formatCurrency(totalSpent, currencySymbol)}</span>
            <span className="text-xs text-zinc-500">
              ({income > 0 ? Math.round((totalSpent / income) * 100) : 0}% of income)
            </span>
          </div>
        </div>

        {/* Net Savings Target */}
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 flex flex-col justify-between">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Unspent Income
          </span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-emerald-400">
              {formatCurrency(savingsProgress, currencySymbol)}
            </span>
            <span className="text-xs text-zinc-500">
              (target: {formatCurrency(targetSavings, currencySymbol)})
            </span>
          </div>
        </div>
      </div>

      {/* Alerts or Warnings */}
      {(spentNeeds > limitNeeds || spentWants > limitWants) && (
        <div className="space-y-2">
          {spentNeeds > limitNeeds && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span>You have exceeded your proportional budget for <strong>Needs/Home Expenses</strong>!</span>
            </div>
          )}
          {spentWants > limitWants && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span>You have exceeded your proportional budget for <strong>Wants/Discretionary Items</strong>!</span>
            </div>
          )}
        </div>
      )}

      {/* Main Grid: Budget Split Guidance + Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Budget split guidance card */}
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 space-y-6">
          <div>
            <h2 className="text-base font-semibold">Budget Split Status</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Based on your {splitNeedsPct}/{splitWantsPct}/{splitSavingsPct} allocation rule</p>
          </div>

          <div className="space-y-6">
            {/* Needs progress bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="font-medium text-zinc-200">Needs & Household ({splitNeedsPct}%)</span>
                </div>
                <span className="text-zinc-400 text-xs">
                  {formatCurrency(spentNeeds, currencySymbol)} / {formatCurrency(limitNeeds, currencySymbol)}
                </span>
              </div>
              <div className="w-full h-3 bg-zinc-955 rounded-full overflow-hidden border border-zinc-800/50">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-500", 
                    needsStyles.barColor
                  )} 
                  style={{ width: `${Math.min(100, limitNeeds > 0 ? (spentNeeds / limitNeeds) * 100 : 0)}%` }}
                />
              </div>
              {spentNeeds >= limitNeeds * 0.8 && (
                <div className="flex items-center gap-1.5 text-xs mt-1 text-zinc-400">
                  <Info className="h-3.5 w-3.5" />
                  <span>
                    Spent <strong className={needsStyles.textColor}>{Math.round((spentNeeds / limitNeeds) * 100)}%</strong> of Needs budget
                  </span>
                </div>
              )}
            </div>

            {/* Wants progress bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="font-medium text-zinc-200">Wants & Discretionary ({splitWantsPct}%)</span>
                </div>
                <span className="text-zinc-400 text-xs">
                  {formatCurrency(spentWants, currencySymbol)} / {formatCurrency(limitWants, currencySymbol)}
                </span>
              </div>
              <div className="w-full h-3 bg-zinc-955 rounded-full overflow-hidden border border-zinc-800/50">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-500", 
                    wantsStyles.barColor
                  )} 
                  style={{ width: `${Math.min(100, limitWants > 0 ? (spentWants / limitWants) * 100 : 0)}%` }}
                />
              </div>
              {spentWants >= limitWants * 0.8 && (
                <div className="flex items-center gap-1.5 text-xs mt-1 text-zinc-400">
                  <Info className="h-3.5 w-3.5" />
                  <span>
                    Spent <strong className={wantsStyles.textColor}>{Math.round((spentWants / limitWants) * 100)}%</strong> of Wants budget
                  </span>
                </div>
              )}
            </div>

            {/* Savings projection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="font-medium text-zinc-200">Savings Target ({splitSavingsPct}%)</span>
                </div>
                <span className="text-zinc-400 text-xs">
                  {formatCurrency(savingsProgress, currencySymbol)} / {formatCurrency(targetSavings, currencySymbol)}
                </span>
              </div>
              <div className="w-full h-3 bg-zinc-955 rounded-full overflow-hidden border border-zinc-800/50">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, targetSavings > 0 ? (savingsProgress / targetSavings) * 100 : 0)}%` }}
                />
              </div>
              <p className="text-[11px] text-zinc-500 leading-normal">
                {savingsProgress >= targetSavings 
                  ? "🎉 Solid! You are hitting your savings target by keeping expenses under control."
                  : "💡 Try reducing discretionary wants to bring your savings back to target."}
              </p>
            </div>
          </div>
        </div>

        {/* Spending breakdown chart */}
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 flex flex-col justify-between min-h-[300px]">
          <div>
            <h2 className="text-base font-semibold">Spending Breakdown</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Categorized breakdown for current month</p>
          </div>

          <div className="flex-1 flex flex-col justify-center items-center py-4">
            {expenses.length === 0 ? (
              <div className="text-center py-8 space-y-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-zinc-950 text-zinc-600 border border-zinc-850 mx-auto">
                  <ShoppingCart className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-zinc-300">No expenses tracked</h3>
                  <p className="text-xs text-zinc-500 mt-1">Tap below to add your first expense.</p>
                </div>
                <button
                  onClick={openModal}
                  className="inline-flex items-center gap-1.5 py-2 px-3 text-xs bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-medium rounded-lg active:scale-95 transition-all cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Expense</span>
                </button>
              </div>
            ) : (
              <div className="w-full h-48 md:h-52 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => formatCurrency(Number(value), currencySymbol)}
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px' }}
                      itemStyle={{ color: '#f4f4f5' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Labels legend listing on bottom or hover */}
              </div>
            )}
          </div>

          {pieData.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-zinc-400 border-t border-zinc-850/50 pt-4 mt-2">
              {pieData.map((data, index) => (
                <div key={index} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: data.color }} />
                  <span className="line-clamp-1">{data.name}: {formatCurrency(data.value, currencySymbol)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 6 Months historical spending Trend */}
      <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6">
        <div className="mb-6">
          <h2 className="text-base font-semibold">6-Month Spending Trend</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Historical breakdown of monthly spending</p>
        </div>

        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={last6Months}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <XAxis 
                dataKey="label" 
                stroke="#71717a" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false}
              />
              <YAxis 
                stroke="#71717a" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(value) => `${currencySymbol}${value}`}
              />
              <Tooltip
                formatter={(value) => formatCurrency(Number(value), currencySymbol)}
                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px' }}
                itemStyle={{ color: '#f4f4f5' }}
              />
              <Bar dataKey="Needs" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Wants" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-4 text-xs mt-3 text-zinc-400">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded bg-blue-500" />
            <span>Needs</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded bg-amber-500" />
            <span>Wants</span>
          </div>
        </div>
      </div>

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
