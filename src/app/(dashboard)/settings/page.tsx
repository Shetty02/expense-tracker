'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Settings as SettingsIcon, LogOut, Check, Save, AlertTriangle, Calendar, History, ChevronDown, ChevronUp } from 'lucide-react'
import { format, parseISO, subMonths, addMonths } from 'date-fns'

import { useProfile } from '@/hooks/useProfile'
import { useIncomeHistory } from '@/hooks/useIncomeHistory'
import { createClient } from '@/lib/supabase/client'
import { cn, formatNumberWithCommas, formatCurrency } from '@/lib/utils'

const settingsSchema = z
  .object({
    monthly_income: z.string()
      .min(1, 'Monthly income is required')
      .refine(
        (val) => {
          const cleaned = val.replace(/,/g, '')
          return !isNaN(Number(cleaned)) && Number(cleaned) > 0
        },
        { message: 'Income must be greater than 0' }
      ),
    currency: z.enum(['₹', '$', '£', '€']),
    tracks_investments: z.boolean(),
    budget_split_needs: z.number({ message: 'Needs split is required' })
      .min(0, 'Min 0%')
      .max(100, 'Max 100%'),
    budget_split_wants: z.number({ message: 'Wants split is required' })
      .min(0, 'Min 0%')
      .max(100, 'Max 100%'),
    budget_split_savings: z.number({ message: 'Savings split is required' })
      .min(0, 'Min 0%')
      .max(100, 'Max 100%'),
  })
  .refine(
    (data) => 
      data.budget_split_needs + data.budget_split_wants + data.budget_split_savings === 100, 
    {
      message: 'Splits must sum to exactly 100%',
      path: ['budget_split_needs'],
    }
  )

