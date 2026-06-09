# Personal Cash Flow & Commitment Tracker

## 個人現金流與承諾支出管理系統

---

# 一、產品願景（Vision）

協助使用者掌握：

- 真正擁有多少錢
- 已經承諾出去多少錢
- 未來可能面臨多少財務壓力
- 是否有足夠的緊急備用金
- 各類預算是否超支

本產品並非單純記帳工具，而是以「現金流管理」與「承諾支出管理」為核心的個人財務規劃系統。

---

# 二、產品定位

## 市面上的記帳軟體

主要解決：

```
我花了多少錢？
```

---

## 本系統

主要解決：

```
我未來已經答應要花多少錢？
```

例如：

- 預購商品
- 已刷卡未請款
- 團購商品
- 分期付款
- 已下單未出貨商品

避免：

```
帳戶看起來有 50,000

實際已經預定花掉 20,000

卻誤以為自己還有 50,000 可以花
```

---

# 三、核心財務概念

---

## 帳戶餘額（Balance）

所有帳戶資產加總。

例如：

```
玉山
30,000

Richart
20,000

現金
5,000
```

總計：

```
55,000
```

---

## 承諾支出（Commitments）

已確定未來會支出的金額。

例如：

```
鬼滅模型
4,200
```

```
預購立牌
2,000
```

```
已刷卡未請款
5,000
```

總計：

```
11,200
```

---

## 可自由運用資金（Available Cash）

```
帳戶餘額
-
承諾支出
```

例如：

```
55,000
-
11,200

=

43,800
```

---

## 預算池（Budget Pool）

資金用途分類。

例如：

- 緊急備用金
- 投資
- 固定支出
- 娛樂
- 保險
- 旅遊基金
- 手機基金

---

# 四、使用者角色

---

## User

個人使用者

只能查看自己的資料

---

# 五、功能模組

---

# Module 1：Authentication

## 功能

登入

登出

註冊

---

## 登入方式

- Google
- Email

---

## 技術

Supabase Auth

---

# Module 2：Dashboard

登入後首頁。

---

## 財務總覽

顯示：

### 帳戶餘額

```
55,000
```

---

### 承諾支出

```
11,200
```

---

### 可自由運用資金

```
43,800
```

---

### 本月收入

```
45,000
```

---

### 本月支出

```
28,000
```

---

### 本月儲蓄率

```
37%
```

---

## 圖表

### 收入趨勢

折線圖

---

### 支出趨勢

折線圖

---

### 承諾支出趨勢

折線圖

---

### 支出分類分析

圓餅圖

---

# Module 3：帳戶管理（Accounts）

---

## 目的

管理實際持有資金的位置。

---

## 帳戶類型

### Cash

現金

---

### Bank

銀行帳戶

---

### Credit Card

信用卡

---

### Investment

投資帳戶

---

## 功能

新增帳戶

修改帳戶

刪除帳戶

調整餘額

停用帳戶

---

## 欄位

| 欄位     | 型別   |
| -------- | ------ |
| 名稱     | string |
| 類型     | enum   |
| 初始餘額 | number |
| 目前餘額 | number |

---

# Module 4：收入管理

---

## 功能

新增

修改

刪除

查詢

---

## 收入類別

- 薪資
- 獎金
- 接案
- 股利
- 利息
- 其他

---

## 欄位

| 欄位 | 型別     |
| ---- | -------- |
| 日期 | date     |
| 金額 | number   |
| 帳戶 | relation |
| 類別 | string   |
| 備註 | string   |

---

# Module 5：支出管理

---

## 功能

新增

修改

刪除

查詢

---

## 支出類別

- 飲食
- 交通
- 娛樂
- 保險
- 電信
- 醫療
- 訂閱服務
- 保健食品
- 美妝用品
- 治裝
- 其他

---

## 欄位

| 欄位   | 型別     |
| ------ | -------- |
| 日期   | date     |
| 金額   | number   |
| 帳戶   | relation |
| 預算池 | relation |
| 類別   | string   |
| 備註   | string   |

---

# Module 6：承諾支出管理（核心功能）

---

## 目的

管理未來已確定支出但尚未實際扣款的項目。

---

## 使用情境

### 預購商品

```
鬼滅模型

4,200
```

---

### 已刷卡未請款

```
Amazon

1,500
```

---

### 團購商品

```
動漫周邊

3,000
```

---

## 功能

新增

修改

取消

標記已扣款

搜尋

篩選

---

## 欄位

