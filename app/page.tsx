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
import { RecentActivity } from "@/components/dashboard/recent-activity";
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
            title: "Total Bookings",
            value: data.completedBookings.toLocaleString(), // Format the value with commas
            change: "+12.5%", // You can adjust this dynamically if needed
            trend: "up" as const, // Trend indicator (up or down)
            icon: Calendar, // Use appropriate icons
            color: "text-primary", // Color for the KPI card
            description: "This month's bookings", // Description
          },
          // You can add more KPIs here with real data
          {
            title: "Total Sales",
            value: `₹${Math.round(data.totalRevenue).toLocaleString()}`, // Update with real data
            change: "+8.2%",
            trend: "up" as const,
            icon: DollarSign,
            color: "text-secondary",
            description: "Gross revenue before discounts",
          },
          {
            title: "Net revenue",
            value: `₹${Math.round(data.netRevenue).toLocaleString()}`, // Update with real data
            change: "+15.3%",
            trend: "up" as const,
            icon: TrendingUp,
            color: "text-chart-3",
            description: "after discounts and offers",
          },
          { title: "Per order value",
            value: `₹${Math.round(data.perOrderValue).toLocaleString()}`, change: "0.2%",
            trend: "up" as const, icon: Users,
            color: "text-chart-5",
            description: "per order value",
          },
          {
            title: "Total Signups",
            value: data.totalCustomers.toLocaleString(),
            change: "+5.7%",
            trend: "up" as const,
            icon: UserPlus, color: "text-chart-4",
            description: "New customer registrations",
          },

          {
            title: "Cusstomer Acquisition Cost (CAC)",
            value: "2000",
            change: "+0.2",
            trend: "up" as const,
            icon: Star,
            color: "text-primary",
            description: "Average service rating",
          },
        ]);
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
            <QuickActions />

            {/* Recent Activity */}
            <RecentActivity />
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
