"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  CheckCircle,
  XCircle,
  RotateCcw,
  IndianRupee,
  Banknote,
  Building,
} from "lucide-react";

interface PaymentStats {
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
  refundedPayments: number;
  totalAmount: number;
  totalSettlements: number;
  totalSettlementAmount: number;
}

export default function PaymentStatsCards({ stats }: { stats: PaymentStats }) {
  const successRate =
    stats.totalPayments > 0
      ? ((stats.successfulPayments / stats.totalPayments) * 100).toFixed(1)
      : 0;

  const refundRate =
    stats.totalPayments > 0
      ? ((stats.refundedPayments / stats.totalPayments) * 100).toFixed(1)
      : 0;

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7">
      {/* Total Payments */}
      <Card className="p-4 border-l-4 border-blue-500 bg-blue-50 shadow-sm flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Wallet className="h-6 w-6 text-blue-500" />
          <h2 className="text-sm text-muted-foreground">Total Payments</h2>
        </div>
        <p className="text-xl font-bold text-blue-600">{stats.totalPayments}</p>
      </Card>

      {/* Successful */}
      <Card className="p-4 border-l-4 border-green-500 bg-green-50 shadow-sm flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-6 w-6 text-green-500" />
          <h2 className="text-sm text-muted-foreground">Successful</h2>
        </div>
        <p className="text-xl font-bold text-green-600">{stats.successfulPayments}</p>
        <Badge className="w-fit bg-green-100 text-green-700 text-xs">
          {successRate}% success rate
        </Badge>
      </Card>

      {/* Failed */}
      <Card className="p-4 border-l-4 border-red-500 bg-red-50 shadow-sm flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <XCircle className="h-6 w-6 text-red-500" />
          <h2 className="text-sm text-muted-foreground">Failed</h2>
        </div>
        <p className="text-xl font-bold text-red-600">{stats.failedPayments}</p>
      </Card>

      {/* Refunded */}
      <Card className="p-4 border-l-4 border-orange-500 bg-orange-50 shadow-sm flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <RotateCcw className="h-6 w-6 text-orange-500" />
          <h2 className="text-sm text-muted-foreground">Refunded</h2>
        </div>
        <p className="text-xl font-bold text-orange-600">{stats.refundedPayments}</p>
        <Badge className="w-fit bg-orange-100 text-orange-700 text-xs">
          {refundRate}% refund rate
        </Badge>
      </Card>

      {/* Total Amount */}
      <Card className="p-4 border-l-4 border-purple-500 bg-purple-50 shadow-sm flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <IndianRupee className="h-6 w-6 text-purple-500" />
          <h2 className="text-sm text-muted-foreground">Total Amount</h2>
        </div>
        <p className="text-xl font-bold text-purple-600">
          ₹{stats.totalAmount.toLocaleString("en-IN")}
        </p>
      </Card>

      {/* Total Settlements */}
      <Card className="p-4 border-l-4 border-teal-500 bg-teal-50 shadow-sm flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Building className="h-6 w-6 text-teal-500" />
          <h2 className="text-sm text-muted-foreground">Settlements</h2>
        </div>
        <p className="text-xl font-bold text-teal-600">{stats.totalSettlements}</p>
      </Card>

      {/* Settlement Amount */}
      <Card className="p-4 border-l-4 border-indigo-500 bg-indigo-50 shadow-sm flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Banknote className="h-6 w-6 text-indigo-500" />
          <h2 className="text-sm text-muted-foreground">Settlement Amount</h2>
        </div>
        <p className="text-xl font-bold text-indigo-600">
          ₹{stats.totalSettlementAmount.toLocaleString("en-IN")}
        </p>
      </Card>
    </div>
  );
}
