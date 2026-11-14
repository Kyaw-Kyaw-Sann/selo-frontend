import { Link, Navigate, Route, Routes } from 'react-router-dom'
import AdminLayout from '../layouts/admin-layout'
import ProductsPage from '../features/products/pages/products-page'
import LoginPage from '../features/auth/pages/login-page'
import AuthGuard from '../features/auth/auth-guard.tsx'

export default function AppRouter() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route element={<AuthGuard />}>
        <Route element={<AdminLayout />}>
          <Route index element={<Navigate to="/products" replace />} />
          <Route path="products" element={<ProductsPage />} />
          <Route
            path="*"
            element={
              <div className="space-y-3">
                <h1 className="text-2xl font-semibold text-heading">Page not found</h1>
                <p className="text-muted">The page you requested does not exist</p>
                <Link to="/products" className="inline-block font-medium text-primary underline underline-offset-4">
                  Back to Products
                </Link>
              </div>
            }
          />
        </Route>
      </Route>
    </Routes>
  )
}
