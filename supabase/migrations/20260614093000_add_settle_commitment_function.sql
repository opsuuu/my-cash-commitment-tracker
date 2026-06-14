-- ============================================================
-- settle_commitment：把承諾支出「結算」成實際支出的原子交易
-- ------------------------------------------------------------
-- 一筆扣款跨 3 表：建 expense → 扣 account 餘額 → 更新 commitment/schedule
-- 狀態。前端循序寫入若部分失敗會造成餘額與狀態不一致（財務失真），故收斂
-- 成單一函式確保全有或全無。一次性與分期每期共用此函式。
--
-- 安全性：使用預設 SECURITY INVOKER，RLS 自動限制使用者只能動到自己的列；
-- 仍鎖定 search_path 避免注入，並用 FOR UPDATE 鎖列防止並發重複扣款。
-- 防呆：目標 status 必須為 'pending'，否則直接 raise，擋連點兩次重複建立 expense。
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

  -- 鎖定扣款帳戶（RLS 確保是自己的帳戶；找不到代表帳戶錯誤）
  PERFORM 1 FROM public.accounts WHERE id = p_account_id FOR UPDATE;
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

  -- 1. 建立 Expense（source 指向 commitment 或 schedule）
  INSERT INTO public.expenses (
    user_id, account_id, budget_pool_id, amount, category, date, note, source_type, source_id
  ) VALUES (
    v_commitment.user_id, p_account_id, v_commitment.budget_pool_id, p_actual_amount,
    '承諾扣款', p_charge_date, p_note, 'commitment', v_source_id
  ) RETURNING id INTO v_expense_id;

  -- 2. 扣帳戶餘額（信用卡餘額為負，扣款使其更負＝欠款增加，公式一致）
  UPDATE public.accounts SET balance = balance - p_actual_amount WHERE id = p_account_id;

  -- 3. 更新狀態 + linked_expense_id
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
