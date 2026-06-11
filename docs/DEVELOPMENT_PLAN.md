# 開發計劃表

> 依據 `docs/DESIGN.md` 設計決策制定。開發順序以依賴關係為優先考量。

---

## 套件版本鎖定

> 版本查詢日期：2026-06-09。開始開發前請再次確認是否有安全性更新。

### 執行環境需求

| 項目    | 版本需求                                |
| ------- | --------------------------------------- |
| Node.js | **20.19+** 或 **22.12+**（Vite 8 要求） |
| npm     | 10+                                     |

### 生產依賴

```json
{
  "react": "^19.2.7",
  "react-dom": "^19.2.7",
  "react-router-dom": "^7.17.0",
  "@tanstack/react-query": "^5.101.0",
  "react-hook-form": "^7.78.0",
  "zod": "^4.4.3",
  "chart.js": "^4.5.1",
  "react-chartjs-2": "^5.3.1",
  "@supabase/supabase-js": "^2.108.0",
  "@supabase/ssr": "^0.12.0",
  "lucide-react": "latest"
}
```

### 開發依賴

```json
{
  "typescript": "^6.0.3",
  "vite": "^8.0.16",
  "@vitejs/plugin-react": "^6.0.2",
  "tailwindcss": "^4.3.0",
  "@tailwindcss/vite": "^4.3.0",
  "@tanstack/react-query-devtools": "^5.101.0",
  "eslint": "^10.4.1",
  "typescript-eslint": "^8.61.0",
  "eslint-plugin-react": "^7.37.5",
  "eslint-plugin-react-hooks": "^7.1.1",
  "eslint-config-prettier": "^10.1.8",
  "prettier": "^3.8.3",
  "husky": "^9.1.7",
  "lint-staged": "^17.0.7"
}
```

### 相容性注意事項

| 套件                     | 重要提醒                                                                                                        |
| ------------------------ | --------------------------------------------------------------------------------------------------------------- |
| **Tailwind v4**          | 不再有 `tailwind.config.js`，改為 CSS-first 設定（`@theme` in CSS）；用 `@tailwindcss/vite` plugin 取代 PostCSS |
| **React Router v7**      | 已與 Remix 合併，SPA 模式使用 `createBrowserRouter` + `RouterProvider`，不再用 `<BrowserRouter>`                |
| **TypeScript 6**         | 更嚴格的預設值，部分舊 tsconfig 選項移除，開發前確認 tsconfig 相容性                                            |
| **Zod v4**               | 從 v3 升級有 breaking changes，錯誤格式與部分 API 有異動                                                        |
| **React 19**             | `forwardRef` 不再需要（ref 現在是普通 prop）；`use(Context)` 取代 `useContext`                                  |
| **Chart.js v4**          | 需手動 `Chart.register(...)` 註冊用到的元件                                                                     |
| **shadcn/ui**            | 透過 CLI 新增元件，不是 npm 套件；支援 Tailwind v4                                                              |
| **ESLint v10**           | 完全移除 `.eslintrc` 支援，只能用 flat config（`eslint.config.js`）                                             |
| **typescript-eslint v8** | 使用統一套件 `typescript-eslint`，提供 `config()` helper 搭配 flat config                                       |
| **Husky v9**             | `prepare` script 改為 `"husky"`；移除 `husky add` 指令，改為手動建立 hook 檔案                                  |

---

## 整體架構

```
Phase 0  專案初始化 + 基礎建設
Phase 1  Authentication
Phase 2  帳戶管理
Phase 3  預算池管理
Phase 4  承諾支出管理（核心）
Phase 5  收入管理
Phase 6  支出管理
Phase 7  Monthly Allocation 系統
Phase 8  Dashboard
Phase 9  緊急備用金分析
Phase 10 財務分析圖表
```

---

## Phase 0：專案初始化 + 基礎建設

### 目標

建立可運行的開發環境與資料庫結構。

