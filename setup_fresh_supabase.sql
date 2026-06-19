-- =============================================
-- Duitr - Fresh Supabase Setup Script
-- Run this in: Supabase Dashboard > SQL Editor
-- =============================================

-- Step 1: Create wallets table
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  balance DECIMAL NOT NULL DEFAULT 0,
  type TEXT NOT NULL,
  color TEXT NOT NULL
);

-- Step 2: Create categories table (integer PK)
CREATE TABLE IF NOT EXISTS public.categories (
  category_id SERIAL PRIMARY KEY,
  category_key TEXT UNIQUE NOT NULL,
  en_name TEXT NOT NULL,
  id_name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income', 'system')),
  icon TEXT DEFAULT NULL,
  color TEXT DEFAULT '#6B7280',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Insert default expense categories
INSERT INTO public.categories (category_key, en_name, id_name, type, icon, color) VALUES
('expense_groceries', 'Groceries', 'Kebutuhan Rumah', 'expense', 'ShoppingCart', '#10B981'),
('expense_food', 'Dining', 'Makan di Luar', 'expense', 'UtensilsCrossed', '#F59E0B'),
('expense_transportation', 'Transportation', 'Transportasi', 'expense', 'Car', '#3B82F6'),
('expense_subscription', 'Subscription', 'Berlangganan', 'expense', 'CreditCard', '#8B5CF6'),
('expense_housing', 'Housing', 'Perumahan', 'expense', 'Home', '#6366F1'),
('expense_entertainment', 'Entertainment', 'Hiburan', 'expense', 'Gamepad2', '#EC4899'),
('expense_shopping', 'Shopping', 'Belanja', 'expense', 'ShoppingBag', '#F97316'),
('expense_health', 'Health', 'Kesehatan', 'expense', 'Heart', '#EF4444'),
('expense_education', 'Education', 'Pendidikan', 'expense', 'GraduationCap', '#14B8A6'),
('expense_travel', 'Travel', 'Perjalanan', 'expense', 'Plane', '#06B6D4'),
('expense_personal', 'Personal Care', 'Personal Care', 'expense', 'User', '#D946EF'),
('expense_other', 'Other', 'Lainnya', 'expense', 'MoreHorizontal', '#6B7280')
ON CONFLICT (category_key) DO NOTHING;

-- Step 4: Insert default income categories
INSERT INTO public.categories (category_key, en_name, id_name, type, icon, color) VALUES
('income_salary', 'Salary', 'Gaji', 'income', 'Briefcase', '#10B981'),
('income_business', 'Business', 'Bisnis', 'income', 'Building2', '#3B82F6'),
('income_investment', 'Investment', 'Investasi', 'income', 'TrendingUp', '#8B5CF6'),
('income_gift', 'Gift', 'Hadiah', 'income', 'Gift', '#F59E0B'),
('income_other', 'Other', 'Lainnya', 'income', 'MoreHorizontal', '#6B7280')
ON CONFLICT (category_key) DO NOTHING;

-- Step 5: Insert system category for transfers
INSERT INTO public.categories (category_key, en_name, id_name, type, icon, color) VALUES
('system_transfer', 'Transfer', 'Transfer', 'system', 'ArrowLeftRight', '#6B7280')
ON CONFLICT (category_key) DO NOTHING;

-- Step 6: Set sequence for user categories to start at 1000
SELECT setval('categories_category_id_seq', 1000, false);

-- Step 7: Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL NOT NULL,
  category_id INTEGER REFERENCES public.categories(category_id),
  description TEXT,
  date TEXT NOT NULL,
  type TEXT NOT NULL,
  wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE NOT NULL
);

-- Step 8: Create budgets table
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id INTEGER REFERENCES public.categories(category_id),
  amount DECIMAL NOT NULL,
  spent DECIMAL NOT NULL DEFAULT 0,
  period TEXT NOT NULL
);

-- =============================================
-- Step 9: Enable Row Level Security
-- =============================================
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- =============================================
-- Step 10: RLS Policies - Wallets
-- =============================================
CREATE POLICY "Users can view their own wallets" ON public.wallets
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own wallets" ON public.wallets
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own wallets" ON public.wallets
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own wallets" ON public.wallets
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- Step 11: RLS Policies - Transactions
-- =============================================
CREATE POLICY "Users can view their own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own transactions" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own transactions" ON public.transactions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own transactions" ON public.transactions
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- Step 12: RLS Policies - Budgets
-- =============================================
CREATE POLICY "Users can view their own budgets" ON public.budgets
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own budgets" ON public.budgets
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own budgets" ON public.budgets
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own budgets" ON public.budgets
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- Step 13: RLS Policies - Categories
-- =============================================
CREATE POLICY "Users can read accessible categories" ON public.categories
  FOR SELECT USING (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "Users can create own categories" ON public.categories
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own categories" ON public.categories
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own categories" ON public.categories
  FOR DELETE USING (user_id = auth.uid());

-- =============================================
-- Step 14: Create indexes for performance
-- =============================================
CREATE INDEX IF NOT EXISTS wallets_user_id_idx ON public.wallets (user_id);
CREATE INDEX IF NOT EXISTS transactions_user_id_idx ON public.transactions (user_id);
CREATE INDEX IF NOT EXISTS transactions_wallet_id_idx ON public.transactions (wallet_id);
CREATE INDEX IF NOT EXISTS budgets_user_id_idx ON public.budgets (user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories (user_id);
CREATE INDEX IF NOT EXISTS idx_categories_type_user ON public.categories (type, user_id);

-- =============================================
-- Step 15: Trigger functions for default categories
-- =============================================
CREATE OR REPLACE FUNCTION set_default_category_for_transaction()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.category_id IS NULL THEN
    IF NEW.type = 'expense' THEN
      NEW.category_id := (SELECT category_id FROM categories WHERE category_key = 'expense_other');
    ELSIF NEW.type = 'income' THEN
      NEW.category_id := (SELECT category_id FROM categories WHERE category_key = 'income_other');
    ELSIF NEW.type = 'transfer' THEN
      NEW.category_id := (SELECT category_id FROM categories WHERE category_key = 'system_transfer');
    ELSE
      NEW.category_id := (SELECT category_id FROM categories WHERE category_key = 'expense_other');
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_default_category_for_budget()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.category_id IS NULL THEN
    NEW.category_id := (SELECT category_id FROM categories WHERE category_key = 'expense_other');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS set_default_category_trigger ON transactions;
CREATE TRIGGER set_default_category_trigger
BEFORE INSERT OR UPDATE ON transactions
FOR EACH ROW EXECUTE FUNCTION set_default_category_for_transaction();

DROP TRIGGER IF EXISTS set_default_category_trigger_budget ON budgets;
CREATE TRIGGER set_default_category_trigger_budget
BEFORE INSERT OR UPDATE ON budgets
FOR EACH ROW EXECUTE FUNCTION set_default_category_for_budget();

-- =============================================
-- Step 16: Validation
-- =============================================
DO $$
DECLARE
  cat_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO cat_count FROM categories;
  RAISE NOTICE '✅ Setup complete! % categories created.', cat_count;
  RAISE NOTICE '✅ Tables: wallets, transactions, budgets, categories';
  RAISE NOTICE '✅ RLS policies enabled on all tables';
  RAISE NOTICE '✅ Indexes created for performance';
END $$;
