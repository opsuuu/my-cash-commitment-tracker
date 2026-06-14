# 設計決策文件

> 本文件記錄所有已確認的產品設計決策，作為開發依據。

---

## 一、承諾支出「標記已扣款」流程

### 確認決策

| 項目               | 決策                                         |
| ------------------ | -------------------------------------------- |
| 扣款帳戶           | **強制選擇**（必填）                         |
| 實際金額           | **可編輯**，預設帶入預估值，UI 即時顯示差額  |
| 承諾記錄           | **保留不刪除**，轉換關聯（可對帳、分析誤差） |
| Partial Settlement | **MVP 不做**，`source_id` 欄位預留           |

### 轉換流程

```
Step 1: 使用者點「已扣款」
Step 2: Modal 彈出
  - 必填：扣款帳戶（下拉選單）
  - 必填：實際扣款金額（預設帶入預估值）
  - 選填：備註
  - UI 顯示：預估金額 vs 實際金額 差額
Step 3: 系統處理
  1. 建立 Expense（source_type: "commitment", source_id: commitment.id）
  2. 更新 Account balance（-= actual_amount）
  3. 更新 Commitment status → "charged"，linked_expense_id = expense.id
```

### 新增欄位

```sql
-- commitments
linked_expense_id  uuid  nullable  -- 轉換後關聯的 expense

-- expenses
source_type  text  nullable  -- 'manual' | 'commitment'
source_id    uuid  nullable  -- commitment.id
```

---

## 二、取消承諾支出

### 確認決策

| 項目     | 決策                                                        |
| -------- | ----------------------------------------------------------- |
| 確認步驟 | **必須 confirm dialog**                                     |
| 影響顯示 | Dialog 顯示「取消後 +金額 回到可用資金」                    |
| 取消理由 | **MVP 不做**，Phase 2 加入（已退款 / 改單 / 不買了 / 其他） |
| 系統行為 | status → "cancelled"，從承諾支出總額移除                    |

---

## 三、預算池（Budget Pool）

### 兩種類型

```typescript
type BudgetPoolType = 'spending' | 'saving'
```

#### Spending Pool（支出型）

- 每月重置
- 有月度上限（`monthly_budget`）
- 剩餘公式：`remaining = monthly_budget - spent - ALL active commitments`
- Commitments **建立當下立即鎖住**，不等到預計扣款日

#### Saving Pool（儲蓄目標型）

- 累積增加
- 有目標金額（`target_amount`）
- 進度公式：`progress = current_amount / target_amount`
- 原 `saving_goals` 表**合併進此類型**，不另立表
- **承諾可綁儲蓄池**：承諾支出可歸屬儲蓄池（代表「為此目標花費」，例：iPhone 基金）。
  進度公式維持 `current_amount / target_amount` **不變**；另以「儲蓄池健康度」視圖呈現
  缺口 `已存 − 已承諾`（例：已存 15,000・已承諾 40,000・缺口 −25,000），把「還沒存夠
  就提前承諾購買」的衝動情境攤出來。此為 DESIGN 四「Pool Health」概念延伸到一般儲蓄池，
  與 Phase 8 Dashboard 一起實作（見 DEVELOPMENT_PLAN backlog）。

### 三層模型

```
Income
  ↓
Monthly Allocation（每月分配記錄）
  ↓
Budget Pools（概念容器）
  ↓
Expenses + Commitments（實際消耗）
```

### 月度分配建議來源（MVP）

1. 複製上個月比例（優先）
2. 無上月記錄 → 使用者手動設定第一次

AI 智慧建議：**Phase 2** 才做（財務系統不適合 MVP 引入 AI）

### 月底 Rollover 規則

```typescript
type RolloverMode = 'reset' | 'rollover' | 'auto_sweep'
```

- `reset`：未用完歸零
- `rollover`：滾入下個月同一個 pool
- `auto_sweep`：轉入指定 Saving Pool
- **Sweep 只能流向 Saving Pool，不能迴流自身**
- Per-pool 設定，非全域

