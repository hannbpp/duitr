-- ============================================================================
-- Add Missing Columns
-- Date: 2026-06-19
-- Purpose: Add columns referenced in app code but absent from DB schema
-- ============================================================================

-- transactions: destination_wallet_id (for transfer transactions)
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS destination_wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS fee NUMERIC(20,2) DEFAULT 0;

-- wallets: icon (Lucide icon name)
ALTER TABLE public.wallets
  ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'wallet';

-- pinjaman_items: description and lender_name
ALTER TABLE public.pinjaman_items
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS lender_name TEXT;

-- Indexes for new FK column
CREATE INDEX IF NOT EXISTS idx_transactions_destination_wallet
  ON public.transactions(destination_wallet_id)
  WHERE destination_wallet_id IS NOT NULL;