### 任務

#### 0-1 前端專案初始化

- [ ] Vite + React + TypeScript 建立專案
- [ ] TailwindCSS v4 安裝與設定（`@tailwindcss/vite` plugin，CSS-first 設定）
- [ ] shadcn/ui 安裝與設定
- [ ] React Router v7 安裝（SPA library 模式）
- [ ] TanStack Query v5 安裝與設定（含 devtools）
- [ ] React Hook Form + Zod v4 安裝
- [ ] Chart.js + react-chartjs-2 安裝

#### 0-2 程式碼品質工具設定

##### ESLint

- [ ] 安裝 `eslint`、`typescript-eslint`、`eslint-plugin-react`、`eslint-plugin-react-hooks`、`eslint-config-prettier`
- [ ] 建立 `eslint.config.js`（flat config 格式，ESLint v10 不再支援 `.eslintrc`）
- [ ] 設定規則：TypeScript 推薦規則 + React Hooks 規則 + Prettier 相容

```js
// eslint.config.js 大致結構
import tseslint from 'typescript-eslint'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import prettierConfig from 'eslint-config-prettier'

export default tseslint.config(
  ...tseslint.configs.recommended,
  reactPlugin.configs.flat.recommended,
  reactHooksPlugin.configs['recommended-latest'],
  prettierConfig
)
```

##### Prettier

- [ ] 安裝 `prettier`
- [ ] 建立 `.prettierrc`：

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

- [ ] 建立 `.prettierignore`（排除 `dist/`、`node_modules/`）

##### Husky + lint-staged

- [ ] 安裝 `husky` 與 `lint-staged`
- [ ] `package.json` 加入 prepare script：`"prepare": "husky"`
- [ ] 執行 `npx husky init` 建立 `.husky/` 目錄
- [ ] 建立 `.husky/pre-commit` hook（手動建立檔案，Husky v9 移除 `husky add` 指令）：

```sh
npx lint-staged
```

- [ ] `package.json` 加入 lint-staged 設定：

```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,css,md}": ["prettier --write"]
  }
}
```

#### 0-3 Supabase 設定

- [ ] 建立 Supabase 專案
- [ ] 設定環境變數（`.env.local`）

#### 0-3 資料庫 Schema 建立

依序執行以下 Table 建立：