### saving_goals 合併

原規格的 `saving_goals` 表**刪除**，功能由 Saving Pool 承擔：

```sql
budget_pools
  target_amount  numeric  nullable  -- saving only
  current_amount numeric  nullable  -- saving only
  target_date    date     nullable  -- saving only
```

---

## 四、緊急備用金

### 資金模式（Hybrid）

```typescript
type PoolMode = 'virtual' | 'account-backed'
```

- `account-backed`：綁定特定帳戶，用帳戶餘額計算
- `virtual`：不綁帳戶，用 `current_amount` 手動記錄
- Saving Pool 可選性設定 `linked_account_id`

### 雙視角顯示

**Global Risk（全局風險，保守版）**

```
緊急備用金可用額 = 帳戶餘額 - ALL active commitments
```

用途：判斷「是否會爆」

**Pool Health（池健康度）**

```
緊急備用金池可用 = emergency_balance - pool-related commitments only
```

用途：判斷「這個池夠不夠」

UI 同時顯示兩個視角，讓使用者同時看到財務現實與預算心理舒適感。

---

## 五、承諾支出計時規則

| 規則       | 決策                                              |
| ---------- | ------------------------------------------------- |
| 承諾建立時 | **立即鎖住預算**（不等預計扣款日）                |
| 預計扣款日 | **只做提醒用途**，不影響金額計算                  |
| 影響範圍   | Available Cash + Spending Pool remaining 同時扣減 |

設計原因：避免使用者看到「未來才扣」就誤以為現在還有錢可花。

### 分期承諾計時規則

| 規則                    | 決策                                                              |
| ----------------------- | ----------------------------------------------------------------- |
| 建立分期承諾時          | 系統自動產生所有 N 筆 commitment_schedules，status 全部為 pending |
| Available Cash 計算     | **扣除全部 pending schedules**（保守原則，全額視為已承諾）        |
| Spending Pool remaining | 只扣除**當月**對應 pool 的 pending schedules                      |
| 每期 due_date 預設      | 建立時預設為 start_month 開始的每個月 1 號                        |

**核心財務公式（含分期）：**

```
available_cash =
  帳戶餘額總和
  - SUM(one_time commitments WHERE status = 'pending')
  - SUM(commitment_schedules WHERE status = 'pending')

spending_pool_remaining =
  monthly_budget - spent
  - SUM(one_time pending commitments 屬於此 pool)
  - SUM(pending schedules 屬於此 pool AND due_date 在當月)
```

**信用卡使用率（credit_card 帳戶）：**

```
已使用額度 = -balance（balance 為負數代表欠款，例如 -20,000 → 已使用 20,000）
使用率 = 已使用額度 / credit_limit
剩餘額度 = credit_limit + balance
```

> 範例：額度 150,000、未繳 20,000 → 使用率 = 20,000 / 150,000 ≈ 13%

---

## 六、幣別

### MVP

- **單一幣別 TWD**
- 所有計算不做匯率轉換
- `currency` 欄位預設 `'TWD'`

### Schema 預留（MVP 不啟用）

```sql
-- accounts
currency  text  default 'TWD'

-- expenses, commitments
currency           text     default 'TWD'
original_currency  text     nullable  -- e.g. 'JPY', 'USD'
original_amount    numeric  nullable
fx_rate            numeric  nullable
```

### V2 多幣別原則

- UI 永遠顯示一種 base currency（TWD）
- 其他幣別只做「來源紀錄」
- 不做即時匯率串接（MVP 不需要）

---

## 七、完整資料庫 Schema（最終版）