type SettingsFormValues = z.infer<typeof settingsSchema>

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const { profile, isLoading, updateProfile, isUpdating } = useProfile()
  const { incomeHistory, saveMonthlyIncome, isSavingIncome } = useIncomeHistory()
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentMonthKey = format(new Date(), 'yyyy-MM')
  const [effectiveMonth, setEffectiveMonth] = useState<string>(currentMonthKey)
  const [protectPastMonths, setProtectPastMonths] = useState<boolean>(true)
  const [showHistoryList, setShowHistoryList] = useState<boolean>(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
  })

  // Watch splits to compute running sum
  const splitNeeds = watch('budget_split_needs') || 0
  const splitWants = watch('budget_split_wants') || 0
  const splitSavings = watch('budget_split_savings') || 0
  const totalSplits = Number(splitNeeds) + Number(splitWants) + Number(splitSavings)

  useEffect(() => {
    if (profile) {
      reset({
        monthly_income: formatNumberWithCommas(profile.monthly_income || 0) as any,
        currency: profile.currency,
        tracks_investments: profile.tracks_investments ?? true,
        budget_split_needs: profile.budget_split_needs,
        budget_split_wants: profile.budget_split_wants,
        budget_split_savings: profile.budget_split_savings,
      })
    }
  }, [profile, reset])

  const onSubmit = async (values: SettingsFormValues) => {
    setSuccess(false)
    setError(null)
    try {
      const newIncome = Number(values.monthly_income.replace(/,/g, ''))
      const previousIncome = profile?.monthly_income ? Number(profile.monthly_income) : 0

      // 1. Record salary for effective month & preserve past months
      await saveMonthlyIncome({
        yearMonth: effectiveMonth,
        newIncome,
        effectiveFromCurrentMonth: protectPastMonths,
        previousIncome: previousIncome !== newIncome ? previousIncome : undefined,
      })

      // 2. Atomic update of splits and latest income in profile
      await updateProfile({
        monthly_income: newIncome,
        currency: values.currency,
        tracks_investments: values.tracks_investments,
        budget_split_needs: values.budget_split_needs,
        budget_split_wants: values.budget_split_wants,
        budget_split_savings: values.budget_split_savings,
      })

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to save settings.')
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
    router.push('/login')
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse py-4">
        <div className="h-8 bg-zinc-900 rounded-lg w-1/3" />
        <div className="h-96 bg-zinc-900 rounded-2xl w-full" />
      </div>
    )
  }

  const currencies = [
    { symbol: '₹', label: 'INR (₹)' },
    { symbol: '$', label: 'USD ($)' },
    { symbol: '£', label: 'GBP (£)' },
    { symbol: '€', label: 'EUR (€)' },
  ]

  return (
    <div className="max-w-md mx-auto space-y-6">
      
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-zinc-400 mt-1">Configure your income, currency, and budgets</p>
      </div>

      {/* Main Settings Card */}
      <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 shadow-xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          {success && (
            <div className="flex items-center gap-2 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400">
              <Check className="h-4 w-4 shrink-0" />
              <span>Settings updated successfully!</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Net Income Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Monthly Income
            </label>
            <input
              type="text"
              inputMode="decimal"
              className={cn(
                "block w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-50 focus:outline-none focus:border-emerald-500 transition-all",
                errors.monthly_income && "border-red-500"
              )}
              {...register('monthly_income', {
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
            {errors.monthly_income && (
              <p className="text-xs text-red-400 font-medium">{errors.monthly_income.message}</p>
            )}

            {/* Effective Starting Month & Salary Protection */}
            <div className="p-3.5 bg-zinc-950/80 border border-zinc-850 rounded-xl space-y-3 mt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-300 font-semibold flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Salary Effective From:</span>
                </span>
                <select
                  value={effectiveMonth}
                  onChange={(e) => setEffectiveMonth(e.target.value)}
                  className="bg-zinc-900 border border-zinc-750 text-xs text-zinc-100 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer font-medium"
                >
                  {[
                    format(subMonths(new Date(), 2), 'yyyy-MM'),
                    format(subMonths(new Date(), 1), 'yyyy-MM'),
                    format(new Date(), 'yyyy-MM'),
                    format(addMonths(new Date(), 1), 'yyyy-MM'),
                  ].map((mKey) => (
                    <option key={mKey} value={mKey}>
                      {format(parseISO(`${mKey}-01`), 'MMMM yyyy')} {mKey === currentMonthKey ? '(This Month)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-zinc-900 text-xs">
                <div className="flex flex-col pr-3">
                  <span className="text-zinc-200 font-medium text-xs">Protect past months' salary</span>
                  <span className="text-[11px] text-zinc-500">
                    Previous months will keep their historical salary and not be changed
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setProtectPastMonths(!protectPastMonths)}
                  className={cn(
                    "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                    protectPastMonths ? "bg-emerald-500" : "bg-zinc-800"
                  )}
                  aria-pressed={protectPastMonths}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
                      protectPastMonths ? "translate-x-4" : "translate-x-0"
                    )}
                  />
                </button>
              </div>

              {/* View/manage recorded salary history */}
              {Object.keys(incomeHistory).length > 0 && (
                <div className="pt-2 border-t border-zinc-900">
                  <button
                    type="button"
                    onClick={() => setShowHistoryList(!showHistoryList)}
                    className="flex items-center justify-between w-full text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <History className="h-3 w-3" />
                      <span>Recorded Monthly Salaries ({Object.keys(incomeHistory).length})</span>
                    </span>
                    {showHistoryList ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>

                  {showHistoryList && (
                    <div className="mt-2 space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {Object.keys(incomeHistory)
                        .sort()
                        .reverse()
                        .map((mKey) => (
                          <div
                            key={mKey}
                            className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/70 border border-zinc-850 text-xs"
                          >
                            <span className="text-zinc-300 font-medium">
                              {format(parseISO(`${mKey}-01`), 'MMMM yyyy')}
                            </span>
                            <span className="font-bold text-zinc-100">
                              {formatCurrency(incomeHistory[mKey], profile?.currency || '₹')}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Currency Field */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Currency
            </label>
            <div className="grid grid-cols-4 gap-2">
              {currencies.map((curr) => {
                const isSelected = watch('currency') === curr.symbol
                return (
                  <button
                    key={curr.symbol}
                    type="button"
                    onClick={() => setValue('currency', curr.symbol as any, { shouldValidate: true })}
                    className={cn(
                      "flex flex-col items-center justify-center py-2.5 rounded-xl border text-center transition-all cursor-pointer active:scale-95 duration-100",
                      isSelected
                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-500/5"
                        : "bg-zinc-950 border-zinc-850 text-zinc-400 hover:border-zinc-750"
                    )}
                  >
                    <span className="text-base font-bold">{curr.symbol}</span>
                    <span className="text-[9px] text-zinc-500 mt-0.5">{curr.label.split(' ')[0]}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Show Investment Tracking Toggle */}
          <div className="flex items-start justify-between gap-4 border-t border-zinc-850/60 pt-5">
            <div className="space-y-0.5">
              <label className="text-xs font-bold text-zinc-350 uppercase tracking-wider">
                Show Investment Tracking
              </label>
              <p className="text-[11px] text-zinc-500 leading-relaxed max-w-[280px]">
                Track mutual funds, stocks, and other investments separately from spending
              </p>
            </div>
            
            <button
              type="button"
              onClick={() => setValue('tracks_investments', !watch('tracks_investments'), { shouldDirty: true })}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-0",
                watch('tracks_investments') ? "bg-emerald-500" : "bg-zinc-800"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-zinc-950 shadow ring-0 transition duration-200 ease-in-out",
                  watch('tracks_investments') ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </div>

          {/* Budget Splits Section */}
          <div className="space-y-4 border-t border-zinc-850/60 pt-5">
            <div>
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Budget Allocation</h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">Customize your Needs / Wants / Savings split proportion</p>
            </div>

            <div className="space-y-4">
              {/* Needs percentage */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-zinc-300">
                  <span>Needs & Utilities</span>
                  <span className="font-semibold">{watch('budget_split_needs') || 0}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  className="w-full accent-emerald-500 h-1 bg-zinc-950 rounded-lg appearance-none cursor-pointer"
                  {...register('budget_split_needs', { valueAsNumber: true })}
                />
              </div>

              {/* Wants percentage */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-zinc-300">
                  <span>Wants & Discretionary</span>
                  <span className="font-semibold">{watch('budget_split_wants') || 0}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  className="w-full accent-emerald-500 h-1 bg-zinc-950 rounded-lg appearance-none cursor-pointer"
                  {...register('budget_split_wants', { valueAsNumber: true })}
                />
              </div>

              {/* Savings percentage */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-zinc-300">
                  <span>Savings Target</span>
                  <span className="font-semibold">{watch('budget_split_savings') || 0}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  className="w-full accent-emerald-500 h-1 bg-zinc-950 rounded-lg appearance-none cursor-pointer"
                  {...register('budget_split_savings', { valueAsNumber: true })}
                />
              </div>
            </div>

            {/* Sum validator display */}
            <div className="flex items-center justify-between p-3.5 bg-zinc-950 rounded-xl border border-zinc-850">
              <span className="text-xs text-zinc-400">Total Split Sum</span>
              <span 
                className={cn(
                  "text-sm font-bold", 
                  totalSplits === 100 ? "text-emerald-400 animate-pulse" : "text-red-400"
                )}
              >
                {totalSplits}%
              </span>
            </div>
            {totalSplits !== 100 && (
              <p className="text-[11px] text-red-400 leading-tight">
                ⚠️ Budget splits must sum to exactly 100% (currently off by {100 - totalSplits}%).
              </p>
            )}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isUpdating || totalSplits !== 100}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold shadow-lg shadow-emerald-500/10 active:scale-[0.98] transition-all focus:outline-none disabled:opacity-50 cursor-pointer text-sm"
          >
            <Save className="h-4 w-4" />
            <span>{isUpdating ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </form>
      </div>

      {/* Mobile Sign Out Button */}
      <div className="md:hidden">
        <button
          onClick={handleSignOut}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-zinc-900 hover:bg-red-500/10 hover:text-red-400 border border-zinc-800/80 font-medium text-sm text-zinc-400 transition-colors focus:outline-none cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>

    </div>
  )
}
