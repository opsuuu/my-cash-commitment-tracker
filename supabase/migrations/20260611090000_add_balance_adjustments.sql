-- ============================================================
-- Balance Adjustments（手動調整帳戶餘額的歷史記錄）
-- ============================================================
CREATE TABLE balance_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  previous_balance numeric NOT NULL,
  new_balance numeric NOT NULL,
  reason text NOT NULL,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE balance_adjustments IS '手動調整帳戶餘額的記錄；收入/支出造成的餘額變動不在此表';
COMMENT ON COLUMN balance_adjustments.previous_balance IS '調整前餘額';
COMMENT ON COLUMN balance_adjustments.new_balance IS '調整後餘額';
COMMENT ON COLUMN balance_adjustments.reason IS '調整原因（必填），例如：對帳差額、漏記支出';

ALTER TABLE balance_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own balance adjustments" ON balance_adjustments
  FOR ALL USING (auth.uid() = user_id);