```sql
-- 帳戶
accounts (
  id uuid primary key,
  user_id uuid,
  name text,
  type text,                    -- 'cash' | 'bank' | 'credit_card' | 'investment'
  balance numeric,              -- credit_card 用負數代表欠款（e.g. -3200 = 欠 3,200）
  credit_limit numeric,         -- credit_card only，nullable，用於計算使用率
  currency text default 'TWD',
  is_active boolean default true,
  created_at timestamptz
)

-- 預算池（含原 saving_goals）
budget_pools (
  id uuid primary key,
  user_id uuid,
  name text,
  type text,                    -- 'spending' | 'saving'
  monthly_budget numeric,       -- spending only
  target_amount numeric,        -- saving only
  current_amount numeric,       -- saving only
  target_date date,             -- saving only, nullable
  rollover_mode text,           -- 'reset' | 'rollover' | 'auto_sweep'
  sweep_to_pool_id uuid,        -- auto_sweep 指向哪個 saving pool, nullable
  linked_account_id uuid,       -- saving only, optional（account-backed 模式）
  pool_mode text,               -- 'virtual' | 'account-backed'
  created_at timestamptz
)

-- 月度分配
monthly_allocations (
  id uuid primary key,
  user_id uuid,
  pool_id uuid,
  month text,                   -- 'YYYY-MM'
  allocated_amount numeric,
  created_at timestamptz
)

-- 收入
incomes (
  id uuid primary key,
  user_id uuid,
  account_id uuid,
  amount numeric,
  currency text default 'TWD',
  category text,                -- 'salary' | 'bonus' | 'freelance' | 'dividend' | 'interest' | 'refund' | 'other'
  date date,
  note text,
  related_commitment_id uuid,   -- nullable，退款時對應哪筆承諾支出
  created_at timestamptz
)

-- 支出
expenses (
  id uuid primary key,
  user_id uuid,
  account_id uuid,
  budget_pool_id uuid NOT NULL, -- 必填，每筆支出必須歸屬 pool
  amount numeric,
  currency text default 'TWD',
  original_currency text,       -- nullable, 多幣別預留
  original_amount numeric,      -- nullable
  fx_rate numeric,              -- nullable
  category text,
  date date,
  note text,
  source_type text,             -- 'manual' | 'commitment', nullable
  source_id uuid,               -- commitment.id 或 commitment_schedule.id, nullable
  created_at timestamptz
)

-- 承諾支出
commitments (
  id uuid primary key,
  user_id uuid,
  budget_pool_id uuid NOT NULL, -- 必填，每筆承諾必須歸屬 pool
  title text,
  type text default 'one_time', -- 'one_time' | 'installment'
  amount numeric,               -- one_time: 全額；installment: 總金額
  installment_count int,        -- installment only
  installment_amount numeric,   -- installment only（每期金額）
  start_month text,             -- installment only，'YYYY-MM'
  currency text default 'TWD',
  original_currency text,       -- nullable
  original_amount numeric,      -- nullable
  fx_rate numeric,              -- nullable
  order_date date,
  expected_charge_date date,    -- one_time only, nullable（只做提醒，不影響計算）
  status text,                  -- one_time: 'pending'|'charged'|'cancelled'
                                -- installment: 'pending'|'active'|'completed'|'cancelled'
  priority text default 'medium', -- 'high' | 'medium' | 'low'，用於風險分析
  note text,
  linked_expense_id uuid,       -- one_time only，charged 後關聯；installment 永遠為 null
  created_at timestamptz
)

-- 分期承諾期程（installment only）
commitment_schedules (
  id uuid primary key,
  commitment_id uuid,           -- 對應 commitments.id
  due_date date,                -- 預計扣款日（建立時預設為該月 1 號，可修改為具體日期）
  amount numeric,               -- 該期金額
  status text default 'pending', -- 'pending' | 'charged' | 'cancelled'
  linked_expense_id uuid,       -- nullable，charged 後關聯
  created_at timestamptz
)
```

---

## 八、Dashboard 財務風險系統

### 風險等級算法（MVP）

**前置定義：**

```
available_cash    = 帳戶餘額總和 - 所有 pending commitments
commitment_ratio  = 總承諾支出 ÷ 帳戶餘額總和
monthly_income    = 近三個月平均月收入（無資料時退化為 0）
```

**判斷規則：**

