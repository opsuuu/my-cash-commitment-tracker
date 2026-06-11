-- ============================================================
-- Profiles
-- ============================================================
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text,
  display_name text,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE profiles IS '使用者基本資料，對應 auth.users，新用戶註冊時自動建立';
COMMENT ON COLUMN profiles.id IS '對應 auth.users.id';
COMMENT ON COLUMN profiles.email IS '使用者電子郵件';
COMMENT ON COLUMN profiles.display_name IS '顯示名稱';

-- Auto-create profile on user signup
-- 注意：此 trigger 由 supabase_auth_admin 觸發，其 search_path 不含 public，
-- 因此必須鎖定 search_path 並使用完整 schema 路徑
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- Accounts
-- ============================================================
CREATE TABLE accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('cash', 'bank', 'credit_card', 'investment')),
  balance numeric NOT NULL DEFAULT 0,
  credit_limit numeric,
  currency text NOT NULL DEFAULT 'TWD',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE accounts IS '使用者持有的資金帳戶，是所有財務計算的基礎資產層';
COMMENT ON COLUMN accounts.type IS '帳戶類型：cash（現金）| bank（銀行）| credit_card（信用卡）| investment（投資）';
COMMENT ON COLUMN accounts.balance IS '目前餘額；credit_card 用負數代表欠款，例如 -3200 代表欠 3,200 元';
COMMENT ON COLUMN accounts.credit_limit IS '信用額度，僅 credit_card 使用，用於計算使用率';
COMMENT ON COLUMN accounts.is_active IS '是否啟用；停用的帳戶不出現在一般選單（軟刪除）';

-- ============================================================
-- Budget Pools
-- ============================================================
CREATE TABLE budget_pools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('spending', 'saving')),
  monthly_budget numeric,
  target_amount numeric,
  current_amount numeric DEFAULT 0,
  target_date date,
  rollover_mode text NOT NULL DEFAULT 'reset' CHECK (rollover_mode IN ('reset', 'rollover', 'auto_sweep')),
  sweep_to_pool_id uuid REFERENCES budget_pools(id),
  linked_account_id uuid REFERENCES accounts(id),
  pool_mode text NOT NULL DEFAULT 'virtual' CHECK (pool_mode IN ('virtual', 'account-backed')),
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE budget_pools IS '預算池，將資金分類管理；分為 spending（每月支出型）與 saving（儲蓄目標型）兩種';
COMMENT ON COLUMN budget_pools.type IS '池類型：spending（每月重置，有月度上限）| saving（累積增加，有目標金額）';
COMMENT ON COLUMN budget_pools.monthly_budget IS '月度預算上限，僅 spending 使用';
COMMENT ON COLUMN budget_pools.target_amount IS '儲蓄目標金額，僅 saving 使用';
COMMENT ON COLUMN budget_pools.current_amount IS '目前累積金額，僅 saving 使用';
COMMENT ON COLUMN budget_pools.target_date IS '目標達成日期，僅 saving 使用，可為空';
COMMENT ON COLUMN budget_pools.rollover_mode IS '月底結算規則：reset（歸零）| rollover（滾入下月）| auto_sweep（轉入指定 saving pool）';
COMMENT ON COLUMN budget_pools.sweep_to_pool_id IS 'rollover_mode 為 auto_sweep 時，指定轉入的 saving pool';
COMMENT ON COLUMN budget_pools.linked_account_id IS 'pool_mode 為 account-backed 時，綁定的帳戶；用帳戶餘額計算池狀態';
COMMENT ON COLUMN budget_pools.pool_mode IS '資金模式：virtual（虛擬，用 current_amount 記錄）| account-backed（綁定帳戶，用帳戶餘額計算）';

-- ============================================================
-- Monthly Allocations
-- ============================================================
CREATE TABLE monthly_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pool_id uuid NOT NULL REFERENCES budget_pools(id) ON DELETE CASCADE,
  month text NOT NULL,
  allocated_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(pool_id, month)
);

