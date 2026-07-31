import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Expense } from '@/types'
import { startOfMonth, endOfMonth, format } from 'date-fns'

export function useExpenses(selectedMonth: Date, categoryId?: string) {
  const supabase = createClient()
  const queryClient = useQueryClient()

  const startDate = format(startOfMonth(selectedMonth), 'yyyy-MM-dd')
  const endDate = format(endOfMonth(selectedMonth), 'yyyy-MM-dd')

  const expensesQuery = useQuery({
    queryKey: ['expenses', startDate, endDate, categoryId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      let query = supabase
        .from('expenses')
        .select('*, category:categories(*)')
        .eq('user_id', user.id)
        .gte('expense_date', startDate)
        .lte('expense_date', endDate)
        .order('expense_date', { ascending: false })
        .order('created_at', { ascending: false })

      if (categoryId && categoryId !== 'all') {
        query = query.eq('category_id', categoryId)
      }

      const { data, error } = await query

      if (error) throw error
      return data as Expense[]
    },
  })

  const createExpenseMutation = useMutation({
    mutationFn: async (expense: Omit<Expense, 'id' | 'user_id' | 'created_at'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('expenses')
        .insert({
          ...expense,
          user_id: user.id,
        })
        .select('*, category:categories(*)')
        .single()

      if (error) throw error
      return data as Expense
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['expenses-history'] })
    },
  })

  const updateExpenseMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Omit<Expense, 'id' | 'user_id' | 'created_at'>>) => {
      const { data, error } = await supabase
        .from('expenses')
        .update(updates)
        .eq('id', id)
        .select('*, category:categories(*)')
        .single()

      if (error) throw error
      return data as Expense
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['expenses-history'] })
    },
  })

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)

      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['expenses-history'] })
    },
  })

  return {
    expenses: expensesQuery.data || [],
    isLoading: expensesQuery.isLoading,
    error: expensesQuery.error,
    createExpense: createExpenseMutation.mutateAsync,
    isCreating: createExpenseMutation.isPending,
    updateExpense: updateExpenseMutation.mutateAsync,
    isUpdating: updateExpenseMutation.isPending,
    deleteExpense: deleteExpenseMutation.mutateAsync,
    isDeleting: deleteExpenseMutation.isPending,
  }
}

export function useExpensesHistory(monthsLimit: number = 6, endDate: Date = new Date()) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['expenses-history', monthsLimit, endDate.toISOString().slice(0, 7)],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      // First day of the month 'monthsLimit - 1' months ago relative to endDate
      const startOfHistory = startOfMonth(new Date(endDate.getFullYear(), endDate.getMonth() - monthsLimit + 1, 1))
      const startDate = format(startOfHistory, 'yyyy-MM-dd')
      const formattedEndDate = format(new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0), 'yyyy-MM-dd')

      const { data, error } = await supabase
        .from('expenses')
        .select('*, category:categories(*)')
        .eq('user_id', user.id)
        .gte('expense_date', startDate)
        .lte('expense_date', formattedEndDate)
        .order('expense_date', { ascending: true })

      if (error) throw error
      return data as Expense[]
    },
  })
}
