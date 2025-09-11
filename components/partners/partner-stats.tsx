"use client"; // Add this at the top

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, Clock, DollarSign, AlertTriangle } from "lucide-react";

export function PartnerStats() {
  // Initialize state to store partners data
  const [partners, setPartners] = useState<any[]>([]); // Replace 'any' with actual type if needed


  // // If partners are still loading, show a loading state
  // if (partners.length === 0) {
  //   return <div>Loading...</div>;
  // }

  // // Calculate stats based on mockPartners
  // const totalPartners = partners.length;
  // const activePartners = partners.filter((p) => p.status === "active").length;
  // const pendingVerification = partners.filter((p) => p.kycStatus === "pending").length;
  // const totalEarnings = partners.reduce((sum, p) => sum + p.earnings, 0);
  // const pendingPayouts = partners.reduce((sum, p) => sum + p.pendingPayouts, 0);

  // // Format earnings into currency format
  // const formatCurrency = (amount: number) => {
  //   return new Intl.NumberFormat("en-IN", {
  //     style: "currency",
  //     currency: "INR",
  //     maximumFractionDigits: 0,
  //   }).format(amount);
  // };

  // Stats to display
  const stats = [
    {
      title: "Total Partners",
      value: "23",
      icon: Users,
      color: "text-primary",
      description: "All registered partners",
    },
    {
      title: "Active Partners",
      value: "78",
      icon: UserCheck,
      color: "text-green-600",
      description: "Currently active",
    },
    {
      title: "Pending Verification",
      value: "89",
      icon: Clock,
      color: "text-yellow-600",
      description: "Awaiting KYC approval",
    },
    {
      title: "Total Earnings",
      value: "78900",
      icon: DollarSign,
      color: "text-chart-3",
      description: "Partner earnings to date",
    },
    {
      title: "Pending Payouts",
      value: "7800",
      icon: AlertTriangle,
      color: "text-secondary",
      description: "Awaiting payment",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
      {stats.map((stat) => (
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
