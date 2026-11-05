-- ========================================================
-- Schema SQL Setup Script for Smart Asset Hospital App
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)
-- Project: https://xmzonnmpzmaykvypqmhz.supabase.co
-- ========================================================

-- 1. Departments Table
CREATE TABLE IF NOT EXISTS public.departments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Asset Categories Table
CREATE TABLE IF NOT EXISTS public.asset_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  default_useful_life INT DEFAULT 5,
  salvage_value_percent NUMERIC DEFAULT 10,
  prefix TEXT DEFAULT 'AST',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL,
  department_id TEXT,
  position TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Assets Table
CREATE TABLE IF NOT EXISTS public.assets (
  id TEXT PRIMARY KEY,
  asset_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category_id TEXT,
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  received_date DATE,
  inspection_date DATE,
  purchase_price NUMERIC DEFAULT 0,
  salvage_value NUMERIC DEFAULT 1,
  useful_life INT DEFAULT 5,
  po_number TEXT,
  inspection_no TEXT,
  budget_source TEXT DEFAULT 'งบแผ่นดิน',
  acquisition_method TEXT DEFAULT 'จัดซื้อปกติ',
  location TEXT,
  department_id TEXT,
  responsible_person TEXT,
  vendor_name TEXT,
  vendor_phone TEXT,
  warranty_expiry_date DATE,
  status TEXT DEFAULT 'พร้อมใช้งาน',
  specifications TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Inventory Items Table
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id TEXT PRIMARY KEY,
  item_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category_id TEXT,
  stock_qty INT DEFAULT 0,
  min_qty INT DEFAULT 5,
  unit TEXT DEFAULT 'ชิ้น',
  unit_price NUMERIC DEFAULT 0,
  location TEXT,
  last_received_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Inventory Transactions Table
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL,
  transaction_type TEXT NOT NULL,
  quantity INT NOT NULL,
  remaining_qty INT NOT NULL,
  user_id TEXT,
  department_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Borrow Requests Table
CREATE TABLE IF NOT EXISTS public.borrow_requests (
  id TEXT PRIMARY KEY,
  request_no TEXT NOT NULL UNIQUE,
  borrower_id TEXT NOT NULL,
  department_id TEXT,
  asset_ids JSONB DEFAULT '[]'::jsonb,
  borrow_date DATE,
  expected_return_date DATE,
  return_date DATE,
  status TEXT DEFAULT 'รอตรวจสอบ',
  purpose TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Repair Requests Table
CREATE TABLE IF NOT EXISTS public.repair_requests (
  id TEXT PRIMARY KEY,
  repair_no TEXT NOT NULL UNIQUE,
  asset_id TEXT NOT NULL,
  reporter_id TEXT NOT NULL,
  department_id TEXT,
  issue_description TEXT NOT NULL,
  urgency TEXT DEFAULT 'ปกติ',
  repair_method TEXT,
  labor_cost NUMERIC DEFAULT 0,
  parts_cost NUMERIC DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  spare_parts JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'รอรับเรื่อง',
  technician_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Budget Plans Table
CREATE TABLE IF NOT EXISTS public.budget_plans (
  id TEXT PRIMARY KEY,
  fiscal_year INT DEFAULT 2568,
  item_name TEXT NOT NULL,
  category_id TEXT,
  quantity INT DEFAULT 1,
  unit_price NUMERIC DEFAULT 0,
  total_budget NUMERIC DEFAULT 0,
  budget_source TEXT DEFAULT 'งบแผ่นดิน',
  department_id TEXT,
  urgency_level TEXT DEFAULT 'ปกติ',
  justification TEXT,
  status TEXT DEFAULT 'ร่างแผนงาน',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. System Settings Table
CREATE TABLE IF NOT EXISTS public.system_settings (
  id INT PRIMARY KEY DEFAULT 1,
  organization_name TEXT DEFAULT 'โรงพยาบาลสังขละบุรี',
  logo_url TEXT,
  emblem_url TEXT,
  fiscal_year INT DEFAULT 2568,
  line_oa_enabled BOOLEAN DEFAULT TRUE,
  line_oa_basic_id TEXT DEFAULT '@sangkhla_repair_bot',
  line_oa_channel_access_token TEXT,
  line_oa_channel_secret TEXT,
  line_oa_webhook_url TEXT,
  line_notify_token TEXT,
  depreciation_method TEXT DEFAULT 'straight_line',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  user_name TEXT,
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  record_id TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS & Allow Anonymous Read/Write Access for Applet
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.borrow_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repair_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Departments Policies
DROP POLICY IF EXISTS "Allow anon select departments" ON public.departments;
DROP POLICY IF EXISTS "Allow anon insert/update departments" ON public.departments;
CREATE POLICY "Allow anon select departments" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Allow anon insert/update departments" ON public.departments FOR ALL USING (true);

-- 2. Asset Categories Policies
DROP POLICY IF EXISTS "Allow anon select asset_categories" ON public.asset_categories;
DROP POLICY IF EXISTS "Allow anon insert/update asset_categories" ON public.asset_categories;
CREATE POLICY "Allow anon select asset_categories" ON public.asset_categories FOR SELECT USING (true);
CREATE POLICY "Allow anon insert/update asset_categories" ON public.asset_categories FOR ALL USING (true);

-- 3. Users Policies
DROP POLICY IF EXISTS "Allow anon select users" ON public.users;
DROP POLICY IF EXISTS "Allow anon insert/update users" ON public.users;
CREATE POLICY "Allow anon select users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow anon insert/update users" ON public.users FOR ALL USING (true);

-- 4. Assets Policies
DROP POLICY IF EXISTS "Allow anon select assets" ON public.assets;
DROP POLICY IF EXISTS "Allow anon insert/update assets" ON public.assets;
CREATE POLICY "Allow anon select assets" ON public.assets FOR SELECT USING (true);
CREATE POLICY "Allow anon insert/update assets" ON public.assets FOR ALL USING (true);

-- 5. Inventory Items Policies
DROP POLICY IF EXISTS "Allow anon select inventory_items" ON public.inventory_items;
DROP POLICY IF EXISTS "Allow anon insert/update inventory_items" ON public.inventory_items;
CREATE POLICY "Allow anon select inventory_items" ON public.inventory_items FOR SELECT USING (true);
CREATE POLICY "Allow anon insert/update inventory_items" ON public.inventory_items FOR ALL USING (true);

-- 6. Inventory Transactions Policies
DROP POLICY IF EXISTS "Allow anon select inventory_transactions" ON public.inventory_transactions;
DROP POLICY IF EXISTS "Allow anon insert/update inventory_transactions" ON public.inventory_transactions;
CREATE POLICY "Allow anon select inventory_transactions" ON public.inventory_transactions FOR SELECT USING (true);
CREATE POLICY "Allow anon insert/update inventory_transactions" ON public.inventory_transactions FOR ALL USING (true);

-- 7. Borrow Requests Policies
DROP POLICY IF EXISTS "Allow anon select borrow_requests" ON public.borrow_requests;
DROP POLICY IF EXISTS "Allow anon insert/update borrow_requests" ON public.borrow_requests;
CREATE POLICY "Allow anon select borrow_requests" ON public.borrow_requests FOR SELECT USING (true);
CREATE POLICY "Allow anon insert/update borrow_requests" ON public.borrow_requests FOR ALL USING (true);

-- 8. Repair Requests Policies
DROP POLICY IF EXISTS "Allow anon select repair_requests" ON public.repair_requests;
DROP POLICY IF EXISTS "Allow anon insert/update repair_requests" ON public.repair_requests;
CREATE POLICY "Allow anon select repair_requests" ON public.repair_requests FOR SELECT USING (true);
CREATE POLICY "Allow anon insert/update repair_requests" ON public.repair_requests FOR ALL USING (true);

-- 9. Budget Plans Policies
DROP POLICY IF EXISTS "Allow anon select budget_plans" ON public.budget_plans;
DROP POLICY IF EXISTS "Allow anon insert/update budget_plans" ON public.budget_plans;
CREATE POLICY "Allow anon select budget_plans" ON public.budget_plans FOR SELECT USING (true);
CREATE POLICY "Allow anon insert/update budget_plans" ON public.budget_plans FOR ALL USING (true);

-- 10. System Settings Policies
DROP POLICY IF EXISTS "Allow anon select system_settings" ON public.system_settings;
DROP POLICY IF EXISTS "Allow anon insert/update system_settings" ON public.system_settings;
CREATE POLICY "Allow anon select system_settings" ON public.system_settings FOR SELECT USING (true);
CREATE POLICY "Allow anon insert/update system_settings" ON public.system_settings FOR ALL USING (true);

-- 11. Audit Logs Policies
DROP POLICY IF EXISTS "Allow anon select audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Allow anon insert/update audit_logs" ON public.audit_logs;
CREATE POLICY "Allow anon select audit_logs" ON public.audit_logs FOR SELECT USING (true);
CREATE POLICY "Allow anon insert/update audit_logs" ON public.audit_logs FOR ALL USING (true);

-- ========================================================
-- 12. Optional LINE OA Broadcast Function via pg_net
-- (Allows sending LINE messages directly from GitHub Pages via Supabase Cloud Server)
-- ========================================================
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.send_line_broadcast(token text, messages jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_id bigint;
BEGIN
  SELECT net.http_post(
    url := 'https://api.line.me/v2/bot/message/broadcast',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || token
    ),
    body := jsonb_build_object('messages', messages)
  ) INTO request_id;

  RETURN jsonb_build_object('success', true, 'request_id', request_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.send_line_broadcast(text, jsonb) TO anon, authenticated, service_role;
