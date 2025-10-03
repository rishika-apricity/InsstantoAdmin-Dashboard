"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserPlus, Calendar, ListChecks } from "lucide-react";
import { fetchCustomerStats } from "@/lib/queries/customers"; // 👈 we’ll use the function I wrote for you earlier

type Stats = {
  totalCustomers: number;
  newCustomersToday: number;
  customersWithOneBooking: number;
  customersWithMultipleBookings: number;
};

export function CustomerStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      const data = await fetchCustomerStats();
      setStats(data);
      setLoading(false);
    }
    loadStats();
  }, []);

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading customer stats...</div>;
  }

  const kpiCards = [
    {
      title: "Total Sign-Ups",
      value: stats?.totalCustomers.toString() || "0",
      icon: Users,
      color: "text-primary",
      description: "All registered customers",
    },
    {
      title: "Today's Sign_Ups",
      value: stats?.newCustomersToday.toString() || "0",
      icon: Calendar,
      color: "text-green-600",
      description: "New signups today",
    },
    {
      title: "Total New Customers",
      value: stats?.customersWithOneBooking.toString() || "0",
      icon: UserPlus,
      color: "text-secondary",
      description: "Customers with exactly 1 booking",
    },
    {
      title: "Total Repeated Customers",
      value: stats?.customersWithMultipleBookings.toString() || "0",
      icon: ListChecks,
      color: "text-yellow-600",
      description: "Customers with multiple bookings",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      {kpiCards.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
