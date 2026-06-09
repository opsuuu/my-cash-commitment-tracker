# Personal Cash Flow & Commitment Tracker

## 專案背景

個人現金流與承諾支出管理系統。核心差異化：追蹤「已承諾但尚未扣款」的支出，避免使用者誤以為帳戶餘額就是可以自由運用的錢。

## 技術架構

- **Frontend**: React + TypeScript + Vite + React Router + TanStack Query + React Hook Form + Zod + TailwindCSS + shadcn/ui + Chart.js
- **Backend**: Supabase (PostgreSQL + Auth + RLS)

## 核心財務公式

```
可自由運用資金 = 帳戶餘額總和 - 所有 pending commitments
Spending Pool 剩餘 = monthly_budget - spent - ALL active commitments（建立當下立即鎖住）
Saving Pool 進度 = current_amount / target_amount
緊急備用金 Global Risk = account_balance - ALL active commitments
緊急備用金 Pool Health = emergency_balance - pool-related commitments only
```

## 設計決策摘要

詳細設計決策見 `docs/DESIGN.md`。

## MVP 範圍

1. Authentication（Google + Email）
2. 帳戶管理
3. 預算池管理（spending + saving 兩種類型）
4. 承諾支出管理（核心功能）
5. 收入管理
6. 支出管理
7. Monthly Allocation 系統
8. Dashboard 財務總覽
9. 緊急備用金分析
10. 財務分析圖表

## 語言

介面語言：繁體中文  
程式碼語言：英文（變數、函式、資料庫欄位）
