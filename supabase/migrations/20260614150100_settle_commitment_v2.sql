-- ============================================================
-- settle_commitment v2：配合 Ledger Model，移除「扣帳戶餘額」那一步
-- ------------------------------------------------------------
-- Ledger 下帳戶餘額由 view 從 expenses 推導，函式不再 UPDATE accounts.balance
-- （該欄位已移除）。但本函式仍維持 RPC：insert expense + 更新 commitment/schedule
-- 狀態仍是兩個寫入，需原子（避免「錢花了但承諾還 pending」）。
--
-- 注意：CLI 未 link，此檔僅供版本記錄；需手動在 Supabase Dashboard SQL Editor 執行。
-- ============================================================
CREATE OR REPLACE FUNCTION public.settle_commitment(
  p_commitment_id uuid,
  p_account_id uuid,
  p_actual_amount numeric,
  p_charge_date date,
  p_schedule_id uuid DEFAULT NULL,
  p_note text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_commitment public.commitments%ROWTYPE;
  v_schedule   public.commitment_schedules%ROWTYPE;
  v_expense_id uuid;
  v_source_id  uuid;
  v_pending_left int;
BEGIN
  -- 鎖定承諾列（RLS 確保只看得到自己的）
  SELECT * INTO v_commitment FROM public.commitments
    WHERE id = p_commitment_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION '找不到承諾支出';
  END IF;

  -- 驗證扣款帳戶屬於自己（RLS 確保；找不到代表帳戶錯誤）。Ledger 下不再鎖列扣餘額。
  PERFORM 1 FROM public.accounts WHERE id = p_account_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION '找不到扣款帳戶';
  END IF;

  IF p_schedule_id IS NULL THEN
    -- 一次性承諾
    IF v_commitment.status <> 'pending' THEN
      RAISE EXCEPTION '此承諾支出狀態為 %，無法扣款', v_commitment.status;
    END IF;
    v_source_id := v_commitment.id;
  ELSE
    -- 分期某一期
    SELECT * INTO v_schedule FROM public.commitment_schedules
      WHERE id = p_schedule_id AND commitment_id = p_commitment_id FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION '找不到分期期程';
    END IF;
    IF v_schedule.status <> 'pending' THEN
      RAISE EXCEPTION '此期程狀態為 %，無法扣款', v_schedule.status;
    END IF;
    v_source_id := v_schedule.id;
  END IF;

  -- 1. 建立 Expense（帳戶餘額由 account_balances view 從此推導，不再直接扣 balance）
  INSERT INTO public.expenses (
    user_id, account_id, budget_pool_id, amount, category, date, note, source_type, source_id
  ) VALUES (
    v_commitment.user_id, p_account_id, v_commitment.budget_pool_id, p_actual_amount,
    '承諾扣款', p_charge_date, p_note, 'commitment', v_source_id
  ) RETURNING id INTO v_expense_id;

  -- 2. 更新狀態 + linked_expense_id
  IF p_schedule_id IS NULL THEN
    UPDATE public.commitments
      SET status = 'charged', linked_expense_id = v_expense_id
      WHERE id = v_commitment.id;
  ELSE
    UPDATE public.commitment_schedules
      SET status = 'charged', linked_expense_id = v_expense_id
      WHERE id = v_schedule.id;

    -- 連動 parent：還有 pending 期 → active；全數結清 → completed
    SELECT count(*) INTO v_pending_left FROM public.commitment_schedules
      WHERE commitment_id = p_commitment_id AND status = 'pending';
    UPDATE public.commitments
      SET status = CASE WHEN v_pending_left = 0 THEN 'completed' ELSE 'active' END
      WHERE id = p_commitment_id;
  END IF;

  RETURN v_expense_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.settle_commitment(uuid, uuid, numeric, date, uuid, text) TO authenticated;
