'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { X, Calendar, Sparkles, FileText, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { useAddExpenseModal } from '@/contexts/AddExpenseContext'
import { useCategories } from '@/hooks/useCategories'
import { useExpenses } from '@/hooks/useExpenses'
import { useProfile } from '@/hooks/useProfile'
import { CategoryIcon } from '@/components/icons'
import { cn, formatNumberWithCommas } from '@/lib/utils'

const expenseSchema = z.object({
  amount: z.string()
    .min(1, 'Amount is required')
    .refine(
      (val) => {
        const cleaned = val.replace(/,/g, '')
        return !isNaN(Number(cleaned)) && Number(cleaned) > 0
      },
      { message: 'Amount must be greater than 0' }
    ),
  category_id: z.string({ message: 'Category is required' }).uuid('Invalid category'),
  expense_date: z.string().min(1, 'Date is required'),
  description: z.string().max(100, 'Max 100 characters').optional(),
})

type ExpenseFormValues = z.infer<typeof expenseSchema>

interface AddExpenseModalProps {
  expenseToEdit?: any; // Used if editing an existing expense
  onCloseEdit?: () => void;
}

export function AddExpenseModal({ expenseToEdit, onCloseEdit }: AddExpenseModalProps) {
  const { isOpen, closeModal } = useAddExpenseModal()
  const { categories, isLoading: loadingCategories } = useCategories()
  const { profile } = useProfile()
  
  // Custom Date Picker states
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date())
  
  // Use current date for scoping mutations (prefix validation handles cache updates)
  const { createExpense, isCreating, updateExpense, isUpdating } = useExpenses(new Date())

  const isModalOpen = expenseToEdit ? true : isOpen
  const handleClose = expenseToEdit ? onCloseEdit! : closeModal

  const defaultValues: ExpenseFormValues = {
    amount: '' as any,
    category_id: '',
    expense_date: new Date().toISOString().split('T')[0],
    description: '',
  }

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues,
  })

  // Prefill if editing
  useEffect(() => {
    if (expenseToEdit) {
      reset({
        amount: formatNumberWithCommas(expenseToEdit.amount) as any,
        category_id: expenseToEdit.category_id,
        expense_date: expenseToEdit.expense_date,
        description: expenseToEdit.description || '',
      })
      try {
        setCalendarMonth(new Date(expenseToEdit.expense_date))
      } catch (e) {}
    } else {
      reset(defaultValues)
      setCalendarMonth(new Date())
    }
  }, [expenseToEdit, isModalOpen, reset])

  const generateCalendarDays = (monthDate: Date) => {
    const year = monthDate.getFullYear()
    const month = monthDate.getMonth()
    const firstDayIndex = new Date(year, month, 1).getDay()
    const totalDays = new Date(year, month + 1, 0).getDate()
    const totalDaysPrev = new Date(year, month, 0).getDate()

    const days: { date: Date; isCurrentMonth: boolean }[] = []

    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, totalDaysPrev - i),
        isCurrentMonth: false,
      })
    }

    for (let i = 1; i <= totalDays; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      })
    }

    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      })
    }

    return days
  }

  const selectedCategoryId = watch('category_id')

  const onSubmit = async (values: ExpenseFormValues) => {
    const expenseData = {
      amount: Number(values.amount.replace(/,/g, '')),
      category_id: values.category_id,
      expense_date: values.expense_date,
      description: values.description || null,
    }
    try {
      if (expenseToEdit) {
        await updateExpense({
          id: expenseToEdit.id,
          ...expenseData,
        })
      } else {
        await createExpense(expenseData)
      }
      handleClose()
      reset(defaultValues)
    } catch (err) {
      console.error(err)
    }
  }

  // Handle closing modal on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleClose])

  if (!isModalOpen) return null

  const currencySymbol = profile?.currency || '₹'

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={handleClose}
      />

      {/* Drawer / Dialog */}
      <div className="relative w-full md:max-w-md bg-zinc-900 border-t md:border border-zinc-800/80 rounded-t-2xl md:rounded-2xl p-6 shadow-2xl z-10 transition-all transform duration-350 animate-in slide-in-from-bottom md:zoom-in-95 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-semibold">
              {expenseToEdit ? 'Edit Expense' : 'Add Expense'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          
          {/* Amount input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Amount
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-xl font-medium text-emerald-400">
                {currencySymbol}
              </div>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                autoFocus={!expenseToEdit}
                className={cn(
                  "block w-full pl-9 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xl font-semibold text-zinc-50 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all",
                  errors.amount && "border-red-500 focus:border-red-500 focus:ring-red-500"
                )}
                {...register('amount', {
                  onChange: (e) => {
                    const cleanValue = e.target.value.replace(/,/g, '')
                    if (cleanValue === '' || !isNaN(Number(cleanValue))) {
                      e.target.value = formatNumberWithCommas(cleanValue)
                    } else {
                      e.target.value = e.target.value.slice(0, -1)
                    }
                  }
                })}
              />
            </div>
            {errors.amount && (
              <p className="text-xs text-red-400 font-medium">{errors.amount.message}</p>
            )}
          </div>

          {/* Category Picker Grid */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Category
            </label>
            {loadingCategories ? (
              <div className="grid grid-cols-4 gap-2">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-16 rounded-xl bg-zinc-850 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {categories.map((category) => {
                  const isSelected = selectedCategoryId === category.id
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setValue('category_id', category.id, { shouldValidate: true })}
                      className={cn(
                        "flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer active:scale-95 duration-100",
                        isSelected
                          ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-500/5"
                          : "bg-zinc-950 border-zinc-850 text-zinc-400 hover:border-zinc-750 hover:text-zinc-200"
                      )}
                    >
                      <div className="mb-1">
                        <CategoryIcon name={category.icon} className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] leading-tight line-clamp-1">
                        {category.name}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
            {errors.category_id && (
              <p className="text-xs text-red-400 font-medium">{errors.category_id.message}</p>
            )}
          </div>

          {/* Date Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Date
            </label>
            <button
              type="button"
              onClick={() => setShowDatePicker(true)}
              className={cn(
                "flex items-center justify-between w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-50 focus:outline-none focus:border-emerald-500 transition-all text-left cursor-pointer",
                errors.expense_date && "border-red-500"
              )}
            >
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-400" />
                <span>
                  {watch('expense_date') 
                    ? format(parseISO(watch('expense_date')), 'MMMM d, yyyy')
                    : 'Select Date'}
                </span>
              </span>
              <ChevronDown className="h-4 w-4 text-zinc-500" />
            </button>
            {errors.expense_date && (
              <p className="text-xs text-red-400 font-medium">{errors.expense_date.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Description (Optional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                <FileText className="h-4 w-4" />
              </div>
              <input
                type="text"
                placeholder="What was this for?"
                className="block w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-50 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-all"
                {...register('description')}
              />
            </div>
            {errors.description && (
              <p className="text-xs text-red-400 font-medium">{errors.description.message}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isCreating || isUpdating}
            className="w-full mt-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold shadow-lg shadow-emerald-500/10 transition-colors focus:outline-none disabled:opacity-50 cursor-pointer text-center"
          >
            {expenseToEdit 
              ? (isUpdating ? 'Saving...' : 'Save Changes') 
              : (isCreating ? 'Adding...' : 'Add Expense')}
          </button>
        </form>

        {/* Custom Calendar Picker Modal Overlay */}
        {showDatePicker && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/75 backdrop-blur-xs"
              onClick={() => setShowDatePicker(false)}
            />

            {/* Calendar Box */}
            <div className="relative w-full max-w-xs bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-2xl z-10 transition-all transform animate-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-850">
                <button
                  type="button"
                  onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                  className="p-1.5 rounded-lg hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                
                <span className="text-xs font-bold text-zinc-200">
                  {format(calendarMonth, 'MMMM yyyy')}
                </span>

                <button
                  type="button"
                  onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                  className="p-1.5 rounded-lg hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Weekday Names */}
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                  <span key={d} className="text-[10px] font-bold text-zinc-650 uppercase tracking-wider">
                    {d}
                  </span>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1">
                {generateCalendarDays(calendarMonth).map(({ date, isCurrentMonth }, i) => {
                  const dateStr = format(date, 'yyyy-MM-dd')
                  const isSelected = watch('expense_date') === dateStr
                  const isCurrentToday = format(new Date(), 'yyyy-MM-dd') === dateStr

                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setValue('expense_date', dateStr, { shouldValidate: true })
                        setShowDatePicker(false)
                      }}
                      className={cn(
                        "aspect-square flex items-center justify-center text-[11px] font-semibold rounded-lg transition-all cursor-pointer active:scale-90 duration-100",
                        isSelected
                          ? "bg-emerald-500 text-zinc-950 font-bold"
                          : isCurrentMonth
                            ? isCurrentToday
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : "bg-zinc-950 text-zinc-300 hover:bg-zinc-800"
                            : "text-zinc-700"
                      )}
                    >
                      {date.getDate()}
                    </button>
                  )
                })}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-2 border-t border-zinc-850 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setValue('expense_date', format(new Date(), 'yyyy-MM-dd'), { shouldValidate: true })
                    setShowDatePicker(false)
                  }}
                  className="flex-1 py-1.5 bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 text-[10px] font-bold text-zinc-400 rounded-lg transition-colors cursor-pointer text-center"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setShowDatePicker(false)}
                  className="flex-1 py-1.5 bg-zinc-850 hover:bg-zinc-800 text-[10px] font-bold text-zinc-300 rounded-lg transition-colors cursor-pointer text-center"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
