-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Create Profiles Table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  monthly_income numeric check (monthly_income >= 0),
  budget_split_needs numeric default 50 check (budget_split_needs >= 0 and budget_split_needs <= 100),
  budget_split_wants numeric default 30 check (budget_split_wants >= 0 and budget_split_wants <= 100),
  budget_split_savings numeric default 20 check (budget_split_savings >= 0 and budget_split_savings <= 100),
  currency text default '₹' check (currency in ('₹', '$', '£', '€')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Constraint to make sure splits sum to 100
  constraint check_splits_sum check (budget_split_needs + budget_split_wants + budget_split_savings = 100)
);

-- Enable RLS on Profiles
alter table public.profiles enable row level security;

-- 2. Create Categories Table (Read-only for users)
create table public.categories (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  icon text not null,
  type text not null check (type in ('needs', 'wants')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on Categories
alter table public.categories enable row level security;

-- 3. Create Expenses Table
create table public.expenses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  category_id uuid references public.categories on delete restrict not null,
  amount numeric not null check (amount > 0),
  description text,
  expense_date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on Expenses
alter table public.expenses enable row level security;

-- 4. Seed Categories
insert into public.categories (name, icon, type) values
  ('Food', 'Utensils', 'wants'),
  ('Groceries', 'ShoppingCart', 'needs'),
  ('Movies & Entertainment', 'Film', 'wants'),
  ('Clothes', 'Shirt', 'wants'),
  ('Travel', 'Train', 'wants'),
  ('Bills & Utilities', 'Receipt', 'needs'),
  ('Health', 'HeartPulse', 'needs'),
  ('Other', 'HelpCircle', 'wants')
on conflict (name) do nothing;

-- 5. RLS Policies

-- Profiles: Users can select and update their own profile
create policy "Users can view own profile" 
  on public.profiles for select 
  using (auth.uid() = id);

create policy "Users can update own profile" 
  on public.profiles for update 
  using (auth.uid() = id);

create policy "Users can insert own profile" 
  on public.profiles for insert 
  with check (auth.uid() = id);

-- Categories: Anyone logged in can read categories
create policy "Authenticated users can read categories" 
  on public.categories for select 
  using (auth.role() = 'authenticated');

-- Expenses: Users can perform CRUD only on their own expenses
create policy "Users can view own expenses" 
  on public.expenses for select 
  using (auth.uid() = user_id);

create policy "Users can insert own expenses" 
  on public.expenses for insert 
  with check (auth.uid() = user_id);

create policy "Users can update own expenses" 
  on public.expenses for update 
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own expenses" 
  on public.expenses for delete 
  using (auth.uid() = user_id);

-- 6. Profile Auto-Creation Trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, monthly_income, budget_split_needs, budget_split_wants, budget_split_savings, currency)
  values (new.id, null, 50, 30, 20, '₹');
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