```sql
-- profiles
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users,
  email text,
  display_name text,
  created_at timestamptz DEFAULT now()
);

-- accounts
CREATE TABLE accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  name text NOT NULL,
  type text NOT NULL,  -- 'cash' | 'bank' | 'credit_card' | 'investment'
  balance numeric NOT NULL DEFAULT 0,  -- credit_card 用負數代表欠款
  credit_limit numeric,  -- credit_card only, nullable
  currency text NOT NULL DEFAULT 'TWD',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- budget_pools
CREATE TABLE budget_pools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  name text NOT NULL,
  type text NOT NULL,           -- 'spending' | 'saving'
  monthly_budget numeric,       -- spending only
  target_amount numeric,        -- saving only
  current_amount numeric DEFAULT 0, -- saving only
  target_date date,             -- saving only
  rollover_mode text NOT NULL DEFAULT 'reset', -- 'reset' | 'rollover' | 'auto_sweep'
  sweep_to_pool_id uuid REFERENCES budget_pools(id), -- auto_sweep only
  linked_account_id uuid REFERENCES accounts(id),    -- saving, account-backed only
  pool_mode text NOT NULL DEFAULT 'virtual', -- 'virtual' | 'account-backed'
  created_at timestamptz DEFAULT now()
);

-- monthly_allocations
CREATE TABLE monthly_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  pool_id uuid REFERENCES budget_pools(id),
  month text NOT NULL,  -- 'YYYY-MM'
  allocated_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(pool_id, month)
);

-- incomes
CREATE TABLE incomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  account_id uuid REFERENCES accounts(id),
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'TWD',
  category text NOT NULL,  -- 'salary' | 'bonus' | 'freelance' | 'dividend' | 'interest' | 'refund' | 'other'
  date date NOT NULL,
  note text,
  related_commitment_id uuid REFERENCES commitments(id),  -- 退款時對應哪筆承諾支出, nullable
  created_at timestamptz DEFAULT now()
);

-- expenses
CREATE TABLE expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  account_id uuid REFERENCES accounts(id),
  budget_pool_id uuid NOT NULL REFERENCES budget_pools(id),  -- 必填
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'TWD',
  original_currency text,   -- 多幣別預留，MVP 不啟用
  original_amount numeric,  -- 多幣別預留，MVP 不啟用
  fx_rate numeric,          -- 多幣別預留，MVP 不啟用
  category text NOT NULL,
  date date NOT NULL,
  note text,
  source_type text,  -- 'manual' | 'commitment'
  source_id uuid,    -- one_time: commitment.id；installment: commitment_schedule.id
  created_at timestamptz DEFAULT now()
);

-- commitments
CREATE TABLE commitments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  budget_pool_id uuid NOT NULL REFERENCES budget_pools(id),  -- 必填
  title text NOT NULL,
  type text NOT NULL DEFAULT 'one_time',  -- 'one_time' | 'installment'
  amount numeric NOT NULL,               -- one_time: 全額；installment: 總金額
  installment_count int,                 -- installment only
  installment_amount numeric,            -- installment only（每期金額）
  start_month text,                      -- installment only，'YYYY-MM'
  currency text NOT NULL DEFAULT 'TWD',
  original_currency text,   -- 多幣別預留，MVP 不啟用
  original_amount numeric,  -- 多幣別預留，MVP 不啟用
  fx_rate numeric,          -- 多幣別預留，MVP 不啟用
  order_date date NOT NULL,
  expected_charge_date date,  -- one_time only, nullable，只做提醒用途
  status text NOT NULL DEFAULT 'pending',
    -- one_time:    'pending' | 'charged' | 'cancelled'
    -- installment: 'pending' | 'active'  | 'completed' | 'cancelled'
  priority text NOT NULL DEFAULT 'medium',  -- 'high' | 'medium' | 'low'
  note text,
  linked_expense_id uuid REFERENCES expenses(id),  -- one_time only，installment 永遠為 null
  created_at timestamptz DEFAULT now()
);

-- 分期承諾期程（installment only）
CREATE TABLE commitment_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commitment_id uuid NOT NULL REFERENCES commitments(id),
  due_date date NOT NULL,  -- 預計扣款日，預設為該月 1 號，可修改為具體日期
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',  -- 'pending' | 'charged' | 'cancelled'
  linked_expense_id uuid REFERENCES expenses(id),  -- charged 後關聯
  created_at timestamptz DEFAULT now()
);
```

#### 0-4 RLS 設定

- [ ] 為所有 Table 啟用 RLS
- [ ] 設定每個 Table 的 policy（user 只能讀寫自己的資料）

#### 0-5 TypeScript 型別

- [ ] 安裝 Supabase CLI
- [ ] 產生 TypeScript 型別（`supabase gen types typescript`）
- [ ] 建立 `src/types/` 目錄放置型別定義

#### 0-6 專案結構建立

```
src/
├── components/     # 共用元件
│   └── ui/         # shadcn/ui 元件
├── pages/          # 頁面元件
├── hooks/          # 自訂 hooks（TanStack Query）
├── lib/            # 工具函式、supabase client
├── types/          # TypeScript 型別
└── constants/      # 常數（類別清單等）
```

---

## Phase 1：Authentication

**依賴：** Phase 0

### 目標

實作完整的登入、登出、註冊流程。

### 任務

#### 1-1 Supabase Auth 設定

- [ ] 啟用 Email/Password 登入
- [ ] 設定 Google OAuth Provider

#### 1-2 Auth Context