| 等級      | 條件                                                                                                                         |
| --------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 🟢 安全   | `available_cash > 0` 且 `commitment_ratio < 30%`                                                                             |
| 🟡 注意   | `available_cash > 0` 且 `commitment_ratio 30–60%`<br>或 `available_cash < 0` 且 `abs(available_cash) < monthly_income × 10%` |
| 🔴 高風險 | `available_cash ≤ 0` 且 `abs(available_cash) ≥ monthly_income × 10%`<br>或 `commitment_ratio > 60%`                          |

**風險原因文字（強制顯示）：**

風險等級卡片必須同時顯示原因，不能只顯示等級標籤：

```
🔴 高風險
原因：
- 承諾支出佔資產 72%
- 可支配資金為 -8,200
```

### Dashboard 壓力來源區塊

**顯示規則：**

- 取前 3 筆金額最大的 pending commitments（`ORDER BY amount DESC`）
- 計算前 3 筆佔總承諾支出的百分比
- 其餘筆數顯示為摘要行

**UI 結構：**

```
主要壓力來源（佔總承諾 68%）

1. 鬼滅模型         4,200
2. 日本代購商品     3,800
3. Amazon 訂閱      1,500

   其餘 12 筆       4,000

查看全部 →
```

### Phase 2 風險功能（MVP 不做）

| 功能         | 說明                                     |
| ------------ | ---------------------------------------- |
| 短期承諾壓力 | 30 天內預計扣款總額                      |
| 中期承諾壓力 | 90 天內預計扣款總額                      |
| 扣款時間權重 | 相同金額但近期扣款的承諾給予更高風險分數 |
| 資金缺口預測 | 未來 30 / 90 / 180 天的現金流預測        |

---

## 九、MVP 不做 / Phase 2 功能清單

| 功能                           | 狀態                   |
| ------------------------------ | ---------------------- |
| Partial Settlement（部分扣款） | Phase 2                |
| 取消承諾理由分類               | Phase 2                |
| AI 智慧預算建議                | Phase 2                |
| 多幣別 FX 轉換                 | Phase 2                |
| 月底自動 Sweep 結算            | Phase 2（UI 先做手動） |
| 扣款時間權重風險               | Phase 2                |
| 30 / 90 / 180 天資金缺口預測   | Phase 2                |

---

## 十、UI 視覺風格指南

### 設計趨勢方向

參考來源：