| 欄位         | 型別     |
| ------------ | -------- |
| 名稱         | string   |
| 金額         | number   |
| 預算池       | relation |
| 下單日期     | date     |
| 預計扣款日期 | nullable |
| 備註         | string   |
| 狀態         | enum     |

---

## 狀態

### Pending

待扣款

---

### Charged

已扣款

---

### Cancelled

已取消

---

## 業務規則

建立後立即納入：

```
承諾支出總額
```

計算。

---

### 標記已扣款

系統自動：

```
Commitment
↓
Expense
```

轉換。

---

# Module 7：預算池管理

---

## 目的

管理資金用途。

---

## 預設類型

- 緊急備用金
- 固定支出
- 投資
- 娛樂
- 保險
- 旅遊基金

---

## 功能

新增

修改

刪除

設定月預算

---

## 顯示資訊

### 預算

```
10,000
```

---

### 已支出

```
4,000
```

---

### 承諾支出

```
3,000
```

---

### 剩餘可用

```
3,000
```

---

公式：

```
預算
-
已支出
-
承諾支出
```

---

# Module 8：存款目標

---

## 功能

新增

修改

刪除

---

## 範例

### 日本旅遊

```
目標

50,000
```

---

### 目前

```
18,000
```

---

### 達成率

```
36%
```

---

### 預計完成時間

根據平均存款速度推估。

---

# Module 9：緊急備用金分析

---

## 目的

評估財務安全程度。

---

## 計算模式

使用者可選擇：

### 平均支出模式（推薦）

```
近六個月平均支出
×
保留月數
```

---

### 平均收入模式

```
近六個月平均收入
×
保留月數
```

---

### 自訂模式

```
自訂每月需求金額
×
保留月數
```

---

## 保留月數

可選：

- 3 個月
- 6 個月
- 12 個月

---

## 顯示資訊

### 目前緊急備用金

```
90,000
```

---

### 目標金額

```
168,000
```

---

### 達成率

```
53.6%
```

---

### 可支撐月數

```
3.2 個月
```

---

## 重要規則

緊急備用金可用額：

```
緊急備用金帳戶餘額
-
承諾支出
```

避免高估財務安全程度。

---

# Module 10：財務分析

---

## 支出分析

圓餅圖

---

## 月趨勢分析

折線圖

包含：

- 收入
- 支出
- 承諾支出
- 儲蓄率

---

## 承諾支出分析

顯示：

### 已知扣款時間

```
7月 2000
8月 5000
9月 8000
```

---

### 未知扣款時間

```
待扣款

6,500
```

---

# 六、資料庫設計

## profiles

```sql
id uuid primary key
email text
display_name text
created_at timestamptz
```

## accounts

```sql
id uuid primary key
user_id uuid
name text
type text
balance numeric
created_at timestamptz
```

## budget_pools

```sql
id uuid primary key
user_id uuid
name text
monthly_budget numeric
created_at timestamptz
```

## incomes

```sql
id uuid primary key
user_id uuid
account_id uuid
amount numeric
category text
date date
note text
created_at timestamptz
```

## expenses

```sql
id uuid primary key
user_id uuid
account_id uuid
budget_pool_id uuid
amount numeric
category text
date date
note text
created_at timestamptz
```

## commitments

```sql
id uuid primary key
user_id uuid
budget_pool_id uuid
title text
amount numeric
order_date date
expected_charge_date date null
status text
note text
created_at timestamptz
```

## saving_goals

```sql
id uuid primary key
user_id uuid
name text
target_amount numeric
current_amount numeric
target_date date null
created_at timestamptz
```

---

# 七、技術架構

## Frontend

- React
- TypeScript
- Vite
- React Router
- TanStack Query
- React Hook Form
- Zod
- TailwindCSS
- shadcn/ui
- Chart.js + react-chartjs-2

## Backend

- Supabase
- PostgreSQL
- Supabase Auth
- Row Level Security (RLS)

---

# 八、MVP 範圍

第一階段只開發：

✅ 登入

✅ Dashboard

✅ 帳戶管理

✅ 收入管理

✅ 支出管理

✅ 承諾支出管理（核心）

✅ 預算池管理

✅ 基本統計圖表

---

# 九、產品成功指標

使用者每天打開系統時，能在 5 秒內回答：

```
我現在有多少錢？

我未來已經答應花多少錢？

我實際還能花多少錢？

這個月娛樂預算還剩多少？

如果失業，我還能撐多久？
```

如果這五個問題都能被快速回答，代表產品已成功達成核心目標。
