import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Category } from '@/types'

export function useCategories() {
  const supabase = createClient()

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      return data as Category[]
    },
  })

  return {
    categories: categoriesQuery.data || [],
    isLoading: categoriesQuery.isLoading,
    error: categoriesQuery.error,
  }
}
