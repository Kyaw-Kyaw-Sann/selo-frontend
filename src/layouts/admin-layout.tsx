import { Outlet } from 'react-router-dom'
import Header from './header'
import Sidebar from './sidebar'

export default function AdminLayout() {
  return (
    <div className="min-h-dvh md:flex">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-control focus:bg-primary focus:px-4 focus:py-2 focus:text-on-primary"
      >
        Skip to content
      </a>
      <Sidebar />

      <div className="min-w-0 flex-1">
        <Header />

        <main id="main-content" tabIndex={-1} className="min-w-0 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
