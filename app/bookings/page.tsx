import { ProtectedRoute } from "@/components/auth/protected-route"
import { AdminSidebar } from "@/components/admin-sidebar"
import { AdminHeader } from "@/components/admin-header"
import BookingStats from "@/components/bookings/booking-stats"
import { BookingTable } from "@/components/bookings/booking-table"

export default function BookingsPage() {
  return (
    <ProtectedRoute requiredPermission="bookings:view">
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <AdminSidebar />
        <div className="flex flex-col sm:gap-4 sm:py-4">
          <AdminHeader title="Booking & Scheduling" />
          <main className="flex-1 space-y-4 p-4 md:p-6">
            <BookingStats />
            <BookingTable />
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