- [ ] 建立 `AuthProvider`（管理 session 狀態）
- [ ] 建立 `useAuth` hook

#### 1-3 頁面

- [ ] 登入頁（Email + Google 登入）
- [ ] 註冊頁
- [ ] 忘記密碼頁

#### 1-4 路由保護

- [ ] 建立 `ProtectedRoute` 元件
- [ ] 未登入自動導向登入頁
- [ ] 登入後導向 Dashboard

#### 1-5 Profiles 自動建立

- [ ] 設定 Supabase trigger：新用戶註冊時自動建立 `profiles` 記錄

---

## Phase 2：帳戶管理

**依賴：** Phase 1

### 目標

管理實際持有資金的帳戶，這是所有財務計算的基礎資產層。

### 任務

#### 2-1 帳戶列表頁

- [ ] 顯示所有帳戶（名稱、類型、餘額）
- [ ] 顯示帳戶總餘額加總

#### 2-2 新增帳戶

- [ ] 表單：名稱、類型（Cash / Bank / Credit Card / Investment）、初始餘額
- [ ] 表單驗證（Zod）

#### 2-3 修改帳戶

- [ ] 修改名稱、類型
- [ ] 調整餘額功能（記錄調整原因）

#### 2-4 停用帳戶

- [ ] 軟刪除（`is_active = false`）
- [ ] 停用帳戶不出現在一般選單

#### 2-5 TanStack Query Hooks

- [ ] `useAccounts()`
- [ ] `useCreateAccount()`
- [ ] `useUpdateAccount()`
- [ ] `useDeactivateAccount()`

---

## Phase 3：預算池管理

**依賴：** Phase 2（saving pool 可選綁定帳戶）

### 目標

建立資金用途分類系統，支援 spending / saving 兩種類型。

### 任務

#### 3-1 預算池列表頁

- [ ] 分區顯示 Spending Pools 與 Saving Pools
- [ ] Spending Pool 顯示：月預算、已支出、承諾支出、剩餘可用
- [ ] Saving Pool 顯示：目標金額、目前金額、進度條、達成率

#### 3-2 新增 Spending Pool

- [ ] 表單：名稱、月預算上限、Rollover 模式
- [ ] Rollover 模式為 `auto_sweep` 時，需選擇目標 Saving Pool

#### 3-3 新增 Saving Pool

- [ ] 表單：名稱、目標金額、目標日期（選填）、Pool 模式
- [ ] Pool 模式為 `account-backed` 時，需選擇綁定帳戶

#### 3-4 修改 / 刪除預算池

- [ ] 刪除前確認（有關聯交易時警告）

#### 3-5 TanStack Query Hooks

- [ ] `useBudgetPools()`
- [ ] `useSpendingPoolStats(poolId, month)` — 計算剩餘可用
- [ ] `useSavingPoolStats(poolId)` — 計算進度
- [ ] `useCreateBudgetPool()`
- [ ] `useUpdateBudgetPool()`
- [ ] `useDeleteBudgetPool()`

---

## Phase 4：承諾支出管理（核心功能）

**依賴：** Phase 2（帳戶）、Phase 3（預算池）

### 目標

追蹤已承諾但尚未扣款的支出，這是本系統的核心差異化功能。

### 任務

#### 4-1 承諾支出列表頁

- [ ] 顯示所有 pending commitments
- [ ] 可篩選狀態（pending / charged / cancelled）
- [ ] 可搜尋（名稱）
- [ ] 顯示總承諾金額（pending 狀態）

#### 4-2 新增一次性承諾支出

- [ ] 表單：名稱、金額、預算池（必填）、優先級、下單日期、預計扣款日（選填）、備註
- [ ] 建立後立即影響 Available Cash 與對應 Pool 的剩餘可用

#### 4-3 新增分期承諾支出

