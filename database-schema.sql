-- Complete Database Schema for Bhavishya Road Carriers Transport Management System
-- Run this in your Supabase SQL Editor

-- 1. Companies table
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Profiles table (linked to auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Company memberships (max 4 users per company)
CREATE TABLE company_memberships (
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('owner','member')) DEFAULT 'member',
  PRIMARY KEY (company_id, user_id)
);

-- 4. Document counters for auto-incrementing numbers
CREATE TABLE doc_counters (
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('loading_slip','memo','bill')),
  next_number BIGINT NOT NULL DEFAULT 1,
  PRIMARY KEY (company_id, kind)
);

-- 5. Parties (customers)
CREATE TABLE parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (company_id, name)
);

-- 6. Suppliers (truck owners/transporters)
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (company_id, name)
);

-- 7. Vehicles
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  reg_no TEXT NOT NULL,
  type TEXT CHECK (type IN ('own','market')) DEFAULT 'market',
  model TEXT,
  fuel_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (company_id, reg_no)
);

-- 8. Loading Slips
CREATE TABLE loading_slips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  number BIGINT NOT NULL,
  date DATE NOT NULL DEFAULT now(),
  party_id UUID REFERENCES parties(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  origin TEXT,
  destination TEXT,
  rto_amount NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (company_id, number)
);

-- 9. Memos (to suppliers)
CREATE TABLE memos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  number BIGINT NOT NULL,
  date DATE NOT NULL DEFAULT now(),
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  freight NUMERIC(12,2) NOT NULL DEFAULT 0,
  detention NUMERIC(12,2) NOT NULL DEFAULT 0,
  extra_weight_charge NUMERIC(12,2) NOT NULL DEFAULT 0,
  commission_pct NUMERIC(5,2) DEFAULT 0,
  status TEXT CHECK (status IN ('pending','paid')) DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (company_id, number)
);

-- 10. Bills (to parties)
CREATE TABLE bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  number BIGINT NOT NULL,
  date DATE NOT NULL DEFAULT now(),
  party_id UUID REFERENCES parties(id) ON DELETE SET NULL,
  freight NUMERIC(12,2) NOT NULL DEFAULT 0,
  detention NUMERIC(12,2) NOT NULL DEFAULT 0,
  extra_charges NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT CHECK (status IN ('pending','received')) DEFAULT 'pending',
  received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (company_id, number)
);

-- 11. General Ledger Entries
CREATE TABLE ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT now(),
  account_type TEXT NOT NULL CHECK (account_type IN ('party','supplier','vehicle','expense','bank','cash')),
  account_id UUID,
  account_name TEXT NOT NULL,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('debit','credit')),
  amount NUMERIC(12,2) NOT NULL,
  narration TEXT,
  link_type TEXT CHECK (link_type IN ('bill','memo','bank_txn','cash_txn','fuel','pod')),
  link_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. Bank Days (day-wise statement)
CREATE TABLE bank_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  opening_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  closing_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  UNIQUE (company_id, date)
);

-- 13. Bank Transactions
CREATE TABLE bank_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  day_id UUID REFERENCES bank_days(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL DEFAULT now(),
  type TEXT CHECK (type IN ('credit','debit')) NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  mode TEXT,
  party_or_supplier TEXT,
  link_kind TEXT CHECK (link_kind IN ('bill','memo','advance','expense')),
  link_id UUID,
  narration TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 14. Cash Transactions
CREATE TABLE cash_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  day_id UUID REFERENCES bank_days(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL DEFAULT now(),
  type TEXT CHECK (type IN ('credit','debit')) NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  mode TEXT,
  party_or_supplier TEXT,
  link_kind TEXT CHECK (link_kind IN ('bill','memo','advance','expense')),
  link_id UUID,
  narration TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 15. POD Files
CREATE TABLE pod_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  link_type TEXT CHECK (link_type IN ('bill','memo','loading_slip')) NOT NULL,
  link_id UUID NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_parties_company_id ON parties(company_id);
CREATE INDEX idx_suppliers_company_id ON suppliers(company_id);
CREATE INDEX idx_vehicles_company_id ON vehicles(company_id);
CREATE INDEX idx_loading_slips_company_id ON loading_slips(company_id);
CREATE INDEX idx_loading_slips_date ON loading_slips(company_id, date);
CREATE INDEX idx_memos_company_id ON memos(company_id);
CREATE INDEX idx_memos_status ON memos(company_id, status);
CREATE INDEX idx_memos_date ON memos(company_id, date);
CREATE INDEX idx_bills_company_id ON bills(company_id);
CREATE INDEX idx_bills_status ON bills(company_id, status);
CREATE INDEX idx_bills_date ON bills(company_id, date);
CREATE INDEX idx_ledger_entries_company_id ON ledger_entries(company_id);
CREATE INDEX idx_ledger_entries_date ON ledger_entries(company_id, date);
CREATE INDEX idx_bank_transactions_company_id ON bank_transactions(company_id);
CREATE INDEX idx_cash_transactions_company_id ON cash_transactions(company_id);
CREATE INDEX idx_pod_files_company_id ON pod_files(company_id);

-- Enable Row Level Security on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE doc_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE loading_slips ENABLE ROW LEVEL SECURITY;
ALTER TABLE memos ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pod_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies for company members
CREATE POLICY "Company members can read/write companies" ON companies
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM company_memberships m 
    WHERE m.company_id = companies.id AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Users can read/write their own profile" ON profiles
FOR ALL USING (id = auth.uid());

CREATE POLICY "Company members can read/write memberships" ON company_memberships
FOR ALL USING (
  company_id IN (
    SELECT company_id FROM company_memberships 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Company members can read/write doc_counters" ON doc_counters
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM company_memberships m 
    WHERE m.company_id = doc_counters.company_id AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Company members can read/write parties" ON parties
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM company_memberships m 
    WHERE m.company_id = parties.company_id AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Company members can read/write suppliers" ON suppliers
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM company_memberships m 
    WHERE m.company_id = suppliers.company_id AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Company members can read/write vehicles" ON vehicles
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM company_memberships m 
    WHERE m.company_id = vehicles.company_id AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Company members can read/write loading_slips" ON loading_slips
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM company_memberships m 
    WHERE m.company_id = loading_slips.company_id AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Company members can read/write memos" ON memos
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM company_memberships m 
    WHERE m.company_id = memos.company_id AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Company members can read/write bills" ON bills
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM company_memberships m 
    WHERE m.company_id = bills.company_id AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Company members can read/write ledger_entries" ON ledger_entries
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM company_memberships m 
    WHERE m.company_id = ledger_entries.company_id AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Company members can read/write bank_days" ON bank_days
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM company_memberships m 
    WHERE m.company_id = bank_days.company_id AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Company members can read/write bank_transactions" ON bank_transactions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM company_memberships m 
    WHERE m.company_id = bank_transactions.company_id AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Company members can read/write cash_transactions" ON cash_transactions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM company_memberships m 
    WHERE m.company_id = cash_transactions.company_id AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Company members can read/write pod_files" ON pod_files
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM company_memberships m 
    WHERE m.company_id = pod_files.company_id AND m.user_id = auth.uid()
  )
);

-- Function to create company and add user as owner on first login
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to initialize document counters for new company
CREATE OR REPLACE FUNCTION init_doc_counters(company_uuid UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO doc_counters (company_id, kind, next_number) VALUES
  (company_uuid, 'loading_slip', 1),
  (company_uuid, 'memo', 1),
  (company_uuid, 'bill', 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
