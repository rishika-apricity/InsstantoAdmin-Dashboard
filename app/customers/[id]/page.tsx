import { ProtectedRoute } from "@/components/auth/protected-route"
import { AdminSidebar } from "@/components/admin-sidebar"
import { AdminHeader } from "@/components/admin-header"
import { CustomerProfile } from "@/components/customers/customer-profile"

interface CustomerDetailPageProps {
  params: {
    id: string
  }
}

export default function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  return (
    <ProtectedRoute requiredPermission="customers:view_limited">
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <AdminSidebar />
        <div className="flex flex-col sm:gap-4 sm:py-4">
          <AdminHeader title="Customer Profile" />
          <main className="flex-1 space-y-4 p-4 md:p-6">
            <CustomerProfile customerId={params.id} />
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