- [ ] 表單：名稱、總金額、期數、每期金額（自動計算）、預算池（必填）、優先級、開始月份、備註
- [ ] 建立後自動產生 N 筆 commitment_schedules（due_date 預設為各月 1 號）
- [ ] 全部 pending schedules 立即計入 available_cash

#### 4-4 修改承諾支出

- [ ] one_time：僅限 pending 狀態可修改；金額異動時即時更新計算
- [ ] installment：pending/active 狀態可修改名稱、備註、優先級；金額修改只在 pending 狀態允許

#### 4-5 標記已扣款（one_time 核心流程）

- [ ] 彈出 Modal：
  - 必填：扣款帳戶（下拉，顯示帳戶餘額）
  - 必填：實際扣款金額（預設帶入預估值）
  - 即時顯示：差額（實際 - 預估）
  - 選填：備註
- [ ] 系統處理：
  1. 建立 Expense（source_type: "commitment", source_id: commitment.id）
  2. 更新 Account balance（-= actual_amount）
  3. 更新 Commitment status → "charged"，linked_expense_id

#### 4-6 標記期程已扣款（installment 每期流程）

- [ ] 對 commitment_schedules 中的某一期操作
- [ ] 彈出同樣的 Modal（帳戶、實際金額、備註）
- [ ] 系統處理：
  1. 建立 Expense（source_type: "commitment", source_id: schedule.id）
  2. 更新 Account balance（-= actual_amount）
  3. 更新 schedule status → "charged"，linked_expense_id
  4. 若為第一期：commitment status → "active"
  5. 若最後一期：commitment status → "completed"

#### 4-7 取消承諾支出

- [ ] one_time：Confirm Dialog 顯示「取消後 +金額 回到可用資金」
- [ ] installment：Confirm Dialog 顯示「取消後剩餘 N 期（共 X,XXX）回到可用資金」；同時 cancel 所有 pending schedules

#### 4-8 TanStack Query Hooks

- [ ] `useCommitments(filters?)`
- [ ] `useCommitmentStats()` — 總承諾金額（含分期全部 pending schedules）
- [ ] `useCommitmentSchedules(commitmentId)` — 某筆分期的所有期程
- [ ] `useCreateCommitment()` — 含分期自動產生 schedules
- [ ] `useUpdateCommitment()`
- [ ] `useChargeCommitment()` — one_time 標記已扣款
- [ ] `useChargeSchedule()` — installment 每期標記已扣款
- [ ] `useCancelCommitment()`

---

## Phase 5：收入管理

**依賴：** Phase 2（帳戶）

### 目標

記錄收入並更新帳戶餘額。

### 任務

#### 5-1 收入列表頁

- [ ] 依日期排序顯示
- [ ] 可篩選月份、類別
- [ ] 顯示本月收入總計

#### 5-2 新增收入

- [ ] 表單：日期、金額、帳戶、類別、備註
- [ ] 類別：薪資 / 獎金 / 接案 / 股利 / 利息 / **退款** / 其他
- [ ] 退款類別可選填「對應承諾支出」（related_commitment_id）
- [ ] 建立後自動更新 Account balance（+= amount）

#### 5-3 修改 / 刪除收入

- [ ] 修改金額時反向調整帳戶餘額
- [ ] 刪除時反向調整帳戶餘額

#### 5-4 TanStack Query Hooks

- [ ] `useIncomes(filters?)`
- [ ] `useIncomeStats(month)` — 月收入統計
- [ ] `useCreateIncome()`
- [ ] `useUpdateIncome()`
- [ ] `useDeleteIncome()`

---

## Phase 6：支出管理

**依賴：** Phase 2（帳戶）、Phase 3（預算池）

### 目標

記錄實際支出並更新帳戶餘額與預算池消耗。

### 任務

#### 6-1 支出列表頁

- [ ] 依日期排序顯示
- [ ] 可篩選月份、類別、預算池
- [ ] 標示 source_type = "commitment" 的項目（從承諾轉換而來）
- [ ] 顯示本月支出總計

