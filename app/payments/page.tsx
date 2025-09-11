"use client"

import { AdminSidebar } from "@/components/admin-sidebar"
import { AdminHeader } from "@/components/admin-header"
import { PaymentStatsCards } from "@/components/payments/payment-stats"
import { PaymentTable } from "@/components/payments/payment-table"
import { mockPaymentStats, mockPayments } from "@/lib/queries/payments"

export default function PaymentsPage() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <AdminSidebar />
      <div className="flex flex-col sm:gap-4 sm:py-4">
        <AdminHeader title="Payment Management" />
        <main className="flex-1 space-y-6 p-4 md:p-6">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-balance">Payment Management</h1>
              <p className="text-muted-foreground">
                Monitor, track, and manage all payment transactions and settlements
              </p>
            </div>

            <PaymentStatsCards stats={mockPaymentStats} />
            <PaymentTable payments={mockPayments} />
          </div>
        </main>
      </div>
    </div>
  )
}