COMMENT ON TABLE monthly_allocations IS '每月資金分配記錄，記錄每個 pool 在特定月份分配到多少收入';
COMMENT ON COLUMN monthly_allocations.month IS '分配月份，格式 YYYY-MM，例如 2026-06';
COMMENT ON COLUMN monthly_allocations.allocated_amount IS '該月分配給此 pool 的金額';

-- ============================================================
-- Commitments
-- ============================================================
CREATE TABLE commitments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  budget_pool_id uuid NOT NULL REFERENCES budget_pools(id),
  title text NOT NULL,
  type text NOT NULL DEFAULT 'one_time' CHECK (type IN ('one_time', 'installment')),
  amount numeric NOT NULL,
  installment_count int,
  installment_amount numeric,
  start_month text,
  currency text NOT NULL DEFAULT 'TWD',
  original_currency text,
  original_amount numeric,
  fx_rate numeric,
  order_date date NOT NULL,
  expected_charge_date date,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'charged', 'completed', 'cancelled')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  note text,
  linked_expense_id uuid,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE commitments IS '承諾支出：已承諾但尚未實際扣款的支出。建立當下立即鎖住資金，不等實際扣款日。這是本系統的核心差異化功能';
COMMENT ON COLUMN commitments.budget_pool_id IS '必填，每筆承諾必須歸屬某個 pool，以確保預算管理有效';
COMMENT ON COLUMN commitments.type IS '承諾類型：one_time（一次性）| installment（分期）';
COMMENT ON COLUMN commitments.amount IS 'one_time 為全額；installment 為總金額';
COMMENT ON COLUMN commitments.installment_count IS '分期總期數，僅 installment 使用';
COMMENT ON COLUMN commitments.installment_amount IS '每期金額，僅 installment 使用';
COMMENT ON COLUMN commitments.start_month IS '分期開始月份，格式 YYYY-MM，僅 installment 使用';
COMMENT ON COLUMN commitments.original_currency IS '原始幣別，多幣別預留欄位，MVP 不啟用';
COMMENT ON COLUMN commitments.original_amount IS '原始幣別金額，多幣別預留欄位，MVP 不啟用';
COMMENT ON COLUMN commitments.fx_rate IS '匯率，多幣別預留欄位，MVP 不啟用';
COMMENT ON COLUMN commitments.expected_charge_date IS '預計扣款日，one_time 使用，僅作提醒用途，不影響任何財務計算';
COMMENT ON COLUMN commitments.status IS 'one_time 狀態：pending | charged | cancelled；installment 狀態：pending | active | completed | cancelled';
COMMENT ON COLUMN commitments.priority IS '優先級：high | medium | low，用於風險分析時判斷建議取消哪些承諾';
COMMENT ON COLUMN commitments.linked_expense_id IS 'one_time 標記已扣款後關聯的 expense；installment 永遠為 null（由 commitment_schedules 追蹤）';

-- ============================================================
-- Commitment Schedules (installment only)
-- ============================================================
CREATE TABLE commitment_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commitment_id uuid NOT NULL REFERENCES commitments(id) ON DELETE CASCADE,
  due_date date NOT NULL,
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'charged', 'cancelled')),
  linked_expense_id uuid,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE commitment_schedules IS '分期承諾的每期付款期程。建立分期承諾時自動產生所有期，所有 pending 期程立即計入 available_cash（保守原則）';
COMMENT ON COLUMN commitment_schedules.commitment_id IS '對應的分期承諾';
COMMENT ON COLUMN commitment_schedules.due_date IS '預計扣款日；建立時預設為該月 1 號，可修改為具體日期以支援未來 30/90 天風險計算';
COMMENT ON COLUMN commitment_schedules.amount IS '該期金額';
COMMENT ON COLUMN commitment_schedules.status IS '期程狀態：pending（待扣款）| charged（已扣款）| cancelled（已取消）';
COMMENT ON COLUMN commitment_schedules.linked_expense_id IS '該期標記已扣款後關聯的 expense';

