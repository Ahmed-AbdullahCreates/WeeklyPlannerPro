import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { PropsWithChildren, useState } from "react";

interface PageWrapperProps extends PropsWithChildren {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

export function PageWrapper({ children, title }: PageWrapperProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Fixed sidebar */}
      <div className="fixed inset-y-0 left-0 z-50">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:pl-64">
        <Header title={title} onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
