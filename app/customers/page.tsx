import { ProtectedRoute } from "@/components/auth/protected-route"
import { AdminSidebar } from "@/components/admin-sidebar"
import { AdminHeader } from "@/components/admin-header"
import { CustomerStats } from "@/components/customers/customer-stats"
import { CustomerTable } from "@/components/customers/customer-table"

export default function CustomersPage() {
  return (
    <ProtectedRoute requiredPermission="customers:view_limited">
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <AdminSidebar />
        <div className="flex flex-col sm:gap-4 sm:py-4">
          <AdminHeader title="Customer Management" />
          <main className="flex-1 space-y-4 p-4 md:p-6">
            <CustomerStats />
            <CustomerTable />
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
