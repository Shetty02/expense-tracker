export type CategoryType = 'needs' | 'wants' | 'savings';

export interface Profile {
  id: string;
  monthly_income: number | null;
  budget_split_needs: number;
  budget_split_wants: number;
  budget_split_savings: number;
  currency: '₹' | '$' | '£' | '€';
  tracks_investments: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  type: CategoryType;
  created_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  description: string | null;
  expense_date: string;
  created_at: string;
  billing_cycle?: 'one_time' | 'monthly' | 'annual';
  category?: Category; // Joined category details
}

export type CurrencySymbol = '₹' | '$' | '£' | '€';