#### 6-2 新增支出

- [ ] 表單：日期、金額、帳戶、預算池、類別、備註
- [ ] 類別：飲食 / 交通 / 娛樂 / 保險 / 電信 / 醫療 / 訂閱服務 / 保健食品 / 美妝用品 / 治裝 / 其他
- [ ] 建立後自動更新 Account balance（-= amount）

#### 6-3 修改 / 刪除支出

- [ ] source_type = "commitment" 的支出不允許直接刪除（需從 Commitment 操作）
- [ ] 修改金額時反向調整帳戶餘額
- [ ] 刪除時反向調整帳戶餘額

#### 6-4 TanStack Query Hooks

- [ ] `useExpenses(filters?)`
- [ ] `useExpenseStats(month)` — 月支出統計
- [ ] `useCreateExpense()`
- [ ] `useUpdateExpense()`
- [ ] `useDeleteExpense()`

---

## Phase 7：Monthly Allocation 系統

**依賴：** Phase 3（預算池）、Phase 5（收入）

### 目標

建立每月資金分配機制，連結收入與預算池。

### 任務

#### 7-1 月度分配頁

- [ ] 顯示當月各 Pool 分配金額
- [ ] 顯示分配總計 vs 本月收入

#### 7-2 建立月度分配

- [ ] 首次使用：手動設定各 Pool 分配金額
- [ ] 之後：提示「複製上個月分配」（一鍵複製）
- [ ] 複製後可手動調整各 Pool 金額

#### 7-3 TanStack Query Hooks

- [ ] `useMonthlyAllocations(month)`
- [ ] `useCopyLastMonthAllocations()` — 複製上月
- [ ] `useUpdateMonthlyAllocation()`

---

## Phase 8：Dashboard

**依賴：** Phase 1–7 全部完成

### 目標

登入後首頁，5 秒內回答五個核心財務問題。

### 任務

#### 8-1 財務總覽卡片

- [ ] 可支配資金（最重要，放最顯眼位置）；**負值標紅**
- [ ] 帳戶總餘額（次要，顯示「其中 X 已承諾」）
- [ ] 承諾支出明細：
  - 一次性承諾總額
  - 分期承諾剩餘總額（future_commitment_amount，所有 pending schedules 加總）
- [ ] 本月收入（排除 refund 類別）
- [ ] 本月支出
- [ ] 本月儲蓄率

#### 8-2 財務風險卡片（核心）

計算邏輯見 `docs/DESIGN.md § 八`

- [ ] 計算 `available_cash`、`commitment_ratio`、`monthly_income`
- [ ] 依規則判斷風險等級（🟢 安全 / 🟡 注意 / 🔴 高風險）
- [ ] **強制顯示風險原因**（不只顯示標籤）：
  - 例：「承諾支出佔資產 72%」
  - 例：「可支配資金為 -8,200」

#### 8-3 主要壓力來源區塊

- [ ] 取金額最大的前 3 筆 pending commitments（`ORDER BY amount DESC`）
- [ ] 計算並顯示前 3 筆佔總承諾支出的百分比
- [ ] 其餘筆數顯示摘要行（「其餘 N 筆 X,XXX」）
- [ ] 「查看全部 →」連結至承諾支出完整列表

#### 8-4 圖表區

- [ ] 收支趨勢折線圖（近 6 個月）
- [ ] 承諾支出趨勢折線圖（近 6 個月）
- [ ] 支出分類圓餅圖（本月）

#### 8-5 預算池快速狀態

- [ ] 各 Spending Pool 剩餘可用（進度條）
- [ ] 各 Saving Pool 達成率（進度條）

#### 8-6 TanStack Query Hooks

- [ ] `useDashboardSummary()` — 帳戶餘額、承諾支出、available_cash
- [ ] `useRiskLevel()` — 風險等級 + 原因文字
- [ ] `useTopCommitments(limit: 3)` — 壓力來源前 N 筆

