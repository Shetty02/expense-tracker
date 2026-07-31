'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Sparkles, Wallet, ArrowRight } from 'lucide-react'
import { useProfile } from '@/hooks/useProfile'
import { cn, formatNumberWithCommas } from '@/lib/utils'

const onboardingSchema = z.object({
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
})

type OnboardingFormValues = z.infer<typeof onboardingSchema>

export default function OnboardingPage() {
  const router = useRouter()
  const { updateProfile, isUpdating } = useProfile()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      monthly_income: '' as any,
      currency: '₹',
    },
  })

  const selectedCurrency = watch('currency')

  const onSubmit = async (values: OnboardingFormValues) => {
    setError(null)
    try {
      await updateProfile({
        monthly_income: Number(values.monthly_income.replace(/,/g, '')),
        currency: values.currency,
        budget_split_needs: 50,
        budget_split_wants: 30,
        budget_split_savings: 20,
      })
      router.refresh()
      router.push('/')
    } catch (err: any) {
      setError(err.message || 'Failed to save settings. Please try again.')
    }
  }

  const currencies = [
    { symbol: '₹', label: 'INR (₹)' },
    { symbol: '$', label: 'USD ($)' },
    { symbol: '£', label: 'GBP (£)' },
    { symbol: '€', label: 'EUR (€)' },
  ]

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center py-12">
      <div className="w-full max-w-md">
        
        {/* Onboarding Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4 animate-bounce">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Let's set up your budget</h1>
          <p className="text-sm text-zinc-500 mt-2 max-w-sm">
            To generate your custom budget plan, we need to know your monthly take-home income.
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 md:p-8 shadow-xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {error && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
                {error}
              </div>
            )}

            {/* Income field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Monthly Net Income
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-xl font-medium text-emerald-400">
                  {selectedCurrency}
                </div>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  className={cn(
                    "block w-full pl-9 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xl font-semibold text-zinc-50 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all",
                    errors.monthly_income && "border-red-500 focus:border-red-500 focus:ring-red-500"
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
              </div>
              {errors.monthly_income && (
                <p className="text-xs text-red-400 font-medium">{errors.monthly_income.message}</p>
              )}
            </div>

            {/* Currency Selector Grid */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Preferred Currency
              </label>
              <div className="grid grid-cols-4 gap-2">
                {currencies.map((curr) => {
                  const isSelected = selectedCurrency === curr.symbol
                  return (
                    <button
                      key={curr.symbol}
                      type="button"
                      onClick={() => setValue('currency', curr.symbol as any, { shouldValidate: true })}
                      className={cn(
                        "flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer active:scale-95 duration-100",
                        isSelected
                          ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-500/5"
                          : "bg-zinc-950 border-zinc-850 text-zinc-400 hover:border-zinc-750 hover:text-zinc-200"
                      )}
                    >
                      <span className="text-lg font-bold">{curr.symbol}</span>
                      <span className="text-[10px] text-zinc-500 leading-none mt-1">
                        {curr.label.split(' ')[0]}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Explanatory Note */}
            <div className="flex items-start gap-2.5 p-3.5 bg-zinc-950 rounded-xl border border-zinc-850/50">
              <Wallet className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-xs text-zinc-500 leading-relaxed">
                By default, your income will be split using the popular{' '}
                <strong className="text-zinc-400 font-semibold">50/30/20 budget rule</strong> (50% Needs, 30% Wants, 20% Savings). You can customize these percentages anytime in the settings.
              </p>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isUpdating}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold shadow-lg shadow-emerald-500/10 active:scale-[0.98] transition-all focus:outline-none disabled:opacity-50 cursor-pointer"
            >
              <span>{isUpdating ? 'Saving...' : 'Get Started'}</span>
              {!isUpdating && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}
