
//page.tsx
"use client"
import { useEffect, useState } from "react";
import { fetchBookingStats } from "@/lib/queries/dashboard"; // Import fetchBookingStats
import { ProtectedRoute } from "@/components/auth/protected-route";
import { AdminSidebar } from "@/components/admin-sidebar";
import { AdminHeader } from "@/components/admin-header";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { ChartPlaceholder } from "@/components/dashboard/chart-placeholder";
import { GraphPlaceholder } from "@/components/dashboard/graph-placeholder";
import { QuickActions } from "@/components/dashboard/quick-actions";
// import { RecentActivity } from "@/components/dashboard/recent-activity";
import { PerformanceMetrics } from "@/components/dashboard/performance-metrics";
import { Calendar, Users, DollarSign, TrendingUp, UserPlus, Star, Activity, BarChart3 } from "lucide-react";

export default function DashboardPage() {
  const [kpiData, setKpiData] = useState<any[]>([]); // State to hold KPI data
  const [loading, setLoading] = useState(true); // State for loading indicator
  const [error, setError] = useState<string | null>(null); // State for error handling

  useEffect(() => {
    // Fetch the real data when the component is mounted
    const fetchData = async () => {
      try {
        setLoading(true); // Start loading
        const data = await fetchBookingStats(); // Fetch the real data from Firestore
        setKpiData([
  {
    title: "Completed Bookings",
    value: data.completedBookings.toLocaleString(),
    change: `${data.completedBookingsChange}%`,
    trend: data.completedBookingsChange >= 0 ? "up" : "down",
    icon: Calendar,
    color: "text-primary",
    description: "Bookings successfully completed",
  },
  {
    title: "Total Sales",
    value: `₹${Math.round(data.totalRevenue).toLocaleString()}`,
    change: `${data.totalRevenueChange}%`,
    trend: data.totalRevenueChange >= 0 ? "up" : "down",
    icon: DollarSign,
    color: "text-secondary",
    description: "Gross revenue",
  },
  {
    title: "Net Revenue",
    value: `₹${Math.round(data.netRevenue).toLocaleString()}`,
    change: `${data.netRevenueChange}%`,
    trend: data.netRevenueChange >= 0 ? "up" : "down",
    icon: TrendingUp,
    color: "text-chart-3",
    description: "After discounts",
  },
  {
    title: "Per Order Value",
    value: `₹${Math.round(data.perOrderValue).toLocaleString()}`,
    change: `${data.perOrderValueChange}%`,
    trend: data.perOrderValueChange >= 0 ? "up" : "down",
    icon: Users,
    color: "text-chart-4",
    description: "Average per booking",
  },
  {
    title: "Total Signups",
    value: data.totalCustomers.toLocaleString(),
    change: `${data.totalCustomersChange}%`,
    trend: data.totalCustomersChange >= 0 ? "up" : "down",
    icon: UserPlus,
    color: "text-primary",
    description: "New customer registrations",
  },
  {
    title: "CAC",
    value: "0",
    change: "0%",
    trend: "up" as const,
    icon: Star,
    color: "text-chart-2",
    description: "Customer Acquisition Cost",
  },
])

      } catch (error) {
        setError("Error fetching data"); // Handle error
      } finally {
        setLoading(false); // End loading
      }
    };

    fetchData(); // Call the fetch function
  }, []);

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <AdminSidebar />
        <div className="flex flex-col sm:gap-4 sm:py-4">
          <AdminHeader title="Dashboard Overview" />
          <main className="flex-1 space-y-6 p-4 md:p-6">
            {/* KPI Cards Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {loading ? (
                <div>Loading...</div> // Display loading while fetching data
              ) : error ? (
                <div>{error}</div> // Display error if any
              ) : (
                kpiData.map((kpi, index) => (
                  <KpiCard key={index} {...kpi} /> // Pass the data to the KpiCard
                ))
              )}
            </div>

            {/* Charts and Analytics Row */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <ChartPlaceholder
                title="Monthly Bookings Trend"
                description="Booking volume over the last 6 months"
                icon={BarChart3}
                iconColor="text-primary"
                className="col-span-2"
              />

              <GraphPlaceholder
                title="Revenue Distribution"
                description="Revenue by service category"
                icon={Activity}
                iconColor="text-secondary"
                className="col-span-2"
              />
            </div>

            {/* Performance Metrics */}
            <PerformanceMetrics />

            {/* Quick Actions */}
            {/* <QuickActions /> */}

            {/* Recent Activity */}
            {/* <RecentActivity />  */}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
