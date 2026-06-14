import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { GuestRoute } from './GuestRoute'
import AppLayout from '@/components/layout/AppLayout'
import AccountsPage from '@/pages/accounts/AccountsPage'
import BudgetPoolsPage from '@/pages/budget-pools/BudgetPoolsPage'
import CommitmentsPage from '@/pages/commitments/CommitmentsPage'
import IncomesPage from '@/pages/income/IncomesPage'
import ExpensesPage from '@/pages/expenses/ExpensesPage'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage'
import DashboardPage from '@/pages/DashboardPage'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <GuestRoute>
        <LoginPage />
      </GuestRoute>
    ),
  },
  {
    path: '/register',
    element: (
      <GuestRoute>
        <RegisterPage />
      </GuestRoute>
    ),
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    // 不套 GuestRoute：使用者點重設信連結進來時會帶著 recovery session（已登入狀態）
    path: '/reset-password',
    element: <ResetPasswordPage />,
  },
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '/',
        element: <DashboardPage />,
      },
      {
        path: '/accounts',
        element: <AccountsPage />,
      },
      {
        path: '/budget-pools',
        element: <BudgetPoolsPage />,
      },
      {
        path: '/commitments',
        element: <CommitmentsPage />,
      },
      {
        path: '/income',
        element: <IncomesPage />,
      },
      {
        path: '/expenses',
        element: <ExpensesPage />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])
