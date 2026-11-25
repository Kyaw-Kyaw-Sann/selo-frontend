import { Outlet } from "react-router-dom";
import Sidebar from "./sidebar";

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
        <main id="main-content" tabIndex={-1} className="mx-auto w-full min-w-0 max-w-[1440px] px-4 py-6 md:px-6 md:py-8 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
