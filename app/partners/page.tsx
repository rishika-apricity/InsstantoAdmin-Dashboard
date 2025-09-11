import { ProtectedRoute } from "@/components/auth/protected-route"
import { AdminSidebar } from "@/components/admin-sidebar"
import { AdminHeader } from "@/components/admin-header"
import { PartnerStats } from "@/components/partners/partner-stats"
import { PartnerTable } from "@/components/partners/partner-table"

export default function PartnersPage() {
  return (
    <ProtectedRoute requiredPermission="partners:manage">
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <AdminSidebar />
        <div className="flex flex-col sm:gap-4 sm:py-4">
          <AdminHeader title="Partner Management" />
          <main className="flex-1 space-y-4 p-4 md:p-6">
            <PartnerStats />
            <PartnerTable />
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
