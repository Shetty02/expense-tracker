import { useState, useEffect, useCallback } from 'react'
import { format, parseISO } from 'date-fns'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from './useProfile'

export function useIncomeHistory() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { profile, updateProfile } = useProfile()
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setUserId(data.user.id)
    })
  }, [supabase])

  const storageKey = userId ? `expense_tracker_income_history_${userId}` : null

  // Fetch local history + remote if available
  const historyQuery = useQuery({
    queryKey: ['income_history', userId],
    queryFn: async (): Promise<Record<string, number>> => {
      let localData: Record<string, number> = {}
      if (storageKey) {
        try {
          const raw = localStorage.getItem(storageKey)
          if (raw) localData = JSON.parse(raw)
        } catch {}
      }

      // Try fetching from Supabase table if table exists
      try {
        const { data: remoteData, error } = await supabase
          .from('monthly_incomes')
          .select('year_month, amount')
        
        if (!error && remoteData) {
          remoteData.forEach((row: { year_month: string; amount: number }) => {
            localData[row.year_month] = Number(row.amount)
          })
          if (storageKey) {
            localStorage.setItem(storageKey, JSON.stringify(localData))
          }
        }
      } catch {
        // Table might not exist yet in Supabase, localData is the source of truth
      }

      return localData
    },
    enabled: !!userId,
  })

  const incomeHistory = historyQuery.data || {}

  // Helper to determine the income for any specific month
  const getIncomeForMonth = useCallback(
    (monthDate: Date | string): number => {
      const yearMonth = typeof monthDate === 'string' 
        ? monthDate.slice(0, 7) 
        : format(monthDate, 'yyyy-MM')

      // 1. Direct match for this specific month
      if (incomeHistory[yearMonth] !== undefined && incomeHistory[yearMonth] > 0) {
        return incomeHistory[yearMonth]
      }

      // 2. If month is before/after, find the closest applicable historical salary
      const sortedKeys = Object.keys(incomeHistory).sort()
      if (sortedKeys.length > 0) {
        // Find latest record before or equal to this month
        const priorKeys = sortedKeys.filter(k => k <= yearMonth)
        if (priorKeys.length > 0) {
          const latestPrior = priorKeys[priorKeys.length - 1]
          return incomeHistory[latestPrior]
        }
        // If viewing a month before any recorded history, use the earliest recorded
        return incomeHistory[sortedKeys[0]]
      }

      // 3. Fallback to profile monthly income
      return profile?.monthly_income || 0
    },
    [incomeHistory, profile?.monthly_income]
  )

  // Save new monthly income
  const saveMonthlyIncomeMutation = useMutation({
    mutationFn: async ({
      yearMonth,
      newIncome,
      effectiveFromCurrentMonth = true,
      previousIncome,
    }: {
      yearMonth: string;
      newIncome: number;
      effectiveFromCurrentMonth?: boolean;
      previousIncome?: number;
    }) => {
      const updatedHistory = { ...incomeHistory }

      // If user is raising/changing salary from a specific month onwards:
      // Lock in previous salary for prior months so old data is protected!
      if (previousIncome && previousIncome > 0 && effectiveFromCurrentMonth) {
        const [year, month] = yearMonth.split('-').map(Number)
        // Check prior month
        const prevMonthDate = new Date(year, month - 2, 1)
        const prevYearMonth = format(prevMonthDate, 'yyyy-MM')
        if (!updatedHistory[prevYearMonth]) {
          updatedHistory[prevYearMonth] = previousIncome
        }
      }

      // Record for the specified month
      updatedHistory[yearMonth] = newIncome

      // Save to localStorage
      if (storageKey) {
        localStorage.setItem(storageKey, JSON.stringify(updatedHistory))
      }

      // Update latest profile income in Supabase
      if (profile) {
        await updateProfile({
          monthly_income: newIncome,
        })
      }

      // Attempt to save to Supabase monthly_incomes table if present
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase.from('monthly_incomes').upsert({
            user_id: user.id,
            year_month: yearMonth,
            amount: newIncome,
          })
        }
      } catch {}

      return updatedHistory
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income_history'] })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })

  return {
    incomeHistory,
    getIncomeForMonth,
    saveMonthlyIncome: saveMonthlyIncomeMutation.mutateAsync,
    isSavingIncome: saveMonthlyIncomeMutation.isPending,
  }
}