-- ============================================================
-- Incomes
-- ============================================================
CREATE TABLE incomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES accounts(id),
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'TWD',
  category text NOT NULL CHECK (category IN ('salary', 'bonus', 'freelance', 'dividend', 'interest', 'refund', 'other')),
  date date NOT NULL,
  note text,
  related_commitment_id uuid REFERENCES commitments(id),
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE incomes IS '收入記錄；建立後自動更新對應帳戶餘額（+= amount）';
COMMENT ON COLUMN incomes.account_id IS '收入存入的帳戶';
COMMENT ON COLUMN incomes.category IS '收入類別：salary（薪資）| bonus（獎金）| freelance（接案）| dividend（股利）| interest（利息）| refund（退款）| other（其他）';
COMMENT ON COLUMN incomes.related_commitment_id IS '退款類別可選填，對應哪筆承諾支出的退款，方便對帳';

-- ============================================================
-- Expenses
-- ============================================================
CREATE TABLE expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES accounts(id),
  budget_pool_id uuid NOT NULL REFERENCES budget_pools(id),
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'TWD',
  original_currency text,
  original_amount numeric,
  fx_rate numeric,
  category text NOT NULL,
  date date NOT NULL,
  note text,
  source_type text CHECK (source_type IN ('manual', 'commitment')),
  source_id uuid,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE expenses IS '實際支出記錄；建立後自動更新對應帳戶餘額（-= amount）。每筆支出必須歸屬 pool';
COMMENT ON COLUMN expenses.budget_pool_id IS '必填，每筆支出必須歸屬某個 pool，確保預算與報表準確';
COMMENT ON COLUMN expenses.original_currency IS '原始幣別，多幣別預留欄位，MVP 不啟用';
COMMENT ON COLUMN expenses.original_amount IS '原始幣別金額，多幣別預留欄位，MVP 不啟用';
COMMENT ON COLUMN expenses.fx_rate IS '匯率，多幣別預留欄位，MVP 不啟用';
COMMENT ON COLUMN expenses.source_type IS '來源類型：manual（手動建立）| commitment（從承諾支出轉換而來）';
COMMENT ON COLUMN expenses.source_id IS 'source_type 為 commitment 時：one_time 填 commitment.id，installment 填 commitment_schedule.id';

-- Add FK after expenses table exists
ALTER TABLE commitments
  ADD CONSTRAINT commitments_linked_expense_id_fkey
  FOREIGN KEY (linked_expense_id) REFERENCES expenses(id);

ALTER TABLE commitment_schedules
  ADD CONSTRAINT commitment_schedules_linked_expense_id_fkey
  FOREIGN KEY (linked_expense_id) REFERENCES expenses(id);

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE commitment_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- accounts
CREATE POLICY "Users can manage own accounts" ON accounts
  FOR ALL USING (auth.uid() = user_id);

-- budget_pools
CREATE POLICY "Users can manage own budget pools" ON budget_pools
  FOR ALL USING (auth.uid() = user_id);

-- monthly_allocations
CREATE POLICY "Users can manage own allocations" ON monthly_allocations
  FOR ALL USING (auth.uid() = user_id);

-- commitments
CREATE POLICY "Users can manage own commitments" ON commitments
  FOR ALL USING (auth.uid() = user_id);

-- commitment_schedules（透過 commitment 的 user_id 驗證）
CREATE POLICY "Users can manage own commitment schedules" ON commitment_schedules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM commitments
      WHERE commitments.id = commitment_schedules.commitment_id
        AND commitments.user_id = auth.uid()
    )
  );

-- incomes
CREATE POLICY "Users can manage own incomes" ON incomes
  FOR ALL USING (auth.uid() = user_id);

-- expenses
CREATE POLICY "Users can manage own expenses" ON expenses
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- Grants（Supabase 標準基礎權限；實際資料隔離由上方 RLS policy 負責）
-- ============================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