- [Web Design Trends 2026 – Muzli](https://medium.com/muzli-design-inspiration/web-design-trends-2026-bfd9edf03d80)
- [Graphic Design Trends 2026 – Kittl](https://www.kittl.com/blogs/graphic-design-trends-2026/)

### 核心視覺語言

| 風格                          | 說明                         | 實作方向                                                                    |
| ----------------------------- | ---------------------------- | --------------------------------------------------------------------------- |
| **Glassmorphism（玻璃擬態）** | 半透明卡片、毛玻璃背景       | Tailwind `backdrop-blur`、`bg-white/10`、`border border-white/20`           |
| **大圓角**                    | 柔順弧線，避免生硬直角       | Tailwind `rounded-2xl`、`rounded-3xl`，shadcn/ui 元件統一調大 border-radius |
| **柔和未來感**                | 金屬質感 + 自然色調融合      | 色票以霧面紫、灰藍、珍珠白為主，點綴金屬光澤 accent                         |
| **動態漸層**                  | 背景、卡片使用流動漸層       | CSS `@keyframes` + Tailwind `bg-gradient-to-*`，SVGator 用於 loading 動畫   |
| **Tranquil Tech**             | 科技感但不冰冷，融入自然柔和 | 避免純黑背景，改用深藍灰（`#0f1729`、`#1a2540`）搭配霧感白                  |

### 色系規範

#### 基礎色票（Foundation Palette）

5 色為整個 UI 的基礎語言，覆蓋背景、文字、互動元素。漸層色只用於特殊標題、強調區塊、卡片點綴。

| 名稱              | HEX       | 用途                                        |
| ----------------- | --------- | ------------------------------------------- |
| **Floral White**  | `#F7F4EA` | 主背景、頁面底色、輸入框背景                |
| **Lavender**      | `#DED9E2` | 次要背景、卡片底色、分隔線、disabled 狀態   |
| **Periwinkle**    | `#C0B9DD` | 標籤（tag）、badge、border、圖表輔助色      |
| **Wisteria Blue** | `#80A1D4` | 主要互動色（按鈕、連結、icon、focus ring）  |
| **Pearl Aqua**    | `#75C9C8` | 次要 accent、Saving Pool、正向數值、success |

```
文字色（淺色底上）
  Primary:   #2a2d3e   深藍灰（主要文字）
  Secondary: #6b7280   中灰（輔助說明）
  Muted:     #9ca3af   淡灰（placeholder、disabled）

語義色（狀態）
  Safe：     #75C9C8（Pearl Aqua）/ rgba(117,201,200,0.15) 背景
  Warning：  #f59e0b / rgba(245,158,11,0.12) 背景
  Danger：   #ef4444 / rgba(239,68,68,0.12) 背景

玻璃擬態卡片
  Card BG:   rgba(255,255,255,0.55)  半透明白
  Backdrop:  blur(12px)
  Border:    rgba(192,185,221,0.4)   Periwinkle 透明邊框
```

#### 漸層色票（Fancy Gradients）

10 組漸層依 UI 用途分配：

| #   | 起始色    | 結束色    | 視覺感受      | 建議用途                          |
| --- | --------- | --------- | ------------- | --------------------------------- |
| 1   | `#A9F1DF` | `#FFBBBB` | 薄荷 → 玫瑰粉 | Dashboard Hero 背景漸層、歡迎卡片 |
| 2   | `#D8B5FF` | `#1EAE98` | 薰衣草 → 青綠 | Saving Pool 進度條、存款目標卡片  |
| 3   | `#BFF098` | `#6FD6FF` | 嫩綠 → 天藍   | 🟢 安全狀態 risk 卡片漸層         |
| 4   | `#C6EA8D` | `#FE90AF` | 黃綠 → 粉紅   | 支出分析圓餅圖 accent             |
| 5   | `#F1EAB9` | `#FF8C8C` | 奶油 → 珊瑚   | 🟡 注意狀態 risk 卡片漸層         |
| 6   | `#EA8D8D` | `#A890FE` | 玫瑰 → 紫羅蘭 | Commitment 類型標籤、承諾支出卡   |
| 7   | `#00B7FF` | `#FFFFC7` | 亮藍 → 淡黃   | 月收入趨勢折線、收入相關圖表      |
| 8   | `#FCA5F1` | `#B5FFFF` | 粉紫 → 薄荷藍 | Budget Pool Spending 卡片         |
| 9   | `#D74177` | `#FFE98A` | 深玫紅 → 金黃 | 🔴 高風險狀態 risk 卡片漸層       |
| 10  | `#38ADAE` | `#CD295A` | 青藍 → 深玫瑰 | 緊急備用金分析卡片、警示 banner   |

#### 漸層用法規範

```css
/* 用於卡片 border 光暈（玻璃擬態搭配） */
border: 1px solid transparent;
background-clip: padding-box;

/* 用於進度條 */
background: linear-gradient(90deg, #bff098, #6fd6ff);

/* 用於文字（特殊標題） */
background: linear-gradient(135deg, #d8b5ff, #1eae98);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
```

#### 漸層使用規則

> 漸層**只用於**：特殊標題文字、強調卡片、hero 區塊、進度條。一般卡片、文字、按鈕使用基礎色票。

| 場景                          | 漸層組合                 | 說明                                  |
| ----------------------------- | ------------------------ | ------------------------------------- |
| Dashboard Hero 區塊           | `#A9F1DF → #FFBBBB`      | 薄荷玫瑰，頁面最頂端的視覺焦點        |
| 🟢 安全 — risk 卡片 border    | `#BFF098 → #6FD6FF`      | 嫩綠天藍，卡片左側 4px border 或 glow |
| 🟡 注意 — risk 卡片 border    | `#F1EAB9 → #FF8C8C`      | 奶油珊瑚                              |
| 🔴 高風險 — risk 卡片 border  | `#D74177 → #FFE98A`      | 深玫紅金黃                            |
| Saving Pool 進度條            | `#D8B5FF → #1EAE98`      | 薰衣草青綠，代表「成長中」            |
| 緊急備用金卡片                | `#38ADAE → #CD295A`      | 青藍深玫瑰，代表「嚴肅的安全感」      |
| 特殊標題文字（gradient text） | 任選 2–10 組             | `-webkit-background-clip: text`       |
| 支出圓餅圖各分類              | 第 4、6、7、8 組各取一端 | 圖表色避免使用完整漸層，取單色即可    |

### 數值顯示規則

| 情境                       | 樣式                                     |
| -------------------------- | ---------------------------------------- |
| 正值 / 安全數字            | 預設文字色（`#f0f4ff`）                  |
| 負值（available_cash < 0） | **紅色加粗**（`text-red-400 font-bold`） |
| 高風險數字                 | 紅色 + 輕微背景色（`bg-red-500/10`）     |
| 大額金額                   | 金屬金色（`#d4af7a`），搭配較大字級      |

### 動態與互動

- **Hover 狀態**：卡片輕微上浮（`hover:-translate-y-1 transition`）
- **Loading**：骨架屏（skeleton）而非 spinner，保持版型穩定
- **數字變動**：金額更新時加入淡入動畫（避免突然跳字）
- **3D / AR**：Phase 2 考慮，MVP 僅做平面動態漸層

### MVP 實作優先順序

1. 玻璃擬態卡片 + 大圓角（所有卡片統一）
2. 深色底色系 + 色彩語義（紅/黃/綠）
3. 負值標紅規則（全系統一致）
4. 動態漸層背景（Dashboard 頁）
5. Hover 微動畫（卡片、按鈕）

---

## 十一、分期承諾設計決策

### 類型

```typescript
type CommitmentType = 'one_time' | 'installment'
```

### 建立分期承諾時的系統行為

1. 建立 `commitments` 記錄（type: "installment", status: "pending"）
2. 自動產生 N 筆 `commitment_schedules`（每月 1 筆，due_date 預設為該月 1 號）
3. 所有 schedules 立即影響 available_cash（保守原則）

### 狀態機制

**commitments（installment）：**

```
pending → active（第一筆 schedule charged）
active → completed（所有 schedules charged）
pending/active → cancelled（取消整個分期，所有未 charged schedules 一併 cancelled）
```

**commitment_schedules：**

```
pending → charged（標記該期已扣款，建立對應 Expense）
pending → cancelled（取消該期或整個分期）
```

### UI 顯示

- 列表頁預設顯示：「iPhone 17 — 剩餘 28 / 36 期」
- 展開後顯示每期 due_date 與狀態
- Dashboard 壓力來源：顯示 commitment 總額，不展開每期

### MVP 不做

- 提前清償
- 利率 / 本金利息拆分
- 不固定金額的分期
- 信用卡帳單週期

### linked_expense_id 語義說明

| 欄位                                     | 適用類型         | 說明                                    |
| ---------------------------------------- | ---------------- | --------------------------------------- |
| `commitments.linked_expense_id`          | one_time only    | charged 後關聯；installment 永遠為 null |
| `commitment_schedules.linked_expense_id` | installment only | 每期 charged 後各自關聯                 |

---

## 十二、核心設計原則

1. **承諾支出 = 尚未結算的支出**，不是未來支出
2. **錢一旦承諾就立即鎖住**，不等實際扣款
3. **保留所有原始記錄**，只做狀態轉換，不刪除
4. **財務數字永遠保守**，寧可低估可用資金
5. **雙視角並存**，同時提供財務現實與心理舒適感
6. **不只顯示結果，也顯示原因**，讓使用者知道如何改善
7. **負債不是異常**，承諾支出是預設狀態的一部分，系統設計不假設使用者沒有承諾
