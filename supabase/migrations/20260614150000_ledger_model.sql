-- ============================================================
-- Ledger Model：帳戶餘額改為「由交易推導」而非「被快取的欄位」
-- ------------------------------------------------------------
-- 原本 accounts.balance 每筆交易都要去改（Current Balance Model），任何漏寫/
-- 失敗就漂移。改為：accounts.initial_balance 為起點，當前餘額由 SUM(交易) 即時
-- 推導（view account_balances）。真相只有不可變的交易紀錄，餘額由建構保證正確。
--
-- 收入/支出/退款 = 單表 insert，不需餘額 RPC；調整餘額 = 新增一筆 adjustment。
--
-- 注意：CLI 未 link，此檔僅供版本記錄；需手動在 Supabase Dashboard SQL Editor 執行。
-- ============================================================

-- 1. 新增起始餘額欄位
ALTER TABLE accounts ADD COLUMN initial_balance numeric NOT NULL DEFAULT 0;

-- 2. Backfill：保留現有顯示餘額（不重置）
--    derived = initial + Σincome − Σexpense + Σadj_delta，令 derived = 現有 balance 反解：
--    initial = balance + Σexpense − Σadj_delta − Σincome
UPDATE accounts a SET initial_balance = a.balance
  + COALESCE((SELECT SUM(amount) FROM expenses WHERE account_id = a.id), 0)
  - COALESCE(
      (SELECT SUM(new_balance - previous_balance) FROM balance_adjustments WHERE account_id = a.id),
      0
    )
  - COALESCE((SELECT SUM(amount) FROM incomes WHERE account_id = a.id), 0);

-- 3. 移除被快取的 balance 欄位（先移除，view 才能安全用 a.*）
ALTER TABLE accounts DROP COLUMN balance;

-- 4. 推導餘額 view（security_invoker 讓底層表的 RLS 生效，使用者只看得到自己的帳戶）
CREATE VIEW account_balances WITH (security_invoker = true) AS
SELECT
  a.*,
  a.initial_balance
  + COALESCE((SELECT SUM(amount) FROM incomes WHERE account_id = a.id), 0)
  - COALESCE((SELECT SUM(amount) FROM expenses WHERE account_id = a.id), 0)
  + COALESCE(
      (SELECT SUM(new_balance - previous_balance) FROM balance_adjustments WHERE account_id = a.id),
      0
    ) AS current_balance
FROM accounts a;
