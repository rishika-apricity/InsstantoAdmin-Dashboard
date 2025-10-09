"use client";

import { useEffect, useState } from "react";
import { AdminHeader } from "../../components/admin-header";
import { AdminSidebar } from "../../components/admin-sidebar";
import PaymentStatsCards from "../../components/payments/payment-stats";
import PaymentTable from "../../components/payments/payment-table";

function formatDateInput(d: Date) {
  return d.toLocaleDateString("en-CA");
}

export default function PaymentsPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const [fromDate, setFromDate] = useState<string>(formatDateInput(firstDay));
  const [toDate, setToDate] = useState<string>(formatDateInput(lastDay));

  const fetchData = async () => {
    setLoading(true);

    const params = new URLSearchParams();
    if (fromDate) {
      const fromUTC = new Date(fromDate + "T00:00:00Z");
      params.set("from", Math.floor(fromUTC.getTime() / 1000).toString());
    }
    if (toDate) {
      const toUTC = new Date(toDate + "T23:59:59Z");
      params.set("to", Math.floor(toUTC.getTime() / 1000).toString());
    }

    const res = await fetch(`/api/payments?${params.toString()}`);
    const { payments: pItems, settlements: sItems, stats } = await res.json();

    // normalize payments
    const mappedPayments = pItems.map((p: any) => ({
      type: "PAYMENT",
      id: p.id,
      customer: {
        name: p.email?.split("@")[0] || "Unknown",
        email: p.email || "N/A",
      },
      service: p.description || "N/A",
      amount: p.amount / 100,
      method: p.method ? p.method.toUpperCase() : "N/A",
      status: p.status ? p.status.toUpperCase() : "N/A",
      utr: null,
      date: new Date(p.created_at * 1000).toLocaleDateString("en-IN"),
    }));

    // normalize settlements
    const mappedSettlements = sItems.map((s: any) => ({
      type: "SETTLEMENT",
      id: s.id,
      customer: { name: "-", email: "-" },
      service: "-",
      amount: s.amount / 100,
      method: "-",
      status: "SETTLEMENT",
      utr: s.utr || "—",
      date: new Date(s.created_at * 1000).toLocaleDateString("en-IN"),
    }));

    setRecords([...mappedPayments, ...mappedSettlements]);
    setStats(stats);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [fromDate, toDate]);

  const clearFilter = () => {
    setFromDate(formatDateInput(firstDay));
    setToDate(formatDateInput(lastDay));
  };

  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <AdminSidebar />
      <div className="flex flex-1 flex-col">
        <AdminHeader title="Payment Management" />

        <main className="flex-1 space-y-6 p-6">
          <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-lg font-semibold">
                  Monitor, track, and manage all payment & settlement data
                </p>
              </div>

              <div className="flex gap-2 items-center">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="border rounded px-2 py-1"
                  max={formatDateInput(today)}  /* Disable future dates */
                />
                <span>to</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="border rounded px-2 py-1"
                  max={formatDateInput(today)}  /* Disable future dates */
                />
                <button
                  onClick={clearFilter}
                  className="bg-gray-200 hover:bg-gray-300 text-sm px-3 py-1 rounded"
                >
                  Reset to Current Month
                </button>
              </div>
            </div>

            {loading ? (
              <p>Loading...</p>
            ) : (
              <>
                {stats && <PaymentStatsCards stats={stats} />}
                <PaymentTable records={records} />
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
