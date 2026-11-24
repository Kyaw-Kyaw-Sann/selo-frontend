import { Link, Navigate, Route, Routes } from "react-router-dom";
import AdminLayout from "../layouts/admin-layout";
import ProductsPage from "../features/products/pages/products-page";
import LoginPage from "../features/auth/pages/login-page";
import AuthGuard from "../features/auth/auth-guard.tsx";
import UnitsPage from "../features/units/pages/units-page.tsx";
import CategoriesPage from "../features/categories/pages/categories-page";
import CreateProductPage from "../features/products/pages/create-product-page";
import EditProductPage from "../features/products/pages/edit-product-page";
import ProductDetailPage from "../features/products/pages/product-detail-page";
import OwnerGuard from "../features/auth/owner-guard";
import SuppliersPage from "../features/suppliers/pages/suppliers-page";
import InventoryPage from "../features/inventory/pages/inventory-page";
import StockMovementsPage from "../features/inventory/pages/stock-movements-page";
import PurchasesPage from "../features/purchases/pages/purchases-page";
import PurchaseDetailPage from "../features/purchases/pages/purchase-detail-page";
import NewPurchasePage from "../features/purchases/pages/new-purchase-page";
import SalesPage from "../features/sales/pages/sales-page";
import SaleDetailPage from "../features/sales/pages/sale-detail-page";
import PosPage from "../features/sales/pages/pos-page";
import StaffPage from "../features/users/pages/staff-page";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route element={<AuthGuard />}>
        <Route path="pos" element={<PosPage />} />
        <Route element={<AdminLayout />}>
          <Route index element={<Navigate to="/products" replace />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/:id" element={<ProductDetailPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="sales" element={<SalesPage />} />
          <Route path="sales/:id" element={<SaleDetailPage />} />
          <Route element={<OwnerGuard />}>
            <Route path="staff" element={<StaffPage />} />
            <Route path="purchases" element={<PurchasesPage />} />
            <Route path="purchases/new" element={<NewPurchasePage />} />
            <Route path="purchases/:id" element={<PurchaseDetailPage />} />
            <Route path="inventory/movements" element={<StockMovementsPage />} />
            <Route path="suppliers" element={<SuppliersPage />} />
            <Route path="products/new" element={<CreateProductPage />} />
            <Route path="products/:id/edit" element={<EditProductPage />} />
          </Route>
          <Route path="units" element={<UnitsPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route
            path="*"
            element={
              <div className="space-y-3">
                <h1 className="text-2xl font-semibold text-heading">
                  Page not found
                </h1>
                <p className="text-muted">
                  The page you requested does not exist
                </p>
                <Link
                  to="/products"
                  className="inline-block font-medium text-primary underline underline-offset-4"
                >
                  Back to Products
                </Link>
              </div>
            }
          />
        </Route>
      </Route>
    </Routes>
  );
}