---

## Phase 9：緊急備用金分析

**依賴：** Phase 2（帳戶）、Phase 3（Saving Pool）、Phase 4（承諾支出）、Phase 5–6（收支歷史）

### 目標

評估財務安全程度。

### 任務

#### 9-1 計算模式選擇

- [ ] 平均支出模式（推薦）：近 6 個月平均支出 × 保留月數
- [ ] 平均收入模式：近 6 個月平均收入 × 保留月數
- [ ] 自訂模式：自訂每月需求金額 × 保留月數

#### 9-2 保留月數選擇

- [ ] 3 / 6 / 12 個月

#### 9-3 雙視角顯示

- [ ] **Global Risk（保守版）**
  - 可用額 = 緊急備用金帳戶餘額 - ALL active commitments
- [ ] **Pool Health（局部健康）**
  - 池可用 = emergency_balance - pool-related commitments only

#### 9-4 顯示資訊

- [ ] 目前緊急備用金
- [ ] 目標金額
- [ ] 達成率
- [ ] 可支撐月數

---

## Phase 10：財務分析圖表

**依賴：** Phase 5–6（收支資料）、Phase 4（承諾支出資料）

### 目標

提供財務洞察分析。

### 任務

#### 10-1 支出分析

- [ ] 圓餅圖：本月支出分類佔比
- [ ] 可切換月份

#### 10-2 月趨勢分析

- [ ] 折線圖：收入 / 支出 / 儲蓄率（近 12 個月）

#### 10-3 承諾支出分析

- [ ] 已知扣款時間：未來各月預計扣款金額（長條圖）
- [ ] 未知扣款時間：待確認承諾總額

---

## 開發順序總覽

```
Phase 0  ─────────────────────────────── 基礎（無依賴）
   │
Phase 1  ─────────────────────────────── Auth
   │
Phase 2  ─────────────────────────────── 帳戶管理
   │         │
Phase 3    Phase 5 ─── Phase 6
   │         │           │
Phase 4 ────┘            │
   │                     │
Phase 7 ─────────────────┘
   │
Phase 8  ─────────────────────────────── Dashboard（整合所有）
   │
Phase 9  ─────────────────────────────── 緊急備用金分析
   │
Phase 10 ─────────────────────────────── 財務分析圖表
```

---

## Phase 2 後可以留下來繼續做的功能

| 功能                   | 說明                                                                                                                                                                                                   |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Partial Settlement     | 承諾支出部分扣款，需要 `commitment_charges` 中間表                                                                                                                                                     |
| 取消承諾理由分類       | 已退款 / 改單 / 不買了 / 其他                                                                                                                                                                          |
| AI 預算分配建議        | 根據歷史支出分析給出建議                                                                                                                                                                               |
| 多幣別支援             | 啟用預留的 `original_currency` / `fx_rate` 欄位                                                                                                                                                        |
| 月底自動 Sweep 結算    | 自動將未用完的 Spending Pool 轉入指定 Saving Pool                                                                                                                                                      |
| 設定頁：設定密碼       | 讓 Google-only 帳號補設密碼（`supabase.auth.updateUser({ password })`），啟用 Email + 密碼登入；目前替代管道是忘記密碼流程                                                                             |
| 登入提示信             | Google-only 帳號被嘗試密碼登入時，寄信告知「你的帳號是用 Google 註冊的」（Edge Function + Admin API）；登入頁維持通用錯誤不洩漏帳號存在性，取代目前的通用文案提示                                      |
| 自訂 SMTP + 信件中文化 | 部署前設定：Resend（或同類服務）驗證自有網域 → Supabase 啟用自訂 SMTP → 套用 `docs/EMAIL_TEMPLATES.md` 的中文模板。Supabase 已將模板編輯鎖在自訂 SMTP 之後；自訂 SMTP 同時解除內建寄信的每小時速率限制 |
